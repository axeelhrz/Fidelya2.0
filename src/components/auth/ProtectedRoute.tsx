'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute, getUserStatusDisplay } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireEmailVerification?: boolean;
  fallbackRoute?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireEmailVerification = true,
  fallbackRoute = '/auth/login'
}) => {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // No user authenticated
      if (!user) {
        router.push(fallbackRoute);
        return;
      }

      // Email verification required but not verified
      if (requireEmailVerification && !isEmailVerified) {
        router.push('/auth/verify-email');
        return;
      }

      // Role-based access control
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
        return;
      }

      // Check if user account is active
      if (user.estado !== 'activo') {
        router.push('/account-inactive');
        return;
      }
    }
  }, [user, loading, isEmailVerified, allowedRoles, requireEmailVerification, router, fallbackRoute]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando acceso...</h2>
          <p className="text-gray-600">Por favor espera un momento</p>
        </motion.div>
      </div>
    );
  }

  // Show unauthorized state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para acceder a esta página.
          </p>
          <button
            onClick={() => router.push(fallbackRoute)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
        </motion.div>
      </div>
    );
  }

  // Show email verification required
  if (requireEmailVerification && !isEmailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verificación Requerida</h1>
          <p className="text-gray-600 mb-6">
            Debes verificar tu email antes de acceder a esta sección.
          </p>
          <button
            onClick={() => router.push('/auth/verify-email')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Verificar Email
          </button>
        </motion.div>
      </div>
    );
  }

  // Show role access denied
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sin Permisos</h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta sección.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Volver
          </button>
        </motion.div>
      </div>
    );
  }

  // Show account inactive
  if (user.estado !== 'activo') {
    const statusDisplay = getUserStatusDisplay(user.estado);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className={`w-16 h-16 ${statusDisplay.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
            <AlertCircle className={`w-8 h-8 ${statusDisplay.color}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cuenta {statusDisplay.label}</h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta está {statusDisplay.label.toLowerCase()}. Contacta al administrador para más información.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Volver al Login
          </button>
        </motion.div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Higher-order component for easy route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for conditional rendering based on permissions
export function usePermissions() {
  const { user } = useAuth();

  return {
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => user ? roles.includes(user.role) : false,
    canAccess: (route: string) => canAccessRoute(user, route),
    isActive: () => user?.estado === 'activo',
    isEmailVerified: () => user ? true : false, // Assuming if user exists, email is verified
  };
}
