import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { AlertTriangle, RefreshCw, Play } from 'lucide-react';
import type { CollectionStatus, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';

const stageColors: Record<string, string> = {
  current: 'bg-green-100 text-green-700',
  reminder: 'bg-yellow-100 text-yellow-700',
  warning: 'bg-orange-100 text-orange-700',
  escalated: 'bg-red-100 text-red-700',
  legal: 'bg-purple-100 text-purple-700',
};

export function CollectionStatusPage() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [statuses, setStatuses] = useState<CollectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningEngine, setRunningEngine] = useState(false);
  const [engineResult, setEngineResult] = useState<string | null>(null);

  useEffect(() => { loadStatuses(); }, []);

  const loadStatuses = async () => {
    try {
      const res = await apiGet<PaginatedResponse<CollectionStatus>>('/collections/status?limit=60');
      setStatuses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiPost('/collections/refresh', {});
      loadStatuses();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunEngine = async () => {
    setRunningEngine(true);
    setEngineResult(null);
    try {
      const res = await apiPost<{ success: boolean; message: string }>('/collections/engine/run', {});
      setEngineResult(res.message);
      loadStatuses();
    } catch (err: any) {
      setEngineResult(err.message);
    } finally {
      setRunningEngine(false);
    }
  };

  const overdueAccounts = statuses.filter(s => s.daysOverdue > 0);
  const totalOverdue = overdueAccounts.reduce((sum, s) => sum + Number(s.totalOverdue), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-orange-500" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.collections.title}</h1>
            <p className="text-sm text-gray-500">{overdueAccounts.length} cuentas en mora</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button onClick={handleRunEngine} disabled={runningEngine} className="flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm">
              <Play size={16} />
              {runningEngine ? 'Ejecutando...' : 'Ejecutar Motor'}
            </button>
          </div>
        )}
      </div>

      {engineResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm mb-4">{engineResult}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total en Mora</p>
          <p className="text-xl font-bold text-red-600">Q{totalOverdue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Cuentas en Mora</p>
          <p className="text-xl font-bold text-orange-600">{overdueAccounts.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Con Promesa Activa</p>
          <p className="text-xl font-bold text-blue-600">{statuses.filter(s => s.hasActivePromise).length}</p>
        </div>
      </div>

      {/* Status table */}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.unitNumber}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total Vencido</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.collections.daysOverdue}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.collections.stage}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.collections.promise}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statuses.filter(s => s.daysOverdue > 0).map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{(s as any).unit?.unitNumber || s.unitId}</td>
                  <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">Q{Number(s.totalOverdue).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-sm text-center font-medium">{s.daysOverdue}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors[s.collectionStage] || 'bg-gray-100 text-gray-600'}`}>
                      {es.collections.stages[s.collectionStage as keyof typeof es.collections.stages]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.hasActivePromise && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {es.collections.promiseStatuses.active}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {!loading && overdueAccounts.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay cuentas en mora.</div>
        )}
      </div>
    </div>
  );
}
