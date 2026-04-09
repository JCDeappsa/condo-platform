import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { Megaphone, Plus, X, User, Clock } from 'lucide-react';
import type { Announcement, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';

const priorityColors: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-600',
  important: 'bg-yellow-100 text-yellow-700',
  urgent: 'bg-red-100 text-red-700',
};

export function AnnouncementList() {
  const { user } = useAuth();
  const canCreate = user?.role.name === 'administrator' || user?.role.name === 'board_member';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', body: '', priority: 'normal', publishAt: '', expiresAt: '',
  });

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await apiGet<PaginatedResponse<Announcement>>('/announcements?limit=50');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/announcements', {
        title: form.title,
        body: form.body,
        priority: form.priority,
        publishAt: form.publishAt || undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setShowForm(false);
      setForm({ title: '', body: '', priority: 'normal', publishAt: '', expiresAt: '' });
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.announcements.title}</h1>
            <p className="text-sm text-gray-500">{announcements.length} avisos</p>
          </div>
        </div>
        {canCreate && (
          <button onClick={() => { setError(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus size={18} />
            {es.announcements.createAnnouncement}
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{es.common.noData}</div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[a.priority]}`}>
                  {es.announcements.priorities[a.priority as keyof typeof es.announcements.priorities]}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{a.body}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{a.author.firstName} {a.author.lastName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(a.createdAt).toLocaleString('es-GT')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{es.announcements.createAnnouncement}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input type="text" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
                <textarea required rows={4} value={form.body} onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.priority}</label>
                <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(es.announcements.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.announcements.publishAt}</label>
                  <input type="datetime-local" value={form.publishAt} onChange={e => setForm(prev => ({ ...prev, publishAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.announcements.expiresAt}</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(prev => ({ ...prev, expiresAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? es.common.loading : es.announcements.createAnnouncement}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
