import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft } from 'lucide-react';
import type { Unit, User, PaginatedResponse } from '../../types';

export function CreateTicket() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<{ id: string; unitNumber: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    location: '',
    assignedTo: '',
    unitId: '',
    dueDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [unitsRes, usersRes] = await Promise.all([
        apiGet<PaginatedResponse<Unit>>('/units?limit=60'),
        apiGet<PaginatedResponse<User>>('/users?limit=60'),
      ]);
      setUnits(unitsRes.data.map(u => ({ id: u.id, unitNumber: u.unitNumber })));
      setUsers(usersRes.data.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/maintenance-tickets', {
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        location: form.location,
        assignedTo: form.assignedTo || undefined,
        unitId: form.unitId || undefined,
        dueDate: form.dueDate || undefined,
      });
      navigate('/maintenance');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link to="/maintenance" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4">
        <ArrowLeft size={16} />
        {es.common.back}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{es.maintenance.createTicket}</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description} *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.category} *</label>
              <select
                required
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(es.maintenance.priorities).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.location} *</label>
            <input
              type="text"
              required
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Area de piscina, Casa 12..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.assignedTo}</label>
              <select
                value={form.assignedTo}
                onChange={e => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Sin asignar</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.unitNumber}</label>
              <select
                value={form.unitId}
                onChange={e => setForm(prev => ({ ...prev, unitId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Ninguna</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.dueDate}</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              {es.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting ? es.common.loading : es.maintenance.createTicket}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
