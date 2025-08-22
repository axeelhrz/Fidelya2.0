import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadImageOptions {
  maxSize?: number;
  allowedTypes?: string[];
  quality?: number;
  retries?: number;
  onProgress?: (progress: number) => void;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export const uploadImage = async (
  file: File,
  path: string,
  options: UploadImageOptions = {}
): Promise<string> => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    quality = 0.8,
    retries = 3,
    onProgress
  } = options;

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
  }

  // Compress image if needed
  const processedFile = await compressImage(file, quality);

  console.log('📤 Subiendo imagen:', {
    originalName: file.name,
    size: processedFile.size,
    type: processedFile.type,
    path: path
  });

  // Enhanced upload strategy with server-side API as primary method
  const uploadStrategies = [
    { name: 'Server-side API (Primary)', method: uploadViaAPI },
    { name: 'CORS Workaround', method: uploadWithCorsWorkaround },
    { name: 'Simple Upload', method: uploadWithSimple },
    { name: 'Resumable Upload', method: uploadWithResumable }
  ];

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const strategy of uploadStrategies) {
      try {
        console.log(`📤 Intento ${attempt}/${retries} - Estrategia: ${strategy.name}`);
        
        const result = await strategy.method(path, processedFile, onProgress);
        console.log(`✅ Upload exitoso con ${strategy.name}:`, result);
        return result;
        
      } catch (error) {
        console.error(`❌ Error con ${strategy.name} (intento ${attempt}):`, error);
        lastError = error as Error;
        
        // Check if it's a CORS error
        const isCorsError = error instanceof Error && (
          error.message.includes('CORS') ||
          error.message.includes('cors') ||
          error.message.includes('preflight') ||
          error.message.includes('Access-Control-Allow-Origin') ||
          error.message.includes('ERR_FAILED')
        );
        
        if (isCorsError) {
          console.warn(`🚫 Error CORS detectado con ${strategy.name}, probando siguiente estrategia...`);
          continue; // Try next strategy immediately
        }
        
        // For non-CORS errors, wait before retry
        if (attempt < retries && strategy.name === 'Server-side API (Primary)') {
          const delay = Math.min(Math.pow(2, attempt) * 500, 2000);
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          break; // Break strategy loop to retry with same strategy
        }
      }
    }
  }

  // If all strategies failed, provide helpful error message
  if (lastError) {
    const errorMessage = handleStorageError(lastError);
    throw new Error(errorMessage);
  }

  throw new Error('No se pudo subir la imagen después de todos los intentos');
};

// Server-side API upload (primary method - no CORS issues)
const uploadViaAPI = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Usando API del servidor (método principal - sin CORS)...');
  
  onProgress?.(10);
  
  try {
    // Create FormData for the API request
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    onProgress?.(20);
    
    console.log('📤 API: Enviando archivo al servidor...');
    
    // Make request to our API route
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });
    
    onProgress?.(60);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }
    
    const result = await response.json();
    
    onProgress?.(90);
    
    if (!result.success || !result.url) {
      throw new Error('Respuesta inválida del servidor');
    }
    
    onProgress?.(100);
    
    console.log('✅ Upload vía API exitoso:', result.url);
    return result.url;
    
  } catch (error) {
    console.error('❌ Error en upload vía API:', error);
    throw error;
  }
};

// Enhanced CORS workaround strategy (fallback)
const uploadWithCorsWorkaround = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Usando workaround para CORS (fallback)...');
  
  onProgress?.(5);
  
  try {
    // Method 1: Convert to ArrayBuffer and create new blob
    console.log('🔄 Convirtiendo archivo para evitar CORS...');
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(15);
    
    // Create a new blob with minimal headers to avoid CORS preflight
    const corsBlob = new Blob([arrayBuffer], { 
      type: 'application/octet-stream' // Generic type to avoid CORS issues
    });
    
    onProgress?.(25);
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const finalPath = `${path}_${timestamp}_${randomId}.${extension}`;
    
    const storageRef = ref(storage, finalPath);
    
    // Use minimal metadata to avoid CORS preflight triggers
    const metadata = {
      contentType: file.type, // Set correct type in metadata
      customMetadata: {
        originalName: file.name,
        originalType: file.type,
        uploadedAt: new Date().toISOString(),
        method: 'cors-workaround',
        size: file.size.toString()
      }
    };
    
    onProgress?.(40);
    
    console.log('📤 Subiendo con blob optimizado para CORS...');
    const snapshot = await uploadBytes(storageRef, corsBlob, metadata);
    
    onProgress?.(80);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    onProgress?.(100);
    
    console.log('✅ Upload con workaround CORS exitoso:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Error en workaround CORS:', error);
    
    // Method 2: Try with base64 conversion as fallback
    try {
      console.log('📤 Intentando método base64 como respaldo...');
      onProgress?.(20);
      
      const base64Data = await fileToBase64(file);
      onProgress?.(40);
      
      // Convert base64 back to blob but with different approach
      const base64Response = await fetch(base64Data);
      const base64Blob = await base64Response.blob();
      onProgress?.(60);
      
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const finalPath = `base64_${path}_${timestamp}_${randomId}.${extension}`;
      
      const storageRef = ref(storage, finalPath);
      const snapshot = await uploadBytes(storageRef, base64Blob, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          method: 'base64-workaround',
          size: file.size.toString()
        }
      });
      
      onProgress?.(90);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      onProgress?.(100);
      
      console.log('✅ Upload base64 exitoso:', downloadURL);
      return downloadURL;
      
    } catch (base64Error) {
      console.error('❌ Error en método base64:', base64Error);
      throw error; // Throw original error
    }
  }
};

// Simple upload strategy (fallback)
const uploadWithSimple = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Usando estrategia de upload simple...');
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || 'jpg';
  const finalPath = `${path}_${timestamp}_${randomId}.${extension}`;
  
  const storageRef = ref(storage, finalPath);
  
  // Simulate progress for better UX
  onProgress?.(10);
  
  const metadata = {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      method: 'simple',
      size: file.size.toString()
    }
  };
  
  onProgress?.(30);
  
  try {
    const snapshot = await uploadBytes(storageRef, file, metadata);
    onProgress?.(80);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    onProgress?.(100);
    
    console.log('✅ Upload simple exitoso:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error en upload simple:', error);
    throw error;
  }
};

// Resumable upload strategy with real progress tracking
const uploadWithResumable = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Usando estrategia de upload resumable...');
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || 'jpg';
  const finalPath = `${path}_${timestamp}_${randomId}.${extension}`;
  
  const storageRef = ref(storage, finalPath);
  
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      method: 'resumable',
      size: file.size.toString()
    }
  });

  return new Promise<string>((resolve, reject) => {
    uploadTask.on('state_changed',
      // Progress callback
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(progress);
        console.log(`📊 Progreso resumable: ${progress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
      },
      // Error callback
      (error) => {
        console.error('❌ Error en upload resumable:', error);
        reject(error);
      },
      // Success callback
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('✅ Upload resumable exitoso:', url);
          onProgress?.(100);
          resolve(url);
        } catch (urlError) {
          console.error('❌ Error obteniendo URL:', urlError);
          reject(urlError);
        }
      }
    );
  });
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const deleteImage = async (url: string): Promise<void> => {
  if (!url) return;
  
  try {
    // Extract path from URL if it's a full Firebase Storage URL
    let imagePath = url;
    if (url.includes('firebasestorage.googleapis.com')) {
      const urlParts = url.split('/o/')[1];
      if (urlParts) {
        imagePath = decodeURIComponent(urlParts.split('?')[0]);
      }
    }
    
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    console.log('✅ Imagen eliminada exitosamente');
  } catch (error) {
    console.warn('⚠️ Error eliminando imagen (puede que no exista):', error);
    // Don't throw error for delete operations as the image might not exist
  }
};

const compressImage = async (file: File, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    // Skip compression for small files
    if (file.size < 500 * 1024) { // Less than 500KB
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate optimal dimensions
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;

        // Maintain aspect ratio while resizing
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Enable image smoothing for better quality
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              // Only use compressed version if it's actually smaller
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              console.log(`📦 Imagen comprimida: ${file.size} → ${blob.size} bytes`);
              resolve(compressedFile);
            } else {
              console.log('📦 Usando imagen original (compresión no efectiva)');
              resolve(file);
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        console.warn('⚠️ Error comprimiendo imagen, usando archivo original:', error);
        resolve(file);
      }
    };

    img.onerror = () => {
      console.warn('⚠️ Error cargando imagen para compresión, usando archivo original');
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
};

export const generateImagePath = (userId: string, type: 'profile' | 'logo' | 'portada'): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `users/${userId}/${type}/${timestamp}_${randomId}`;
};

// Utility to validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no válido. Solo se permiten: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Archivo demasiado grande. Máximo: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
    };
  }

  return { valid: true };
};

// Enhanced connection check with API test
export const checkStorageConnection = async (): Promise<{
  connected: boolean;
  canUpload: boolean;
  corsConfigured: boolean;
  apiWorking: boolean;
  error?: string;
  details?: string;
}> => {
  try {
    console.log('🔍 Verificando conexión a Firebase Storage...');
    
    // Test 1: Check if API is working
    try {
      console.log('🧪 Test 1: Verificando API del servidor...');
      
      // Create a minimal test file
      const testContent = new Blob(['test-connection'], { type: 'text/plain' });
      const testFile = new File([testContent], 'connection-test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('path', `connection-tests/api-test-${Date.now()}`);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.url) {
          console.log('✅ API del servidor funcionando correctamente');
          return {
            connected: true,
            canUpload: true,
            corsConfigured: true, // API bypasses CORS
            apiWorking: true,
            details: 'Conexión exitosa usando API del servidor. No hay problemas de CORS.'
          };
        }
      }
      
      throw new Error(`API response not ok: ${response.status}`);
      
    } catch (apiError) {
      console.error('❌ Error en API del servidor:', apiError);
      
      // Test 2: Try direct Firebase Storage (will likely fail with CORS)
      try {
        console.log('🧪 Test 2: Probando conexión directa a Firebase Storage...');
        
        const testContent = new Blob(['test-connection'], { type: 'text/plain' });
        const testFile = new File([testContent], 'connection-test.txt', { type: 'text/plain' });
        const testPath = `connection-tests/${Date.now()}_direct_test.txt`;
        const testRef = ref(storage, testPath);
        
        const arrayBuffer = await testFile.arrayBuffer();
        const corsBlob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        
        await uploadBytes(testRef, corsBlob, {
          contentType: testFile.type,
          customMetadata: {
            originalName: testFile.name,
            method: 'direct-test'
          }
        });
        
        await getDownloadURL(testRef);
        await deleteObject(testRef);
        
        console.log('✅ Conexión directa exitosa (workaround CORS funciona)');
        return {
          connected: true,
          canUpload: true,
          corsConfigured: false,
          apiWorking: false,
          details: 'API del servidor no disponible, pero workaround CORS funciona.'
        };
        
      } catch (directError) {
        console.error('❌ Error en conexión directa:', directError);
        
        const errorMessage = directError instanceof Error ? directError.message : 'Error desconocido';
        const isCorsError = errorMessage.includes('CORS') || 
                           errorMessage.includes('cors') || 
                           errorMessage.includes('preflight') ||
                           errorMessage.includes('ERR_FAILED');
        
        return {
          connected: true,
          canUpload: false,
          corsConfigured: false,
          apiWorking: false,
          error: isCorsError ? 'Error de configuración CORS' : errorMessage,
          details: 'Tanto la API del servidor como la conexión directa fallaron. Ejecuta: npm run setup-cors'
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Error crítico en verificación de conexión:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return {
      connected: false,
      canUpload: false,
      corsConfigured: false,
      apiWorking: false,
      error: errorMessage,
      details: 'No se pudo establecer conexión con Firebase Storage'
    };
  }
};

// Enhanced error handling for Firebase Storage errors
export const handleStorageError = (error: unknown): string => {
  if (!error) return 'Error desconocido';
  
  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
  
  console.error('🔍 Analizando error de storage:', errorMessage);
  
  // API errors
  if (errorMessage.includes('API') || errorMessage.includes('servidor')) {
    return 'Error en la API del servidor. El sistema intentará métodos alternativos de subida.';
  }
  
  // CORS errors (less common now with API)
  if (errorMessage.includes('CORS') || 
      errorMessage.includes('cors') || 
      errorMessage.includes('preflight') ||
      errorMessage.includes('ERR_FAILED') ||
      errorMessage.includes('Access-Control-Allow-Origin')) {
    return 'Error de configuración CORS detectado. El sistema está usando la API del servidor para evitar este problema.';
  }
  
  // Network errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('ERR_NETWORK') ||
      errorMessage.includes('ERR_INTERNET_DISCONNECTED')) {
    return 'Error de conexión a internet. Verifica tu conexión e intenta de nuevo.';
  }
  
  // Permission errors
  if (errorMessage.includes('permission') || 
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Forbidden')) {
    return 'No tienes permisos para realizar esta acción. Contacta al administrador del sistema.';
  }
  
  // File size errors
  if (errorMessage.includes('size') || 
      errorMessage.includes('large') ||
      errorMessage.includes('413') ||
      errorMessage.includes('too big')) {
    return 'El archivo es demasiado grande. Reduce el tamaño de la imagen e intenta de nuevo.';
  }
  
  // Quota errors
  if (errorMessage.includes('quota') || 
      errorMessage.includes('limit') ||
      errorMessage.includes('exceeded') ||
      errorMessage.includes('429')) {
    return 'Se ha alcanzado el límite de almacenamiento o solicitudes. Contacta al administrador.';
  }
  
  // Authentication errors
  if (errorMessage.includes('auth') || 
      errorMessage.includes('token') ||
      errorMessage.includes('401') ||
      errorMessage.includes('Unauthorized')) {
    return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
  }
  
  // Generic Firebase errors
  if (errorMessage.includes('firebase') || 
      errorMessage.includes('storage') ||
      errorMessage.includes('firebasestorage')) {
    return 'Error del servicio de almacenamiento. Intenta de nuevo en unos momentos.';
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('TIMEOUT')) {
    return 'La operación tardó demasiado tiempo. Verifica tu conexión e intenta con una imagen más pequeña.';
  }
  
  return `Error al procesar la imagen: ${errorMessage}. El sistema intentará métodos alternativos de subida.`;
};