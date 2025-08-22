'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface UsageStats {
  period: string;
  whatsapp: {
    sent: number;
    failed: number;
    cost: number;
    providers: Record<string, number>;
  };
  email: {
    sent: number;
    failed: number;
    cost: number;
  };
  totalCost: number;
  savings: number;
}

interface Provider {
  name: string;
  configured: boolean;
  cost: string;
  limitations?: string;
  status?: string;
}

export const NotificationDashboard = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar proveedores
      const providersResponse = await fetch('/api/notifications/whatsapp');
      const providersResult = await providersResponse.json();
      
      if (providersResult.success) {
        setProviders(providersResult.providers);
      }

      // Simular estadísticas (en producción, esto vendría de tu API)
      setStats({
        period: 'day',
        whatsapp: {
          sent: 150,
          failed: 5,
          cost: 0,
          providers: {
            'WhatsApp Web (Baileys)': 120,
            'Green API': 25,
            'CallMeBot': 5
          }
        },
        email: {
          sent: 10,
          failed: 1,
          cost: 0
        },
        totalCost: 0,
        savings: 45.50
      });

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getProviderStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'authorized': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-yellow-100 text-yellow-800';
      case 'not_configured': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (name: string) => {
    if (name.includes('Baileys')) return '🌐';
    if (name.includes('Green')) return '🟢';
    if (name.includes('CallMe')) return '📞';
    if (name.includes('Meta')) return '📘';
    if (name.includes('Twilio')) return '📱';
    return '📡';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🚀 Dashboard de Notificaciones GRATUITAS</h2>
        <p className="opacity-90">
          Sistema híbrido con múltiples proveedores gratuitos y fallback automático
        </p>
      </div>

      {/* Estadísticas Principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📱</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">WhatsApp Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.whatsapp.sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📧</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.email.sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalCost.toFixed(2)}</p>
                <p className="text-xs text-green-600">¡GRATIS!</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ahorro vs Twilio</p>
                <p className="text-2xl font-bold text-purple-600">${stats.savings}</p>
                <p className="text-xs text-purple-600">Este mes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de Proveedores */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📊 Estado de Proveedores</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getProviderIcon(provider.name)}</span>
                    <span className="font-medium text-sm">{provider.name}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderStatusColor(provider.status)}`}>
                    {provider.status || 'unknown'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Costo:</span>
                    <span className={`font-bold ${provider.cost === 'free' ? 'text-green-600' : 'text-orange-600'}`}>
                      {provider.cost.toUpperCase()}
                    </span>
                  </div>
                  
                  {provider.limitations && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Límites:</span> {provider.limitations}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución de Uso */}
      {stats && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">📈 Distribución de Uso (WhatsApp)</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(stats.whatsapp.providers).map(([provider, count]) => {
                const percentage = (count / stats.whatsapp.sent) * 100;
                return (
                  <div key={provider} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700">
                      {provider}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">⚡ Acciones Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/dashboard/asociacion/notificaciones'}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <span className="text-2xl mb-2 block">🧪</span>
                <span className="text-sm font-medium">Probar Envío</span>
              </div>
            </button>

            <button
              onClick={loadDashboardData}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <span className="text-2xl mb-2 block">🔄</span>
                <span className="text-sm font-medium">Actualizar Estado</span>
              </div>
            </button>

            <button
              onClick={() => toast('Configuración próximamente')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="text-center">
                <span className="text-2xl mb-2 block">⚙️</span>
                <span className="text-sm font-medium">Configuración</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
