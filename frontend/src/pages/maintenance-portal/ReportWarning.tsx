import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export function ReportWarning() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    location: '',
    category: 'general',
    priority: 'medium',
    description: '',
    immediateRisk: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/maintenance-tickets/report-warning', {
        location: form.location,
        category: form.category,
        priority: form.immediateRisk ? 'urgent' : form.priority,
        description: form.description,
        immediateRisk: form.immediateRisk,
      });
      navigate('/my-tasks');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <Link to="/my-tasks" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4 py-2">
        <ArrowLeft size={18} />
        {es.common.back}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="text-orange-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">{es.maintenance.reportWarning}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.location} *</label>
            <input
              type="text"
              required
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Area de piscina, Entrada principal..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.category} *</label>
            <select
              required
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.entries(es.maintenance.categories).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.priority} *</label>
            <select
              required
              value={form.priority}
              onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.entries(es.maintenance.priorities).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description} *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Describa el problema encontrado..."
            />
          </div>

          {/* Immediate risk toggle */}
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.immediateRisk}
                onChange={e => setForm(prev => ({ ...prev, immediateRisk: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-red-600"></div>
            </label>
            <div>
              <p className="text-sm font-semibold text-red-700">{es.maintenance.immediateRisk}</p>
              <p className="text-xs text-red-600">Marque si hay peligro inmediato para personas</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-600 text-white rounded-xl text-base font-semibold hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50"
          >
            {submitting ? es.common.loading : es.maintenance.reportWarning}
          </button>
        </form>
      </div>
    </div>
  );
}
