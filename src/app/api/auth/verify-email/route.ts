import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { emailVerificationTokenService } from '@/services/email-verification-token.service';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, USER_STATES } from '@/lib/constants';

/**
 * Endpoint para validar email con token corto
 * POST /api/auth/verify-email
 * Body: { token: string }
 */
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
    const { token } = body;

    // Validar parámetros requeridos
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔐 Solicitud de verificación de email recibida con token: ${token}`);

    // Validar el token
    const validationResult = await emailVerificationTokenService.validateToken(token);

    if (!validationResult.success) {
      console.warn(`⚠️ Token inválido o expirado: ${token}`);
      return NextResponse.json(
        { 
          success: false, 
          error: validationResult.error,
          expired: validationResult.expired,
          alreadyUsed: validationResult.alreadyUsed
        },
        { status: 400 }
      );
    }

    const { userId, email, role } = validationResult;

    if (!userId || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Datos de token incompletos' },
        { status: 400 }
      );
    }

    console.log(`✅ Token válido para usuario: ${userId} (${email})`);

    // Actualizar estado del usuario usando batch
    const batch = writeBatch(db);

    // 1. Actualizar documento en colección users
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    batch.update(userDocRef, {
      estado: USER_STATES.ACTIVO,
      emailVerified: true,
      actualizadoEn: serverTimestamp(),
    });

    // 2. Actualizar documento en colección específica del rol
    let roleCollection: string;
    switch (role) {
      case 'socio':
        roleCollection = COLLECTIONS.SOCIOS;
        break;
      case 'comercio':
        roleCollection = COLLECTIONS.COMERCIOS;
        break;
      case 'asociacion':
        roleCollection = COLLECTIONS.ASOCIACIONES;
        break;
      default:
        throw new Error(`Rol desconocido: ${role}`);
    }

    const roleDocRef = doc(db, roleCollection, userId);
    
    // Para socios, también actualizar estadoMembresia si tienen asociación
    if (role === 'socio') {
      batch.update(roleDocRef, {
        estado: USER_STATES.ACTIVO,
        requiresEmailVerification: false,
        actualizadoEn: serverTimestamp(),
      });
    } else {
      batch.update(roleDocRef, {
        estado: USER_STATES.ACTIVO,
        actualizadoEn: serverTimestamp(),
      });
    }

    // Ejecutar batch
    await batch.commit();

    console.log(`✅ Usuario activado exitosamente: ${userId}`);

    // Marcar token como usado
    await emailVerificationTokenService.markTokenAsUsed(token);

    console.log(`✅ Token marcado como usado: ${token}`);

    return NextResponse.json({
      success: true,
      message: 'Email verificado exitosamente',
      userId,
      email,
      role,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en endpoint de verificación de email:', error);
    
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

/**
 * Endpoint para obtener información de un token (sin validarlo)
 * GET /api/auth/verify-email?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 Consultando información del token: ${token}`);

    // Validar el token (sin marcarlo como usado)
    const validationResult = await emailVerificationTokenService.validateToken(token);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationResult.error,
          expired: validationResult.expired,
          alreadyUsed: validationResult.alreadyUsed
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: validationResult.email,
      role: validationResult.role,
      valid: true
    });

  } catch (error) {
    console.error('❌ Error consultando token:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor'
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
