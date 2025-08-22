'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Store, 
  Gift, 
  QrCode, 
  Users, 
  UserCheck,
  LogOut,
  CheckCircle,
  BarChart3,
  Bell,
  Settings,
  TrendingUp,
  Sparkles,
  Crown,
  Star,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useComercio } from '@/hooks/useComercio';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface ComercioSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick?: () => void;
  activeSection: string;
}

interface RealtimeStats {
  validacionesHoy: number;
  validacionesMes: number;
  beneficiosActivos: number;
  clientesUnicos: number;
  qrGenerado: boolean;
  qrEscaneos: number;
  qrEscaneosSemana: number;
  actividadReciente: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
  isNew?: boolean;
  isPro?: boolean;
  description?: string;
  gradient?: string;
}

export const ComercioSidebar: React.FC<ComercioSidebarProps> = ({
  open,
  onToggle,
  onMenuClick,
  onLogoutClick,
  activeSection
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { comercio, stats, loading: comercioLoading } = useComercio();
  
  // Enhanced state management
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    validacionesHoy: 0,
    validacionesMes: 0,
    beneficiosActivos: 0,
    clientesUnicos: 0,
    qrGenerado: false,
    qrEscaneos: 0,
    qrEscaneosSemana: 0,
    actividadReciente: 0
  });


  // Simplified menu items without submenus
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      route: '/dashboard/comercio',
      description: 'Vista general del negocio',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: Store,
      route: '/dashboard/comercio/perfil',
      description: 'Configuración del comercio',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      route: '/dashboard/comercio/beneficios',
      badge: realtimeStats.beneficiosActivos,
      description: 'Gestionar ofertas y promociones',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'qr',
      label: 'Código QR',
      icon: QrCode,
      route: '/dashboard/comercio/qr',
      badge: realtimeStats.qrEscaneos,
      description: 'Gestión de códigos QR',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'validaciones',
      label: 'Validaciones',
      icon: UserCheck,
      route: '/dashboard/comercio/validaciones',
      badge: realtimeStats.validacionesHoy,
      description: 'Historial de validaciones',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      route: '/dashboard/comercio/clientes',
      badge: realtimeStats.clientesUnicos,
      description: 'Gestión de clientes',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      route: '/dashboard/comercio/analytics',
      isNew: true,
      isPro: true,
      description: 'Métricas avanzadas y reportes',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      route: '/dashboard/comercio/notificaciones',
      description: 'Centro de notificaciones',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      route: '/dashboard/comercio/configuracion',
      description: 'Ajustes del sistema',
      gradient: 'from-slate-500 to-gray-500'
    }
  ], [realtimeStats]);

  // Optimized stats calculation
  const memoizedStats = useMemo(() => ({
    validacionesHoy: stats?.validacionesHoy || 0,
    validacionesMes: stats?.validacionesMes || 0,
    beneficiosActivos: stats?.beneficiosActivos || 0,
    clientesUnicos: stats?.clientesUnicos || 0,
    qrGenerado: !!comercio?.qrCode,
    qrEscaneos: 0,
    qrEscaneosSemana: 0,
    actividadReciente: 0
  }), [stats, comercio]);

  // Update stats only when memoized values change
  useEffect(() => {
    setRealtimeStats(prev => ({
      ...prev,
      ...memoizedStats
    }));
  }, [memoizedStats]);

  // Enhanced Firebase listener with cleanup
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to validaciones collection
      const validacionesRef = collection(db, 'validaciones');
      const validacionesQuery = query(
        validacionesRef, 
        where('comercioId', '==', user.uid),
        orderBy('fechaHora', 'desc'),
        limit(100)
      );
      
      const unsubscribeValidaciones = onSnapshot(validacionesQuery, (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const validacionesHoy = snapshot.docs.filter(doc => {
          const data = doc.data();
          const fechaValidacion = data.fechaHora?.toDate();
          return fechaValidacion && fechaValidacion >= today;
        }).length;

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const validacionesMes = snapshot.docs.filter(doc => {
          const data = doc.data();
          const fechaValidacion = data.fechaHora?.toDate();
          return fechaValidacion && fechaValidacion >= thisMonth;
        }).length;

        const clientesUnicos = new Set(
          snapshot.docs.map(doc => doc.data().socioId)
        ).size;
        
        setRealtimeStats(prev => ({
          ...prev,
          validacionesHoy,
          validacionesMes,
          clientesUnicos
        }));
      }, (error) => {
        console.error('Error listening to validaciones:', error);
      });
      unsubscribers.push(unsubscribeValidaciones);

      // Listen to beneficios collection
      const beneficiosRef = collection(db, 'beneficios');
      const beneficiosQuery = query(
        beneficiosRef, 
        where('comercioId', '==', user.uid),
        where('estado', '==', 'activo')
      );
      
      const unsubscribeBeneficios = onSnapshot(beneficiosQuery, (snapshot) => {
        setRealtimeStats(prev => ({
          ...prev,
          beneficiosActivos: snapshot.docs.length
        }));
      }, (error) => {
        console.error('Error listening to beneficios:', error);
      });
      unsubscribers.push(unsubscribeBeneficios);

    } catch (error) {
      console.error('Error setting up Firebase listeners:', error);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.uid]);

  // Enhanced navigation handler
  const handleNavigation = useCallback((route: string, itemId: string) => {
    if (pathname !== route) {
      router.push(route);
    }
    onMenuClick(itemId);
  }, [router, pathname, onMenuClick]);

  // Check if menu item is active
  const isActiveItem = useCallback((item: MenuItem) => {
    return pathname === item.route || activeSection === item.id;
  }, [pathname, activeSection]);

  // Handle logout
  const handleLogout = async () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      try {
        await signOut();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  };

  // Modern loading skeleton
  if (comercioLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`
          fixed left-0 top-0 h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 
          backdrop-blur-xl border-r border-white/20 shadow-2xl z-40 transition-all duration-500
          ${open ? 'w-80' : 'w-0 lg:w-20'}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="p-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Enhanced mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Modern Sidebar */}
      <motion.div 
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        className={`
          fixed left-0 top-0 h-full bg-gradient-to-br from-slate-50/95 via-white/95 to-slate-50/95 
          backdrop-blur-xl border-r border-white/20 shadow-2xl z-40 transition-all duration-500
          ${open ? 'w-80' : 'w-0 lg:w-20'}
          lg:relative lg:translate-x-0 flex flex-col
        `}
      >
        {/* Modern Header */}
        <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <motion.div 
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <AnimatePresence>
              {open && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 min-w-0"
                >
                  <h2 className="text-lg font-bold text-slate-900 truncate">
                    {comercio?.nombreComercio || user?.nombre || 'Comercio'}
                  </h2>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                    <CheckCircle className="w-3 h-3 mr-1.5" />
                    Activo
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Enhanced mobile toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl hover:bg-white/50 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </motion.button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 py-4 border-b border-white/10 flex-shrink-0"
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100/50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-indigo-700">{realtimeStats.validacionesHoy}</span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-600/80">Validaciones Hoy</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-emerald-700">{realtimeStats.beneficiosActivos}</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-600/80">Beneficios Activos</p>
                </motion.div>
              </div>
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-4 border border-slate-200/50 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Este mes</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{realtimeStats.validacionesMes}</span>
                      <span className="ml-1 text-slate-600">validaciones</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{realtimeStats.clientesUnicos}</span>
                      <span className="ml-1 text-slate-600">clientes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Navigation - Simplified without submenus */}
        <nav className="flex-1 px-4 py-3 space-y-2 overflow-y-auto min-h-0">
          {menuItems.map((item, index) => {
            const isActive = isActiveItem(item);
            
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation(item.route, item.id)}
                  className={`
                    w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-300
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25' 
                      : 'text-slate-700 hover:bg-white/60 hover:shadow-md'
                    }
                    ${!open && 'lg:justify-center lg:px-3'}
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : `bg-gradient-to-br ${item.gradient || 'from-slate-100 to-slate-200'} text-white`
                    }
                  `}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  
                  <AnimatePresence>
                    {open && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold truncate">{item.label}</span>
                          {item.isNew && (
                            <motion.span 
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm"
                            >
                              <Sparkles className="w-2.5 h-2.5 mr-1" />
                              Nuevo
                            </motion.span>
                          )}
                          {item.isPro && (
                            <motion.span 
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm"
                            >
                              <Crown className="w-2.5 h-2.5 mr-1" />
                              Pro
                            </motion.span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs opacity-75 truncate mt-0.5">{item.description}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {open && item.badge !== undefined && item.badge > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full min-w-[24px] shadow-sm"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            );
          })}
        </nav>

        {/* Enhanced User Section */}
        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          <AnimatePresence>
            {open ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-3"
              >
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-white/60 to-slate-50/60 rounded-2xl border border-white/20 shadow-sm"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {(comercio?.nombreComercio || user?.nombre)?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {comercio?.nombreComercio || user?.nombre || 'Comercio'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email || 'comercio@email.com'}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Star className="w-4 h-4 text-amber-400" />
                  </motion.div>
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 border border-red-200/50 hover:border-red-300 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-semibold text-sm">Cerrar Sesión</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 shadow-sm"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export default ComercioSidebar;