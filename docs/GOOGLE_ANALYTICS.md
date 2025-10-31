# Google Analytics Integration

Esta documentación explica cómo está integrado Google Analytics en la aplicación Fidelya y cómo utilizarlo.

## Configuración

### 1. Variable de Entorno

Agrega tu ID de medición de Google Analytics en tu archivo `.env.local`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-SSFH2MMELB
```

### 2. Componentes Instalados

La integración incluye los siguientes archivos:

- `src/components/analytics/GoogleAnalytics.tsx` - Componente principal de GA
- `src/components/analytics/AnalyticsTracker.tsx` - Rastreador automático de páginas
- `src/lib/analytics.ts` - Utilidades y funciones helper
- `src/hooks/useGoogleAnalytics.ts` - Hook personalizado para rastreo

## Características

### ✅ Rastreo Automático de Páginas

El rastreo de páginas se realiza automáticamente cuando el usuario navega por la aplicación. No necesitas hacer nada adicional.

### ✅ Rastreo de Eventos Personalizados

Puedes rastrear eventos personalizados en cualquier componente:

```typescript
import { event } from '@/lib/analytics';

// Ejemplo: Rastrear cuando un usuario hace clic en un botón
const handleClick = () => {
  event({
    action: 'click',
    category: 'Button',
    label: 'Crear Beneficio',
    value: 1
  });
};
```

### ✅ Ejemplos de Eventos Comunes

#### Rastrear Login de Usuario
```typescript
import { event } from '@/lib/analytics';

event({
  action: 'login',
  category: 'Authentication',
  label: 'Socio Login',
});
```

#### Rastrear Creación de Beneficio
```typescript
import { event } from '@/lib/analytics';

event({
  action: 'create',
  category: 'Beneficio',
  label: 'Nuevo Beneficio Creado',
  value: 1
});
```

#### Rastrear Validación de QR
```typescript
import { event } from '@/lib/analytics';

event({
  action: 'scan',
  category: 'QR',
  label: 'QR Validado',
  value: 1
});
```

#### Rastrear Búsqueda
```typescript
import { event } from '@/lib/analytics';

event({
  action: 'search',
  category: 'Search',
  label: searchQuery,
});
```

## Optimizaciones Implementadas

### 🚀 Carga Optimizada
- Usa `next/script` con estrategia `afterInteractive` para no bloquear la carga inicial
- Los scripts se cargan después de que la página sea interactiva

### 🎯 Rastreo Preciso
- Rastreo automático de cambios de ruta usando el router de Next.js
- Incluye parámetros de búsqueda en las URLs rastreadas

### 🔒 Type-Safe
- Tipos TypeScript completos para todos los eventos
- Validación de tipos en tiempo de compilación

## Verificación

Para verificar que Google Analytics está funcionando:

1. Abre tu aplicación en el navegador
2. Abre las DevTools (F12)
3. Ve a la pestaña "Network"
4. Filtra por "gtag" o "google-analytics"
5. Deberías ver requests a `www.google-analytics.com`

También puedes usar la extensión de Chrome "Google Analytics Debugger" para ver los eventos en tiempo real.

## Mejores Prácticas

### ✅ DO's
- Rastrea eventos significativos para tu negocio
- Usa nombres de categorías consistentes
- Incluye labels descriptivos
- Usa valores numéricos cuando sea relevante

### ❌ DON'Ts
- No rastrees información personal identificable (PII)
- No rastrees datos sensibles (contraseñas, tokens, etc.)
- No sobrecargues con demasiados eventos
- No uses nombres de eventos genéricos

## Eventos Sugeridos para Fidelya

Aquí hay algunos eventos que podrías querer rastrear:

```typescript
// Gestión de Socios
event({ action: 'create', category: 'Socio', label: 'Nuevo Socio' });
event({ action: 'update', category: 'Socio', label: 'Perfil Actualizado' });
event({ action: 'delete', category: 'Socio', label: 'Socio Eliminado' });

// Gestión de Comercios
event({ action: 'create', category: 'Comercio', label: 'Nuevo Comercio' });
event({ action: 'approve', category: 'Comercio', label: 'Comercio Aprobado' });
event({ action: 'reject', category: 'Comercio', label: 'Comercio Rechazado' });

// Beneficios
event({ action: 'create', category: 'Beneficio', label: 'Nuevo Beneficio' });
event({ action: 'redeem', category: 'Beneficio', label: 'Beneficio Canjeado' });
event({ action: 'expire', category: 'Beneficio', label: 'Beneficio Vencido' });

// Validaciones
event({ action: 'scan', category: 'QR', label: 'QR Escaneado' });
event({ action: 'validate', category: 'QR', label: 'Validación Exitosa' });
event({ action: 'error', category: 'QR', label: 'Validación Fallida' });

// Notificaciones
event({ action: 'send', category: 'Notification', label: 'Email Enviado' });
event({ action: 'send', category: 'Notification', label: 'WhatsApp Enviado' });
event({ action: 'open', category: 'Notification', label: 'Notificación Abierta' });

// Reportes
event({ action: 'export', category: 'Report', label: 'Reporte Exportado' });
event({ action: 'generate', category: 'Report', label: 'Reporte Generado' });
```

## Soporte

Si tienes problemas con la integración de Google Analytics, verifica:

1. ✅ La variable de entorno está configurada correctamente
2. ✅ El ID de medición es válido (formato: G-XXXXXXXXXX)
3. ✅ Los scripts se están cargando (verifica en Network tab)
4. ✅ No hay bloqueadores de anuncios activos
5. ✅ La consola no muestra errores relacionados con gtag

## Referencias

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [gtag.js API Reference](https://developers.google.com/analytics/devguides/collection/gtagjs)
