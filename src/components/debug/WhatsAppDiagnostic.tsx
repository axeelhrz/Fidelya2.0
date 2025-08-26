'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Settings,
  Phone,
  Key,
  Server
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProviderStatus {
  name: string;
  configured: boolean;
  available: boolean;
  cost: string;
  limitations?: string;
  status?: string;
}

interface DiagnosticResult {
  provider: string;
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp: Date;
}

export const WhatsAppDiagnostic = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<DiagnosticResult[]>([]);
  const [testPhone, setTestPhone] = useState('+59898978384');

  // Cargar estado de proveedores
  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/whatsapp');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
      } else {
        toast.error('Error cargando proveedores');
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Error conectando con la API');
    } finally {
      setLoading(false);
    }
  };

  // Probar envío de WhatsApp
  const testWhatsApp = async () => {
    if (!testPhone) {
      toast.error('Ingresa un número de teléfono');
      return;
    }

    setTesting(true);
    setTestResults([]);
    
    try {
      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testPhone,
          message: '🧪 Mensaje de prueba desde Fidelya\n\nSi recibes este mensaje, ¡WhatsApp está funcionando correctamente!',
          title: 'Prueba de WhatsApp'
        })
      });

      const result = await response.json();
      
      const testResult: DiagnosticResult = {
        provider: result.provider || 'Desconocido',
        success: result.success,
        error: result.error,
        messageId: result.messageId,
        timestamp: new Date()
      };

      setTestResults([testResult]);

      if (result.success) {
        toast.success(`✅ Mensaje enviado con ${result.provider}`);
      } else {
        toast.error(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      toast.error('Error en la prueba');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const getStatusIcon = (status: string, configured: boolean, available: boolean) => {
    if (!configured) return <XCircle className="w-5 h-5 text-red-500" />;
    if (!available) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    
    switch (status) {
      case 'ready':
      case 'connected':
      case 'authorized':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
      case 'not_authorized':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'dependencies_missing':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string, configured: boolean, available: boolean) => {
    if (!configured) return 'No configurado';
    if (!available) return 'Dependencias faltantes';
    
    switch (status) {
      case 'ready': return 'Listo';
      case 'connected': return 'Conectado';
      case 'authorized': return 'Autorizado';
      case 'disconnected': return 'Desconectado';
      case 'not_authorized': return 'No autorizado';
      case 'dependencies_missing': return 'Dependencias faltantes';
      case 'not_configured': return 'No configurado';
      default: return status || 'Estado desconocido';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Diagnóstico de WhatsApp
        </h1>
        <p className="text-gray-600">
          Verifica el estado de los proveedores de WhatsApp y prueba el envío de mensajes
        </p>
      </div>

      {/* Estado de Proveedores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Estado de Proveedores
          </h2>
          <button
            onClick={loadProviders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Cargando estado de proveedores...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(provider.status || '', provider.configured, provider.available)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-600">
                        {getStatusText(provider.status || '', provider.configured, provider.available)}
                      </p>
                      {provider.limitations && (
                        <p className="text-xs text-gray-500 mt-1">{provider.limitations}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      provider.cost === 'free' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {provider.cost === 'free' ? 'Gratis' : 'Pago'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Prueba de Envío */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Prueba de Envío
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de teléfono (con código de país)
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+59898978384"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={testWhatsApp}
              disabled={testing || !testPhone}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Enviando mensaje de prueba...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  Enviar mensaje de prueba
                </>
              )}
            </button>
          </div>

          {/* Resultados de la prueba */}
          {testResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Resultados de la prueba:</h3>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {result.success ? 'Éxito' : 'Error'} - {result.provider}
                    </span>
                  </div>
                  {result.success ? (
                    <p className="text-sm text-green-700">
                      Mensaje enviado exitosamente
                      {result.messageId && ` (ID: ${result.messageId})`}
                    </p>
                  ) : (
                    <p className="text-sm text-red-700">
                      {result.error}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {result.timestamp.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Configuración Recomendada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 rounded-2xl border border-blue-200 p-6"
      >
        <div className="flex items-start gap-3">
          <Settings className="w-6 h-6 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Configuración Recomendada
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Green API:</strong> Más confiable, 3000 mensajes gratis/mes</p>
              <p><strong>CallMeBot:</strong> Fácil de configurar, limitado a números registrados</p>
              <p><strong>WhatsApp Web:</strong> Gratis ilimitado, requiere escanear QR</p>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <Key className="w-4 h-4 inline mr-1" />
                Para configurar los proveedores, agrega las variables de entorno correspondientes en tu archivo <code>.env.local</code>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};