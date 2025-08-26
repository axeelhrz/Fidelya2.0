# 📱 Configuración de WhatsApp para Fidelya

Esta guía te ayudará a configurar los proveedores de WhatsApp para enviar notificaciones desde Fidelya.

## 🚀 Proveedores Disponibles

### 1. Green API (Recomendado) ⭐
- **Ventajas:** Más confiable, 3000 mensajes gratis/mes
- **Desventajas:** Requiere registro y configuración
- **Costo:** Gratis hasta 3000 mensajes/mes

#### Configuración:
1. Ve a [green-api.com](https://green-api.com)
2. Regístrate y crea una instancia
3. Obtén tu `Instance ID` y `API Token`
4. Agrega a tu `.env.local`:
```env
GREEN_API_INSTANCE_ID=tu_instance_id
GREEN_API_TOKEN=tu_api_token
```

### 2. CallMeBot (Fácil) 🔧
- **Ventajas:** Muy fácil de configurar
- **Desventajas:** Solo funciona con números registrados
- **Costo:** Completamente gratis

#### Configuración:
1. Envía un mensaje a +34 644 59 71 67 con el texto: `I allow callmebot to send me messages`
2. Recibirás tu API key
3. Agrega a tu `.env.local`:
```env
CALLMEBOT_API_KEY=tu_api_key
CALLMEBOT_PHONE=tu_numero_registrado
```

### 3. WhatsApp Web (Baileys) 🌐
- **Ventajas:** Gratis ilimitado
- **Desventajas:** Requiere escanear QR y dependencias opcionales
- **Costo:** Completamente gratis

#### Configuración:
1. Las dependencias se instalan automáticamente
2. Escanea el código QR cuando se solicite
3. No requiere variables de entorno adicionales

## 🔧 Configuración Rápida

### Paso 1: Copia las variables de entorno
```bash
cp .env.example .env.local
```

### Paso 2: Configura al menos un proveedor
Edita `.env.local` y agrega las credenciales de al menos uno de los proveedores.

### Paso 3: Prueba la configuración
Ve a: `http://localhost:3000/test-whatsapp-diagnostic`

## 🧪 Diagnóstico y Pruebas

### Página de Diagnóstico
Visita `/test-whatsapp-diagnostic` para:
- Ver el estado de todos los proveedores
- Probar el envío de mensajes
- Diagnosticar problemas de configuración

### Comandos de Prueba
```bash
# Verificar estado de proveedores
curl http://localhost:3000/api/notifications/whatsapp

# Enviar mensaje de prueba
curl -X POST http://localhost:3000/api/notifications/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+59898978384",
    "message": "Mensaje de prueba",
    "title": "Prueba"
  }'
```

## 🔍 Solución de Problemas

### Error: "Todos los proveedores de WhatsApp fallaron"
1. Verifica que al menos un proveedor esté configurado
2. Revisa las variables de entorno en `.env.local`
3. Usa la página de diagnóstico para identificar el problema

### Error 400: Bad Request
- Verifica que el número de teléfono incluya el código de país
- Formato correcto: `+59898978384`

### Green API no funciona
1. Verifica que la instancia esté autorizada
2. Escanea el código QR en el panel de Green API
3. Verifica que el `Instance ID` y `API Token` sean correctos

### CallMeBot no funciona
1. Asegúrate de haber enviado el mensaje de autorización
2. Verifica que el número esté registrado correctamente
3. El número debe incluir el código de país

## 📊 Monitoreo

### Logs en Consola
Los servicios de WhatsApp generan logs detallados:
```
📱 Cliente: Enviando WhatsApp a: +59898978384
🔄 Intentando con Green API...
✅ Mensaje enviado exitosamente con Green API
```

### Estados de Proveedores
- ✅ **ready/connected**: Listo para enviar
- ❌ **not_configured**: Falta configuración
- ⚠️ **dependencies_missing**: Faltan dependencias
- 🔄 **connecting**: Conectando

## 🎯 Recomendaciones

1. **Para producción:** Usa Green API por su confiabilidad
2. **Para desarrollo:** CallMeBot es perfecto para pruebas
3. **Para uso intensivo:** Considera WhatsApp Web con Baileys
4. **Siempre:** Configura múltiples proveedores como respaldo

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en la consola del navegador
2. Usa la página de diagnóstico
3. Verifica las variables de entorno
4. Consulta la documentación de cada proveedor

---

¡Con esta configuración tendrás WhatsApp funcionando perfectamente en Fidelya! 🚀