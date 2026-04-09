import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { es } from '../../i18n/es';
import { LogOut, Menu } from 'lucide-react';

export function AppShell() {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{es.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isMaintenance = user.role.name === 'maintenance';

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{es.common.appName}</h1>
            <p className="text-sm text-blue-100">{user.firstName} {user.lastName}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-blue-100 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{es.auth.logout}</span>
          </button>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {es.common.appName}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {es.roles[user.role.name]}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
