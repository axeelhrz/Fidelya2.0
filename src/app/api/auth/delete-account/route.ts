import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminAuth, isAdminSDKAvailable } from '@/lib/firebase-admin';

// Función para eliminar cuenta de Firebase Auth usando Admin SDK
async function deleteFirebaseAuthAccount(uid: string): Promise<boolean> {
  try {
    console.log(`🔥 Eliminando cuenta de Firebase Auth para UID: ${uid}`);
    
    // Verificar si Admin SDK está disponible
    if (!isAdminSDKAvailable()) {
      throw new Error('Firebase Admin SDK no está configurado correctamente');
    }

    // Eliminar usuario usando Firebase Admin SDK
    await adminAuth.deleteUser(uid);
    
    console.log(`✅ Cuenta de Firebase Auth eliminada exitosamente: ${uid}`);
    return true;
  } catch (error: unknown) {
    console.error(`❌ Error eliminando cuenta de Firebase Auth para ${uid}:`, error);
    
    // Si el usuario no existe, consideramos que ya fue eliminado
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'auth/user-not-found'
    ) {
      console.log(`⚠️ Usuario ${uid} no encontrado en Firebase Auth, posiblemente ya eliminado`);
      return true;
    }
    
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const contentType = headersList.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type debe ser application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { uid, asociacionId, userType } = body;

    console.log('🗑️ Solicitud de eliminación de cuenta recibida:', {
      uid,
      asociacionId: asociacionId || 'No especificado',
      userType: userType || 'No especificado',
      timestamp: new Date().toISOString()
    });

    // Validar que se proporcione el UID
    if (!uid) {
      return NextResponse.json(
        { error: 'UID es requerido' },
        { status: 400 }
      );
    }

    // Validar userType si se proporciona
    if (userType && !['socio', 'comercio', 'asociacion'].includes(userType)) {
      return NextResponse.json(
        { error: 'userType debe ser: socio, comercio o asociacion' },
        { status: 400 }
      );
    }

    // Intentar eliminar la cuenta de Firebase Auth
    const authDeleted = await deleteFirebaseAuthAccount(uid);
    
    if (authDeleted) {
      console.log(`✅ Eliminación completa exitosa para UID: ${uid}`);
      return NextResponse.json({
        success: true,
        message: 'Cuenta eliminada exitosamente',
        uid,
        userType: userType || 'no especificado',
        authDeleted: true
      });
    } else {
      console.log(`⚠️ Eliminación parcial para UID: ${uid} - Auth falló pero continuando`);
      return NextResponse.json({
        success: true,
        message: 'Cuenta eliminada con advertencias',
        uid,
        userType: userType || 'no especificado',
        authDeleted: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: unknown) {
    console.error('❌ Error en endpoint de eliminación de cuenta:', error);

    let message = 'Unknown error';
    if (typeof error === 'object' && error !== null && 'message' in error) {
      message = String((error as { message?: unknown }).message);
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: message,
        timestamp: new Date().toISOString()
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