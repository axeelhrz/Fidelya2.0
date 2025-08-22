'use client';

import React, { useState } from 'react';
import { checkStorageConnection, uploadImage, validateImageFile } from '@/utils/storage/uploadImage';

interface ConnectionStatus {
  connected: boolean;
  canUpload: boolean;
  corsConfigured: boolean;
  error?: string;
  details?: string;
}

export const StorageConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const status = await checkStorageConnection();
      setConnectionStatus(status);
    } catch (error) {
      setConnectionStatus({
        connected: false,
        canUpload: false,
        corsConfigured: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: 'Error crítico al verificar la conexión'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testImageUpload = async (file: File) => {
    setIsTestingUpload(true);
    setUploadProgress(0);
    setUploadResult(null);
    setUploadError(null);

    try {
      // Validate file first
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Test upload
      const testPath = `test-uploads/diagnostic_${Date.now()}`;
      const downloadURL = await uploadImage(file, testPath, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      setUploadResult(downloadURL);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsTestingUpload(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      testImageUpload(file);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🔧 Diagnóstico de Firebase Storage
      </h2>

      {/* Connection Test Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Prueba de Conexión
          </h3>
          <button
            onClick={testConnection}
            disabled={isTestingConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingConnection ? '🔄 Probando...' : '🧪 Probar Conexión'}
          </button>
        </div>

        {connectionStatus && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Conexión a Firebase:</span>
                <span className={getStatusColor(connectionStatus.connected)}>
                  {getStatusIcon(connectionStatus.connected)} {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Permisos de subida:</span>
                <span className={getStatusColor(connectionStatus.canUpload)}>
                  {getStatusIcon(connectionStatus.canUpload)} {connectionStatus.canUpload ? 'Permitido' : 'Denegado'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>CORS configurado:</span>
                <span className={getStatusColor(connectionStatus.corsConfigured)}>
                  {getStatusIcon(connectionStatus.corsConfigured)} {connectionStatus.corsConfigured ? 'Configurado' : 'No configurado'}
                </span>
              </div>
            </div>

            {connectionStatus.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">Error:</p>
                <p className="text-red-600 text-sm">{connectionStatus.error}</p>
              </div>
            )}

            {connectionStatus.details && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">{connectionStatus.details}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Test Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Prueba de Subida de Imagen
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar imagen para probar:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isTestingUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {isTestingUpload && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso de subida:</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium mb-2">✅ Subida exitosa!</p>
              <p className="text-green-600 text-sm break-all">URL: {uploadResult}</p>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium mb-2">❌ Error en la subida:</p>
              <p className="text-red-600 text-sm">{uploadError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-medium mb-2">📋 Instrucciones:</h4>
        <div className="text-yellow-700 text-sm space-y-1">
          <p>1. Primero ejecuta la &quot;Prueba de Conexión&quot; para verificar el estado</p>
          <p>2. Si CORS no está configurado, ejecuta: <code className="bg-yellow-100 px-1 rounded">npm run setup-cors</code></p>
          <p>3. Luego prueba subir una imagen para verificar que todo funciona</p>
          <p>4. Si persisten los errores, revisa la consola del navegador para más detalles</p>
        </div>
      </div>
    </div>
  );
};