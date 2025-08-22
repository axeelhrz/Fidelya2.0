'use client';

import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
// Import the type from the correct location
import type { SimpleNotificationResult } from '@/types/simple-notification';

export const AsociacionNotificationDebug = () => {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const {
    recipients,
    notifications,
    loading,
    sending,
    error,
    sendNotification,
    loadRecipients
  } = useSimpleNotifications();

  const [testResult, setTestResult] = useState<SimpleNotificationResult | null>(null);

  const handleTestSend = async () => {
    if (recipients.length === 0) {
      toast.error('❌ No hay destinatarios disponibles');
      console.error('❌ No hay destinatarios disponibles');
      return;
    }

    // Buscar un destinatario con teléfono
    const recipientWithPhone = recipients.find(r => r.phone);
    if (!recipientWithPhone) {
      toast.error('❌ No hay destinatarios con teléfono');
      console.error('❌ No hay destinatarios con teléfono');
      return;
    }

    const testData = {
      title: 'Prueba desde Dashboard Asociación',
      message: 'Este es un mensaje de prueba enviado desde el dashboard de asociación para verificar que WhatsApp funciona correctamente.',
      type: 'info' as const,
      channels: ['whatsapp' as const],
      recipientIds: [recipientWithPhone.id]
    };

    console.log('🧪 Enviando notificación de prueba desde asociación:', testData);
    console.log('👤 Usuario actual:', user);
    console.log('🔥 Firebase user:', firebaseUser);
    console.log('📋 Destinatario seleccionado:', recipientWithPhone);

    try {
      setTestResult(null);
      const result = await sendNotification(testData);
      console.log('✅ Resultado del envío:', result);
      setTestResult(result);
      
      if (result?.success) {
        toast.success(`✅ WhatsApp enviado exitosamente! ${result.sentCount} enviados`);
      } else {
        toast.error(`❌ Error en el envío: ${result?.errors?.join(', ') || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('❌ Error en el envío:', err);
      setTestResult({ success: false, sentCount: 0, failedCount: 1, errors: [err instanceof Error ? err.message : 'Error desconocido'] });
      toast.error('❌ Error crítico en el envío');
    }
  };

  const handleDirectAPITest = async () => {
    if (recipients.length === 0) {
      toast.error('❌ No hay destinatarios disponibles');
      return;
    }

    const recipientWithPhone = recipients.find(r => r.phone);
    if (!recipientWithPhone) {
      toast.error('❌ No hay destinatarios con teléfono');
      return;
    }

    try {
      console.log('🧪 Probando API directa de WhatsApp...');
      
      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientWithPhone.phone,
          message: 'Prueba directa de API desde dashboard de asociación',
          title: 'Prueba API Directa'
        })
      });

      const result = await response.json();
      console.log('📱 Resultado API directa:', result);

      if (response.ok && result.success) {
        toast.success(`✅ API directa funcionando! SID: ${result.sid}`);
      } else {
        toast.error(`❌ Error en API directa: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Error en API directa:', error);
      toast.error('❌ Error crítico en API directa');
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-3">🔍 Debug Dashboard Asociación</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2 text-sm">
          <div>
            <strong>🔐 Autenticación:</strong>
          </div>
          <div className="ml-4 space-y-1">
            <div>Firebase User: {firebaseUser ? `✅ ${firebaseUser.email}` : '❌ No autenticado'}</div>
            <div>User Data: {user ? `✅ ${user.email} (${user.role})` : '❌ Sin datos'}</div>
            <div>Estado: {user?.estado || 'N/A'}</div>
            <div>Auth Loading: {authLoading ? '⏳ Cargando...' : '✅ Listo'}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <strong>📊 Datos de Notificaciones:</strong>
          </div>
          <div className="ml-4 space-y-1">
            <div>Destinatarios: {loading ? '⏳ Cargando...' : `${recipients.length} cargados`}</div>
            <div>Con teléfono: {recipients.filter(r => r.phone).length}</div>
            <div>Notificaciones: {notifications.length} históricas</div>
            <div>Estado envío: {sending ? '📤 Enviando...' : '✅ Listo'}</div>
            {error && <div className="text-red-600">Error: {error}</div>}
          </div>
        </div>
      </div>

      {recipients.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-blue-800 mb-2">📋 Primeros 3 destinatarios:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {recipients.slice(0, 3).map(recipient => (
              <div key={recipient.id} className="bg-white p-2 rounded border text-xs">
                <div><strong>{recipient.name}</strong> ({recipient.type})</div>
                <div>📧 {recipient.email || 'Sin email'}</div>
                <div>📱 {recipient.phone || 'Sin teléfono'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleTestSend}
          disabled={loading || sending || recipients.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          🧪 Prueba Completa (Servicio)
        </button>
        
        <button
          onClick={handleDirectAPITest}
          disabled={recipients.filter(r => r.phone).length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          📱 Prueba API Directa
        </button>

        <button
          onClick={loadRecipients}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          🔄 Recargar Destinatarios
        </button>
      </div>

      {testResult && (
        <div className="bg-white p-3 rounded border">
          <h5 className="font-medium mb-2">📊 Último resultado de prueba:</h5>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs text-blue-600 mt-2">
        💡 <strong>Instrucciones:</strong> 
        <br />1. Verifica que tengas rol &quot;asociacion&quot; y estés autenticado
        <br />2. Asegúrate de que hay destinatarios con teléfonos válidos
        <br />3. Usa &quot;Prueba API Directa&quot; para verificar que Twilio funciona
        <br />4. Usa &quot;Prueba Completa&quot; para probar todo el flujo de notificaciones
      </div>
    </div>
  );
};