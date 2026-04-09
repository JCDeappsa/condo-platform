import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { Home, CreditCard, AlertTriangle, Megaphone } from 'lucide-react';
import type { Unit, MonthlyCharge, Payment, Announcement } from '../../types';

export function MyUnit() {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [charges, setCharges] = useState<MonthlyCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const unitRes = await apiGet<{ success: boolean; data: Unit }>('/units/my-unit');
      const u = unitRes.data;
      setUnit(u);

      const [balRes, chargeRes, payRes, annRes] = await Promise.all([
        apiGet<{ success: boolean; data: { balance: number } }>(`/payments/balance/${u.id}`),
        apiGet<{ success: boolean; data: MonthlyCharge[] }>(`/billing/charges?unitId=${u.id}&limit=5`),
        apiGet<{ success: boolean; data: Payment[] }>(`/payments?unitId=${u.id}&limit=5`),
        apiGet<{ success: boolean; data: Announcement[] }>('/announcements?limit=5'),
      ]);

      setBalance(balRes.data.balance);
      setCharges(Array.isArray(chargeRes.data) ? chargeRes.data : []);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : []);
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

  if (!unit) {
    return <div className="text-center py-12 text-gray-500">No tiene una unidad asignada.</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Home className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.nav.myUnit}</h1>
          <p className="text-sm text-gray-500">Unidad {unit.unitNumber}</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className={`rounded-lg border p-6 mb-6 ${balance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <p className="text-sm text-gray-600 mb-1">{es.dashboard.currentBalance}</p>
        <p className={`text-3xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          Q{Number(balance).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </p>
        {balance > 0 && <p className="text-sm text-red-500 mt-1">Tiene saldo pendiente de pago.</p>}
        {balance <= 0 && <p className="text-sm text-green-600 mt-1">Su cuenta esta al dia.</p>}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link to="/report-issue" className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <AlertTriangle className="text-orange-500" size={24} />
          <div>
            <p className="text-sm font-medium text-gray-900">{es.maintenance.reportWarning}</p>
            <p className="text-xs text-gray-500">Crear un ticket de mantenimiento</p>
          </div>
        </Link>
        <Link to="/announcements" className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <Megaphone className="text-blue-500" size={24} />
          <div>
            <p className="text-sm font-medium text-gray-900">{es.announcements.title}</p>
            <p className="text-xs text-gray-500">Ver avisos del condominio</p>
          </div>
        </Link>
      </div>

      {/* Recent Charges & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Charges */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Cobros Recientes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {charges.length > 0 ? charges.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.period}</p>
                  <p className="text-xs text-gray-500">{c.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Q{Number(c.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'paid' ? 'bg-green-100 text-green-700' :
                    c.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {es.billing.statuses[c.status]}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">{es.common.noData}</div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <CreditCard size={16} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">{es.dashboard.recentPayments}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.length > 0 ? payments.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{new Date(p.paymentDate).toLocaleDateString('es-GT')}</p>
                  <p className="text-xs text-gray-500">{es.payments.methods[p.paymentMethod as keyof typeof es.payments.methods]}</p>
                </div>
                <p className="text-sm font-medium text-green-600">Q{Number(p.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
              </div>
            )) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">{es.common.noData}</div>
            )}
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-6 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Megaphone size={16} className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">Avisos Recientes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {announcements.map(a => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  {a.priority !== 'normal' && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {es.announcements.priorities[a.priority]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString('es-GT')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
