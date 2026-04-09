import { useState } from 'react';
import { apiPatch, apiPost } from '../lib/api';
import { es } from '../i18n/es';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function Profile() {
  const { user, refreshUser } = useAuth();

  const [phone, setPhone] = useState(user?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
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

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <User className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{es.nav.profile}</h1>
          <p className="text-sm text-gray-500">Informacion de su cuenta</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
      {phoneSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{es.common.successSaved}</div>}
      {passwordSuccess && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">Contraseña actualizada exitosamente.</div>}

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
            <p className="text-sm font-medium">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('es-GT') : '—'}</p>
          </div>
        </div>
      </div>

      {/* Update Phone */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
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

      {/* Change Password */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-gray-400" />
          Cambiar Contraseña
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={savingPassword} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            {savingPassword ? es.common.loading : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
