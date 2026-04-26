import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import {
  LayoutDashboard, Calendar, Users, ClipboardCheck, BarChart2,
  Download, Settings, LogOut, X, Clock, Store
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/schedule', icon: Calendar, label: 'Orari', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/my-schedule', icon: Calendar, label: 'I miei orari', roles: ['EMPLOYEE'] },
  { path: '/employees', icon: Users, label: 'Dipendenti', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/attendance', icon: ClipboardCheck, label: 'Presenze', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/clock', icon: Clock, label: 'Timbratura', roles: ['EMPLOYEE'] },
  { path: '/stats', icon: BarChart2, label: 'Statistiche', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { path: '/export', icon: Download, label: 'Esporta', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { path: '/admin', icon: Store, label: 'Negozio', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { role } = usePermissions();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200',
          'flex flex-col transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Orari</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {user?.store && (
          <div className="px-4 py-3 bg-primary-50 border-b border-primary-100">
            <p className="text-xs text-primary-600 font-medium truncate">{user.store.name}</p>
            <p className="text-xs text-primary-400">{user.store.city}</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            <Settings className="w-5 h-5" />
            Profilo
          </NavLink>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </div>
      </aside>
    </>
  );
}
