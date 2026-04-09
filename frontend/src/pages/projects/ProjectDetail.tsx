import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import type { Project } from '../../types';
import { useAuth } from '../../lib/auth';

const statusColors: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-600',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Project }>(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(`/projects/${id}/updates`, { comment });
      setComment('');
      loadProject();
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

  if (!project) {
    return <div className="text-center py-12 text-gray-500">{es.common.noData}</div>;
  }

  const budget = Number(project.budget);
  const spent = Number(project.spent);
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <div>
      <Link to="/projects" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4">
        <ArrowLeft size={16} />
        {es.common.back}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Creado por {project.createdBy.firstName} {project.createdBy.lastName}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {es.projects.statuses[project.status as keyof typeof es.projects.statuses]}
        </span>
      </div>

      {/* Info and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{es.common.description}</h3>
          <p className="text-sm text-gray-800 whitespace-pre-wrap mb-4">{project.description}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">{es.projects.startDate}:</span>
              <span className="font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString('es-GT') : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">{es.projects.targetEndDate}:</span>
              <span className="font-medium">{project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString('es-GT') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Budget gauge */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-4">{es.projects.budget}</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">{es.projects.budget}</p>
              <p className="text-lg font-bold text-gray-900">Q{budget.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{es.projects.spent}</p>
              <p className="text-lg font-bold text-orange-600">Q{spent.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{es.projects.remaining}</p>
              <p className={`text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>Q{remaining.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">{pct.toFixed(1)}% ejecutado</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Actualizaciones</h3>
        {project.updates && project.updates.length > 0 ? (
          <div className="space-y-4">
            {project.updates.map(update => (
              <div key={update.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{update.author.firstName} {update.author.lastName}</span>
                    <span className="text-xs text-gray-400">{new Date(update.createdAt).toLocaleString('es-GT')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{update.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin actualizaciones</p>
        )}
      </div>

      {/* Add Update Form */}
      {isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">{es.projects.addUpdate}</h3>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-3">{error}</div>}
          <form onSubmit={handleAddUpdate} className="space-y-3">
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Agregar actualizacion..."
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting ? es.common.loading : es.projects.addUpdate}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
