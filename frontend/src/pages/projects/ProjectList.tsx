import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { FolderKanban, Plus, X } from 'lucide-react';
import type { Project, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';

const statusColors: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-600',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

export function ProjectList() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', budget: '', startDate: '', targetEndDate: '',
  });

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const res = await apiGet<PaginatedResponse<Project>>('/projects?limit=50');
      setProjects(res.data);
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
      await apiPost('/projects', {
        title: form.title,
        description: form.description,
        budget: parseFloat(form.budget),
        startDate: form.startDate || undefined,
        targetEndDate: form.targetEndDate || undefined,
      });
      setShowForm(false);
      setForm({ title: '', description: '', budget: '', startDate: '', targetEndDate: '' });
      loadProjects();
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.projects.title}</h1>
            <p className="text-sm text-gray-500">{projects.length} proyectos</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => { setError(null); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus size={18} />
            {es.common.create}
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{es.common.noData}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const budget = Number(project.budget);
            const spent = Number(project.spent);
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex-1 mr-2">{project.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                    {es.projects.statuses[project.status as keyof typeof es.projects.statuses]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{es.projects.spent}: Q{spent.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                    <span>{es.projects.budget}: Q{budget.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>{project.startDate ? new Date(project.startDate).toLocaleDateString('es-GT') : '—'}</span>
                  <span>{project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString('es-GT') : '—'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Crear Proyecto</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input type="text" required value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description} *</label>
                <textarea required rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.projects.budget} (Q) *</label>
                <input type="number" step="0.01" min="0" required value={form.budget} onChange={e => setForm(prev => ({ ...prev, budget: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.projects.startDate}</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.projects.targetEndDate}</label>
                  <input type="date" value={form.targetEndDate} onChange={e => setForm(prev => ({ ...prev, targetEndDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? es.common.loading : es.common.create}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
