'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Person,
  Email,
  Phone,
  CalendarToday,
  LocationOn,
  Edit,
  Camera,
  TrendingUp,
  Download,
  Refresh,
  CheckCircle,
  Badge as BadgeIcon,
  Analytics,
  Store,
  LocalOffer,
  AccountCircle,
  Cake,
  Business,
  Schedule,
  MonetizationOn,
  Loyalty,
  BarChart,
  Speed,
  Visibility,
  Mail,
  Sms,
  NotificationsActive,
  History,
  Receipt,
  Security,
  Share,
  Close,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Socio, SocioStats } from '@/types/socio';
import { HistorialValidacion } from '@/services/validaciones.service';
import { socioService } from '@/services/socio.service';
import { validacionesService } from '@/services/validaciones.service';
import { safeFormatTimestamp } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SocioProfileViewProps {
  socio: Socio;
  open: boolean;
  onClose: () => void;
  onEdit?: (socio: Socio) => void;
  onRefresh?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && <div className="space-y-3">{children}</div>}
  </div>
);

// Componente de tarjeta de estadística compacta
const CompactStatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-lg font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-gray-600 font-medium">{title}</div>
    </div>
  </div>
);

// Componente de información compacta
const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor?: string;
}> = ({ icon, label, value, iconColor = 'text-gray-400' }) => (
  <div className="flex items-center gap-3 py-2">
    <div className={`${iconColor} w-4 h-4 flex-shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className="text-sm text-gray-900 font-semibold truncate">{value}</div>
    </div>
  </div>
);

export const SocioProfileView: React.FC<SocioProfileViewProps> = ({
  socio,
  open,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<SocioStats | null>(null);
  const [validaciones, setValidaciones] = useState<HistorialValidacion[]>([]);
  const [loading, setLoading] = useState(false);

  // Detectar el ancho de la pantalla para calcular la posición
  const [screenWidth, setScreenWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcular el margen izquierdo basado en el sidebar
  const getModalPosition = () => {
    if (isMobile) {
      return {
        left: '1rem',
        right: '1rem',
        width: 'auto',
        maxWidth: 'calc(100vw - 2rem)',
      };
    }

    // En desktop, posicionar junto al sidebar
    const sidebarWidth = screenWidth >= 1024 ? 320 : 80; // SIDEBAR_WIDTH o SIDEBAR_COLLAPSED_WIDTH
    return {
      left: `${sidebarWidth + 24}px`, // sidebar width + padding
      right: '24px',
      width: 'auto',
      maxWidth: `calc(100vw - ${sidebarWidth + 48}px)`, // total width - sidebar - padding
    };
  };

  const modalPosition = getModalPosition();

  // Cargar datos del perfil
  const loadProfileData = React.useCallback(async () => {
    if (!socio) return;
    
    setLoading(true);
    try {
      const [statsData, , validacionesData] = await Promise.all([
        socioService.getSocioStats?.(socio.uid) || Promise.resolve(null),
        socioService.getSocioActivity?.() || Promise.resolve([]),
        validacionesService.getHistorialValidaciones(socio.uid, 20),
      ]);
      
      setStats(statsData);
      setValidaciones(validacionesData.validaciones);
    } finally {
      setLoading(false);
    }
  }, [socio]);

  useEffect(() => {
    if (open && socio) {
      loadProfileData();
    }
  }, [open, socio, loadProfileData]);

  const handleImageUpload = async (file: File) => {
    if (!socio) return;
    
    try {
      await socioService.uploadProfileImage?.(socio.uid, file);
      toast.success('Imagen de perfil actualizada');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    }
  };

  const handleExportData = async () => {
    if (!socio) return;
    
    try {
      const exportData = await socioService.exportSocioData?.(socio.uid);
      
      if (exportData) {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `perfil_${socio.nombre.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Datos exportados correctamente');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar los datos');
    }
  };

  const getStatusChip = (estado: string) => {
    const config = {
      activo: { color: 'bg-emerald-100 text-emerald-800', label: 'Activo' },
      vencido: { color: 'bg-red-100 text-red-800', label: 'Vencido' },
      inactivo: { color: 'bg-gray-100 text-gray-800', label: 'Inactivo' },
      pendiente: { color: 'bg-amber-100 text-amber-800', label: 'Pendiente' },
      suspendido: { color: 'bg-red-100 text-red-800', label: 'Suspendido' },
    };

    const { color, label } = config[estado as keyof typeof config] || config.inactivo;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
        {label}
      </span>
    );
  };

  const getValidationStatusChip = (estado: string) => {
    const config = {
      exitoso: { color: 'bg-emerald-100 text-emerald-800', label: 'Exitoso' },
      fallido: { color: 'bg-red-100 text-red-800', label: 'Fallido' },
      pendiente: { color: 'bg-amber-100 text-amber-800', label: 'Pendiente' },
    };

    const { color, label } = config[estado as keyof typeof config] || config.pendiente;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { label: 'Muy Alto', color: 'text-emerald-600' };
    if (score >= 60) return { label: 'Alto', color: 'text-amber-600' };
    if (score >= 40) return { label: 'Medio', color: 'text-blue-600' };
    return { label: 'Bajo', color: 'text-red-600' };
  };

  const calculateEngagementScore = () => {
    if (!stats) return 50;
    
    let score = 50;
    if (socio.estado === 'activo') score += 20;
    if (stats.beneficiosUsados && stats.beneficiosUsados > 0) score += 15;
    if (stats.comerciosVisitados && stats.comerciosVisitados > 3) score += 10;
    if (stats.racha && stats.racha > 7) score += 5;
    
    return Math.min(100, Math.max(0, score));
  };

  const engagementScore = calculateEngagementScore();
  const engagementLevel = getEngagementLevel(engagementScore);

  const tabs = [
    { id: 0, label: 'Info', icon: Person },
    { id: 1, label: 'Stats', icon: Analytics },
    { id: 2, label: 'Historial', icon: History },
    { id: 3, label: 'Config', icon: Security },
  ];

  if (!socio || !open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Background overlay solo en mobile */}
      {isMobile && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* Modal compacto posicionado junto al sidebar */}
      <div 
        className="fixed top-6 bottom-6 bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto overflow-hidden flex flex-col"
        style={modalPosition}
      >
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden">
                {socio.avatar ? (
                  <Image
                    src={socio.avatar}
                    alt={socio.nombre}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {socio.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                <Camera className="w-2 h-2 text-blue-600" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </label>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-sm font-bold truncate">
                {socio.nombre}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusChip(socio.estado)}
                <span className={`text-xs font-medium ${engagementLevel.color}`}>
                  {engagementScore}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                loadProfileData();
                if (onRefresh) onRefresh();
              }}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              title="Actualizar"
            >
              <Refresh className="w-4 h-4" />
            </button>
            
            {onEdit && (
              <button
                onClick={() => onEdit(socio)}
                className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={handleExportData}
              className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              title="Exportar"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              title="Cerrar"
            >
              <Close className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs Navigation compactos */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex px-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 border-b-2 font-medium text-xs flex items-center space-x-1 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content scrolleable */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Cargando...</span>
            </div>
          )}

          {/* Tab 1: Información Personal */}
          <TabPanel value={activeTab} index={0}>
            <div className="space-y-4">
              {/* Información básica */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                  <AccountCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Información Personal
                </h4>
                
                <div className="space-y-2">
                  <InfoItem
                    icon={<Person />}
                    label="Nombre"
                    value={socio.nombre}
                  />

                  <InfoItem
                    icon={<Email />}
                    label="Email"
                    value={socio.email}
                  />

                  {socio.telefono && (
                    <InfoItem
                      icon={<Phone />}
                      label="Teléfono"
                      value={socio.telefono}
                    />
                  )}

                  {socio.dni && (
                    <InfoItem
                      icon={<BadgeIcon />}
                      label="DNI"
                      value={socio.dni}
                    />
                  )}

                  {socio.direccion && (
                    <InfoItem
                      icon={<LocationOn />}
                      label="Dirección"
                      value={socio.direccion}
                    />
                  )}

                  {socio.fechaNacimiento && (
                    <InfoItem
                      icon={<Cake />}
                      label="Nacimiento"
                      value={safeFormatTimestamp(socio.fechaNacimiento, 'dd/MM/yyyy', { locale: es })}
                    />
                  )}
                </div>
              </div>

              {/* Información de membresía */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                  <Business className="w-4 h-4 mr-2 text-emerald-600" />
                  Membresía
                </h4>
                
                <div className="space-y-2">
                  <InfoItem
                    icon={<CalendarToday />}
                    label="Registro"
                    value={safeFormatTimestamp(socio.creadoEn, 'dd/MM/yyyy', { locale: es })}
                  />

                  {socio.numeroSocio && (
                    <InfoItem
                      icon={<BadgeIcon />}
                      label="N° Socio"
                      value={`#${socio.numeroSocio}`}
                    />
                  )}

                  <InfoItem
                    icon={<MonetizationOn />}
                    label="Cuota"
                    value={`$${socio.montoCuota || 0}`}
                  />

                  {socio.ultimoAcceso && (
                    <InfoItem
                      icon={<Schedule />}
                      label="Último acceso"
                      value={safeFormatTimestamp(socio.ultimoAcceso, 'dd/MM HH:mm', { locale: es })}
                    />
                  )}

                  {/* Engagement score compacto */}
                  <div className="py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Speed className="text-gray-400 w-4 h-4" />
                      <div className="text-xs text-gray-500 font-medium">Engagement</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            engagementScore >= 80 ? 'bg-emerald-500' :
                            engagementScore >= 60 ? 'bg-amber-500' :
                            engagementScore >= 40 ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${engagementScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${engagementLevel.color}`}>
                        {engagementScore}%
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${engagementLevel.color} mt-1`}>
                      {engagementLevel.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Tab 2: Estadísticas */}
          <TabPanel value={activeTab} index={1}>
            <div className="grid grid-cols-1 gap-3">
              <CompactStatCard
                title="Beneficios Usados"
                value={stats?.beneficiosUsados || 0}
                icon={<LocalOffer className="w-5 h-5 text-white" />}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              
              <CompactStatCard
                title="Ahorro Total"
                value={`$${stats?.ahorroTotal || 0}`}
                icon={<MonetizationOn className="w-5 h-5 text-white" />}
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              
              <CompactStatCard
                title="Comercios Visitados"
                value={stats?.comerciosVisitados || 0}
                icon={<Store className="w-5 h-5 text-white" />}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              
              <CompactStatCard
                title="Validaciones Exitosas"
                value={validaciones.filter(v => v.estado === 'exitosa').length}
                icon={<CheckCircle className="w-5 h-5 text-white" />}
                color="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              
              <CompactStatCard
                title="Racha Actual"
                value={`${stats?.racha || 0} días`}
                icon={<Loyalty className="w-5 h-5 text-white" />}
                color="bg-gradient-to-br from-amber-500 to-orange-600"
              />

              <CompactStatCard
                title="Promedio Mensual"
                value={`$${Math.round((stats?.ahorroTotal || 0) / Math.max(1, stats?.tiempoComoSocio || 1) * 30)}`}
                icon={<TrendingUp className="w-5 h-5 text-white" />}
                color="bg-gradient-to-br from-pink-500 to-rose-600"
              />
            </div>
          </TabPanel>

          {/* Tab 3: Historial de Validaciones */}
          <TabPanel value={activeTab} index={2}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Receipt className="w-4 h-4 mr-2 text-blue-600" />
                  Últimas Validaciones
                </h4>
                <button
                  onClick={loadProfileData}
                  disabled={loading}
                  className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Refresh className="w-3 h-3 inline mr-1" />
                  Actualizar
                </button>
              </div>

              {validaciones.length > 0 ? (
                <div className="space-y-2">
                  {validaciones.slice(0, 8).map((validacion) => (
                    <div 
                      key={validacion.id} 
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900 text-xs truncate flex-1 mr-2">
                          {validacion.beneficioTitulo}
                        </div>
                        {getValidationStatusChip(validacion.estado)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1 truncate">
                          <Store className="w-3 h-3 flex-shrink-0" />
                          {validacion.comercioNombre}
                        </span>
                        <span className="text-emerald-600 font-semibold">
                          {validacion.tipoDescuento === 'porcentaje' 
                            ? `${validacion.descuento}%` 
                            : `$${validacion.descuento}`
                          }
                        </span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <CalendarToday className="w-3 h-3" />
                          {format(validacion.fechaValidacion, 'dd/MM', { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Sin validaciones
                  </div>
                  <div className="text-xs text-gray-500">
                    Las validaciones aparecerán aquí
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Tab 4: Configuración */}
          <TabPanel value={activeTab} index={3}>
            <div className="space-y-4">
              {/* Configuración de notificaciones */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                  <NotificationsActive className="w-4 h-4 mr-2 text-blue-600" />
                  Notificaciones
                </h4>
                
                <div className="space-y-2">
                  {[
                    {
                      key: 'notificaciones',
                      label: 'Generales',
                      icon: <NotificationsActive />,
                      enabled: socio.configuracion?.notificaciones ?? true,
                    },
                    {
                      key: 'notificacionesEmail',
                      label: 'Email',
                      icon: <Mail />,
                      enabled: socio.configuracion?.notificacionesEmail ?? true,
                    },
                    {
                      key: 'notificacionesSMS',
                      label: 'SMS',
                      icon: <Sms />,
                      enabled: socio.configuracion?.notificacionesSMS ?? false,
                    },
                  ].map((config) => (
                    <div key={config.key} className="flex items-center gap-3 py-2 px-3 bg-gray-50/50 rounded-lg">
                      <div className={`${config.enabled ? 'text-emerald-600' : 'text-gray-400'} w-4 h-4`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{config.label}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuración de privacidad */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                  <Security className="w-4 h-4 mr-2 text-emerald-600" />
                  Privacidad
                </h4>
                
                <div className="space-y-2">
                  {[
                    {
                      key: 'perfilPublico',
                      label: 'Perfil público',
                      icon: <Visibility />,
                      enabled: socio.configuracion?.perfilPublico ?? false,
                    },
                    {
                      key: 'mostrarEstadisticas',
                      label: 'Estadísticas',
                      icon: <BarChart />,
                      enabled: socio.configuracion?.mostrarEstadisticas ?? true,
                    },
                    {
                      key: 'compartirDatos',
                      label: 'Compartir datos',
                      icon: <Share />,
                      enabled: socio.configuracion?.compartirDatos ?? false,
                    },
                  ].map((config) => (
                    <div key={config.key} className="flex items-center gap-3 py-2 px-3 bg-gray-50/50 rounded-lg">
                      <div className={`${config.enabled ? 'text-blue-600' : 'text-gray-400'} w-4 h-4`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{config.label}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        config.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabPanel>
        </div>

        {/* Footer compacto */}
        <div className="bg-gray-50/50 px-4 py-3 flex gap-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cerrar
          </button>
          
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(socio)}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg"
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
