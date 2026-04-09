import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { Wrench, Search, Plus } from 'lucide-react';
import type { MaintenanceTicket, PaginatedResponse } from '../../types';
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

export function TicketList() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => { loadTickets(); }, [pagination.page, statusFilter, priorityFilter, categoryFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let url = `/maintenance-tickets?page=${pagination.page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      const res = await apiGet<PaginatedResponse<MaintenanceTicket>>(url);
      setTickets(res.data);
      setPagination(prev => ({ ...prev, total: res.pagination.total, totalPages: res.pagination.totalPages }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Wrench className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.maintenance.title}</h1>
            <p className="text-sm text-gray-500">{pagination.total} tickets</p>
          </div>
        </div>
        {isAdmin && (
          <Link
            to="/maintenance/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={18} />
            {es.maintenance.createTicket}
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por titulo o ubicacion..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">{es.common.status}: Todos</option>
          {Object.entries(es.maintenance.statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">{es.maintenance.priority}: Todas</option>
          {Object.entries(es.maintenance.priorities).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">{es.maintenance.category}: Todas</option>
          {Object.entries(es.maintenance.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Titulo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.maintenance.category}</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.maintenance.priority}</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.maintenance.location}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.maintenance.assignedTo}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/maintenance/${ticket.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {es.maintenance.categories[ticket.category as keyof typeof es.maintenance.categories]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {es.maintenance.priorities[ticket.priority as keyof typeof es.maintenance.priorities]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                        {es.maintenance.statuses[ticket.status as keyof typeof es.maintenance.statuses]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ticket.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString('es-GT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredTickets.length === 0 && (
          <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
        )}
      </div>
    </div>
  );
}
