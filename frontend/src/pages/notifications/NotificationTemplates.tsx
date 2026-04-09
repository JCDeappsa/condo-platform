import { useState, useEffect } from 'react';
import { apiGet, apiPatch } from '../../lib/api';
import { es } from '../../i18n/es';
import { FileText, X } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  channel: 'email' | 'sms' | 'in_app';
  isActive: boolean;
  createdAt: string;
}

export function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState({ subject: '', bodyHtml: '', bodyText: '', channel: 'email' as string, isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: NotificationTemplate[] }>('/collections/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (t: NotificationTemplate) => {
    setEditing(t);
    setForm({
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      bodyText: t.bodyText,
      channel: t.channel,
      isActive: t.isActive,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPatch(`/collections/templates/${editing.id}`, {
        subject: form.subject,
        bodyHtml: form.bodyHtml,
        bodyText: form.bodyText,
        channel: form.channel,
        isActive: form.isActive,
      });
      setShowModal(false);
      loadTemplates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const channelLabels: Record<string, string> = {
    email: 'Correo',
    sms: 'SMS',
    in_app: 'En App',
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
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.collections.templates}</h1>
          <p className="text-sm text-gray-500">Plantillas de notificacion de cobranza</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Asunto</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Canal</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Activa</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.subject}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {channelLabels[t.channel] || t.channel}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.isActive ? 'Si' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800 text-sm">{es.common.edit}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {templates.length === 0 && <div className="text-center py-8 text-gray-500">{es.common.noData}</div>}
      </div>

      {/* Edit Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar Plantilla: {editing.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input type="text" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo HTML</label>
                <textarea rows={5} value={form.bodyHtml} onChange={e => setForm(p => ({ ...p, bodyHtml: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo Texto</label>
                <textarea rows={3} value={form.bodyText} onChange={e => setForm(p => ({ ...p, bodyText: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                  <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="email">Correo</option>
                    <option value="sms">SMS</option>
                    <option value="in_app">En App</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                    Activa
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? es.common.loading : es.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
