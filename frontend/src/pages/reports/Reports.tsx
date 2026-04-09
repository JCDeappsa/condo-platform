import { useState } from 'react';
import { apiGet } from '../../lib/api';
import { es } from '../../i18n/es';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { MonthlyCharge, CollectionStatus, MaintenanceTicket, PaginatedResponse } from '../../types';

type Tab = 'income' | 'delinquency' | 'maintenance';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280'];

export function Reports() {
  const [tab, setTab] = useState<Tab>('income');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Income data
  const [incomeData, setIncomeData] = useState<{ period: string; billed: number; collected: number }[]>([]);

  // Delinquency data
  const [delinquencyData, setDelinquencyData] = useState<{ name: string; value: number }[]>([]);

  // Maintenance data
  const [maintenanceByStatus, setMaintenanceByStatus] = useState<{ name: string; value: number }[]>([]);
  const [maintenanceByCategory, setMaintenanceByCategory] = useState<{ name: string; value: number }[]>([]);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (tab === 'income') {
        const res = await apiGet<PaginatedResponse<MonthlyCharge>>(`/billing/charges?from=${from}&to=${to}&limit=500`);
        const charges = res.data;
        const byPeriod: Record<string, { billed: number; collected: number }> = {};
        charges.forEach(c => {
          if (!byPeriod[c.period]) byPeriod[c.period] = { billed: 0, collected: 0 };
          byPeriod[c.period].billed += Number(c.amount);
          byPeriod[c.period].collected += Number(c.paidAmount);
        });
        setIncomeData(
          Object.entries(byPeriod)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, d]) => ({ period, billed: d.billed, collected: d.collected }))
        );
      } else if (tab === 'delinquency') {
        const res = await apiGet<{ success: boolean; data: CollectionStatus[] }>('/collections/status');
        const statuses = res.data;
        const byStage: Record<string, number> = {};
        statuses.forEach(s => {
          const label = es.collections.stages[s.collectionStage] || s.collectionStage;
          byStage[label] = (byStage[label] || 0) + 1;
        });
        setDelinquencyData(Object.entries(byStage).map(([name, value]) => ({ name, value })));
      } else {
        const res = await apiGet<PaginatedResponse<MaintenanceTicket>>(`/maintenance-tickets?limit=500`);
        const tickets = res.data;
        const byStatus: Record<string, number> = {};
        const byCat: Record<string, number> = {};
        tickets.forEach(t => {
          const sLabel = es.maintenance.statuses[t.status as keyof typeof es.maintenance.statuses] || t.status;
          byStatus[sLabel] = (byStatus[sLabel] || 0) + 1;
          const cLabel = es.maintenance.categories[t.category as keyof typeof es.maintenance.categories] || t.category;
          byCat[cLabel] = (byCat[cLabel] || 0) + 1;
        });
        setMaintenanceByStatus(Object.entries(byStatus).map(([name, value]) => ({ name, value })));
        setMaintenanceByCategory(Object.entries(byCat).map(([name, value]) => ({ name, value })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'income', label: es.reports.income },
    { key: 'delinquency', label: es.reports.delinquency },
    { key: 'maintenance', label: es.reports.maintenanceStats },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.reports.title}</h1>
          <p className="text-sm text-gray-500">Analisis y estadisticas del condominio</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.reports.from}</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{es.reports.to}</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={generateReport} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {loading ? es.common.loading : es.reports.generate}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tab === 'income' ? (
          incomeData.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Facturado vs Cobrado por Periodo</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `Q${v.toLocaleString()}`} />
                  <Tooltip />
                  <Bar dataKey="billed" name="Facturado" fill="#3b82f6" />
                  <Bar dataKey="collected" name="Cobrado" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">Presione "Generar Reporte" para ver datos.</p>
          )
        ) : tab === 'delinquency' ? (
          delinquencyData.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Unidades por Etapa de Cobranza</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={delinquencyData} cx="50%" cy="50%" outerRadius={150} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {delinquencyData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">Presione "Generar Reporte" para ver datos.</p>
          )
        ) : (
          maintenanceByStatus.length > 0 || maintenanceByCategory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Tickets por Estado</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={maintenanceByStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {maintenanceByStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Tickets por Categoria</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={maintenanceByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tickets" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">Presione "Generar Reporte" para ver datos.</p>
          )
        )}
      </div>
    </div>
  );
}
