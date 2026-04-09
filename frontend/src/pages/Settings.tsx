import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { es } from '../i18n/es';
import { Settings2, User, Lock, Receipt, Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useConfirm } from '../components/ui/ConfirmDialog';
import type { ChargeConcept } from '../types';

type Tab = 'profile' | 'security' | 'concepts';

interface ConceptFormData {
  name: string;
  description: string;
  defaultAmount: number;
  isPercentage: boolean;
  percentageValue: number | null;
  frequency: 'monthly' | 'one_time' | 'annual' | 'on_demand';
  sortOrder: number;
}

const emptyConceptForm: ConceptFormData = {
  name: '', description: '', defaultAmount: 0, isPercentage: false,
  percentageValue: null, frequency: 'monthly', sortOrder: 0,
};

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { confirm: confirmDialog, alert: showAlert } = useConfirm();
  const isAdmin = user?.role.name === 'administrator';

  const [tab, setTab] = useState<Tab>('profile');

  // Profile state
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Concepts state
  const [concepts, setConcepts] = useState<ChargeConcept[]>([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [editingConcept, setEditingConcept] = useState<ChargeConcept | null>(null);
  const [conceptForm, setConceptForm] = useState<ConceptFormData>(emptyConceptForm);
  const [submittingConcept, setSubmittingConcept] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'concepts' && isAdmin) loadConcepts();
  }, [tab]);

  const loadConcepts = async () => {
    setLoadingConcepts(true);
    try {
      const res = await apiGet<{ success: boolean; data: ChargeConcept[] }>('/settings/charge-concepts');
      setConcepts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConcepts(false);
    }
  };

  // Profile handlers
  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    setError(null);
    setPhoneSuccess(false);
    try {
      await apiPatch(`/users/${user?.id}`, { phone: phone || null });
      setPhoneSuccess(true);
      refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  // Security handlers
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }
    setSavingPassword(true);
    setError(null);
    setPasswordSuccess(false);
    try {
      await apiPost('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // Concept handlers
  const openCreateConcept = () => {
    setEditingConcept(null);
    setConceptForm(emptyConceptForm);
    setError(null);
    setShowConceptForm(true);
  };

  const openEditConcept = (c: ChargeConcept) => {
    setEditingConcept(c);
    setConceptForm({
      name: c.name,
      description: c.description || '',
      defaultAmount: Number(c.defaultAmount),
      isPercentage: c.isPercentage,
      percentageValue: c.percentageValue,
      frequency: c.frequency,
      sortOrder: c.sortOrder,
    });
    setError(null);
    setShowConceptForm(true);
  };

  const handleConceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingConcept(true);
    setError(null);
    try {
      const payload = {
        ...conceptForm,
        description: conceptForm.description || null,
        percentageValue: conceptForm.isPercentage ? conceptForm.percentageValue : null,
      };
      if (editingConcept) {
        await apiPatch(`/settings/charge-concepts/${editingConcept.id}`, payload);
      } else {
        await apiPost('/settings/charge-concepts', payload);
      }
      setShowConceptForm(false);
      loadConcepts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingConcept(false);
    }
  };

  const handleDeleteConcept = async (id: string) => {
    const ok = await confirmDialog({ title: 'Eliminar Concepto', message: es.common.confirmDelete, type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/settings/charge-concepts/${id}`);
      showAlert('Concepto eliminado.', 'success');
      loadConcepts();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const handleToggleActive = async (c: ChargeConcept) => {
    try {
      await apiPatch(`/settings/charge-concepts/${c.id}`, { isActive: !c.isActive });
      loadConcepts();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const frequencyLabel = (f: string) => {
    return es.settings.frequencies[f as keyof typeof es.settings.frequencies] || f;
  };

  if (!user) return null;

  const tabConfig: { key: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: 'profile', label: es.settings.profile, icon: <User size={18} /> },
    { key: 'security', label: es.settings.security, icon: <Lock size={18} /> },
    { key: 'concepts', label: es.settings.chargeConcepts, icon: <Receipt size={18} />, adminOnly: true },
  ];

  const visibleTabs = tabConfig.filter(t => !t.adminOnly || isAdmin);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">{es.settings.title}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(null); setPhoneSuccess(false); setPasswordSuccess(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <div className="max-w-xl">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
          {phoneSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{es.common.successSaved}</div>}

          {/* User Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Datos del Usuario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Nombre</span>
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{es.auth.email}</span>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Rol</span>
                <p className="text-sm font-medium">{es.roles[user.role.name]}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ultimo Acceso</span>
                <p className="text-sm font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('es-GT') : '--'}</p>
              </div>
            </div>
          </div>

          {/* Update Phone */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Actualizar Telefono</h3>
            <form onSubmit={handleUpdatePhone} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+502 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button type="submit" disabled={savingPhone} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                {savingPhone ? es.common.loading : es.common.save}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="max-w-xl">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
          {passwordSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">Contrasena actualizada exitosamente.</div>}

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Lock size={16} className="text-gray-400" />
              {es.settings.changePassword}
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.currentPassword}</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.newPassword}</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.confirmPassword}</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={savingPassword} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                {savingPassword ? es.common.loading : es.settings.changePassword}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'concepts' && isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{es.settings.chargeConceptsDesc}</p>
            <button
              onClick={openCreateConcept}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={18} />
              {es.settings.addConcept}
            </button>
          </div>

          {loadingConcepts ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.settings.conceptName}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.description}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.settings.defaultAmount}</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.settings.isPercentage}</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.settings.frequency}</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {concepts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.description || '--'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {c.isPercentage && c.percentageValue != null
                          ? `${Number(c.percentageValue)}%`
                          : `Q${Number(c.defaultAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.isPercentage ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Si</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {frequencyLabel(c.frequency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                            c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {c.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditConcept(c)} className="p-1 text-gray-400 hover:text-blue-600" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDeleteConcept(c.id)} className="p-1 text-gray-400 hover:text-red-600" title="Desactivar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {concepts.length === 0 && (
                <div className="text-center py-8 text-gray-500">No hay conceptos de cobro.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Concept Modal */}
      {showConceptForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingConcept ? 'Editar Concepto' : es.settings.addConcept}
              </h2>
              <button onClick={() => setShowConceptForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

            <form onSubmit={handleConceptSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.conceptName}</label>
                <input
                  type="text"
                  required
                  value={conceptForm.name}
                  onChange={e => setConceptForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.common.description}</label>
                <input
                  type="text"
                  value={conceptForm.description}
                  onChange={e => setConceptForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.defaultAmount}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={conceptForm.defaultAmount}
                    onChange={e => setConceptForm(prev => ({ ...prev, defaultAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.frequency}</label>
                  <select
                    value={conceptForm.frequency}
                    onChange={e => setConceptForm(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="monthly">{es.settings.frequencies.monthly}</option>
                    <option value="one_time">{es.settings.frequencies.one_time}</option>
                    <option value="annual">{es.settings.frequencies.annual}</option>
                    <option value="on_demand">{es.settings.frequencies.on_demand}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conceptForm.isPercentage}
                    onChange={e => setConceptForm(prev => ({ ...prev, isPercentage: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {es.settings.isPercentage}
                </label>
              </div>

              {conceptForm.isPercentage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.settings.percentageValue}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={conceptForm.percentageValue ?? ''}
                    onChange={e => setConceptForm(prev => ({ ...prev, percentageValue: parseFloat(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <input
                  type="number"
                  min="0"
                  value={conceptForm.sortOrder}
                  onChange={e => setConceptForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowConceptForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                  {es.common.cancel}
                </button>
                <button type="submit" disabled={submittingConcept}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {submittingConcept ? es.common.loading : es.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
