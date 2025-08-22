# Configuración CORS para Firebase Storage

Este documento explica cómo resolver el error CORS que ocurre al subir imágenes a Firebase Storage desde el entorno de desarrollo local.

## 🚫 Problema

El error que estás viendo:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3001' has been blocked by CORS policy
```

Indica que Firebase Storage no está configurado para permitir solicitudes desde tu dominio local.

## ✅ Solución

### Opción 1: Script Automático (Recomendado)

1. **Ejecutar el script de configuración:**
   ```bash
   npm run setup-cors
   ```

2. **Si no tienes Google Cloud SDK instalado:**
   - En macOS con Homebrew: El script lo instalará automáticamente
   - En otros sistemas: Instala manualmente desde [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

3. **Autenticarse con Google Cloud (si es necesario):**
   ```bash
   gcloud auth login
   gcloud config set project fidelita-16082
   ```

### Opción 2: Configuración Manual

1. **Instalar Google Cloud SDK:**
   ```bash
   # macOS con Homebrew
   brew install --cask google-cloud-sdk
   
   # O descargar desde: https://cloud.google.com/sdk/docs/install
   ```

2. **Autenticarse:**
   ```bash
   gcloud auth login
   gcloud config set project fidelita-16082
   ```

3. **Aplicar configuración CORS:**
   ```bash
   gsutil cors set cors.json gs://fidelita-16082.firebasestorage.app
   ```

4. **Verificar configuración:**
   ```bash
   gsutil cors get gs://fidelita-16082.firebasestorage.app
   ```

## 📋 Configuración CORS Actual

El archivo `cors.json` incluye:

```json
[
  {
    "origin": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "https://127.0.0.1:3000",
      "https://127.0.0.1:3001",
      "*"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Allow-Credentials",
      "Authorization",
      "X-Requested-With"
    ]
  }
]
```

## 🔧 Mejoras Implementadas

### 1. Upload con Múltiples Estrategias

El sistema ahora intenta diferentes estrategias de subida:

1. **Upload Simple** (más confiable para CORS)
2. **Ruta Alternativa** (si la primera falla)
3. **Upload Resumable** (como último recurso)
4. **Workaround CORS** (conversión a base64)

### 2. Detección y Manejo de Errores CORS

- Detección automática de errores CORS
- Mensajes de error más informativos
- Estrategias de recuperación automática
- Logging detallado para debugging

### 3. Validación de Conexión

```typescript
import { checkStorageConnection } from '@/utils/storage/uploadImage';

// Verificar conectividad
const connectionStatus = await checkStorageConnection();
console.log(connectionStatus);
```

## 🚀 Verificación

Después de aplicar la configuración CORS:

1. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Intenta subir una imagen nuevamente**

3. **Verifica en la consola del navegador:**
   - Deberías ver mensajes como: `✅ Upload simple exitoso`
   - No deberían aparecer errores CORS

## 🆘 Solución de Problemas

### Error: "gsutil command not found"
- Instala Google Cloud SDK siguiendo las instrucciones arriba

### Error: "Authentication required"
```bash
gcloud auth login
gcloud config set project fidelita-16082
```

### Error: "Permission denied"
- Asegúrate de tener permisos de administrador en el proyecto Firebase
- Contacta al propietario del proyecto para obtener acceso

### Los errores CORS persisten
1. Verifica que la configuración se aplicó correctamente:
   ```bash
   gsutil cors get gs://fidelita-16082.firebasestorage.app
   ```

2. Espera unos minutos para que los cambios se propaguen

3. Limpia la caché del navegador y reinicia el servidor

## 📞 Soporte

Si continúas teniendo problemas:

1. Verifica que el archivo `cors.json` existe en la raíz del proyecto
2. Confirma que estás usando el puerto correcto (3001 en tu caso)
3. Revisa los logs de la consola del navegador para errores específicos
4. Contacta al equipo de desarrollo con los detalles del error

---

**Nota:** Esta configuración es específica para el entorno de desarrollo. Para producción, deberás actualizar los orígenes permitidos en `cors.json` con tu dominio de producción.