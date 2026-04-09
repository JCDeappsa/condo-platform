import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { es } from '../../i18n/es';
import { Bell, Plus, X } from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  daysOverdue: number;
  templateName: string;
  cooldownHours: number;
  isActive: boolean;
  requiresApproval: boolean;
  createdAt: string;
}

export function NotificationRules() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [form, setForm] = useState({
    name: '', daysOverdue: '', templateName: '', cooldownHours: '24', isActive: true, requiresApproval: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: NotificationRule[] }>('/collections/rules');
      setRules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setForm({ name: '', daysOverdue: '', templateName: '', cooldownHours: '24', isActive: true, requiresApproval: false });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (rule: NotificationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      daysOverdue: String(rule.daysOverdue),
      templateName: rule.templateName,
      cooldownHours: String(rule.cooldownHours),
      isActive: rule.isActive,
      requiresApproval: rule.requiresApproval,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const body = {
      name: form.name,
      daysOverdue: parseInt(form.daysOverdue),
      templateName: form.templateName,
      cooldownHours: parseInt(form.cooldownHours),
      isActive: form.isActive,
      requiresApproval: form.requiresApproval,
    };
    try {
      if (editingRule) {
        await apiPatch(`/collections/rules/${editingRule.id}`, body);
      } else {
        await apiPost('/collections/rules', body);
      }
      setShowModal(false);
      loadRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (rule: NotificationRule) => {
    try {
      await apiPatch(`/collections/rules/${rule.id}`, { isActive: !rule.isActive });
      loadRules();
    } catch (err) {
      console.error(err);
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
          <Bell className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.collections.rules}</h1>
            <p className="text-sm text-gray-500">Reglas de escalamiento automatico</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus size={18} />
          {es.common.create}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dias Vencidos</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plantilla</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enfriamiento (hrs)</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Requiere Aprobacion</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Activa</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{rule.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{rule.daysOverdue}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{rule.templateName}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-center">{rule.cooldownHours}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rule.requiresApproval ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {rule.requiresApproval ? 'Si' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(rule)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${rule.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openEdit(rule)} className="text-blue-600 hover:text-blue-800 text-sm">{es.common.edit}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && <div className="text-center py-8 text-gray-500">{es.common.noData}</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingRule ? 'Editar Regla' : 'Crear Regla'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dias Vencidos</label>
                  <input type="number" min="1" required value={form.daysOverdue} onChange={e => setForm(p => ({ ...p, daysOverdue: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enfriamiento (hrs)</label>
                  <input type="number" min="1" required value={form.cooldownHours} onChange={e => setForm(p => ({ ...p, cooldownHours: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Plantilla</label>
                <input type="text" required value={form.templateName} onChange={e => setForm(p => ({ ...p, templateName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                  Activa
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.requiresApproval} onChange={e => setForm(p => ({ ...p, requiresApproval: e.target.checked }))} className="rounded" />
                  Requiere Aprobacion
                </label>
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
