import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Info,
} from 'lucide-react';
import { ImportResult } from '@/services/socio.service';
import { toast } from 'react-hot-toast';

interface CsvImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (csvData: Record<string, string>[]) => Promise<ImportResult>;
  loading?: boolean;
}

export const CsvImport: React.FC<CsvImportProps> = ({
  open,
  onClose,
  onImport,
  loading = false
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
          setIsProcessing(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> & { _rowNumber: string } = { _rowNumber: String(index + 2) }; // +2 because we start from line 2 (after headers)
          
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          
          return row;
        });

        setCsvData(data);
        setPreview(data.slice(0, 5)); // Show first 5 rows for preview
        setStep('preview');
      } catch (error) {
        toast.error('Error al procesar el archivo CSV');
        console.error('CSV parsing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData.length) return;

    setIsProcessing(true);
    try {
      const result = await onImport(csvData);
      setImportResult(result);
      setStep('result');
    } catch (error) {
      toast.error('Error durante la importación');
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing && !loading) {
      setFile(null);
      setCsvData([]);
      setPreview([]);
      setImportResult(null);
      setStep('upload');
      onClose();
    }
  };

  const downloadTemplate = () => {
    const template = [
      'nombre,email,dni,telefono,fechaNacimiento,direccion,numeroSocio,montoCuota',
      'Juan Pérez,juan@email.com,12345678,+54911234567,1990-01-15,"Av. Corrientes 1234, CABA",001,5000',
      'María García,maria@email.com,87654321,+54911234568,1985-05-20,"Av. Santa Fe 5678, CABA",002,5000'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_socios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
        >
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Importar Socios desde CSV
                  </h3>
                  <p className="text-sm text-gray-500">
                    Sube un archivo CSV para importar múltiples socios
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing || loading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            {step === 'upload' && (
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Instrucciones para la importación
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• El archivo debe estar en formato CSV</li>
                        <li>• La primera fila debe contener los encabezados</li>
                        <li>• Los campos requeridos son: nombre, email, dni</li>
                        <li>• Las fechas deben estar en formato YYYY-MM-DD</li>
                        <li>• Los montos deben ser números sin símbolos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Template Download */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Plantilla de ejemplo
                      </p>
                      <p className="text-xs text-gray-500">
                        Descarga una plantilla con el formato correcto
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </button>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                  
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      Selecciona tu archivo CSV
                    </p>
                    <p className="text-sm text-gray-500">
                      O arrastra y suelta el archivo aquí
                    </p>
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Seleccionar Archivo
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Archivo procesado correctamente
                      </p>
                      <p className="text-xs text-green-700">
                        {file?.name} - {csvData.length} registros encontrados
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('upload')}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    Cambiar archivo
                  </button>
                </div>

                {/* Preview Table */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Vista previa (primeras 5 filas)
                  </h4>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {preview.length > 0 && Object.keys(preview[0]).filter(key => key !== '_rowNumber').map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.entries(row).filter(([key]) => key !== '_rowNumber').map(([key, value]) => (
                              <td key={key} className="px-4 py-3 text-sm text-gray-900">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {csvData.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... y {csvData.length - 5} filas más
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 'result' && importResult && (
              <div className="space-y-6">
                {/* Result Summary */}
                <div className={`p-4 rounded-lg border ${
                  importResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <h4 className={`text-sm font-medium ${
                        importResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {importResult.success ? 'Importación completada' : 'Importación con errores'}
                      </h4>
                      <div className={`text-xs mt-1 ${
                        importResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        <p>Importados: {importResult.imported}</p>
                        <p>Duplicados omitidos: {importResult.duplicates}</p>
                        <p>Errores: {importResult.errors.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Errors List */}
                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Errores encontrados ({importResult.errors.length})
                    </h4>
                    
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="divide-y divide-gray-200">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="p-3 hover:bg-gray-50">
                            <div className="flex items-start">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm text-red-800">
                                  Fila {error.row}: {error.error}
                                </p>
                                {error.data && Object.keys(error.data).length > 0 && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Datos: {JSON.stringify(error.data)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            {step === 'upload' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}

            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || loading || csvData.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing || loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar {csvData.length} Socios
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'result' && (
              <>
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setCsvData([]);
                    setPreview([]);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Nueva Importación
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                >
                  Finalizar
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};