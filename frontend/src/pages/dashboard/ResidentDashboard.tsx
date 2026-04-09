import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { Home, DollarSign, CreditCard, Megaphone, Wrench } from 'lucide-react';
import type { ResidentDashboardData } from '../../types';
import { useAuth } from '../../lib/auth';

const chargeStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const ticketStatusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  pending_parts: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function ResidentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ResidentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: ResidentDashboardData }>('/dashboards/resident');
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Home className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.dashboard.welcome}, {user?.firstName}</h1>
          <p className="text-sm text-gray-500">{es.nav.dashboard}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={20} />
          <p className="text-sm opacity-90">{es.dashboard.currentBalance}</p>
        </div>
        <p className="text-3xl font-bold">Q{Number(data.currentBalance).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Recent Charges */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500">Cobros Recientes</h3>
          </div>
          {data.recentCharges.length === 0 ? (
            <p className="text-sm text-gray-400">{es.common.noData}</p>
          ) : (
            <div className="space-y-3">
              {data.recentCharges.slice(0, 5).map(charge => (
                <div key={charge.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{charge.description}</p>
                    <p className="text-xs text-gray-500">{charge.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Q{Number(charge.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${chargeStatusColors[charge.status]}`}>
                      {es.billing.statuses[charge.status as keyof typeof es.billing.statuses]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500">{es.dashboard.recentPayments}</h3>
          </div>
          {data.recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400">{es.common.noData}</p>
          ) : (
            <div className="space-y-3">
              {data.recentPayments.slice(0, 5).map(payment => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {es.payments.methods[payment.paymentMethod as keyof typeof es.payments.methods]}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString('es-GT')}</p>
                  </div>
                  <p className="text-sm font-medium text-green-600">Q{Number(payment.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={18} className="text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">{es.nav.announcements}</h3>
        </div>
        {data.announcements.length === 0 ? (
          <p className="text-sm text-gray-400">{es.common.noData}</p>
        ) : (
          <div className="space-y-3">
            {data.announcements.slice(0, 3).map(a => (
              <div key={a.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{a.title}</h4>
                  {a.priority !== 'normal' && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {es.announcements.priorities[a.priority as keyof typeof es.announcements.priorities]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Tickets */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={18} className="text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Mis Tickets</h3>
        </div>
        {data.myTickets.length === 0 ? (
          <p className="text-sm text-gray-400">{es.common.noData}</p>
        ) : (
          <div className="space-y-3">
            {data.myTickets.slice(0, 5).map(ticket => (
              <Link key={ticket.id} to={`/maintenance/${ticket.id}`} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
                <div>
                  <p className="text-sm font-medium text-blue-600">{ticket.title}</p>
                  <p className="text-xs text-gray-500">{ticket.location}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ticketStatusColors[ticket.status]}`}>
                  {es.maintenance.statuses[ticket.status as keyof typeof es.maintenance.statuses]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
