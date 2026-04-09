import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { es } from '../../i18n/es';
import { Users, Plus, Pencil, Trash2, X, Shield, Home, Wrench, Crown, ClipboardList, KeyRound } from 'lucide-react';
import type { User, PaginatedResponse } from '../../types';
import { useConfirm } from '../../components/ui/ConfirmDialog';

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: string;
}

const ROLE_OPTIONS = [
  { id: '00000000-0000-0000-0000-000000000010', label: es.roles.administrator, group: 'admin' },
  { id: '00000000-0000-0000-0000-000000000020', label: es.roles.board_member, group: 'board' },
  { id: '00000000-0000-0000-0000-000000000030', label: es.roles.maintenance, group: 'admin' },
  { id: '00000000-0000-0000-0000-000000000050', label: es.roles.owner, group: 'residents' },
  { id: '00000000-0000-0000-0000-000000000040', label: es.roles.resident, group: 'residents' },
];

const BOARD_POSITIONS = [
  { value: '', label: '— Sin cargo —' },
  { value: 'presidente', label: es.boardPositions.presidente },
  { value: 'vicepresidente', label: es.boardPositions.vicepresidente },
  { value: 'tesorero', label: es.boardPositions.tesorero },
  { value: 'secretario', label: es.boardPositions.secretario },
  { value: 'vocal_1', label: es.boardPositions.vocal_1 },
  { value: 'vocal_2', label: es.boardPositions.vocal_2 },
  { value: 'vocal_3', label: es.boardPositions.vocal_3 },
  { value: 'vocal_suplente_1', label: es.boardPositions.vocal_suplente_1 },
  { value: 'vocal_suplente_2', label: es.boardPositions.vocal_suplente_2 },
];

type Tab = 'admin' | 'board' | 'owners' | 'residents';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('admin');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>({
    email: '', password: '', firstName: '', lastName: '', phone: '',
    roleId: '00000000-0000-0000-0000-000000000040',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Board position editing
  const [editingBoardUser, setEditingBoardUser] = useState<string | null>(null);
  const [boardPositionValue, setBoardPositionValue] = useState('');
  const { confirm: confirmDialog, alert: showAlert } = useConfirm();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await apiGet<PaginatedResponse<User>>('/users?limit=200');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter users by section
  const adminUsers = users.filter(u => ['administrator', 'maintenance'].includes(u.role.name));
  const boardUsers = users.filter(u => u.role.name === 'board_member');
  const ownerUsers = users.filter(u => u.role.name === 'owner');
  const residentUsers = users.filter(u => u.role.name === 'resident');

  const currentUsers = tab === 'admin' ? adminUsers : tab === 'board' ? boardUsers : tab === 'owners' ? ownerUsers : residentUsers;

  const openCreateForm = () => {
    setEditingUser(null);
    const defaultRole = tab === 'admin' ? '00000000-0000-0000-0000-000000000030'
      : tab === 'board' ? '00000000-0000-0000-0000-000000000020'
      : tab === 'owners' ? '00000000-0000-0000-0000-000000000050'
      : '00000000-0000-0000-0000-000000000040';
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: defaultRole });
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email, password: '', firstName: user.firstName,
      lastName: user.lastName, phone: user.phone || '', roleId: user.role.id,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingUser) {
        await apiPatch(`/users/${editingUser.id}`, {
          email: form.email, firstName: form.firstName,
          lastName: form.lastName, phone: form.phone || null, roleId: form.roleId,
        });
      } else {
        await apiPost('/users', form);
      }
      setShowForm(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({ title: 'Eliminar Usuario', message: es.common.confirmDelete, type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/users/${id}`);
      showAlert('Usuario eliminado.', 'success');
      loadUsers();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = window.prompt(`Nueva contraseña para ${userName} (mínimo 8 caracteres):`);
    if (!newPassword || newPassword.length < 8) {
      if (newPassword) showAlert('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    try {
      await apiPost(`/auth/admin-reset-password/${userId}`, { newPassword });
      showAlert(`Contraseña de ${userName} restablecida exitosamente.`, 'success');
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const handleBoardPositionSave = async (userId: string) => {
    try {
      await apiPatch(`/users/${userId}`, { boardPosition: boardPositionValue || null });
      setEditingBoardUser(null);
      loadUsers();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const getBoardPositionLabel = (pos: string | null) => {
    if (!pos) return '—';
    return es.boardPositions[pos as keyof typeof es.boardPositions] || pos;
  };

  const tabConfig: { key: Tab; label: string; desc: string; icon: React.ReactNode; count: number }[] = [
    { key: 'admin', label: es.userSections.administration, desc: es.userSections.administrationDesc, icon: <Wrench size={18} />, count: adminUsers.length },
    { key: 'board', label: es.userSections.board, desc: es.userSections.boardDesc, icon: <Crown size={18} />, count: boardUsers.length },
    { key: 'owners', label: es.userSections.owners, desc: es.userSections.ownersDesc, icon: <Shield size={18} />, count: ownerUsers.length },
    { key: 'residents', label: es.userSections.residents, desc: es.userSections.residentsDesc, icon: <Home size={18} />, count: residentUsers.length },
  ];

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
          <Users className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">{es.nav.users}</h1>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Section Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {tabConfig.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
              tab === t.key
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${tab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {t.icon}
            </div>
            <div>
              <p className={`text-sm font-semibold ${tab === t.key ? 'text-blue-700' : 'text-gray-800'}`}>
                {t.label} <span className="text-xs font-normal text-gray-400">({t.count})</span>
              </p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* User table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.auth.email}</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
              {tab === 'board' && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.userSections.boardPosition}</th>
              )}
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {es.roles[u.role.name as keyof typeof es.roles]}
                  </span>
                </td>
                {tab === 'board' && (
                  <td className="px-4 py-3">
                    {editingBoardUser === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={boardPositionValue}
                          onChange={e => setBoardPositionValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {BOARD_POSITIONS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <button onClick={() => handleBoardPositionSave(u.id)} className="text-green-600 hover:text-green-800">
                          <Shield size={16} />
                        </button>
                        <button onClick={() => setEditingBoardUser(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingBoardUser(u.id); setBoardPositionValue(u.boardPosition || ''); }}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {u.boardPosition ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {getBoardPositionLabel(u.boardPosition)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">{es.userSections.assignPosition}</span>
                        )}
                      </button>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/users/${u.id}/profile`} className="p-1 text-gray-400 hover:text-purple-600" title="Ficha">
                      <ClipboardList size={16} />
                    </Link>
                    <button onClick={() => handleResetPassword(u.id, `${u.firstName} ${u.lastName}`)} className="p-1 text-gray-400 hover:text-orange-600" title="Restablecer Contraseña">
                      <KeyRound size={16} />
                    </button>
                    <button onClick={() => openEditForm(u)} className="p-1 text-gray-400 hover:text-blue-600" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-1 text-gray-400 hover:text-red-600" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {currentUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay usuarios en esta sección.</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" required value={form.firstName}
                    onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input type="text" required value={form.lastName}
                    onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{es.auth.email}</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{es.auth.password}</label>
                  <input type="password" required={!editingUser} value={form.password}
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    minLength={8} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={form.roleId}
                  onChange={e => setForm(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <optgroup label={es.userSections.administration}>
                    {ROLE_OPTIONS.filter(r => r.group === 'admin').map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label={es.userSections.board}>
                    {ROLE_OPTIONS.filter(r => r.group === 'board').map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label={es.userSections.residents}>
                    {ROLE_OPTIONS.filter(r => r.group === 'residents').map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                  {es.common.cancel}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
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
