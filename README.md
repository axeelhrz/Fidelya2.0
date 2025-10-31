# Fidelya - Sistema de Gestión de Socios y Beneficios

La plataforma que conecta asociaciones, socios y comercios en un ecosistema inteligente de beneficios y fidelización.

Este es un proyecto [Next.js](https://nextjs.org) construido con TypeScript, Firebase y Tailwind CSS.

## 🚀 Características Principales

- 🏢 **Gestión de Asociaciones**: Administra múltiples asociaciones con sus socios y comercios
- 👥 **Portal de Socios**: Los socios pueden ver y validar sus beneficios mediante QR
- 🏪 **Portal de Comercios**: Los comercios pueden crear y gestionar beneficios
- 📊 **Analytics Integrado**: Google Analytics 4 para seguimiento de métricas
- 🔔 **Sistema de Notificaciones**: Notificaciones por email y WhatsApp
- 📱 **Responsive Design**: Optimizado para móviles, tablets y desktop
- 🔐 **Autenticación Segura**: Sistema de autenticación con Firebase Auth

## 📋 Requisitos Previos

- Node.js 18.x o superior
- npm, yarn, pnpm o bun
- Cuenta de Firebase
- Cuenta de Google Analytics (opcional)

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd fidelya
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. Configura las variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📊 Google Analytics

La aplicación incluye integración completa con Google Analytics 4. Para más información sobre cómo usar y configurar Analytics, consulta la [documentación de Google Analytics](./docs/GOOGLE_ANALYTICS.md).

### Configuración Rápida

1. Obtén tu ID de medición de Google Analytics (formato: G-XXXXXXXXXX)
2. Agrégalo a tu archivo `.env.local`:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
3. El rastreo de páginas es automático
4. Para eventos personalizados, usa:
```typescript
import { event } from '@/lib/analytics';

event({
  action: 'click',
  category: 'Button',
  label: 'Crear Beneficio',
  value: 1
});
```

## 🏗️ Estructura del Proyecto

```
fidelya/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── dashboard/         # Dashboards por rol
│   │   └── ...
│   ├── components/            # Componentes React
│   │   ├── analytics/         # Componentes de Analytics
│   │   ├── asociacion/        # Componentes de asociación
│   │   ├── comercio/          # Componentes de comercio
│   │   ├── socio/             # Componentes de socio
│   │   └── ui/                # Componentes UI reutilizables
│   ├── hooks/                 # Custom React Hooks
│   ├── lib/                   # Utilidades y configuración
│   ├── services/              # Servicios de negocio
│   ├── types/                 # Definiciones de TypeScript
│   └── utils/                 # Funciones auxiliares
├── docs/                      # Documentación
├── functions/                 # Firebase Cloud Functions
└── public/                    # Archivos estáticos
```

## 🎨 Tecnologías Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Storage**: Firebase Storage
- **Analytics**: Google Analytics 4
- **Notificaciones**: React Hot Toast
- **Gráficos**: Chart.js, Recharts
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Validación**: Zod
- **QR**: qrcode, @zxing/library

## 📱 Roles de Usuario

### 🏢 Asociación
- Gestión completa de socios
- Gestión de comercios afiliados
- Creación y administración de beneficios
- Reportes y analytics
- Sistema de notificaciones

### 👤 Socio
- Visualización de beneficios disponibles
- Validación de beneficios mediante QR
- Historial de validaciones
- Perfil personal
- Gestión de asociaciones

### 🏪 Comercio
- Creación y gestión de beneficios
- Validación de QR de socios
- Analytics de validaciones
- Gestión de clientes
- Notificaciones a socios

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo con Turbopack

# Producción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción

# Utilidades
npm run lint         # Ejecuta el linter
npm run setup-cors   # Configura CORS para Firebase Storage
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio con Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Otros Proveedores

La aplicación puede desplegarse en cualquier plataforma que soporte Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Railway
- Render

## 📚 Documentación Adicional

- [Integración de Google Analytics](./docs/GOOGLE_ANALYTICS.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Equipo

Desarrollado por el equipo de Fidelya.

## 📞 Soporte

Para soporte y consultas, contacta al equipo de desarrollo.
