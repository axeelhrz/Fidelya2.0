'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DependencyInstaller } from './DependencyInstaller';

interface Provider {
  name: string;
  configured: boolean;
  available: boolean;
  cost: string;
  limitations?: string;
  status?: string;
}

export const FreeWhatsAppTester = () => {
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testTitle, setTestTitle] = useState('Bienvenido a Fidelya');
  const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba desde tu plataforma de fidelización favorita.');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/notifications/whatsapp');
      const result = await response.json();
      
      if (result.success) {
        setProviders(result.providers);
        
        // Verificar si hay dependencias faltantes
        const baileys = result.providers.find((p: Provider) => p.name.includes('Baileys'));
        if (baileys && !baileys.available) {
          setShowDependencies(true);
        }
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Ingresa un número de teléfono');
      return;
    }

    const availableProviders = providers.filter(p => p.configured && p.available);
    if (availableProviders.length === 0) {
      toast.error('No hay proveedores disponibles. Configura al menos uno.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🧪 Enviando con proveedores GRATUITOS...');
      
      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
          title: testTitle
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`✅ WhatsApp enviado GRATIS con ${result.provider}!`);
        console.log('🎉 Resultado:', result);
        
        if (result.fallbackUsed) {
          toast('Se usó proveedor de respaldo', { icon: 'ℹ️' });
        }
      } else {
        toast.error(`❌ Error: ${result.error}`);
        console.error('💥 Error:', result);
      }

    } catch (error) {
      console.error('💥 Error:', error);
      toast.error('Error enviando WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupWhatsAppWeb = async () => {
    const baileys = providers.find(p => p.name.includes('Baileys'));
    if (!baileys?.available) {
      toast.error('WhatsApp Web no está disponible. Instala las dependencias primero.');
      setShowDependencies(true);
      return;
    }

    setSetupLoading(true);
    
    try {
      const response = await fetch('/api/notifications/whatsapp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initialize' })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ WhatsApp Web inicializado. Revisa la consola del servidor para el QR.');
        await loadProviders();
      } else {
        toast.error(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error inicializando WhatsApp Web:', error);
      toast.error('Error inicializando WhatsApp Web');
    } finally {
      setSetupLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'authorized': return 'text-green-600';
      case 'ready': return 'text-green-600';
      case 'disconnected': return 'text-yellow-600';
      case 'not_configured': return 'text-gray-500';
      case 'dependencies_missing': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'authorized': return '🟢';
      case 'ready': return '🟢';
      case 'disconnected': return '🟡';
      case 'not_configured': return '⚪';
      case 'dependencies_missing': return '🟠';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const availableProviders = providers.filter(p => p.configured && p.available);

  if (showDependencies) {
    return (
      <div className="space-y-6">
        <DependencyInstaller />
        <div className="text-center">
          <button
            onClick={() => setShowDependencies(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ← Volver al Probador
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        🆓 WhatsApp GRATUITO - Múltiples Proveedores
      </h3>
      
      {/* Estado de Proveedores */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-700">📊 Estado de Proveedores Gratuitos:</h4>
          <button
            onClick={loadProviders}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            🔄 Actualizar
          </button>
        </div>
        <div className="space-y-2">
          {providers.map((provider, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(provider.status)}</span>
                <span className="font-medium">{provider.name}</span>
                <span className="text-green-600 font-bold">({provider.cost.toUpperCase()})</span>
                {!provider.available && (
                  <span className="text-orange-600 text-xs">(Dependencias faltantes)</span>
                )}
              </div>
              <div className="text-right">
                <div className={`font-medium ${getStatusColor(provider.status)}`}>
                  {provider.status || 'unknown'}
                </div>
                {provider.limitations && (
                  <div className="text-xs text-gray-500">{provider.limitations}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {availableProviders.length === 0 && (
          <div className="mt-3 p-3 bg-orange-50 rounded-md">
            <p className="text-orange-800 text-sm">
              ⚠️ No hay proveedores disponibles. 
              <button
                onClick={() => setShowDependencies(true)}
                className="ml-1 text-orange-600 underline hover:text-orange-800"
              >
                Ver instrucciones de configuración
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Configuración de WhatsApp Web */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">🔧 Configuración WhatsApp Web</h4>
        <p className="text-sm text-blue-700 mb-3">
          WhatsApp Web es completamente gratuito. Solo necesitas escanear un QR una vez.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={handleSetupWhatsAppWeb}
            disabled={setupLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {setupLoading ? '🔄 Configurando...' : '📱 Configurar WhatsApp Web'}
          </button>
          <button
            onClick={() => setShowDependencies(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            📦 Ver Dependencias
          </button>
        </div>
      </div>

      {/* Formulario de Prueba */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de teléfono (con código de país)
          </label>
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+5491123456789"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título del mensaje
          </label>
          <input
            type="text"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            placeholder="Título de la notificación"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje de prueba
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={loading || availableProviders.length === 0}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '📤 Enviando GRATIS...' : '🆓 Enviar WhatsApp GRATUITO'}
        </button>
      </div>

      {/* Información */}
      <div className="mt-6 space-y-3">
        <div className="p-3 bg-green-50 rounded-md">
          <h5 className="font-medium text-green-800 mb-1">🆓 Proveedores Disponibles:</h5>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• <strong>Green API:</strong> 3000 mensajes gratis/mes (sin dependencias)</li>
            <li>• <strong>CallMeBot:</strong> Gratis con registro previo (sin dependencias)</li>
            <li>• <strong>WhatsApp Web:</strong> Ilimitado y gratis (requiere dependencias)</li>
          </ul>
        </div>

        <div className="p-3 bg-yellow-50 rounded-md">
          <h5 className="font-medium text-yellow-800 mb-1">⚡ Sistema Inteligente:</h5>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Fallback automático entre proveedores</li>
            <li>• Prioriza opciones gratuitas</li>
            <li>• Sin costos de envío</li>
            <li>• Manejo automático de dependencias</li>
          </ul>
        </div>
      </div>
    </div>
  );
};