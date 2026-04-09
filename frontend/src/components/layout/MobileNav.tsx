import { NavLink } from 'react-router-dom';
import { es } from '../../i18n/es';
import {
  ClipboardList,
  AlertTriangle,
  Gauge,
  CheckSquare,
  User,
} from 'lucide-react';

const mobileNavItems = [
  { to: '/my-tasks', label: es.nav.myTasks, icon: <ClipboardList size={22} /> },
  { to: '/report-warning', label: 'Reportar', icon: <AlertTriangle size={22} /> },
  { to: '/meter-readings', label: 'Lecturas', icon: <Gauge size={22} /> },
  { to: '/inspections', label: 'Inspección', icon: <CheckSquare size={22} /> },
  { to: '/profile', label: es.nav.profile, icon: <User size={22} /> },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {mobileNavItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
              isActive
                ? 'text-blue-600 font-medium'
                : 'text-gray-500'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
