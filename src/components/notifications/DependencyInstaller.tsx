'use client';

import { toast } from 'react-hot-toast';

export const DependencyInstaller = () => {

  const requiredDependencies = [
    {
      name: 'jimp',
      version: '^0.16.13',
      description: 'Procesamiento de imágenes para WhatsApp Web',
      required: true
    },
    {
      name: 'sharp',
      version: '^0.33.5',
      description: 'Optimización de imágenes',
      required: true
    },
    {
      name: 'link-preview-js',
      version: '^3.0.5',
      description: 'Vista previa de enlaces en WhatsApp',
      required: false
    }
  ];

  const installCommands = [
    'npm install jimp@^0.16.13 sharp@^0.33.5 link-preview-js@^3.0.5',
    'yarn add jimp@^0.16.13 sharp@^0.33.5 link-preview-js@^3.0.5',
    'pnpm add jimp@^0.16.13 sharp@^0.33.5 link-preview-js@^3.0.5'
  ];

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast.success('Comando copiado al portapapeles');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">📦</span>
        <h3 className="text-lg font-semibold text-gray-800">
          Instalación de Dependencias para WhatsApp Web
        </h3>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <span className="text-yellow-600 text-xl mr-3">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">Dependencias Faltantes</h4>
            <p className="text-yellow-700 text-sm">
              Para usar WhatsApp Web (Baileys), necesitas instalar algunas dependencias opcionales. 
              Sin estas dependencias, el sistema usará automáticamente otros proveedores gratuitos.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Dependencias */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">📋 Dependencias Requeridas:</h4>
        <div className="space-y-3">
          {requiredDependencies.map((dep, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center">
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
                    {dep.name}@{dep.version}
                  </code>
                  {dep.required && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Requerido
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{dep.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comandos de Instalación */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">🚀 Comandos de Instalación:</h4>
        <div className="space-y-3">
          {installCommands.map((command, index) => {
            const manager = ['npm', 'yarn', 'pnpm'][index];
            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center flex-1">
                    <span className="text-green-400 font-mono text-sm mr-2">$</span>
                    <code className="text-green-300 font-mono text-sm flex-1">{command}</code>
                  </div>
                  <button
                    onClick={() => handleCopyCommand(command)}
                    className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Usando {manager}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alternativas */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start">
          <span className="text-green-600 text-xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-green-800 mb-2">Alternativas Disponibles</h4>
            <p className="text-green-700 text-sm mb-3">
              Si no quieres instalar estas dependencias, el sistema funcionará perfectamente con:
            </p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• <strong>Green API:</strong> 3000 mensajes gratis/mes (sin dependencias)</li>
              <li>• <strong>CallMeBot:</strong> Completamente gratis (sin dependencias)</li>
              <li>• <strong>Meta WhatsApp Business API:</strong> Para empresas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Instrucciones Post-Instalación */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <span className="text-blue-600 text-xl mr-3">📝</span>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Después de la Instalación</h4>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>Reinicia el servidor de desarrollo</li>
              <li>Ve a la sección de notificaciones</li>
              <li>Haz clic en &quot;Configurar WhatsApp Web&quot;</li>
              <li>Escanea el QR con tu teléfono</li>
              <li>¡Disfruta de mensajes ilimitados gratis!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
