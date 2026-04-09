import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { es } from '../../i18n/es';
import {
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  CreditCard,
  AlertTriangle,
  Wrench,
  Gauge,
  FolderKanban,
  Truck,
  DollarSign,
  Megaphone,
  FileText,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: es.nav.dashboard, icon: <LayoutDashboard size={20} />, roles: ['administrator', 'board_member', 'owner', 'resident'] },
  { to: '/units', label: es.nav.units, icon: <Home size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/users', label: es.nav.users, icon: <Users size={20} />, roles: ['administrator'] },
  { to: '/billing', label: es.nav.billing, icon: <Receipt size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/payments', label: es.nav.payments, icon: <CreditCard size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/collections', label: es.nav.collections, icon: <AlertTriangle size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/maintenance', label: es.nav.maintenance, icon: <Wrench size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/meters', label: es.nav.meters, icon: <Gauge size={20} />, roles: ['administrator'] },
  { to: '/projects', label: es.nav.projects, icon: <FolderKanban size={20} />, roles: ['administrator', 'board_member', 'owner', 'resident'] },
  { to: '/vendors', label: es.nav.vendors, icon: <Truck size={20} />, roles: ['administrator'] },
  { to: '/expenses', label: es.nav.expenses, icon: <DollarSign size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/announcements', label: es.nav.announcements, icon: <Megaphone size={20} />, roles: ['administrator', 'board_member', 'owner', 'resident'] },
  { to: '/documents', label: es.nav.documents, icon: <FileText size={20} />, roles: ['administrator', 'board_member', 'owner', 'resident'] },
  { to: '/reports', label: es.nav.reports, icon: <BarChart3 size={20} />, roles: ['administrator', 'board_member'] },
  { to: '/audit-logs', label: es.nav.auditLogs, icon: <ClipboardList size={20} />, roles: ['administrator'] },
  { to: '/settings', label: es.nav.settings, icon: <Settings size={20} />, roles: ['administrator', 'board_member', 'maintenance', 'owner', 'resident'] },
];

export function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const visibleItems = navItems.filter(item =>
    item.roles.includes(user.role.name)
  );

  // For owners and residents, show "Mi Unidad" instead of "Unidades"
  const isOwnerOrResident = user.role.name === 'resident' || user.role.name === 'owner';
  const items = isOwnerOrResident
    ? [
        { to: '/my-unit', label: es.nav.myUnit, icon: <Home size={20} />, roles: ['owner', 'resident'] },
        ...visibleItems.filter(i => i.to !== '/units'),
      ]
    : visibleItems;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">{es.common.appName}</h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          {es.auth.logout}
        </button>
      </div>
    </aside>
  );
}
