import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { es } from '../../i18n/es';
import { Receipt, Plus, X } from 'lucide-react';
import type { Expense, Vendor, Project } from '../../types';
import { useAuth } from '../../lib/auth';

export function ExpenseList() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === 'administrator';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    vendorId: '', projectId: '', category: 'other', description: '', amount: '',
    expenseDate: new Date().toISOString().split('T')[0], invoiceNumber: '',
  });

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Expense[] }>('/vendors/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openForm = async () => {
    try {
      const [vendorsRes, projectsRes] = await Promise.all([
        apiGet<{ success: boolean; data: Vendor[] }>('/vendors/vendors'),
        apiGet<{ success: boolean; data: Project[] }>('/projects?limit=50'),
      ]);
      setVendors(vendorsRes.data);
      setProjects(projectsRes.data || []);
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
      await apiPost('/vendors/expenses', {
        vendorId: form.vendorId || undefined,
        projectId: form.projectId || undefined,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        expenseDate: form.expenseDate,
        invoiceNumber: form.invoiceNumber || undefined,
      });
      setShowForm(false);
      setForm({ vendorId: '', projectId: '', category: 'other', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], invoiceNumber: '' });
      loadExpenses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{es.expenses.title}</h1>
            <p className="text-sm text-gray-500">{expenses.length} gastos — Total: Q{totalExpenses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={openForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus size={18} />
            {es.expenses.recordExpense}
          </button>
        )}
      </div>

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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.expenses.expenseDate}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.description}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.expenses.vendor}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.amount}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.expenses.project}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.expenses.invoiceNumber}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(exp.expenseDate).toLocaleDateString('es-GT')}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{exp.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exp.vendor?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">Q{Number(exp.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exp.project?.title || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exp.invoiceNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && expenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
        )}
      </div>

      {/* Record Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{es.expenses.recordExpense}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description} *</label>
                <input type="text" required value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.amount} (Q) *</label>
                  <input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.expenses.expenseDate} *</label>
                  <input type="date" required value={form.expenseDate} onChange={e => setForm(prev => ({ ...prev, expenseDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.expenses.vendor}</label>
                <select value={form.vendorId} onChange={e => setForm(prev => ({ ...prev, vendorId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Sin proveedor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.expenses.project}</label>
                <select value={form.projectId} onChange={e => setForm(prev => ({ ...prev, projectId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Sin proyecto</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.maintenance.category}</label>
                  <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(es.vendors.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.expenses.invoiceNumber}</label>
                  <input type="text" value={form.invoiceNumber} onChange={e => setForm(prev => ({ ...prev, invoiceNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">{es.common.cancel}</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">{submitting ? es.common.loading : es.expenses.recordExpense}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
