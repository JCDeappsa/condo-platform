import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { ClipboardList, MapPin, Calendar } from 'lucide-react';
import type { MaintenanceTicket } from '../../types';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  pending_parts: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function MyTasks() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: MaintenanceTicket[] }>('/maintenance-tickets/my-tasks');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.nav.myTasks}</h1>
          <p className="text-sm text-gray-500">{tickets.length} tareas asignadas</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{es.common.noData}</div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <Link
              key={ticket.id}
              to={`/my-tasks/${ticket.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow active:bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900 flex-1 mr-2">{ticket.title}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                  {es.maintenance.priorities[ticket.priority as keyof typeof es.maintenance.priorities]}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <MapPin size={14} />
                <span>{ticket.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                  {es.maintenance.statuses[ticket.status as keyof typeof es.maintenance.statuses]}
                </span>
                {ticket.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    <span>{new Date(ticket.dueDate).toLocaleDateString('es-GT')}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
