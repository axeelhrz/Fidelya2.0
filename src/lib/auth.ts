import { UserData } from '@/types/auth';
import { DASHBOARD_ROUTES, USER_ROLES } from './constants';

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role: string): string {
  return DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES] || '/dashboard';
}

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(user: UserData | null, permission: string): boolean {
  if (!user) return false;

  const rolePermissions: Record<string, string[]> = {
    [USER_ROLES.ADMIN]: ['*'], // Admin has all permissions
    [USER_ROLES.ASOCIACION]: [
      'manage_socios',
      'manage_comercios',
      'view_reports',
      'manage_beneficios',
      'send_notifications',
      'export_data',
      'manage_backups'
    ],
    [USER_ROLES.COMERCIO]: [
      'manage_own_profile',
      'manage_beneficios',
      'view_validaciones',
      'generate_qr',
      'view_analytics'
    ],
    [USER_ROLES.SOCIO]: [
      'view_own_profile',
      'view_beneficios',
      'validate_beneficios',
      'view_notifications'
    ]
  };

  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(user: UserData | null, route: string): boolean {
  if (!user) return false;

  // Public routes
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/validar-beneficio'];
  if (publicRoutes.some(publicRoute => route.startsWith(publicRoute))) {
    return true;
  }

  // Dashboard routes
  if (route.startsWith('/dashboard/admin')) {
    return user.role === USER_ROLES.ADMIN;
  }
  
  if (route.startsWith('/dashboard/asociacion')) {
    return user.role === USER_ROLES.ASOCIACION || user.role === USER_ROLES.ADMIN;
  }
  
  if (route.startsWith('/dashboard/comercio')) {
    return user.role === USER_ROLES.COMERCIO || user.role === USER_ROLES.ADMIN;
  }
  
  if (route.startsWith('/dashboard/socio')) {
    return user.role === USER_ROLES.SOCIO || user.role === USER_ROLES.ADMIN;
  }

  return false;
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: UserData | null): string {
  if (!user) return 'Usuario';
  return user.nombre || user.email || 'Usuario';
}

/**
 * Get role display name in Spanish
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [USER_ROLES.ADMIN]: 'Administrador',
    [USER_ROLES.ASOCIACION]: 'Asociación',
    [USER_ROLES.COMERCIO]: 'Comercio',
    [USER_ROLES.SOCIO]: 'Socio'
  };

  return roleNames[role] || role;
}

/**
 * Check if user account is active
 */
export function isUserActive(user: UserData | null): boolean {
  if (!user) return false;
  return user.estado === 'activo';
}

/**
 * Get user status display
 */
export function getUserStatusDisplay(estado: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    activo: {
      label: 'Activo',
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    },
    inactivo: {
      label: 'Inactivo',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100'
    },
    pendiente: {
      label: 'Pendiente',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    suspendido: {
      label: 'Suspendido',
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    }
  };

  return statusMap[estado] || statusMap.inactivo;
}

/**
 * Validate user session
 */
export function validateUserSession(user: UserData | null): {
  isValid: boolean;
  reason?: string;
} {
  if (!user) {
    return { isValid: false, reason: 'No user found' };
  }

  if (!isUserActive(user)) {
    return { isValid: false, reason: 'User account is not active' };
  }

  // Check if user session is too old (optional security measure)
  const lastAccess = user.ultimoAcceso;
  if (lastAccess) {
    const daysSinceLastAccess = (Date.now() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastAccess > 30) { // 30 days
      return { isValid: false, reason: 'Session expired due to inactivity' };
    }
  }

  return { isValid: true };
}

/**
 * Format user role for display with icon
 */
export function formatUserRoleWithIcon(role: string): {
  name: string;
  icon: string;
  color: string;
} {
  const roleConfig: Record<string, { name: string; icon: string; color: string }> = {
    [USER_ROLES.ADMIN]: {
      name: 'Administrador',
      icon: '👑',
      color: 'text-purple-600'
    },
    [USER_ROLES.ASOCIACION]: {
      name: 'Asociación',
      icon: '🏢',
      color: 'text-blue-600'
    },
    [USER_ROLES.COMERCIO]: {
      name: 'Comercio',
      icon: '🏪',
      color: 'text-green-600'
    },
    [USER_ROLES.SOCIO]: {
      name: 'Socio',
      icon: '👤',
      color: 'text-indigo-600'
    }
  };

  return roleConfig[role] || {
    name: role,
    icon: '❓',
    color: 'text-gray-600'
  };
}