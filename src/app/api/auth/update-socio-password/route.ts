import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { socioId, newPassword, asociacionId } = await request.json();

    // Validar que se proporcionen los parámetros requeridos
    if (!socioId || !newPassword || !asociacionId) {
      return NextResponse.json(
        { success: false, error: 'Parámetros requeridos faltantes' },
        { status: 400 }
      );
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log(`🔐 Actualizando contraseña para el socio: ${socioId}`);

    // Actualizar la contraseña en Firebase Authentication
    await adminAuth.updateUser(socioId, {
      password: newPassword,
    });

    console.log(`✅ Contraseña actualizada exitosamente para el socio: ${socioId}`);

    return NextResponse.json(
      { success: true, message: 'Contraseña actualizada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error);

    // Manejar errores específicos de Firebase
    if (error instanceof Error) {
      if (error.message.includes('user-not-found')) {
        return NextResponse.json(
          { success: false, error: 'El socio no fue encontrado en Firebase Auth' },
          { status: 404 }
        );
      }
      if (error.message.includes('invalid-password')) {
        return NextResponse.json(
          { success: false, error: 'La contraseña no cumple con los requisitos de seguridad' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar la contraseña' },
      { status: 500 }
    );
  }
}