'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { simpleNotificationService } from '@/services/simple-notifications.service';
import { useAuth } from '@/hooks/useAuth';

export const EmailTester = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testTitle, setTestTitle] = useState('Bienvenido a Fidelya');
  const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba desde tu plataforma de fidelización favorita. Esperamos que disfrutes de todos los beneficios que tenemos para ti.');

  const handleDirectTest = async () => {
    if (!user) {
      toast.error('Debes estar autenticado');
      return;
    }

    if (!testEmail.trim()) {
      toast.error('Ingresa un email');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('Ingresa un email válido');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🧪 Probando envío de email con credenciales configuradas...');
      
      // Crear una notificación de prueba
      const notificationData = {
        title: testTitle,
        message: testMessage,
        type: 'info' as const,
        channels: ['email' as const],
        recipientIds: ['test-recipient'] // ID ficticio para la prueba
      };

      // Crear la notificación
      const notificationId = await simpleNotificationService.createNotification(
        notificationData,
        user.uid
      );

      // Simular un destinatario con el email de prueba
      const originalGetRecipients = simpleNotificationService.getRecipients;
      simpleNotificationService.getRecipients = async () => [
        {
          id: 'test-recipient',
          name: 'Usuario de Prueba',
          email: testEmail,
          type: 'socio' as const
        }
      ];

      // Enviar la notificación
      const result = await simpleNotificationService.sendNotification(
        notificationId,
        notificationData
      );

      // Restaurar el método original
      simpleNotificationService.getRecipients = originalGetRecipients;

      if (result.success) {
        toast.success(`✅ Email enviado exitosamente!`);
        console.log('🎉 Resultado de la prueba:', result);
      } else {
        toast.error(`❌ Error enviando email: ${result.errors.join(', ')}`);
        console.error('💥 Errores:', result.errors);
      }

    } catch (error) {
      console.error('💥 Error en la prueba:', error);
      toast.error('Error en la prueba de email');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceStatus = () => {
    const status = simpleNotificationService.getServicesStatus();
    console.log('🔧 Estado de servicios:', status);
    
    if (status.email.configured) {
      toast.success('✅ EmailJS está configurado correctamente');
      console.log('📧 Credenciales EmailJS:', {
        serviceId: 'service_r7dep5v',
        templateId: 'template_mgmgrng',
        publicKey: 'wp08DHZOgU6CgICb1'
      });
    } else {
      toast.error('❌ EmailJS NO está configurado');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        📧 Probador de Email - Fidelya
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de destino
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="tu-email@ejemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ingresa un email válido para recibir la prueba
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título del email
          </label>
          <input
            type="text"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            placeholder="Título del email"
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
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleDirectTest}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '📤 Enviando...' : '📧 Enviar Email'}
          </button>
          
          <button
            onClick={handleServiceStatus}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            🔧 Estado
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 rounded-md">
        <p className="text-xs text-green-800">
          <strong>✅ EmailJS Configurado:</strong><br/>
          • Service ID: service_r7dep5v<br/>
          • Template ID: template_mgmgrng<br/>
          • Public Key: wp08DHZ...b1<br/>
          • Estado: Listo para enviar
        </p>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>📧 Vista Previa del Email:</strong><br/>
          <strong>Asunto:</strong> {testTitle} - Fidelya<br/>
          <strong>De:</strong> Fidelya<br/>
          <strong>Para:</strong> {testEmail || 'tu-email@ejemplo.com'}<br/>
          <strong>Contenido:</strong> HTML con diseño profesional
        </p>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <p className="text-xs text-yellow-800">
          <strong>📋 Instrucciones:</strong><br/>
          1. ✅ EmailJS ya está configurado<br/>
          2. Ingresa tu email para la prueba<br/>
          3. Personaliza título y mensaje<br/>
          4. Haz clic en &quot;Enviar Email&quot;<br/>
          5. Revisa tu bandeja de entrada (y spam)
        </p>
      </div>
    </div>
  );
};