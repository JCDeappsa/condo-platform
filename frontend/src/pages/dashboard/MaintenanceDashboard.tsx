import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { Wrench, ClipboardList, AlertTriangle, Gauge } from 'lucide-react';
import type { MaintenanceDashboardData } from '../../types';
import { useAuth } from '../../lib/auth';

export function MaintenanceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<MaintenanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: MaintenanceDashboardData }>('/dashboards/maintenance');
      setData(res.data);
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

  if (!data) {
    return <div className="text-center py-12 text-gray-500 min-h-screen">{es.common.noData}</div>;
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.dashboard.welcome}, {user?.firstName}</h1>
          <p className="text-sm text-gray-500">{es.nav.dashboard}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={18} className="text-blue-500" />
            <p className="text-sm text-gray-500">{es.dashboard.assignedTickets}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.assignedTickets.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-orange-500" />
            <p className="text-sm text-gray-500">{es.dashboard.pendingInspections}</p>
          </div>
          <p className="text-3xl font-bold text-orange-600">{data.pendingInspections}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={18} className="text-green-500" />
            <p className="text-sm text-gray-500">{es.dashboard.readingsDue}</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{data.readingsDue}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/my-tasks"
          className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-xl p-5 hover:bg-blue-100 active:bg-blue-200 transition-colors"
        >
          <ClipboardList size={28} className="text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">{es.nav.myTasks}</p>
            <p className="text-sm text-blue-600">Ver tareas asignadas</p>
          </div>
        </Link>
        <Link
          to="/report-warning"
          className="flex items-center gap-4 bg-orange-50 border border-orange-200 rounded-xl p-5 hover:bg-orange-100 active:bg-orange-200 transition-colors"
        >
          <AlertTriangle size={28} className="text-orange-600" />
          <div>
            <p className="font-semibold text-orange-900">{es.maintenance.reportWarning}</p>
            <p className="text-sm text-orange-600">Reportar un problema</p>
          </div>
        </Link>
        <Link
          to="/meter-readings"
          className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl p-5 hover:bg-green-100 active:bg-green-200 transition-colors"
        >
          <Gauge size={28} className="text-green-600" />
          <div>
            <p className="font-semibold text-green-900">{es.meters.recordReading}</p>
            <p className="text-sm text-green-600">Registrar lectura de medidor</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
