import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { Gauge, Plus, X } from 'lucide-react';
import type { MeterPoint, MeterType, Unit, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';

export function MeterPoints() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [meterPoints, setMeterPoints] = useState<MeterPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [meterTypes, setMeterTypes] = useState<MeterType[]>([]);
  const [units, setUnits] = useState<{ id: string; unitNumber: string }[]>([]);
  const [form, setForm] = useState({ unitId: '', meterTypeId: '', meterSerial: '', locationDescription: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All readings for the flat view
  const [readings, setReadings] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadReadings(); }, [dateFrom, dateTo]);

  const loadData = async () => {
    try {
      const res = await apiGet<PaginatedResponse<MeterPoint>>('/meters/points?limit=200');
      setMeterPoints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReadings = async () => {
    try {
      let url = '/meters/readings?limit=200';
      if (dateFrom) url += `&from=${dateFrom}`;
      if (dateTo) url += `&to=${dateTo}`;
      const res = await apiGet<any>(url);
      setReadings(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openForm = async () => {
    try {
      const [typesRes, unitsRes] = await Promise.all([
        apiGet<{ success: boolean; data: MeterType[] }>('/meters/types'),
        apiGet<PaginatedResponse<Unit>>('/units?limit=100'),
      ]);
      setMeterTypes(typesRes.data);
      setUnits(unitsRes.data.map(u => ({ id: u.id, unitNumber: u.unitNumber })));
    } catch {}
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/meters/points', form);
      setShowForm(false);
      setForm({ unitId: '', meterTypeId: '', meterSerial: '', locationDescription: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Build a map of previous readings per meter point for display
  const readingsByPoint: Record<string, any[]> = {};
  readings.forEach((r: any) => {
    const pid = r.meterPointId;
    if (!readingsByPoint[pid]) readingsByPoint[pid] = [];
    readingsByPoint[pid].push(r);
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Gauge className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.meters.title}</h1>
            <p className="text-sm text-gray-500">{meterPoints.length} puntos de medición</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={openForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus size={18} />
            {es.common.create}
          </button>
        )}
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Desde:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Hasta:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-blue-600 hover:text-blue-800">Limpiar</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.unitNumber}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Serial</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lectura Anterior</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha Anterior</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Última Lectura</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha Última</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Consumo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {meterPoints.map(mp => {
                const pointReadings = readingsByPoint[mp.id] || [];
                const latest = pointReadings[0];
                const previous = pointReadings[1];
                const consumption = latest && previous ? (latest.readingValue - previous.readingValue).toFixed(2) : null;

                return (
                  <tr key={mp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{mp.unit?.unitNumber || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mp.meterType.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mp.meterSerial}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">
                      {previous ? Number(previous.readingValue).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {previous ? new Date(previous.readingDate).toLocaleDateString('es-GT') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {latest ? Number(latest.readingValue).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {latest ? new Date(latest.readingDate).toLocaleDateString('es-GT') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {consumption !== null ? (
                        <span className={Number(consumption) < 0 ? 'text-red-600' : 'text-blue-600'}>{consumption}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {mp.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {meterPoints.length === 0 && (
          <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
        )}
      </div>

      {/* Add Meter Point Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Agregar Punto de Medición</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.unitNumber} *</label>
                <select required value={form.unitId} onChange={e => setForm(prev => ({ ...prev, unitId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccione una unidad</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Medidor *</label>
                <select required value={form.meterTypeId} onChange={e => setForm(prev => ({ ...prev, meterTypeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccione un tipo</option>
                  {meterTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.name} ({mt.unitOfMeasure})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial *</label>
                <input type="text" required value={form.meterSerial} onChange={e => setForm(prev => ({ ...prev, meterSerial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input type="text" value={form.locationDescription} onChange={e => setForm(prev => ({ ...prev, locationDescription: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {submitting ? es.common.loading : es.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
