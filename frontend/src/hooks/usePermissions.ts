import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

export function usePermissions() {
  const { user } = useAuthStore();
  const role = user?.role ?? 'EMPLOYEE';

  const hasRole = (...roles: Role[]) => roles.includes(role as Role);
  const isAdmin = hasRole('ADMIN', 'SUPER_ADMIN');
  const isManager = hasRole('ADMIN', 'MANAGER', 'SUPER_ADMIN');
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return { role, hasRole, isAdmin, isManager, isSuperAdmin };
}
