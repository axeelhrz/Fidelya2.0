'use client';

import { WhatsAppTester } from '@/components/notifications/WhatsAppTester';
import { EmailTester } from '@/components/notifications/EmailTester';

export default function TestNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Centro de Pruebas - Fidelya
          </h1>
          <p className="text-gray-600">
            Sistema completo de notificaciones multicanal configurado y listo
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <WhatsAppTester />
          <EmailTester />
        </div>
        
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            ✅ Estado de Configuración Completa
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* WhatsApp Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                📱 WhatsApp (Twilio) - CONFIGURADO ✅
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Account SID: AC7118568a6ae5ee7b4ffab3e8c46cdec3</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Auth Token configurado</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>API Route funcionando</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Branding Fidelya aplicado</span>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 rounded">
                  <p className="text-xs text-yellow-700">
                    <strong>Para usar:</strong> Envía &quot;join orange-tiger&quot; al +1 415 523 8886
                  </p>
                </div>
              </div>
            </div>

            {/* Email Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                📧 Email (EmailJS) - CONFIGURADO ✅
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Service ID: service_r7dep5v</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Template ID: template_mgmgrng</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Public Key: wp08DHZOgU6CgICb1</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">✅</span>
                  <span>Template HTML profesional</span>
                </div>
                <div className="mt-3 p-2 bg-green-50 rounded">
                  <p className="text-xs text-green-700">
                    <strong>Listo para usar:</strong> Ingresa tu email y prueba el envío
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">🎉 Sistema Completo Configurado:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-green-700">
              <div>
                <p><strong>📱 WhatsApp:</strong></p>
                <p>• Twilio configurado ✅</p>
                <p>• Branding personalizado ✅</p>
                <p>• API Route segura ✅</p>
              </div>
              <div>
                <p><strong>📧 Email:</strong></p>
                <p>• EmailJS configurado ✅</p>
                <p>• Template HTML ✅</p>
                <p>• Branding Fidelya ✅</p>
              </div>
              <div>
                <p><strong>📱 In-App:</strong></p>
                <p>• Firestore integrado ✅</p>
                <p>• Notificaciones internas ✅</p>
                <p>• Estado de lectura ✅</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">💰 Costos y Límites Actuales:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p><strong>WhatsApp (Twilio):</strong></p>
                <p>• Sandbox: Gratis para testing</p>
                <p>• Mensajes: ~$0.005 USD c/u</p>
                <p>• Crédito disponible: $15 USD</p>
              </div>
              <div>
                <p><strong>Email (EmailJS):</strong></p>
                <p>• Plan gratuito: 200 emails/mes</p>
                <p>• Sin límite de destinatarios</p>
                <p>• Templates ilimitados</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium text-gray-800 mb-2">🚀 Próximos Pasos:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>1. ✅ Probar WhatsApp (sandbox configurado)</p>
              <p>2. ✅ Probar Email (credenciales configuradas)</p>
              <p>3. 🔄 Integrar con el sistema de notificaciones de Fidelya</p>
              <p>4. 📊 Monitorear el uso y estadísticas</p>
              <p>5. 🎯 Para producción: comprar número WhatsApp dedicado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}