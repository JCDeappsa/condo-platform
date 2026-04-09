import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPatch, apiPost, apiDelete } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, Home, Edit2, X, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Unit, User as UserType, MonthlyCharge, Payment, AccountMovement, ChargeConcept, PaginatedResponse } from '../../types';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../components/ui/ConfirmDialog';

type Tab = 'charges' | 'payments' | 'movements' | 'readings';

export function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { confirm, alert } = useConfirm();
  const isAdmin = user?.role.name === 'administrator';

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('charges');

  const [charges, setCharges] = useState<MonthlyCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [readingTypeFilter, setReadingTypeFilter] = useState('');
  const [tabLoading, setTabLoading] = useState(false);

  // Inline edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ monthlyFee: '', areaM2: '', isOccupied: false, notes: '', ownerUserId: '', residentUserId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);

  // Add charge modal
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeConcepts, setChargeConcepts] = useState<ChargeConcept[]>([]);
  const [chargeForm, setChargeForm] = useState({ concept: '', amount: '' as string | number, dueDate: '' });
  const [chargeSubmitting, setChargeSubmitting] = useState(false);

  // Edit charge modal
  const [editingCharge, setEditingCharge] = useState<MonthlyCharge | null>(null);
  const [editChargeForm, setEditChargeForm] = useState({ description: '', amount: '', dueDate: '', status: '' });
  const [editChargeSubmitting, setEditChargeSubmitting] = useState(false);

  // Edit payment modal
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', paymentDate: '', paymentMethod: '', referenceNumber: '', bankReference: '', notes: '' });
  const [editPaymentSubmitting, setEditPaymentSubmitting] = useState(false);

  // Payment selection for bulk delete
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [deletingPayments, setDeletingPayments] = useState(false);

  useEffect(() => { loadUnit(); }, [id]);
  useEffect(() => { if (unit) loadTabData(); }, [tab, unit]);

  const loadUnit = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Unit }>(`/units/${id}`);
      setUnit(res.data);
      setEditForm({
        monthlyFee: String(res.data.monthlyFee),
        areaM2: String(res.data.areaM2 || ''),
        isOccupied: res.data.isOccupied,
        notes: res.data.notes || '',
        ownerUserId: res.data.owner?.id || '',
        residentUserId: res.data.resident?.id || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!unit) return;
    setTabLoading(true);
    try {
      if (tab === 'charges') {
        const res = await apiGet<PaginatedResponse<MonthlyCharge>>(`/billing/charges?unitId=${unit.id}&limit=50`);
        setCharges(res.data);
      } else if (tab === 'payments') {
        const res = await apiGet<PaginatedResponse<Payment>>(`/payments?unitId=${unit.id}&limit=50`);
        setPayments(res.data);
      } else if (tab === 'readings') {
        // Get meter points for this unit, then get all readings
        const pointsRes = await apiGet<any>(`/meters/points?unitId=${unit.id}&limit=50`);
        const points = pointsRes.data || [];
        const allReadings: any[] = [];
        for (const p of points) {
          const rRes = await apiGet<any>(`/meters/readings?meterPointId=${p.id}&limit=50`);
          (rRes.data || []).forEach((r: any) => {
            allReadings.push({ ...r, _meterType: p.meterType?.name || 'Medidor', _serial: p.meterSerial });
          });
        }
        allReadings.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
        setReadings(allReadings);
      } else {
        const res = await apiGet<{ success: boolean; data: AccountMovement[] }>(`/payments/movements/${unit.id}`);
        setMovements(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await apiGet<PaginatedResponse<UserType>>('/users?limit=200');
      setAllUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const startEditing = () => {
    setEditing(true);
    loadUsers();
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/units/${id}`, {
        monthlyFee: parseFloat(editForm.monthlyFee),
        areaM2: editForm.areaM2 ? parseFloat(editForm.areaM2) : null,
        isOccupied: editForm.isOccupied,
        notes: editForm.notes || null,
        ownerUserId: editForm.ownerUserId || null,
        residentUserId: editForm.residentUserId || null,
      });
      setEditing(false);
      loadUnit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Edit charge
  const openEditCharge = (c: MonthlyCharge) => {
    setEditingCharge(c);
    setEditChargeForm({
      description: c.description,
      amount: String(c.amount),
      dueDate: typeof c.dueDate === 'string' ? c.dueDate.split('T')[0] : '',
      status: c.status,
    });
  };

  const handleEditCharge = async () => {
    if (!editingCharge) return;
    setEditChargeSubmitting(true);
    try {
      await apiPatch(`/billing/charges/${editingCharge.id}`, {
        description: editChargeForm.description,
        amount: parseFloat(editChargeForm.amount),
        dueDate: editChargeForm.dueDate,
        status: editChargeForm.status,
      });
      setEditingCharge(null);
      alert('Cobro actualizado.', 'success');
      loadTabData();
    } catch (err: any) {
      alert(err.message, 'error');
    } finally {
      setEditChargeSubmitting(false);
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    const ok = await confirm({ title: 'Eliminar Cobro', message: '¿Está seguro que desea eliminar este cobro?', type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/billing/charges/${chargeId}`);
      alert('Cobro eliminado.', 'success');
      loadTabData();
    } catch (err: any) {
      alert(err.message, 'error');
    }
  };

  // Edit payment
  const openEditPayment = (p: Payment) => {
    setEditingPayment(p);
    setEditPaymentForm({
      amount: String(p.amount),
      paymentDate: typeof p.paymentDate === 'string' ? p.paymentDate.split('T')[0] : '',
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber || '',
      bankReference: p.bankReference || '',
      notes: p.notes || '',
    });
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;
    setEditPaymentSubmitting(true);
    try {
      await apiPatch(`/payments/${editingPayment.id}`, {
        amount: parseFloat(editPaymentForm.amount),
        paymentDate: editPaymentForm.paymentDate,
        paymentMethod: editPaymentForm.paymentMethod,
        referenceNumber: editPaymentForm.referenceNumber || null,
        bankReference: editPaymentForm.bankReference || null,
        notes: editPaymentForm.notes || null,
      });
      setEditingPayment(null);
      alert('Pago actualizado.', 'success');
      loadTabData();
    } catch (err: any) {
      alert(err.message, 'error');
    } finally {
      setEditPaymentSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const ok = await confirm({ title: 'Eliminar Pago', message: '¿Está seguro que desea eliminar este pago?', type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/payments/${paymentId}`);
      alert('Pago eliminado.', 'success');
      loadTabData();
    } catch (err: any) { alert(err.message, 'error'); }
  };

  const handleDeletePaymentsBulk = async () => {
    if (selectedPaymentIds.size === 0) return;
    const ok = await confirm({ title: 'Eliminar Pagos', message: `¿Eliminar ${selectedPaymentIds.size} pago(s) seleccionado(s)?`, type: 'danger', confirmText: `Eliminar ${selectedPaymentIds.size}` });
    if (!ok) return;
    setDeletingPayments(true);
    try {
      const res = await apiPost<{ success: boolean; message: string }>('/payments/bulk-delete', { ids: Array.from(selectedPaymentIds) });
      alert(res.message, 'success');
      setSelectedPaymentIds(new Set());
      loadTabData();
    } catch (err: any) { alert(err.message, 'error'); }
    finally { setDeletingPayments(false); }
  };

  const togglePaymentSelect = (id: string) => {
    setSelectedPaymentIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const togglePaymentSelectAll = () => {
    if (selectedPaymentIds.size === payments.length) setSelectedPaymentIds(new Set());
    else setSelectedPaymentIds(new Set(payments.map(p => p.id)));
  };

  const openAddCharge = async () => {
    if (chargeConcepts.length === 0) {
      try {
        const res = await apiGet<{ success: boolean; data: ChargeConcept[] }>('/settings/charge-concepts');
        const active = res.data.filter((c: ChargeConcept) => c.isActive);
        setChargeConcepts(active);
        if (active.length > 0) {
          setChargeForm({ concept: active[0].name, amount: Number(active[0].defaultAmount), dueDate: '' });
        }
      } catch {}
    }
    setShowAddCharge(true);
  };

  const handleAddCharge = async () => {
    if (!chargeForm.concept || !chargeForm.amount || !chargeForm.dueDate) return;
    setChargeSubmitting(true);
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    try {
      await apiPost('/billing/special', {
        unitId: id,
        period,
        description: chargeForm.concept,
        amount: Number(chargeForm.amount),
        dueDate: chargeForm.dueDate,
      });
      setShowAddCharge(false);
      loadTabData();
    } catch (err: any) {
      alert(err.message, 'error');
    } finally {
      setChargeSubmitting(false);
    }
  };

  const unitTypeLabel = (type: string) =>
    es.units.types[type as keyof typeof es.units.types] || type;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!unit) {
    return <div className="text-center py-12 text-gray-500">{es.common.noData}</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'charges', label: 'Cobros' },
    { key: 'payments', label: 'Pagos' },
    { key: 'movements', label: es.payments.movements },
    { key: 'readings', label: es.meters.readings },
  ];

  return (
    <div>
      <Link to="/units" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4">
        <ArrowLeft size={16} />
        {es.common.back}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Home className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unidad {unit.unitNumber}</h1>
            <p className="text-sm text-gray-500">{unitTypeLabel(unit.unitType)}</p>
          </div>
        </div>
        {isAdmin && !editing && (
          <button onClick={startEditing} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
            <Edit2 size={16} />
            {es.common.edit}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {/* Unit Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.monthlyFee} (Q)</label>
                <input type="number" step="0.01" value={editForm.monthlyFee} onChange={e => setEditForm(p => ({ ...p, monthlyFee: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.area}</label>
                <input type="number" step="0.01" value={editForm.areaM2} onChange={e => setEditForm(p => ({ ...p, areaM2: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={editForm.isOccupied} onChange={e => setEditForm(p => ({ ...p, isOccupied: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">{es.units.occupied}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.owner}</label>
                <select value={editForm.ownerUserId} onChange={e => setEditForm(p => ({ ...p, ownerUserId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Sin propietario —</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.units.resident}</label>
                <select value={editForm.residentUserId} onChange={e => setEditForm(p => ({ ...p, residentUserId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">— Sin residente —</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.notes}</label>
              <textarea rows={2} value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                <X size={16} /> {es.common.cancel}
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                <Check size={16} /> {saving ? es.common.loading : es.common.save}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500">{es.units.unitNumber}</span>
              <p className="text-sm font-medium">{unit.unitNumber}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{es.units.unitType}</span>
              <p className="text-sm font-medium">{unitTypeLabel(unit.unitType)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{es.units.area}</span>
              <p className="text-sm font-medium">{unit.areaM2 ? `${unit.areaM2} m²` : '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{es.units.monthlyFee}</span>
              <p className="text-sm font-medium text-green-600">Q{Number(unit.monthlyFee).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{es.units.owner}</span>
              <p className="text-sm font-medium">{unit.owner ? `${unit.owner.firstName} ${unit.owner.lastName}` : '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{es.units.resident}</span>
              <p className="text-sm font-medium">{unit.resident ? `${unit.resident.firstName} ${unit.resident.lastName}` : '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{es.common.status}</span>
              <p className="text-sm">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${unit.isOccupied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {unit.isOccupied ? es.units.occupied : es.units.vacant}
                </span>
              </p>
            </div>
            {unit.notes && (
              <div>
                <span className="text-xs text-gray-500">{es.common.notes}</span>
                <p className="text-sm font-medium">{unit.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-4">
        <div className="flex">
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
        {isAdmin && tab === 'charges' && (
          <button onClick={openAddCharge} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-1">
            <Plus size={16} />
            Agregar Cobro
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {tabLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tab === 'charges' ? (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.billing.period}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.description}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.billing.chargeAmount}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.billing.paidAmount}</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.billing.dueDate}</th>
                  {isAdmin && <th className="px-3 py-3 w-20"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charges.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.period}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Q{Number(c.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">Q{Number(c.paidAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'paid' ? 'bg-green-100 text-green-700' :
                        c.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        c.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {es.billing.statuses[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(c.dueDate).toLocaleDateString('es-GT')}</td>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditCharge(c)} className="p-1 text-gray-400 hover:text-blue-600" title="Editar"><Pencil size={15} /></button>
                          {c.status !== 'paid' && <button onClick={() => handleDeleteCharge(c.id)} className="p-1 text-gray-400 hover:text-red-600" title="Eliminar"><Trash2 size={15} /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {charges.length === 0 && <div className="text-center py-8 text-gray-500">{es.common.noData}</div>}
          </>
        ) : tab === 'payments' ? (
          <>
            {isAdmin && selectedPaymentIds.size > 0 && (
              <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-3">
                <button onClick={handleDeletePaymentsBulk} disabled={deletingPayments}
                  className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
                  <Trash2 size={14} />
                  {deletingPayments ? 'Eliminando...' : `Eliminar ${selectedPaymentIds.size} pago(s)`}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {isAdmin && (
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox" checked={selectedPaymentIds.size === payments.length && payments.length > 0}
                        onChange={togglePaymentSelectAll} className="rounded border-gray-300" />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.paymentDate}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.amount}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.paymentMethod}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.reference}</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.payments.reconciled}</th>
                  {isAdmin && <th className="px-3 py-3 w-20"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${selectedPaymentIds.has(p.id) ? 'bg-blue-50' : ''}`}>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedPaymentIds.has(p.id)}
                          onChange={() => togglePaymentSelect(p.id)} className="rounded border-gray-300" />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.paymentDate).toLocaleDateString('es-GT')}</td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-medium">Q{Number(p.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{es.payments.methods[p.paymentMethod as keyof typeof es.payments.methods]}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.referenceNumber || p.bankReference || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.reconciled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.reconciled ? 'Sí' : 'No'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditPayment(p)} className="p-1 text-gray-400 hover:text-blue-600" title="Editar"><Pencil size={15} /></button>
                          <button onClick={() => handleDeletePayment(p.id)} className="p-1 text-gray-400 hover:text-red-600" title="Eliminar"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {payments.length === 0 && <div className="text-center py-8 text-gray-500">{es.common.noData}</div>}
          </>
        ) : tab === 'movements' ? (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.date}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.description}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.amount}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.billing.balance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(m.createdAt).toLocaleDateString('es-GT')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.movementType === 'payment' ? 'bg-green-100 text-green-700' :
                        m.movementType === 'charge' ? 'bg-blue-100 text-blue-700' :
                        m.movementType === 'penalty' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {m.movementType === 'charge' ? 'Cargo' : m.movementType === 'payment' ? 'Pago' : m.movementType === 'penalty' ? 'Mora' : m.movementType === 'credit' ? 'Credito' : 'Ajuste'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${m.movementType === 'payment' || m.movementType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.movementType === 'payment' || m.movementType === 'credit' ? '-' : '+'}Q{Math.abs(Number(m.amount)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">Q{Number(m.runningBalance).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {movements.length === 0 && <div className="text-center py-8 text-gray-500">{es.common.noData}</div>}
          </>
        ) : tab === 'readings' ? (
          <>
            {/* Meter type filter */}
            {readings.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <label className="text-sm text-gray-600">Filtrar por tipo:</label>
                <select value={readingTypeFilter} onChange={e => setReadingTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Todos</option>
                  {[...new Set(readings.map((r: any) => r._meterType))].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Serial</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.meters.readingDate}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.meters.readingValue}</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.meters.anomaly}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {readings
                    .filter((r: any) => !readingTypeFilter || r._meterType === readingTypeFilter)
                    .map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{r._meterType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r._serial}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.readingDate).toLocaleDateString('es-GT')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{Number(r.readingValue).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {r.isAnomaly ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{es.meters.anomalyDetected}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {readings.length === 0 && <div className="text-center py-8 text-gray-500">{es.common.noData}</div>}
          </>
        ) : null}
      </div>

      {/* Add Charge Modal */}
      {showAddCharge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Agregar Cobro — {unit.unitNumber}</h2>
              <button onClick={() => setShowAddCharge(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <select value={chargeForm.concept} onChange={e => {
                  const sel = chargeConcepts.find(c => c.name === e.target.value);
                  setChargeForm(p => ({ ...p, concept: e.target.value, amount: sel ? Number(sel.defaultAmount) : p.amount }));
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {chargeConcepts.map(c => <option key={c.id} value={c.name}>{c.name} {c.defaultAmount > 0 ? `(Q${c.defaultAmount})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.amount} (Q)</label>
                  <input type="number" step="0.01" min="0.01" value={chargeForm.amount}
                    onChange={e => setChargeForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.billing.dueDate}</label>
                  <input type="date" value={chargeForm.dueDate}
                    onChange={e => setChargeForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddCharge(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button onClick={handleAddCharge} disabled={chargeSubmitting || !chargeForm.concept || !chargeForm.amount || !chargeForm.dueDate}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {chargeSubmitting ? es.common.loading : 'Crear Cobro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Charge Modal */}
      {editingCharge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar Cobro</h2>
              <button onClick={() => setEditingCharge(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description}</label>
                <input type="text" value={editChargeForm.description}
                  onChange={e => setEditChargeForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.amount} (Q)</label>
                  <input type="number" step="0.01" value={editChargeForm.amount}
                    onChange={e => setEditChargeForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.billing.dueDate}</label>
                  <input type="date" value={editChargeForm.dueDate}
                    onChange={e => setEditChargeForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.status}</label>
                <select value={editChargeForm.status}
                  onChange={e => setEditChargeForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="pending">{es.billing.statuses.pending}</option>
                  <option value="partial">{es.billing.statuses.partial}</option>
                  <option value="paid">{es.billing.statuses.paid}</option>
                  <option value="overdue">{es.billing.statuses.overdue}</option>
                  <option value="cancelled">{es.billing.statuses.cancelled}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingCharge(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button onClick={handleEditCharge} disabled={editChargeSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {editChargeSubmitting ? es.common.loading : es.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar Pago</h2>
              <button onClick={() => setEditingPayment(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.amount} (Q)</label>
                  <input type="number" step="0.01" value={editPaymentForm.amount}
                    onChange={e => setEditPaymentForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.paymentDate}</label>
                  <input type="date" value={editPaymentForm.paymentDate}
                    onChange={e => setEditPaymentForm(p => ({ ...p, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.paymentMethod}</label>
                <select value={editPaymentForm.paymentMethod}
                  onChange={e => setEditPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(es.payments.methods).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.reference}</label>
                  <input type="text" value={editPaymentForm.referenceNumber}
                    onChange={e => setEditPaymentForm(p => ({ ...p, referenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.payments.bankReference}</label>
                  <input type="text" value={editPaymentForm.bankReference}
                    onChange={e => setEditPaymentForm(p => ({ ...p, bankReference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.notes}</label>
                <textarea rows={2} value={editPaymentForm.notes}
                  onChange={e => setEditPaymentForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingPayment(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button onClick={handleEditPayment} disabled={editPaymentSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {editPaymentSubmitting ? es.common.loading : es.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
