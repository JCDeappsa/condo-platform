import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, MapPin, Calendar, Tag } from 'lucide-react';
import type { MaintenanceTicket } from '../../types';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  pending_parts: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadTicket(); }, [id]);

  const loadTicket = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: MaintenanceTicket }>(`/maintenance-tickets/${id}`);
      setTicket(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'completed' && !closingNotes.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const patchBody: Record<string, string> = { status: newStatus };
      if (newStatus === 'completed') patchBody.closingNotes = closingNotes;
      await apiPatch(`/maintenance-tickets/${id}`, patchBody);

      if (comment.trim()) {
        await apiPost(`/maintenance-tickets/${id}/updates`, {
          comment,
          statusChangeFrom: ticket?.status,
          statusChangeTo: newStatus,
        });
      }
      setComment('');
      setClosingNotes('');
      setSuccess('Estado actualizado');
      loadTicket();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(`/maintenance-tickets/${id}/updates`, { comment });
      setComment('');
      setSuccess('Comentario agregado');
      loadTicket();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-12 text-gray-500 min-h-screen">{es.common.noData}</div>;
  }

  const isActive = ticket.status !== 'completed' && ticket.status !== 'cancelled';

  return (
    <div className="min-h-screen pb-8">
      <Link to="/my-tasks" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4 py-2">
        <ArrowLeft size={18} />
        {es.common.back}
      </Link>

      {/* Ticket header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
            {es.maintenance.priorities[ticket.priority as keyof typeof es.maintenance.priorities]}
          </span>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${statusColors[ticket.status]}`}>
          {es.maintenance.statuses[ticket.status as keyof typeof es.maintenance.statuses]}
        </span>
        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{ticket.description}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={16} />
            <span>{ticket.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Tag size={16} />
            <span>{es.maintenance.categories[ticket.category as keyof typeof es.maintenance.categories]}</span>
          </div>
          {ticket.dueDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{new Date(ticket.dueDate).toLocaleDateString('es-GT')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status messages */}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{success}</div>}

      {/* Action buttons */}
      {isActive && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Cambiar Estado</h3>

          {ticket.status === 'open' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={submitting}
              className="w-full py-4 bg-yellow-500 text-white rounded-xl text-base font-semibold hover:bg-yellow-600 active:bg-yellow-700 disabled:opacity-50 mb-2"
            >
              Iniciar Trabajo
            </button>
          )}
          {ticket.status === 'in_progress' && (
            <div className="space-y-2">
              <button
                onClick={() => handleStatusChange('pending_parts')}
                disabled={submitting}
                className="w-full py-4 bg-orange-500 text-white rounded-xl text-base font-semibold hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50"
              >
                {es.maintenance.statuses.pending_parts}
              </button>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.closingNotes} *</label>
                <textarea
                  rows={3}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describa como se resolvio..."
                />
              </div>
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={submitting || !closingNotes.trim()}
                className="w-full py-4 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
              >
                Marcar Completado
              </button>
            </div>
          )}
          {ticket.status === 'pending_parts' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={submitting}
              className="w-full py-4 bg-yellow-500 text-white rounded-xl text-base font-semibold hover:bg-yellow-600 active:bg-yellow-700 disabled:opacity-50"
            >
              Reanudar Trabajo
            </button>
          )}
        </div>
      )}

      {/* Add comment */}
      {isActive && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Agregar Comentario</h3>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            placeholder="Escribir comentario..."
          />
          <button
            onClick={handleAddComment}
            disabled={submitting || !comment.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
          >
            Enviar Comentario
          </button>
        </div>
      )}

      {/* Timeline */}
      {ticket.updates && ticket.updates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Historial</h3>
          <div className="space-y-4">
            {ticket.updates.map(update => (
              <div key={update.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{update.author.firstName} {update.author.lastName}</span>
                  <span className="text-xs text-gray-400">{new Date(update.createdAt).toLocaleString('es-GT')}</span>
                </div>
                {update.statusChangeFrom && update.statusChangeTo && (
                  <p className="text-xs text-gray-500 mb-1">
                    {es.maintenance.statuses[update.statusChangeFrom as keyof typeof es.maintenance.statuses]} → {es.maintenance.statuses[update.statusChangeTo as keyof typeof es.maintenance.statuses]}
                  </p>
                )}
                <p className="text-sm text-gray-700">{update.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
