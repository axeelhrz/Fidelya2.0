import { NextRequest, NextResponse } from 'next/server';

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
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
    
    // Get Firebase configuration
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    
    if (!projectId || !storageBucket) {
      console.error('❌ API: Configuración de Firebase incompleta');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 503 }
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
    const extension = file.name.split('.').pop() || 'jpg';
    const finalPath = `${path}_${timestamp}_${randomId}.${extension}`;
    
    console.log('📤 API: Ruta final del archivo:', finalPath);
    
    // Upload using Firebase Storage REST API
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?name=${encodeURIComponent(finalPath)}`;
    
    console.log('📤 API: Subiendo a Firebase Storage via REST API...');
    
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
      console.error('❌ API: Error en upload a Firebase:', uploadResponse.status, errorText);
      
      // Check if it's a CORS issue on the server side (shouldn't happen but just in case)
      if (uploadResponse.status === 0 || errorText.includes('CORS')) {
        return NextResponse.json(
          { error: 'Error de configuración del servidor de almacenamiento' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al subir archivo al almacenamiento' },
        { status: uploadResponse.status }
      );
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ API: Upload exitoso:', uploadResult);
    
    // Get download URL
    console.log('📤 API: Obteniendo URL de descarga...');
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(finalPath)}?alt=media`;
    
    const response = {
      success: true,
      url: downloadUrl,
      path: finalPath,
      metadata: {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log('✅ API: Upload completado exitosamente');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API: Error en upload:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('❌ API: Error message:', error.message);
      console.error('❌ API: Error stack:', error.stack);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    // Check for specific errors
    let statusCode = 500;
    let userMessage = 'Error interno del servidor al subir imagen';
    
    if (errorMessage.includes('fetch')) {
      userMessage = 'Error de conexión con el servicio de almacenamiento';
      statusCode = 503;
    } else if (errorMessage.includes('network')) {
      userMessage = 'Error de red';
      statusCode = 503;
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
    },
  });
}