import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { Shield, Search } from 'lucide-react';
import type { AuditLog, PaginatedResponse } from '../../types';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => { loadLogs(); }, [pagination.page, entityTypeFilter, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let url = `/audit-logs?page=${pagination.page}&limit=30`;
      if (entityTypeFilter) url += `&entityType=${entityTypeFilter}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;
      const res = await apiGet<PaginatedResponse<AuditLog>>(url);
      setLogs(res.data);
      setPagination(prev => ({ ...prev, total: res.pagination.total, totalPages: res.pagination.totalPages }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityType.toLowerCase().includes(search.toLowerCase()) ||
        (l.user && `${l.user.firstName} ${l.user.lastName}`.toLowerCase().includes(search.toLowerCase()))
      )
    : logs;

  // Collect unique entity types from current data for the filter
  const entityTypes = [...new Set(logs.map(l => l.entityType))];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.audit.title}</h1>
          <p className="text-sm text-gray-500">{pagination.total} registros</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario, accion o entidad..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <select
          value={entityTypeFilter}
          onChange={e => { setEntityTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{es.audit.entity}: Todas</option>
          {entityTypes.map(et => <option key={et} value={et}>{et}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          placeholder={es.reports.from}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          placeholder={es.reports.to}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.audit.timestamp}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.audit.user}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.audit.action}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.audit.entity}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('es-GT')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.entityType}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono text-xs">{log.entityId.substring(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {es.common.page} {pagination.page} {es.common.of} {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
