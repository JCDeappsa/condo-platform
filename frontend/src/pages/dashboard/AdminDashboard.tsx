import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { BarChart3, DollarSign, AlertTriangle, Wrench, FolderKanban } from 'lucide-react';
import type { AdminDashboardData } from '../../types';
import { useAuth } from '../../lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: AdminDashboardData }>('/dashboards/admin');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">{es.common.noData}</div>;
  }

  const chartData = [
    { name: 'Facturado', value: Number(data.billedThisMonth), fill: '#3b82f6' },
    { name: 'Cobrado', value: Number(data.collectedThisMonth), fill: '#22c55e' },
    { name: 'Vencido', value: Number(data.overdueAmount), fill: '#ef4444' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.dashboard.welcome}, {user?.firstName}</h1>
          <p className="text-sm text-gray-500">{es.nav.dashboard}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-blue-500" />
            <p className="text-xs text-gray-500">{es.dashboard.billedThisMonth}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">Q{Number(data.billedThisMonth).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-green-500" />
            <p className="text-xs text-gray-500">{es.dashboard.collectedThisMonth}</p>
          </div>
          <p className="text-xl font-bold text-green-600">Q{Number(data.collectedThisMonth).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-xs text-gray-500">{es.dashboard.overdueAmount}</p>
          </div>
          <p className="text-xl font-bold text-red-600">Q{Number(data.overdueAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-orange-500" />
            <p className="text-xs text-gray-500">{es.dashboard.overdueUnits}</p>
          </div>
          <p className="text-xl font-bold text-orange-600">{data.overdueUnitsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={18} className="text-blue-500" />
            <p className="text-xs text-gray-500">{es.dashboard.openTickets}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{data.openTickets}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={18} className="text-red-500" />
            <p className="text-xs text-gray-500">{es.dashboard.urgentTickets}</p>
          </div>
          <p className="text-xl font-bold text-red-600">{data.urgentTickets}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban size={18} className="text-purple-500" />
            <p className="text-xs text-gray-500">{es.dashboard.activeProjects}</p>
          </div>
          <p className="text-xl font-bold text-purple-600">{data.activeProjects}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Resumen Financiero del Mes</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
