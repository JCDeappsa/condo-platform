import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, MessageSquare, Clock, Bell, Handshake } from 'lucide-react';
import type { CollectionStatus, PaymentPromise } from '../../types';
import { useAuth } from '../../lib/auth';

interface CollectionNote {
  id: string;
  note: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
}

interface CollectionNotification {
  id: string;
  channel: string;
  subject: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface CollectionUnitData {
  status: CollectionStatus;
  promises: PaymentPromise[];
  notes: CollectionNote[];
  notifications: CollectionNotification[];
}

type TimelineItem = {
  id: string;
  type: 'note' | 'promise' | 'notification';
  date: string;
  content: string;
  detail?: string;
};

export function CollectionDetail() {
  const { unitId } = useParams<{ unitId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [data, setData] = useState<CollectionUnitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note form
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Promise form
  const [showPromiseForm, setShowPromiseForm] = useState(false);
  const [promiseForm, setPromiseForm] = useState({ promisedAmount: '', promisedDate: '', notes: '' });
  const [submittingPromise, setSubmittingPromise] = useState(false);

  useEffect(() => { loadData(); }, [unitId]);

  const loadData = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: CollectionUnitData }>(`/collections/unit/${unitId}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    setError(null);
    try {
      await apiPost('/collections/notes', { unitId, note: noteText });
      setNoteText('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreatePromise = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPromise(true);
    setError(null);
    try {
      await apiPost('/collections/promises', {
        unitId,
        promisedAmount: parseFloat(promiseForm.promisedAmount),
        promisedDate: promiseForm.promisedDate,
        notes: promiseForm.notes || null,
      });
      setShowPromiseForm(false);
      setPromiseForm({ promisedAmount: '', promisedDate: '', notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingPromise(false);
    }
  };

  const handlePromiseAction = async (promiseId: string, status: 'fulfilled' | 'broken' | 'cancelled') => {
    setError(null);
    try {
      await apiPatch(`/collections/promises/${promiseId}`, { status });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const buildTimeline = (): TimelineItem[] => {
    if (!data) return [];
    const items: TimelineItem[] = [];

    data.notes.forEach(n => items.push({
      id: `note-${n.id}`,
      type: 'note',
      date: n.createdAt,
      content: n.note,
      detail: `${n.createdBy.firstName} ${n.createdBy.lastName}`,
    }));

    data.promises.forEach(p => items.push({
      id: `promise-${p.id}`,
      type: 'promise',
      date: p.createdAt,
      content: `Promesa: Q${Number(p.promisedAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })} para ${new Date(p.promisedDate).toLocaleDateString('es-GT')}`,
      detail: es.collections.promiseStatuses[p.status],
    }));

    data.notifications.forEach(n => items.push({
      id: `notif-${n.id}`,
      type: 'notification',
      date: n.createdAt,
      content: n.subject,
      detail: `${n.channel} — ${n.status}`,
    }));

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  };

  const stageColors: Record<string, string> = {
    current: 'bg-green-100 text-green-700',
    reminder: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    escalated: 'bg-orange-100 text-orange-700',
    legal: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">{es.common.noData}</div>;
  }

  const timeline = buildTimeline();
  const activePromises = data.promises.filter(p => p.status === 'active');

  return (
    <div>
      <Link to="/collections" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4">
        <ArrowLeft size={16} />
        {es.common.back}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalle de Cobranza</h1>
          <p className="text-sm text-gray-500">Unidad {data.status.unit?.unitNumber || unitId}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stageColors[data.status.collectionStage]}`}>
          {es.collections.stages[data.status.collectionStage]}
        </span>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{es.common.total} {es.collections.overdue}</p>
          <p className="text-xl font-bold text-red-600">Q{Number(data.status.totalOverdue).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{es.collections.daysOverdue}</p>
          <p className="text-xl font-bold text-gray-900">{data.status.daysOverdue} dias</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500">{es.collections.promise}</p>
          <p className="text-xl font-bold text-gray-900">{data.status.hasActivePromise ? 'Si' : 'No'}</p>
        </div>
      </div>

      {/* Active Promises */}
      {activePromises.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Handshake size={16} className="text-gray-400" />
            Promesas Activas
          </h3>
          <div className="space-y-3">
            {activePromises.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Q{Number(p.promisedAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })} — {new Date(p.promisedDate).toLocaleDateString('es-GT')}
                  </p>
                  {p.notes && <p className="text-xs text-gray-500 mt-1">{p.notes}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handlePromiseAction(p.id, 'fulfilled')} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Cumplida</button>
                    <button onClick={() => handlePromiseAction(p.id, 'broken')} className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Incumplida</button>
                    <button onClick={() => handlePromiseAction(p.id, 'cancelled')} className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Cancelar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Add Note */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-400" />
              {es.collections.addNote}
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea rows={3} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Agregar nota de gestion..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="submit" disabled={submittingNote || !noteText.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                {submittingNote ? es.common.loading : es.collections.addNote}
              </button>
            </form>
          </div>

          {/* Create Promise */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Handshake size={16} className="text-gray-400" />
              {es.collections.promise}
            </h3>
            {showPromiseForm ? (
              <form onSubmit={handleCreatePromise} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{es.collections.promisedAmount} (Q)</label>
                  <input type="number" step="0.01" min="0.01" required value={promiseForm.promisedAmount} onChange={e => setPromiseForm(p => ({ ...p, promisedAmount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{es.collections.promisedDate}</label>
                  <input type="date" required value={promiseForm.promisedDate} onChange={e => setPromiseForm(p => ({ ...p, promisedDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{es.common.notes}</label>
                  <textarea rows={2} value={promiseForm.notes} onChange={e => setPromiseForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowPromiseForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                  <button type="submit" disabled={submittingPromise} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                    {submittingPromise ? es.common.loading : es.common.create}
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowPromiseForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Crear Promesa de Pago
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          {es.collections.timeline}
        </h3>
        {timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map(item => (
              <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.type === 'note' ? 'bg-blue-100' : item.type === 'promise' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {item.type === 'note' ? <MessageSquare size={14} className="text-blue-600" /> :
                   item.type === 'promise' ? <Handshake size={14} className="text-green-600" /> :
                   <Bell size={14} className="text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleString('es-GT')}</span>
                    {item.detail && <span className="text-xs text-gray-500">— {item.detail}</span>}
                  </div>
                  <p className="text-sm text-gray-700">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin actividad registrada.</p>
        )}
      </div>
    </div>
  );
}
