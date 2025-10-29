import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminAuth, isAdminSDKAvailable } from '@/lib/firebase-admin';

// Función para crear cuenta de Firebase Auth usando Admin SDK (server-side)
async function createFirebaseAuthAccount(
  email: string, 
  password: string, 
  displayName: string, 
  existingUid?: string
): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    console.log(`🔥 Creando cuenta de Firebase Auth server-side para: ${email}`);
    
    // Verificar si Admin SDK está disponible
    if (!isAdminSDKAvailable()) {
      throw new Error('Firebase Admin SDK no está configurado correctamente');
    }

    let userRecord;

    if (existingUid) {
      // Usar UID existente (para importación de socios)
      console.log(`🔄 Usando UID existente: ${existingUid}`);
      userRecord = await adminAuth.createUser({
        uid: existingUid,
        email: email.toLowerCase().trim(),
        password: password,
        displayName: displayName,
        emailVerified: false, // El usuario deberá verificar su email
      });
    } else {
      // Crear usuario con UID generado automáticamente (creación manual)
      userRecord = await adminAuth.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        displayName: displayName,
        emailVerified: false, // El usuario deberá verificar su email
      });
    }
    
    console.log(`✅ Cuenta de Firebase Auth creada server-side: ${userRecord.uid}`);
    return {
      success: true,
      uid: userRecord.uid
    };
  } catch (error: unknown) {
    console.error(`❌ Error creando cuenta de Firebase Auth server-side:`, error);
    
    // Manejar errores específicos de Firebase
    let errorMessage = 'Error desconocido';

    if (typeof error === 'object' && error !== null) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/email-already-exists') {
        errorMessage = 'El email ya está registrado en Firebase Authentication';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'El formato del email es inválido';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (err.code === 'auth/uid-already-exists') {
        errorMessage = 'El UID ya existe en Firebase Authentication';
      } else if (err.message) {
        errorMessage = err.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Función para enviar email de verificación usando Admin SDK
// CORREGIDO: Ahora usa el servicio de notificaciones para enviar el email real
async function sendVerificationEmail(
  uid: string, 
  email: string, 
  displayName: string, 
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 Enviando email de verificación server-side para: ${email}`);
    
    // Verificar si Admin SDK está disponible
    if (!isAdminSDKAvailable()) {
      console.warn('⚠️ Admin SDK no disponible, saltando envío de email de verificación');
      return { success: false, error: 'Admin SDK no disponible' };
    }

    // Generar link de verificación de email
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?verified=true`,
      handleCodeInApp: false,
    };

    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
    
    console.log(`✅ Link de verificación generado: ${verificationLink}`);

    // NUEVO: Usar el servicio de notificaciones para enviar el email real
    try {
      // Importar dinámicamente el servicio de notificaciones
      const { simpleNotificationService } = await import('@/services/simple-notifications.service');
      
      // Crear el contenido del email de verificación
      const subject = '¡Verifica tu email en Fidelya!';
      const message = `
¡Hola ${displayName}!

Para completar la configuración de tu cuenta en Fidelya, necesitas verificar tu dirección de email.

🔗 **Haz clic aquí para verificar tu email:**
${verificationLink}

**¿Por qué necesitas verificar tu email?**
✅ Protege tu cuenta de accesos no autorizados
✅ Permite que recibas notificaciones importantes
✅ Habilita todas las funcionalidades de tu cuenta

**¿Problemas con el enlace?**
Si el enlace no funciona, cópialo y pégalo directamente en tu navegador.

Si no solicitaste esta verificación, puedes ignorar este email.

---
Saludos cordiales,
El equipo de Fidelya 💙

*Este es un email automático, por favor no respondas a esta dirección.*
      `.trim();

      // Crear un destinatario temporal
      const tempRecipient = {
        id: email,
        name: displayName,
        email: email,
        type: 'socio' as const
      };

      // Preparar datos de notificación
      const notificationData = {
        title: subject,
        message: message,
        type: 'info' as const,
        channels: ['email' as const],
        recipientIds: [email],
      };

      // Sobrescribir temporalmente el método getRecipients
      const originalGetRecipients = simpleNotificationService.getRecipients;
      simpleNotificationService.getRecipients = async () => [tempRecipient];

      try {
        // Crear y enviar la notificación
        const notificationId = await simpleNotificationService.createNotification(
          notificationData,
          'system-email-verification'
        );

        const result = await simpleNotificationService.sendNotification(
          notificationId,
          notificationData
        );

        // Restaurar el método original
        simpleNotificationService.getRecipients = originalGetRecipients;

        if (result.success && result.sentCount > 0) {
          console.log(`✅ Email de verificación enviado exitosamente a: ${email}`);
          return { success: true };
        } else {
          console.error(`❌ Error enviando email de verificación:`, result.errors);
          return {
            success: false,
            error: result.errors.length > 0 ? result.errors.join(', ') : 'Error desconocido al enviar email'
          };
        }

      } catch (sendError) {
        // Restaurar el método original en caso de error
        simpleNotificationService.getRecipients = originalGetRecipients;
        throw sendError;
      }

    } catch (notificationError) {
      console.error(`❌ Error usando servicio de notificaciones:`, notificationError);
      
      // Fallback: solo generar el link (comportamiento anterior)
      console.log(`📧 Fallback: Link de verificación generado pero no enviado automáticamente`);
      return { 
        success: false, 
        error: 'Link generado pero no se pudo enviar el email automáticamente' 
      };
    }
    
  } catch (error: unknown) {
    console.error(`❌ Error enviando email de verificación server-side:`, error);
    let errorMessage = 'Error desconocido';
    if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as { message?: string }).message || errorMessage;
    }
    return {
      success: false,
      error: errorMessage
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const contentType = headersList.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type debe ser application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, displayName, asociacionId, existingUid } = body;

    // Validar parámetros requeridos
    if (!email || !password || !displayName || !asociacionId) {
      return NextResponse.json(
        { success: false, error: 'Email, password, displayName y asociacionId son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log(`🔐 Solicitud de creación de cuenta server-side recibida:`, {
      email,
      displayName,
      asociacionId,
      existingUid: existingUid || 'auto-generado',
      timestamp: new Date().toISOString()
    });

    // Crear la cuenta de Firebase Authentication
    const authResult = await createFirebaseAuthAccount(email, password, displayName, existingUid);

    if (!authResult.success || !authResult.uid) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error || 'Error creando cuenta de autenticación'
        },
        { status: 500 }
      );
    }

    // Enviar email de verificación usando el servicio de notificaciones
    const verificationResult = await sendVerificationEmail(
      authResult.uid, 
      email, 
      displayName, 
    );

    console.log(`✅ Cuenta creada exitosamente server-side:`, {
      uid: authResult.uid,
      email,
      verificationSent: verificationResult.success,
      usedExistingUid: !!existingUid
    });

    return NextResponse.json({
      success: true,
      uid: authResult.uid,
      verificationEmailSent: verificationResult.success,
      verificationEmailError: verificationResult.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en endpoint de creación de cuenta server-side:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}