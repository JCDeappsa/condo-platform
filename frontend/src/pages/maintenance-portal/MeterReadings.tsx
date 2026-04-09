import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, Gauge } from 'lucide-react';

interface MeterPointItem {
  id: string;
  meterSerial: string;
  unit: { id: string; unitNumber: string } | null;
  meterType: { id: string; name: string; unitOfMeasure?: string } | null;
}

interface ReadingItem {
  id: string;
  readingValue: number;
  readingDate: string;
  isAnomaly: boolean;
  meterPoint: {
    id: string;
    meterSerial: string;
    unit: { unitNumber: string } | null;
    meterType: { name: string } | null;
  } | null;
}

export function MeterReadingsPortal() {
  const [meterPoints, setMeterPoints] = useState<MeterPointItem[]>([]);
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    meterPointId: '',
    readingValue: '',
    readingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pointsRes, readingsRes] = await Promise.all([
        apiGet<any>('/meters/points?limit=200'),
        apiGet<any>('/meters/readings?limit=50'),
      ]);
      setMeterPoints(pointsRes.data || []);
      setReadings(readingsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPost('/meters/readings', {
        meterPointId: form.meterPointId,
        readingValue: parseFloat(form.readingValue),
        readingDate: form.readingDate,
        notes: form.notes || undefined,
      });
      setSuccess('Lectura registrada exitosamente');
      setForm({ meterPointId: '', readingValue: '', readingDate: new Date().toISOString().split('T')[0], notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen pb-8 max-w-2xl mx-auto">
      <Link to="/my-tasks" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4 py-2">
        <ArrowLeft size={18} />
        {es.common.back}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Gauge className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">{es.meters.recordReading}</h1>
      </div>

      {meterPoints.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm">
          No hay medidores configurados. Un administrador debe crear puntos de medición primero.
        </div>
      ) : (
        <>
          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-4">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.meters.meterPoint} *</label>
                <select required value={form.meterPointId}
                  onChange={e => setForm(prev => ({ ...prev, meterPointId: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccione un medidor</option>
                  {meterPoints.map(mp => (
                    <option key={mp.id} value={mp.id}>
                      {mp.unit?.unitNumber || '—'} — {mp.meterType?.name || 'Medidor'} ({mp.meterSerial || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.meters.readingValue} *</label>
                  <input type="number" step="0.01" required value={form.readingValue}
                    onChange={e => setForm(prev => ({ ...prev, readingValue: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.meters.readingDate} *</label>
                  <input type="date" required value={form.readingDate}
                    onChange={e => setForm(prev => ({ ...prev, readingDate: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.notes}</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-4 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50">
                {submitting ? es.common.loading : es.meters.recordReading}
              </button>
            </form>
          </div>

          {/* Reading History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Historial de Lecturas</h3>
              <p className="text-xs text-gray-500 mt-0.5">Más recientes primero</p>
            </div>
            {readings.length === 0 ? (
              <p className="text-sm text-gray-400 p-5">{es.common.noData}</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {readings.map((r, idx) => {
                  const prevReading = readings[idx + 1];
                  const consumption = prevReading && r.meterPoint?.id === prevReading.meterPoint?.id
                    ? (r.readingValue - prevReading.readingValue).toFixed(2)
                    : null;

                  return (
                    <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${r.isAnomaly ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {r.meterPoint?.unit?.unitNumber?.replace('C-', '') || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {r.meterPoint?.unit?.unitNumber || '—'}
                            <span className="text-gray-400 font-normal"> — {r.meterPoint?.meterType?.name || 'Medidor'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(r.readingDate).toLocaleDateString('es-GT', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">{r.readingValue.toLocaleString()}</p>
                        {consumption !== null && (
                          <p className="text-xs text-gray-500">Consumo: <span className="font-medium text-blue-600">{consumption}</span></p>
                        )}
                        {r.isAnomaly && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                            {es.meters.anomalyDetected}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
