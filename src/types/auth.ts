export interface UserData {
  uid: string;
  email: string;
  nombre: string;
  role: 'comercio' | 'socio' | 'asociacion' | 'admin';
  estado: 'activo' | 'inactivo' | 'pendiente' | 'suspendido';
  creadoEn: Date;
  actualizadoEn: Date;
  ultimoAcceso?: Date;
  // Optional profile data
  telefono?: string;
  avatar?: string;
  configuracion?: {
    notificaciones: boolean;
    tema: 'light' | 'dark' | 'auto';
    idioma: string;
  };
  // Role-specific metadata
  metadata?: Record<string, unknown>;
  asociacionId?: string; // For socios and asociaciones
  // Additional properties for socios
  estadoMembresia?: 'al_dia' | 'vencido' | 'pendiente' | 'suspendido' | 'inactivo';
  asociacionNombre?: string;
}

export interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (data: RegisterData) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (data: Partial<UserData>) => Promise<boolean>;
  clearError: () => void;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  role: 'comercio' | 'socio' | 'asociacion';
  // Role-specific data
  nombreComercio?: string;
  categoria?: string;
  asociacionId?: string;
  numeroSocio?: string;
  nombreAsociacion?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Permission system
export type Permission = 
  | 'read_own_data'
  | 'write_own_data'
  | 'read_beneficios'
  | 'write_beneficios'
  | 'read_validaciones'
  | 'write_validaciones'
  | 'read_socios'
  | 'write_socios'
  | 'read_comercios'
  | 'write_comercios'
  | 'admin_panel'
  | 'manage_users'
  | 'view_analytics';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  comercio: [
    'read_own_data',
    'write_own_data',
    'read_beneficios',
    'write_beneficios',
    'read_validaciones',
    'view_analytics'
  ],
  socio: [
    'read_own_data',
    'write_own_data',
    'read_beneficios'
  ],
  asociacion: [
    'read_own_data',
    'write_own_data',
    'read_socios',
    'write_socios',
    'read_comercios',
    'read_beneficios',
    'read_validaciones',
    'view_analytics'
  ],
  admin: [
    'read_own_data',
    'write_own_data',
    'read_beneficios',
    'write_beneficios',
    'read_validaciones',
    'write_validaciones',
    'read_socios',
    'write_socios',
    'read_comercios',
    'write_comercios',
    'admin_panel',
    'manage_users',
    'view_analytics'
  ]
};

export const hasPermission = (user: UserData | null, permission: Permission): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const hasAnyPermission = (user: UserData | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (user: UserData | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.every(permission => userPermissions.includes(permission));
};