'use client';

import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useAuth } from '@/hooks/useAuth';

export const NotificationDebug = () => {
  const { user } = useAuth();
  const {
    recipients,
    notifications,
    loading,
    sending,
    error,
    sendNotification
  } = useSimpleNotifications();

  const handleTestSend = async () => {
    if (recipients.length === 0) {
      console.error('❌ No hay destinatarios disponibles');
      return;
    }

    const testData = {
      title: 'Prueba de WhatsApp',
      message: 'Este es un mensaje de prueba desde el dashboard',
      type: 'info' as const,
      channels: ['whatsapp' as const],
      recipientIds: [recipients[0].id] // Solo el primer destinatario
    };

    console.log('🧪 Enviando notificación de prueba:', testData);
    console.log('👤 Usuario actual:', user);
    console.log('📋 Destinatarios disponibles:', recipients);

    try {
      const result = await sendNotification(testData);
      console.log('✅ Resultado del envío:', result);
    } catch (err) {
      console.error('❌ Error en el envío:', err);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔍 Debug de Notificaciones</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Usuario autenticado:</strong> {user ? `✅ ${user.email}` : '❌ No autenticado'}
        </div>
        <div>
          <strong>Destinatarios cargados:</strong> {loading ? '⏳ Cargando...' : `${recipients.length} destinatarios`}
        </div>
        <div>
          <strong>Notificaciones históricas:</strong> {notifications.length} notificaciones
        </div>
        <div>
          <strong>Estado de envío:</strong> {sending ? '📤 Enviando...' : '✅ Listo'}
        </div>
        {error && (
          <div>
            <strong>Error:</strong> <span className="text-red-600">{error}</span>
          </div>
        )}
      </div>

      {recipients.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-yellow-800 mb-2">Primeros 3 destinatarios:</h4>
          <ul className="text-xs space-y-1">
            {recipients.slice(0, 3).map(recipient => (
              <li key={recipient.id} className="bg-white p-2 rounded border">
                <strong>{recipient.name}</strong> ({recipient.type})
                <br />
                📧 {recipient.email || 'Sin email'}
                <br />
                📱 {recipient.phone || 'Sin teléfono'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleTestSend}
        disabled={loading || sending || recipients.length === 0}
        className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        🧪 Enviar Prueba de WhatsApp
      </button>
    </div>
  );
};