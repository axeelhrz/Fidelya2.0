import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch  {
    console.warn('Firebase Admin already initialized or missing credentials, using client SDK fallback');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 API: Iniciando upload de imagen...');
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    
    if (!file) {
      console.error('❌ API: No se proporcionó archivo');
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }
    
    if (!path) {
      console.error('❌ API: No se proporcionó ruta de destino');
      return NextResponse.json(
        { error: 'No se proporcionó ruta de destino' },
        { status: 400 }
      );
    }
    
    console.log('📤 API: Archivo recibido:', {
      name: file.name,
      size: file.size,
      type: file.type,
      path: path
    });
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ API: Tipo de archivo no permitido:', file.type);
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      console.error('❌ API: Archivo demasiado grande:', file.size);
      return NextResponse.json(
        { error: `Archivo demasiado grande. Tamaño máximo: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    console.log('📤 API: Convirtiendo archivo a buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('📤 API: Buffer creado exitosamente, tamaño:', buffer.length);
    
    // Create unique file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const finalPath = `${path}_${timestamp}_${randomId}.${extension}`;
    
    console.log('📤 API: Ruta final del archivo:', finalPath);
    
    try {
      // Try Firebase Admin SDK first (if available)
      const storage = getStorage();
      const bucket = storage.bucket();
      const fileRef = bucket.file(finalPath);
      
      console.log('📤 API: Subiendo con Firebase Admin SDK...');
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            method: 'admin-sdk',
            size: file.size.toString()
          }
        }
      });
      
      // Make file publicly readable
      await fileRef.makePublic();
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${finalPath}`;
      
      console.log('✅ API: Upload con Admin SDK exitoso:', publicUrl);
      
      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: finalPath,
        method: 'admin-sdk',
        metadata: {
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      });
      
    } catch (adminError) {
      console.warn('⚠️ API: Admin SDK no disponible, usando método alternativo:', adminError);
      
      // Fallback to direct Firebase Storage REST API with proper authentication
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      
      if (!projectId || !storageBucket) {
        console.error('❌ API: Configuración de Firebase incompleta');
        return NextResponse.json(
          { error: 'Configuración del servidor incompleta' },
          { status: 503 }
        );
      }
      
      // Use the correct Firebase Storage upload URL format
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?name=${encodeURIComponent(finalPath)}&uploadType=media`;
      
      console.log('📤 API: Subiendo con REST API (fallback)...');
      console.log('📤 API: URL de upload:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'Content-Length': buffer.length.toString(),
        },
        body: buffer,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ API: Error en REST API upload:', uploadResponse.status, errorText);
        
        return NextResponse.json(
          { 
            error: 'Error al subir archivo al almacenamiento',
            details: `Status: ${uploadResponse.status}, Response: ${errorText}`,
            method: 'rest-api-fallback'
          },
          { status: uploadResponse.status }
        );
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('✅ API: Upload con REST API exitoso:', uploadResult);
      
      // Get download URL using the correct format
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(finalPath)}?alt=media`;
      
      return NextResponse.json({
        success: true,
        url: downloadUrl,
        path: finalPath,
        method: 'rest-api-fallback',
        metadata: {
          originalName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('❌ API: Error crítico en upload:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('❌ API: Error message:', error.message);
      console.error('❌ API: Error stack:', error.stack);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    // Check for specific errors
    let statusCode = 500;
    let userMessage = 'Error interno del servidor al subir imagen';
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      userMessage = 'Error de conexión con el servicio de almacenamiento';
      statusCode = 503;
    } else if (errorMessage.includes('permission') || errorMessage.includes('auth')) {
      userMessage = 'Error de permisos de almacenamiento';
      statusCode = 403;
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}