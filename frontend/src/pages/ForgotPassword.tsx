import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../lib/api';
import { es } from '../i18n/es';
import { ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', { email });
      setSent(true);
      // In dev mode, the API returns the token directly so you can reset without email
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link to="/login" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-6">
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{es.auth.resetPassword}</h1>
            <p className="text-gray-500 mt-2 text-sm">Ingrese su correo electrónico y le enviaremos instrucciones.</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {es.auth.email}
                </label>
                <input
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? es.common.loading : 'Enviar Instrucciones'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                Si el correo <strong>{email}</strong> existe en el sistema, recibirá instrucciones para restablecer su contraseña.
              </div>

              {resetToken && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Modo Desarrollo — Use este enlace:</p>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    Restablecer contraseña ahora
                  </Link>
                </div>
              )}

              <Link to="/login" className="block text-center text-sm text-blue-600 hover:text-blue-800">
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
