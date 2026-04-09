import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import { es } from '../../i18n/es';
import { CreditCard, Plus, X, Trash2 } from 'lucide-react';
import type { Payment, Unit, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../components/ui/ConfirmDialog';

export function PaymentList() {
  const { user } = useAuth();
  const { confirm, alert } = useConfirm();
  const isAdmin = user?.role.name === 'administrator';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [units, setUnits] = useState<{ id: string; unitNumber: string }[]>([]);
  const [form, setForm] = useState({
    unitId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer', referenceNumber: '', bankReference: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });

  useEffect(() => { loadPayments(); }, [pagination.page]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await apiGet<PaginatedResponse<Payment>>(`/payments?page=${pagination.page}&limit=20`);
      setPayments(res.data);
      setPagination(prev => ({ ...prev, total: res.pagination.total }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    const ok = await confirm({ title: 'Eliminar Pago', message: '¿Está seguro que desea eliminar este pago?', type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try { await apiDelete(`/payments/${id}`); alert('Pago eliminado.', 'success'); loadPayments(); }
    catch (err: any) { alert(err.message, 'error'); }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({ title: 'Eliminar Pagos', message: `¿Eliminar ${selectedIds.size} pago(s) seleccionado(s)?`, type: 'danger', confirmText: `Eliminar ${selectedIds.size}` });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await apiPost<{ success: boolean; message: string }>('/payments/bulk-delete', { ids: Array.from(selectedIds) });
      alert(res.message, 'success'); setSelectedIds(new Set()); loadPayments();
    } catch (err: any) { alert(err.message, 'error'); }
    finally { setDeleting(false); }
  };

  const toggleSelect = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const toggleSelectAll = () => { if (selectedIds.size === payments.length) setSelectedIds(new Set()); else setSelectedIds(new Set(payments.map(p => p.id))); };

  const openForm = async () => {
    try {
      const res = await apiGet<PaginatedResponse<Unit>>('/units?limit=60');
      setUnits(res.data.map(u => ({ id: u.id, unitNumber: u.unitNumber })));
    } catch (err) {
      console.error(err);
    }
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost('/payments', {
        unitId: form.unitId,
        amount: parseFloat(form.amount),
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        referenceNumber: form.referenceNumber || null,
        bankReference: form.bankReference || null,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ unitId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer', referenceNumber: '', bankReference: '', notes: '' });
      loadPayments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.payments.title}</h1>
            <p className="text-sm text-gray-500">{pagination.total} pagos registrados</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={openForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus size={18} />
            {es.payments.record}
          </button>
        )}
      </div>

      {/* Bulk delete bar */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="mb-4">
          <button onClick={handleDeleteBulk} disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
            <Trash2 size={16} />
            {deleting ? 'Eliminando...' : `Eliminar ${selectedIds.size} pago(s)`}
          </button>
        </div>
      )}

      {/* Payment table */}
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
                {isAdmin && (
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.size === payments.length && payments.length > 0}
                      onChange={toggleSelectAll} className="rounded border-gray-300" />
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.units.unitNumber}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.amount}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.paymentDate}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.paymentMethod}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.reference}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.reconciled}</th>
                {isAdmin && <th className="px-3 py-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${selectedIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                  {isAdmin && (
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)} className="rounded border-gray-300" />
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{(p as any).unit?.unitNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">Q{Number(p.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.paymentDate).toLocaleDateString('es-GT')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{es.payments.methods[p.paymentMethod as keyof typeof es.payments.methods]}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.referenceNumber || p.bankReference || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.reconciled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.reconciled ? 'Sí' : 'No'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-3">
                      <button onClick={() => handleDeleteSingle(p.id)} className="p-1 text-gray-400 hover:text-red-600" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {!loading && payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay pagos registrados.</div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{es.payments.record}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.unitNumber}</label>
                <select required value={form.unitId} onChange={e => setForm(prev => ({ ...prev, unitId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccione una unidad</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.amount} (Q)</label>
                  <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.paymentDate}</label>
                  <input type="date" required value={form.paymentDate} onChange={e => setForm(prev => ({ ...prev, paymentDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.paymentMethod}</label>
                <select value={form.paymentMethod} onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(es.payments.methods).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.reference}</label>
                  <input type="text" value={form.referenceNumber} onChange={e => setForm(prev => ({ ...prev, referenceNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.bankReference}</label>
                  <input type="text" value={form.bankReference} onChange={e => setForm(prev => ({ ...prev, bankReference: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.notes}</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? es.common.loading : es.payments.record}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
