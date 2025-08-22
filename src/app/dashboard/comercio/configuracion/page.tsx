'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useComercios } from '@/hooks/useComercios';
import { 
  Settings, 
  Bell, 
  Shield, 
  Zap, 
  Save, 
  RefreshCw,
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Monitor,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Loading component for Suspense fallback
function ComercioConfiguracionSkeleton() {
  return (
    <DashboardLayout
      activeSection="configuracion"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <RefreshCw size={32} className="text-gray-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando configuración...
          </h3>
          <p className="text-gray-500">Obteniendo preferencias del comercio</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Main component that uses useSearchParams
function ComercioConfiguracionContent() {
  const { signOut } = useAuth();
  const { comerciosVinculados, loading, updateComercio } = useComercios();
  // Select the first comercio as an example, adjust as needed
  const comercio = comerciosVinculados && comerciosVinculados.length > 0 ? comerciosVinculados[0] : null;
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';

  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [settings, setSettings] = useState({
    general: {
      nombreComercio: '',
      email: '',
      telefono: '',
      sitioWeb: '',
      timezone: 'America/Argentina/Buenos_Aires',
      idioma: 'es'
    },
    notificaciones: {
      email: {
        validaciones: true,
        beneficios: true,
        reportes: true,
        marketing: false
      },
      whatsapp: {
        validaciones: false,
        beneficios: false,
        reportes: false
      },
      push: {
        validaciones: true,
        beneficios: true,
        sistema: true
      }
    },
    seguridad: {
      autenticacionDosFactor: false,
      sesionesMultiples: true,
      notificarInicioSesion: true,
      bloquearDespuesIntentos: 5,
      tiempoBloqueo: 30
    },
    integraciones: {
      mercadoPago: {
        enabled: false,
        publicKey: '',
        accessToken: ''
      },
      whatsappBusiness: {
        enabled: false,
        phoneNumber: '',
        apiKey: ''
      },
      googleAnalytics: {
        enabled: false,
        trackingId: ''
      }
    }
  });

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSave = async () => {
    if (!comercio) return;

    setSaving(true);
    try {
      const success = await updateComercio(comercio.id, {
        ...settings.general,
        configuracion: {
          notificacionesEmail: settings.notificaciones.email.validaciones,
          notificacionesWhatsApp: settings.notificaciones.whatsapp.validaciones,
          autoValidacion: false, // This would come from another setting
          requiereAprobacion: true // This would come from another setting
        }
      });

      if (success) {
        toast.success('Configuración guardada exitosamente');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    toast.error('La funcionalidad para cambiar la contraseña no está disponible.');
  };

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Configuración básica'
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      description: 'Preferencias de notificaciones'
    },
    {
      id: 'seguridad',
      label: 'Seguridad',
      icon: Shield,
      description: 'Configuración de seguridad'
    },
    {
      id: 'integraciones',
      label: 'Integraciones',
      icon: Zap,
      description: 'APIs y servicios externos'
    }
  ];

  // Load comercio data
  useEffect(() => {
    if (comercio) {
      setSettings(prev => ({
        ...prev,
        general: {
          nombreComercio: comercio.nombreComercio || '',
          email: comercio.email || '',
          telefono: comercio.telefono || '',
          sitioWeb: '', // Removed comercio.sitioWeb as it does not exist
          timezone: 'America/Argentina/Buenos_Aires',
          idioma: 'es'
        },
        notificaciones: {
          ...prev.notificaciones,
          email: {
            ...prev.notificaciones.email,
            validaciones: true // Ajusta este valor según la lógica que desees si 'configuracion' no existe
          },
          whatsapp: {
            ...prev.notificaciones.whatsapp,
            validaciones: false // Ajusta este valor según la lógica que desees si 'configuracion' no existe
          }
        }
      }));
    }
  }, [comercio]);

  if (loading) {
    return (
      <DashboardLayout
        activeSection="configuracion"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <RefreshCw size={32} className="text-gray-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargando configuración...
            </h3>
            <p className="text-gray-500">Obteniendo preferencias del comercio</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="configuracion"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-600 to-slate-600 bg-clip-text text-transparent mb-2">
                Configuración
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Personaliza las preferencias de tu comercio
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => window.location.reload()}
              >
                Actualizar
              </Button>
              <Button
                size="sm"
                leftIcon={<Save size={16} />}
                onClick={handleSave}
                loading={saving}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', tab.id);
                  window.history.pushState({}, '', url.toString());
                  window.location.reload();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gray-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {activeTab === 'general' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Configuración General
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Comercio
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={settings.general.nombreComercio}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, nombreComercio: e.target.value }
                      }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={settings.general.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, email: e.target.value }
                      }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={settings.general.telefono}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, telefono: e.target.value }
                      }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={settings.general.sitioWeb}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, sitioWeb: e.target.value }
                      }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, timezone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Argentina/Cordoba">Córdoba (GMT-3)</option>
                    <option value="America/Argentina/Mendoza">Mendoza (GMT-3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select
                    value={settings.general.idioma}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, idioma: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Preferencias de Notificaciones
              </h3>

              <div className="space-y-8">
                {/* Email Notifications */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Notificaciones por Email</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.notificaciones.email).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <p className="text-xs text-gray-500">
                            Recibir notificaciones de {key} por email
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notificaciones: {
                              ...prev.notificaciones,
                              email: {
                                ...prev.notificaciones.email,
                                [key]: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Notifications */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Notificaciones por WhatsApp</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.notificaciones.whatsapp).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <p className="text-xs text-gray-500">
                            Recibir notificaciones de {key} por WhatsApp
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notificaciones: {
                              ...prev.notificaciones,
                              whatsapp: {
                                ...prev.notificaciones.whatsapp,
                                [key]: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Monitor className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Notificaciones Push</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.notificaciones.push).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <p className="text-xs text-gray-500">
                            Mostrar notificaciones push de {key}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notificaciones: {
                              ...prev.notificaciones,
                              push: {
                                ...prev.notificaciones.push,
                                [key]: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Configuración de Seguridad
              </h3>

              <div className="space-y-8">
                {/* Password Change */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Lock className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Cambiar Contraseña</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña Actual
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwords.current}
                          onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={!passwords.current || !passwords.new || !passwords.confirm}
                    >
                      Cambiar Contraseña
                    </Button>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Configuración de Seguridad</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Autenticación de dos factores
                        </span>
                        <p className="text-xs text-gray-500">
                          Agregar una capa extra de seguridad
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.seguridad.autenticacionDosFactor}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, autenticacionDosFactor: e.target.checked }
                        }))}
                        className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Permitir sesiones múltiples
                        </span>
                        <p className="text-xs text-gray-500">
                          Iniciar sesión desde múltiples dispositivos
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.seguridad.sesionesMultiples}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, sesionesMultiples: e.target.checked }
                        }))}
                        className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Notificar inicios de sesión
                        </span>
                        <p className="text-xs text-gray-500">
                          Recibir notificación cuando alguien inicie sesión
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.seguridad.notificarInicioSesion}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, notificarInicioSesion: e.target.checked }
                        }))}
                        className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integraciones' && (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Integraciones y APIs
              </h3>

              <div className="space-y-8">
                {/* MercadoPago Integration */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">MercadoPago</h4>
                        <p className="text-sm text-gray-500">Integración con pagos</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.integraciones.mercadoPago.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        integraciones: {
                          ...prev.integraciones,
                          mercadoPago: { ...prev.integraciones.mercadoPago, enabled: e.target.checked }
                        }
                      }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  {settings.integraciones.mercadoPago.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Public Key
                        </label>
                        <input
                          type="text"
                          value={settings.integraciones.mercadoPago.publicKey}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integraciones: {
                              ...prev.integraciones,
                              mercadoPago: { ...prev.integraciones.mercadoPago, publicKey: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="APP_USR-..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Access Token
                        </label>
                        <input
                          type="password"
                          value={settings.integraciones.mercadoPago.accessToken}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integraciones: {
                              ...prev.integraciones,
                              mercadoPago: { ...prev.integraciones.mercadoPago, accessToken: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="APP_USR-..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Business Integration */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">WhatsApp Business</h4>
                        <p className="text-sm text-gray-500">API de WhatsApp Business</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.integraciones.whatsappBusiness.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        integraciones: {
                          ...prev.integraciones,
                          whatsappBusiness: { ...prev.integraciones.whatsappBusiness, enabled: e.target.checked }
                        }
                      }))}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                  </div>
                  
                  {settings.integraciones.whatsappBusiness.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Teléfono
                        </label>
                        <input
                          type="tel"
                          value={settings.integraciones.whatsappBusiness.phoneNumber}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integraciones: {
                              ...prev.integraciones,
                              whatsappBusiness: { ...prev.integraciones.whatsappBusiness, phoneNumber: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+54 9 11 1234-5678"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={settings.integraciones.whatsappBusiness.apiKey}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            integraciones: {
                              ...prev.integraciones,
                              whatsappBusiness: { ...prev.integraciones.whatsappBusiness, apiKey: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="API Key"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Analytics Integration */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Google Analytics</h4>
                        <p className="text-sm text-gray-500">Seguimiento de analytics</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.integraciones.googleAnalytics.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        integraciones: {
                          ...prev.integraciones,
                          googleAnalytics: { ...prev.integraciones.googleAnalytics, enabled: e.target.checked }
                        }
                      }))}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                  </div>
                  
                  {settings.integraciones.googleAnalytics.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking ID
                      </label>
                      <input
                        type="text"
                        value={settings.integraciones.googleAnalytics.trackingId}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          integraciones: {
                            ...prev.integraciones,
                            googleAnalytics: { ...prev.integraciones.googleAnalytics, trackingId: e.target.value }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="GA-XXXXXXXXX-X"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

// Main exported component with Suspense boundary
export default function ComercioConfiguracionPage() {
  return (
    <Suspense fallback={<ComercioConfiguracionSkeleton />}>
      <ComercioConfiguracionContent />
    </Suspense>
  );
}