import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, Clock, User, MapPin, Tag } from 'lucide-react';
import type { MaintenanceTicket } from '../../types';
import { useAuth } from '../../lib/auth';

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

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadTicket(); }, [id]);

  const loadTicket = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: MaintenanceTicket }>(`/maintenance-tickets/${id}`);
      setTicket(res.data);
      setNewStatus(res.data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && newStatus === ticket?.status) return;
    setSubmitting(true);
    setError(null);
    try {
      // If status changed, patch the ticket
      if (newStatus !== ticket?.status) {
        const patchBody: Record<string, string> = { status: newStatus };
        if (newStatus === 'completed' && closingNotes.trim()) {
          patchBody.closingNotes = closingNotes;
        }
        await apiPatch(`/maintenance-tickets/${id}`, patchBody);
      }
      // Add update comment
      if (comment.trim()) {
        await apiPost(`/maintenance-tickets/${id}/updates`, {
          comment,
          statusChangeTo: newStatus !== ticket?.status ? newStatus : undefined,
          statusChangeFrom: newStatus !== ticket?.status ? ticket?.status : undefined,
        });
      }
      setComment('');
      setClosingNotes('');
      loadTicket();
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

  if (!ticket) {
    return <div className="text-center py-12 text-gray-500">{es.common.noData}</div>;
  }

  return (
    <div>
      <Link to="/maintenance" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4">
        <ArrowLeft size={16} />
        {es.common.back}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{es.maintenance.ticketDetail}</p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
            {es.maintenance.priorities[ticket.priority as keyof typeof es.maintenance.priorities]}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
            {es.maintenance.statuses[ticket.status as keyof typeof es.maintenance.statuses]}
          </span>
        </div>
      </div>

      {/* Ticket Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Tag size={16} className="text-gray-400" />
            <span className="text-gray-500">{es.maintenance.category}:</span>
            <span className="font-medium">{es.maintenance.categories[ticket.category as keyof typeof es.maintenance.categories]}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-500">{es.maintenance.location}:</span>
            <span className="font-medium">{ticket.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-500">{es.maintenance.assignedTo}:</span>
            <span className="font-medium">{ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-gray-400" />
            <span className="text-gray-500">{es.maintenance.reportedBy}:</span>
            <span className="font-medium">{ticket.reportedBy ? `${ticket.reportedBy.firstName} ${ticket.reportedBy.lastName}` : '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-500">{es.maintenance.dueDate}:</span>
            <span className="font-medium">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString('es-GT') : '—'}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{es.common.description}</h3>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
          {ticket.closingNotes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">{es.maintenance.closingNotes}</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.closingNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {ticket.photos && ticket.photos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Fotos</h3>
          <div className="flex gap-3 flex-wrap">
            {ticket.photos.map(photo => (
              <a key={photo.id} href={photo.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={photo.fileUrl} alt={photo.fileName} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Historial de Actualizaciones</h3>
        {ticket.updates && ticket.updates.length > 0 ? (
          <div className="space-y-4">
            {ticket.updates.map(update => (
              <div key={update.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {update.author.firstName} {update.author.lastName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(update.createdAt).toLocaleString('es-GT')}
                    </span>
                  </div>
                  {update.statusChangeFrom && update.statusChangeTo && (
                    <p className="text-xs text-gray-500 mb-1">
                      Cambio estado: {es.maintenance.statuses[update.statusChangeFrom as keyof typeof es.maintenance.statuses]} → {es.maintenance.statuses[update.statusChangeTo as keyof typeof es.maintenance.statuses]}
                    </p>
                  )}
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
      {(isAdmin || user?.role.name === 'maintenance') && ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">{es.maintenance.addUpdate}</h3>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-3">{error}</div>}
          <form onSubmit={handleAddUpdate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.status}</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(es.maintenance.statuses).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {newStatus === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.closingNotes} *</label>
                <textarea
                  required
                  rows={3}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describa como se resolvio el problema..."
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Agregar comentario..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting ? es.common.loading : es.maintenance.addUpdate}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
