# 🆓 Configuración de WhatsApp GRATUITO para Fidelya

Este documento te guía para configurar múltiples proveedores de WhatsApp **completamente gratuitos** como alternativa a Twilio.

## 🚀 Proveedores Disponibles

### 1. WhatsApp Web (Baileys) - ⭐ RECOMENDADO
- **Costo:** Completamente GRATIS e ilimitado
- **Configuración:** Solo escanear QR una vez
- **Ventajas:** Más estable, sin límites, sin registro
- **Desventajas:** Requiere mantener sesión activa

### 2. Green API
- **Costo:** 3000 mensajes GRATIS por mes
- **Configuración:** Registro en green-api.com
- **Ventajas:** API REST simple, confiable
- **Desventajas:** Límite mensual

### 3. CallMeBot
- **Costo:** Completamente GRATIS
- **Configuración:** Registro del número en CallMeBot
- **Ventajas:** Sin límites conocidos
- **Desventajas:** Proceso de registro manual

## 📋 Instalación de Dependencias


npm install @whiskeysockets/baileys @hapi/boom qrcode-terminal


## ⚙️ Configuración por Proveedor

### 1. WhatsApp Web (Baileys) - GRATIS ∞

**No requiere configuración adicional.** Solo:

1. Ejecuta la aplicación
2. Ve a la sección de notificaciones
3. Haz clic en "Configurar WhatsApp Web"
4. Escanea el QR que aparece en la consola del servidor
5. ¡Listo! Mensajes ilimitados gratis

### 2. Green API - 3000 mensajes/mes GRATIS

1. **Registro:**
   - Ve a [green-api.com](https://green-api.com)
   - Crea una cuenta gratuita
   - Crea una nueva instancia

2. **Configuración:**
   - Copia tu `Instance ID` y `API Token`
   - Agrega a tu `.env`:

   GREEN_API_INSTANCE_ID=tu_instance_id
   GREEN_API_TOKEN=tu_api_token


3. **Activación:**
   - Escanea el QR desde el panel de Green API
   - Verifica que el estado sea "authorized"

### 3. CallMeBot - GRATIS ∞

1. **Registro del número:**
   - Envía "I allow callmebot to send me messages" al número +34 644 59 71 67
   - Recibirás un mensaje con tu API key

2. **Configuración:**

   CALLMEBOT_API_KEY=tu_api_key_recibida
   CALLMEBOT_PHONE=tu_numero_registrado


### 4. Meta WhatsApp Business API (Opcional)

Para empresas que quieran usar la API oficial:

1. **Registro:**
   - Ve a [developers.facebook.com](https://developers.facebook.com)
   - Crea una app de WhatsApp Business
   - Obtén tu token y phone number ID

2. **Configuración:**

   META_WHATSAPP_ACCESS_TOKEN=tu_access_token
   META_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id


## 🔧 Variables de Entorno Completas

Copia este contenido a tu archivo `.env`:


# WhatsApp Web (Baileys) - No requiere configuración
# Solo escanear QR una vez

# Green API (3000 mensajes gratis/mes)
GREEN_API_INSTANCE_ID=
GREEN_API_TOKEN=

# CallMeBot (Completamente gratis)
CALLMEBOT_API_KEY=
CALLMEBOT_PHONE=

# Meta WhatsApp Business API (Opcional)
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=

# Email de respaldo (Resend - 3000 emails gratis/mes)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@tudominio.com
RESEND_FROM_NAME=Fidelya


## 🚀 Uso del Sistema

### Envío Simple

import { freeWhatsAppService } from '@/services/free-whatsapp.service';

const result = await freeWhatsAppService.sendMessage(
  '+5491123456789',
  'Tu mensaje aquí',
  'Título opcional'
);

console.log(`Enviado con: ${result.provider}`);


### Envío con Fallback Automático

import { hybridNotificationsService } from '@/services/hybrid-notifications.service';

const result = await hybridNotificationsService.sendNotification({
  to: '+5491123456789',
  message: 'Tu mensaje aquí',
  title: 'Título opcional',
  email: 'fallback@email.com', // Email de respaldo
  priority: 'high'
});


### Envío Masivo

const notifications = [
  { to: '+5491111111111', message: 'Mensaje 1', priority: 'medium' },
  { to: '+5491111111112', message: 'Mensaje 2', priority: 'medium' },
  // ... más notificaciones
];

const results = await hybridNotificationsService.sendBulkNotifications(
  notifications,
  {
    batchSize: 10,
    delayBetweenBatches: 1000
  }
);


## 📊 Monitoreo y Dashboard

El sistema incluye un dashboard completo que muestra:

- ✅ Estado de cada proveedor
- 📈 Estadísticas de uso
- 💰 Ahorro vs servicios pagos
- 🔄 Distribución de mensajes por proveedor
- ⚡ Acciones rápidas

Accede desde: `/dashboard/asociacion/notificaciones`

## 🛠️ Solución de Problemas

### WhatsApp Web no conecta
1. Verifica que el puerto esté libre
2. Revisa la consola del servidor para el QR
3. Asegúrate de escanear con el teléfono correcto
4. Reinicia el servicio si es necesario

### Green API no funciona
1. Verifica que la instancia esté "authorized"
2. Revisa que el token sea correcto
3. Comprueba que no hayas excedido los 3000 mensajes/mes

### CallMeBot falla
1. Verifica que el número esté registrado correctamente
2. Asegúrate de usar el API key exacto que recibiste
3. El número debe incluir código de país

## 💡 Consejos de Optimización

1. **Prioriza WhatsApp Web:** Es el más confiable y sin límites
2. **Configura múltiples proveedores:** Para máxima disponibilidad
3. **Usa email como fallback:** Para notificaciones críticas
4. **Monitorea el uso:** Para no exceder límites gratuitos
5. **Implementa rate limiting:** Para evitar bloqueos

## 🎯 Beneficios del Sistema

- 💰 **Ahorro:** $0 vs $0.005+ por mensaje en Twilio
- 🔄 **Redundancia:** Múltiples proveedores con fallback automático
- 📈 **Escalabilidad:** Maneja miles de mensajes gratis
- 🛡️ **Confiabilidad:** Sistema híbrido con múltiples canales
- 📊 **Monitoreo:** Dashboard completo incluido

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de la consola
2. Verifica las variables de entorno
3. Comprueba el estado en el dashboard
4. Consulta la documentación de cada proveedor

¡Disfruta de tu sistema de WhatsApp completamente GRATUITO! 🚀

