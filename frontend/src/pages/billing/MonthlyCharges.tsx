import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import { es } from '../../i18n/es';
import { Receipt, Plus, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, Trash2, X } from 'lucide-react';
import type { MonthlyCharge, ChargeConcept, Unit, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../components/ui/ConfirmDialog';

type SortKey = 'unitNumber' | 'description' | 'amount' | 'paidAmount' | 'balance' | 'status' | 'dueDate' | 'daysOverdue';
type SortDir = 'asc' | 'desc';
type StatusFilter = '' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export function MonthlyCharges() {
  const { user } = useAuth();
  const { confirm, alert } = useConfirm();
  const isAdmin = user?.role.name === 'administrator';

  const [charges, setCharges] = useState<MonthlyCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(currentPeriod());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  // Generate panel
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genDueDate, setGenDueDate] = useState('');
  const [genDescription, setGenDescription] = useState('Mantenimiento');
  const [genAmount, setGenAmount] = useState<number | ''>('');
  const [chargeConcepts, setChargeConcepts] = useState<ChargeConcept[]>([]);
  const [genResult, setGenResult] = useState<string | null>(null);

  // Individual charge
  const [showIndividual, setShowIndividual] = useState(false);
  const [indUnit, setIndUnit] = useState('');
  const [indConcept, setIndConcept] = useState('');
  const [indAmount, setIndAmount] = useState<number | ''>('');
  const [indDueDate, setIndDueDate] = useState('');
  const [units, setUnits] = useState<{ id: string; unitNumber: string }[]>([]);
  const [indSubmitting, setIndSubmitting] = useState(false);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('unitNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => { loadCharges(); }, [period, statusFilter, pagination.page]);

  useEffect(() => {
    if (isAdmin) {
      apiGet<{ success: boolean; data: ChargeConcept[] }>('/settings/charge-concepts')
        .then(res => {
          const active = res.data.filter((c: ChargeConcept) => c.isActive);
          setChargeConcepts(active);
          if (active.length > 0) {
            const maint = active.find((c: ChargeConcept) => c.name === 'Mantenimiento');
            const first = maint || active[0];
            setGenDescription(first.name);
            setGenAmount(Number(first.defaultAmount));
            setIndConcept(first.name);
            setIndAmount(Number(first.defaultAmount));
          }
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  const loadCharges = async () => {
    setLoading(true);
    try {
      let url = `/billing/charges?page=${pagination.page}&limit=100`;
      if (period) url += `&period=${period}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await apiGet<PaginatedResponse<MonthlyCharge>>(url);
      setCharges(res.data);
      setPagination(prev => ({ ...prev, total: res.pagination.total, totalPages: res.pagination.totalPages }));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genDueDate) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await apiPost<{ success: boolean; data: { created: number; skipped: number }; message: string }>(
        '/billing/generate',
        { period, dueDate: genDueDate, description: genDescription, amountOverride: genAmount || undefined }
      );
      setGenResult(res.message);
      loadCharges();
    } catch (err: any) {
      setGenResult(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openIndividual = async () => {
    if (units.length === 0) {
      try {
        const res = await apiGet<PaginatedResponse<Unit>>('/units?limit=100');
        setUnits(res.data.map(u => ({ id: u.id, unitNumber: u.unitNumber })));
      } catch {}
    }
    setShowIndividual(true);
  };

  const handleIndividualCreate = async () => {
    if (!indUnit || !indConcept || !indAmount || !indDueDate) return;
    setIndSubmitting(true);
    try {
      await apiPost('/billing/special', {
        unitId: indUnit,
        period,
        description: indConcept,
        amount: indAmount,
        dueDate: indDueDate,
      });
      setShowIndividual(false);
      setIndUnit('');
      loadCharges();
    } catch (err: any) {
      alert(err.message, 'error');
    } finally {
      setIndSubmitting(false);
    }
  };

  // Delete
  const handleDeleteSingle = async (id: string) => {
    const ok = await confirm({ title: 'Eliminar Cobro', message: '¿Está seguro que desea eliminar este cobro?', type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/billing/charges/${id}`);
      alert('Cobro eliminado.', 'success');
      loadCharges();
    } catch (err: any) {
      alert(err.message, 'error');
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({ title: 'Eliminar Cobros', message: `¿Está seguro que desea eliminar ${selectedIds.size} cobro(s) seleccionado(s)?`, type: 'danger', confirmText: `Eliminar ${selectedIds.size}` });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await apiPost<{ success: boolean; message: string }>('/billing/charges/bulk-delete', {
        ids: Array.from(selectedIds),
      });
      alert(res.message, 'success');
      loadCharges();
    } catch (err: any) {
      alert(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedCharges.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedCharges.map(c => c.id)));
    }
  };

  // Sorting
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="text-gray-300" />;
    return sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />;
  };

  const sortedCharges = [...charges].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'unitNumber': return dir * ((a as any).unit?.unitNumber || '').localeCompare((b as any).unit?.unitNumber || '');
      case 'description': return dir * a.description.localeCompare(b.description);
      case 'amount': return dir * (Number(a.amount) - Number(b.amount));
      case 'paidAmount': return dir * (Number(a.paidAmount) - Number(b.paidAmount));
      case 'balance': return dir * ((Number(a.amount) - Number(a.paidAmount)) - (Number(b.amount) - Number(b.paidAmount)));
      case 'status': return dir * a.status.localeCompare(b.status);
      case 'dueDate': return dir * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      case 'daysOverdue': return dir * (((a as any).daysOverdue || 0) - ((b as any).daysOverdue || 0));
      default: return 0;
    }
  });

  const totalBilled = charges.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPaid = charges.reduce((sum, c) => sum + Number(c.paidAmount), 0);
  const overdueCount = charges.filter(c => c.status === 'overdue' || (c as any).daysOverdue > 0).length;

  const SortHeader = ({ col, label, align = 'left' }: { col: SortKey; label: string; align?: string }) => (
    <th className={`text-${align} px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none`} onClick={() => toggleSort(col)}>
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>{label} <SortIcon column={col} /></span>
    </th>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.billing.title}</h1>
            <p className="text-sm text-gray-500">{pagination.total} cobros en el período</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button onClick={openIndividual} className="flex items-center gap-2 bg-white border border-blue-600 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 text-sm">
              <Plus size={16} />
              Cobro Individual
            </button>
            <button onClick={() => setShowGenerate(!showGenerate)} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
              <RefreshCw size={16} />
              {es.billing.generate}
            </button>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">{es.billing.period}:</label>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">{es.common.status}:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Todos</option>
            <option value="pending">{es.billing.statuses.pending}</option>
            <option value="partial">{es.billing.statuses.partial}</option>
            <option value="paid">{es.billing.statuses.paid}</option>
            <option value="overdue">{es.billing.statuses.overdue}</option>
            <option value="cancelled">{es.billing.statuses.cancelled}</option>
          </select>
        </div>
        {isAdmin && selectedIds.size > 0 && (
          <button onClick={handleDeleteBulk} disabled={deleting}
            className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
            <Trash2 size={16} />
            {deleting ? 'Eliminando...' : `Eliminar ${selectedIds.size} seleccionado(s)`}
          </button>
        )}
      </div>

      {/* Generate charges panel */}
      {showGenerate && isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-800 mb-3">Generar Cobros en Lote — {period}</h3>
          <p className="text-xs text-blue-600 mb-3">Se aplicará a todas las unidades tipo casa.</p>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm text-blue-700 mb-1">Concepto</label>
              <select value={genDescription} onChange={e => {
                const selected = chargeConcepts.find(c => c.name === e.target.value);
                setGenDescription(e.target.value);
                if (selected) setGenAmount(Number(selected.defaultAmount));
              }} className="px-3 py-2 border border-blue-300 rounded-lg text-sm">
                {chargeConcepts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                {chargeConcepts.length === 0 && <option value="Mantenimiento">Mantenimiento</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm text-blue-700 mb-1">{es.common.amount} (Q)</label>
              <input type="number" step="0.01" min="0" value={genAmount}
                onChange={e => setGenAmount(parseFloat(e.target.value) || '')}
                className="px-3 py-2 border border-blue-300 rounded-lg text-sm w-32" />
            </div>
            <div>
              <label className="block text-sm text-blue-700 mb-1">{es.billing.dueDate}</label>
              <input type="date" value={genDueDate} onChange={e => setGenDueDate(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-lg text-sm" />
            </div>
            <button onClick={handleGenerate} disabled={generating || !genDueDate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Generando...' : 'Generar'}
            </button>
          </div>
          {genResult && <p className="mt-3 text-sm text-blue-800 bg-blue-100 p-2 rounded">{genResult}</p>}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Facturado</p>
          <p className="text-xl font-bold text-gray-900">Q{totalBilled.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Cobrado</p>
          <p className="text-xl font-bold text-green-600">Q{totalPaid.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pendiente</p>
          <p className="text-xl font-bold text-red-600">Q{(totalBilled - totalPaid).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Vencidos</p>
          <p className="text-xl font-bold text-orange-600">{overdueCount}</p>
        </div>
      </div>

      {/* Charges table */}
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
                      <input type="checkbox" checked={selectedIds.size === sortedCharges.length && sortedCharges.length > 0}
                        onChange={toggleSelectAll} className="rounded border-gray-300" />
                    </th>
                  )}
                  <SortHeader col="unitNumber" label={es.units.unitNumber} />
                  <SortHeader col="description" label={es.common.description} />
                  <SortHeader col="amount" label={es.common.amount} align="right" />
                  <SortHeader col="paidAmount" label={es.billing.paidAmount} align="right" />
                  <SortHeader col="balance" label={es.billing.balance} align="right" />
                  <SortHeader col="status" label={es.common.status} align="center" />
                  <SortHeader col="dueDate" label={es.billing.dueDate} />
                  <SortHeader col="daysOverdue" label="Días Mora" align="center" />
                  {isAdmin && <th className="px-3 py-3 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedCharges.map(charge => {
                  const daysOverdue = (charge as any).daysOverdue || 0;
                  return (
                    <tr key={charge.id} className={`hover:bg-gray-50 ${selectedIds.has(charge.id) ? 'bg-blue-50' : ''}`}>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selectedIds.has(charge.id)}
                            onChange={() => toggleSelect(charge.id)} className="rounded border-gray-300" />
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{(charge as any).unit?.unitNumber || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{charge.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">Q{Number(charge.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right">Q{Number(charge.paidAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        Q{(Number(charge.amount) - Number(charge.paidAmount)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[charge.status] || 'bg-gray-100 text-gray-600'}`}>
                          {es.billing.statuses[charge.status as keyof typeof es.billing.statuses]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(charge.dueDate).toLocaleDateString('es-GT')}</td>
                      <td className="px-4 py-3 text-center">
                        {daysOverdue > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            daysOverdue > 30 ? 'bg-red-100 text-red-700' : daysOverdue > 15 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          {charge.status !== 'paid' && (
                            <button onClick={() => handleDeleteSingle(charge.id)} className="text-gray-400 hover:text-red-600">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && charges.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay cobros para este período.</div>
        )}
      </div>

      {/* Individual charge modal */}
      {showIndividual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cobro Individual</h2>
              <button onClick={() => setShowIndividual(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.unitNumber}</label>
                <select value={indUnit} onChange={e => setIndUnit(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccione una unidad</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <select value={indConcept} onChange={e => {
                  const selected = chargeConcepts.find(c => c.name === e.target.value);
                  setIndConcept(e.target.value);
                  if (selected) setIndAmount(Number(selected.defaultAmount));
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {chargeConcepts.map(c => <option key={c.id} value={c.name}>{c.name} {c.isPercentage ? `(${c.percentageValue}%)` : c.defaultAmount > 0 ? `(Q${c.defaultAmount})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.amount} (Q)</label>
                  <input type="number" step="0.01" min="0.01" value={indAmount}
                    onChange={e => setIndAmount(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.billing.dueDate}</label>
                  <input type="date" value={indDueDate} onChange={e => setIndDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowIndividual(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button onClick={handleIndividualCreate} disabled={indSubmitting || !indUnit || !indConcept || !indAmount || !indDueDate}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {indSubmitting ? es.common.loading : 'Crear Cobro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
