import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Info,
  ArrowRight,
  ArrowLeft,
  Settings,
  Zap,
  Users,
  TrendingUp,
  AlertTriangle,
  Check,
  Play,
} from 'lucide-react';
import { ImportResult } from '@/services/socio.service';
import { toast } from 'react-hot-toast';

interface EnhancedCsvImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (csvData: Record<string, string>[], options: ImportOptions) => Promise<ImportResult>;
  loading?: boolean;
}

interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateData: boolean;
  sendWelcomeEmail: boolean;
  generateCredentials: boolean;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  required: boolean;
  validated: boolean;
  suggestions: string[];
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
  fixable: boolean;
}

interface ImportProgress {
  current: number;
  total: number;
  stage: string;
  percentage: number;
  speed: number;
  eta: number;
}

const IMPORT_STEPS = [
  { id: 'upload', title: 'Seleccionar Archivo', description: 'Sube tu archivo CSV' },
  { id: 'mapping', title: 'Mapear Columnas', description: 'Configura las columnas' },
  { id: 'validation', title: 'Validar Datos', description: 'Revisa y corrige errores' },
  { id: 'config', title: 'Configuración', description: 'Opciones de importación' },
  { id: 'import', title: 'Importando', description: 'Procesando datos' },
  { id: 'results', title: 'Resultados', description: 'Resumen de importación' }
];

const REQUIRED_FIELDS = [
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'dni', label: 'DNI', required: true },
  { key: 'telefono', label: 'Teléfono', required: false },
  { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', required: false },
  { key: 'direccion', label: 'Dirección', required: false },
  { key: 'numeroSocio', label: 'Número de Socio', required: false },
  { key: 'montoCuota', label: 'Monto de Cuota', required: false }
];

export const EnhancedCsvImport: React.FC<EnhancedCsvImportProps> = ({
  open,
  onClose,
  onImport,
  loading = false
}) => {
  // Estados principales
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false,
    validateData: true,
    sendWelcomeEmail: true,
    generateCredentials: true
  });
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Funciones de utilidad
  const resetState = useCallback(() => {
    setCurrentStep(0);
    setFile(null);
    setCsvData([]);
    setColumnMappings([]);
    setValidationErrors([]);
    setImportProgress(null);
    setImportResult(null);
    setIsProcessing(false);
    setPreviewData([]);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < IMPORT_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Generación automática de mapeo de columnas
  const generateColumnMappings = useCallback((headers: string[]): ColumnMapping[] => {
    return REQUIRED_FIELDS.map(field => {
      const suggestions = headers.filter(header => 
        header.toLowerCase().includes(field.key.toLowerCase()) ||
        field.label.toLowerCase().includes(header.toLowerCase())
      );
      
      const bestMatch = suggestions[0] || '';
      
      return {
        csvColumn: bestMatch,
        targetField: field.key,
        required: field.required,
        validated: !field.required || !!bestMatch,
        suggestions: headers
      };
    });
  }, []);

  // Manejo de archivos
  const parseCSV = useCallback((file: File) => {
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

        // Parse CSV with better handling
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = { _rowNumber: String(index + 2) };
          
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          
          return row;
        });

        setCsvData(data);
        setPreviewData(data.slice(0, 10));
        
        // Auto-generate column mappings
        const mappings = generateColumnMappings(headers);
        setColumnMappings(mappings);
        
        toast.success(`Archivo procesado: ${data.length} registros encontrados`);
        nextStep();
      } catch (error) {
        toast.error('Error al procesar el archivo CSV');
        console.error('CSV parsing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  }, [nextStep, generateColumnMappings]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV válido');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('El archivo es demasiado grande. Máximo 10MB permitido');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  }, [parseCSV]);

  // Validación de datos
  const validateData = useCallback(() => {
    setIsProcessing(true);
    const errors: ValidationError[] = [];

    csvData.forEach((row, index) => {
      columnMappings.forEach(mapping => {
        if (mapping.required && mapping.csvColumn) {
          const value = row[mapping.csvColumn];
          
          if (!value || value.trim() === '') {
            errors.push({
              row: index + 1,
              field: mapping.targetField,
              value: value || '',
              error: `Campo requerido vacío`,
              severity: 'error',
              fixable: false
            });
          }
          
          // Validaciones específicas
          if (mapping.targetField === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push({
                row: index + 1,
                field: mapping.targetField,
                value,
                error: 'Formato de email inválido',
                severity: 'error',
                fixable: true
              });
            }
          }
          
          if (mapping.targetField === 'dni' && value) {
            if (!/^\d{7,8}$/.test(value)) {
              errors.push({
                row: index + 1,
                field: mapping.targetField,
                value,
                error: 'DNI debe tener 7-8 dígitos',
                severity: 'warning',
                fixable: true
              });
            }
          }
        }
      });
    });

    setValidationErrors(errors);
    setIsProcessing(false);
    
    if (errors.filter(e => e.severity === 'error').length === 0) {
      toast.success('Validación completada sin errores críticos');
      nextStep();
    } else {
      toast.error(`Se encontraron ${errors.filter(e => e.severity === 'error').length} errores críticos`);
    }
  }, [csvData, columnMappings, nextStep]);

  // Proceso de importación
  const handleImport = useCallback(async () => {
    if (!csvData.length) return;

    setIsProcessing(true);
    setImportProgress({
      current: 0,
      total: csvData.length,
      stage: 'Iniciando importación...',
      percentage: 0,
      speed: 0,
      eta: 0
    });

    try {
      // Simular progreso en tiempo real
      const startTime = Date.now();
      
      for (let i = 0; i <= csvData.length; i += Math.ceil(csvData.length / 20)) {
        const current = Math.min(i, csvData.length);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = current / elapsed;
        const remaining = csvData.length - current;
        const eta = remaining / speed;
        
        setImportProgress({
          current,
          total: csvData.length,
          stage: current === csvData.length ? 'Finalizando...' : `Procesando registro ${current}`,
          percentage: (current / csvData.length) * 100,
          speed,
          eta
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const result = await onImport(csvData, importOptions);
      setImportResult(result);
      nextStep();
      
      if (result.success) {
        toast.success('Importación completada exitosamente');
      } else {
        toast.error('Importación completada con errores');
      }
    } catch (error) {
      toast.error('Error durante la importación');
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  }, [csvData, importOptions, onImport, nextStep]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelect(csvFile);
    } else {
      toast.error('Por favor suelta un archivo CSV');
    }
  }, [handleFileSelect]);

  const downloadTemplate = useCallback(() => {
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
    
    toast.success('Plantilla descargada');
  }, []);

  const handleClose = useCallback(() => {
    if (!isProcessing && !loading) {
      resetState();
      onClose();
    }
  }, [isProcessing, loading, resetState, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (importProgress) {
        setImportProgress(null);
      }
    };
  }, [importProgress]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
        >
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Importación Inteligente de Socios
                  </h3>
                  <p className="text-blue-100">
                    {IMPORT_STEPS[currentStep].description}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing || loading}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-xl disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {IMPORT_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    index < currentStep 
                      ? 'bg-white text-blue-600 border-white' 
                      : index === currentStep
                      ? 'bg-blue-500 text-white border-blue-300'
                      : 'bg-transparent text-blue-200 border-blue-300'
                  }`}>
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {index < IMPORT_STEPS.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 transition-all ${
                      index < currentStep ? 'bg-white' : 'bg-blue-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-3">
              <div className="text-sm text-blue-100 font-medium">
                Paso {currentStep + 1} de {IMPORT_STEPS.length}: {IMPORT_STEPS[currentStep].title}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-8 min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Upload */}
              {currentStep === 0 && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Instructions */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3">
                          Guía de Importación
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-blue-800 mb-2">Requisitos del archivo:</h5>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Formato CSV únicamente</li>
                              <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Primera fila con encabezados</li>
                              <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Máximo 10MB de tamaño</li>
                              <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Codificación UTF-8</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 mb-2">Campos requeridos:</h5>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-orange-500" />Nombre completo</li>
                              <li className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-orange-500" />Email válido</li>
                              <li className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-orange-500" />DNI (7-8 dígitos)</li>
                              <li className="flex items-center"><Info className="w-4 h-4 mr-2 text-blue-500" />Teléfono (opcional)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Download */}
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Plantilla de Ejemplo
                          </h4>
                          <p className="text-gray-600">
                            Descarga una plantilla con el formato correcto y datos de ejemplo
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={downloadTemplate}
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar Plantilla
                      </button>
                    </div>
                  </div>

                  {/* File Upload Zone */}
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                      isDragOver 
                        ? 'border-blue-400 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
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
                    
                    <div className="space-y-6">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all ${
                        isDragOver ? 'bg-blue-100 scale-110' : 'bg-gray-100'
                      }`}>
                        <Upload className={`w-10 h-10 transition-colors ${
                          isDragOver ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {isDragOver ? '¡Suelta tu archivo aquí!' : 'Selecciona tu archivo CSV'}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          Arrastra y suelta tu archivo CSV aquí, o haz clic para seleccionarlo desde tu computadora
                        </p>
                      </div>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none font-semibold text-lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            Procesando archivo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mr-3" />
                            Seleccionar Archivo CSV
                          </>
                        )}
                      </button>
                    </div>

                    {isDragOver && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-3xl flex items-center justify-center">
                        <div className="text-blue-600 font-semibold text-xl">
                          ¡Suelta el archivo para continuar!
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Column Mapping */}
              {currentStep === 1 && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Mapeo Inteligente de Columnas
                    </h3>
                    <p className="text-gray-600">
                      Hemos detectado automáticamente las columnas. Verifica y ajusta si es necesario.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {columnMappings.map((mapping, index) => (
                      <div key={mapping.targetField} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              mapping.validated ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <div className="font-medium text-gray-900">
                                {REQUIRED_FIELDS.find(f => f.key === mapping.targetField)?.label}
                                {mapping.required && <span className="text-red-500 ml-1">*</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                Campo {mapping.required ? 'requerido' : 'opcional'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <select
                              value={mapping.csvColumn}
                              onChange={(e) => {
                                const newMappings = [...columnMappings];
                                newMappings[index] = {
                                  ...mapping,
                                  csvColumn: e.target.value,
                                  validated: !mapping.required || !!e.target.value
                                };
                                setColumnMappings(newMappings);
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Seleccionar columna...</option>
                              {mapping.suggestions.map(suggestion => (
                                <option key={suggestion} value={suggestion}>
                                  {suggestion}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {file && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <div className="font-medium text-blue-900">{file.name}</div>
                            <div className="text-sm text-blue-700">
                              {csvData.length} registros • {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          {columnMappings.filter(m => m.validated).length} de {columnMappings.length} columnas mapeadas
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Data Validation */}
              {currentStep === 2 && (
                <motion.div
                  key="validation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Validación de Datos
                    </h3>
                    <p className="text-gray-600">
                      Revisamos la calidad de tus datos y detectamos posibles errores
                    </p>
                  </div>

                  {/* Validation Summary */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-green-900">
                            {csvData.length - validationErrors.filter(e => e.severity === 'error').length}
                          </div>
                          <div className="text-sm text-green-700">Registros válidos</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-yellow-900">
                            {validationErrors.filter(e => e.severity === 'warning').length}
                          </div>
                          <div className="text-sm text-yellow-700">Advertencias</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-red-900">
                            {validationErrors.filter(e => e.severity === 'error').length}
                          </div>
                          <div className="text-sm text-red-700">Errores críticos</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Errors List */}
                  {validationErrors.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Errores Detectados ({validationErrors.length})
                        </h4>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start">
                                {error.severity === 'error' ? (
                                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      Fila {error.row}
                                    </span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                      {error.field}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{error.error}</p>
                                  {error.value && (
                                    <p className="text-xs text-gray-500 mt-1"></p>
                                  )}
                                </div>
                              </div>
                              
                              {error.fixable && (
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                  Corregir
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Preview */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Vista Previa de Datos
                      </h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {columnMappings.filter(m => m.csvColumn).map((mapping) => (
                              <th
                                key={mapping.targetField}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {REQUIRED_FIELDS.find(f => f.key === mapping.targetField)?.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {columnMappings.filter(m => m.csvColumn).map((mapping) => (
                                <td key={mapping.targetField} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {row[mapping.csvColumn] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {!isProcessing && validationErrors.length === 0 && (
                    <div className="text-center">
                      <button
                        onClick={validateData}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        Validar Datos
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Import Configuration */}
              {currentStep === 3 && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Configuración de Importación
                    </h3>
                    <p className="text-gray-600">
                      Personaliza cómo quieres que se procesen los datos
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Data Processing Options */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Procesamiento de Datos
                      </h4>
                      
                      <div className="space-y-4">
                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={importOptions.skipDuplicates}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              skipDuplicates: e.target.checked
                            }))}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Omitir duplicados
                            </div>
                            <div className="text-xs text-gray-500">
                              No importar socios que ya existen (por email o DNI)
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={importOptions.updateExisting}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              updateExisting: e.target.checked
                            }))}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Actualizar existentes
                            </div>
                            <div className="text-xs text-gray-500">
                              Actualizar datos de socios que ya existen
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={importOptions.validateData}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              validateData: e.target.checked
                            }))}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Validación estricta
                            </div>
                            <div className="text-xs text-gray-500">
                              Aplicar validaciones adicionales durante la importación
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* User Experience Options */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Experiencia del Usuario
                      </h4>
                      
                      <div className="space-y-4">
                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={importOptions.sendWelcomeEmail}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              sendWelcomeEmail: e.target.checked
                            }))}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Enviar email de bienvenida
                            </div>
                            <div className="text-xs text-gray-500">
                              Enviar un email de bienvenida a los nuevos socios
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={importOptions.generateCredentials}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              generateCredentials: e.target.checked
                            }))}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Generar credenciales
                            </div>
                            <div className="text-xs text-gray-500">
                              Crear credenciales de acceso automáticamente
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Import Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Resumen de Importación
                    </h4>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{csvData.length}</div>
                        <div className="text-sm text-gray-600">Total registros</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {csvData.length - validationErrors.filter(e => e.severity === 'error').length}
                        </div>
                        <div className="text-sm text-gray-600">Válidos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {validationErrors.filter(e => e.severity === 'warning').length}
                        </div>
                        <div className="text-sm text-gray-600">Advertencias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {validationErrors.filter(e => e.severity === 'error').length}
                        </div>
                        <div className="text-sm text-gray-600">Errores</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Import Progress */}
              {currentStep === 4 && (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Importando Datos
                    </h3>
                    <p className="text-gray-600">
                      Por favor espera mientras procesamos tus datos...
                    </p>
                  </div>

                  {importProgress && (
                    <div className="space-y-6">
                      {/* Progress Bar */}
                      <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${importProgress.percentage}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      {/* Progress Stats */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(importProgress.percentage)}%
                          </div>
                          <div className="text-sm text-gray-600">Completado</div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {importProgress.current}
                          </div>
                          <div className="text-sm text-gray-600">Procesados</div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {importProgress.speed.toFixed(1)}/s
                          </div>
                          <div className="text-sm text-gray-600">Velocidad</div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {Math.round(importProgress.eta)}s
                          </div>
                          <div className="text-sm text-gray-600">Tiempo restante</div>
                        </div>
                      </div>

                      {/* Current Stage */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-3" />
                          <div>
                            <div className="font-semibold text-blue-900">
                              {importProgress.stage}
                            </div>
                            <div className="text-sm text-blue-700">
                              {importProgress.current} de {importProgress.total} registros
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Animation */}
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-32 h-32 border-4 border-blue-200 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Upload className="w-12 h-12 text-blue-600 animate-bounce" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 6: Results */}
              {currentStep === 5 && importResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      importResult.success ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {importResult.success ? (
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-10 h-10 text-yellow-600" />
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {importResult.success ? '¡Importación Completada!' : 'Importación Finalizada con Advertencias'}
                    </h3>
                    <p className="text-gray-600">
                      {importResult.success 
                        ? 'Todos los datos se han importado correctamente'
                        : 'La importación se completó pero algunos registros tuvieron problemas'
                      }
                    </p>
                  </div>

                  {/* Results Summary */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {importResult.imported}
                      </div>
                      <div className="text-green-800 font-medium">Socios Importados</div>
                      <div className="text-sm text-green-600 mt-1">
                        Registros procesados exitosamente
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {importResult.duplicates}
                      </div>
                      <div className="text-yellow-800 font-medium">Duplicados</div>
                      <div className="text-sm text-yellow-600 mt-1">
                        Registros omitidos por duplicación
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {importResult.errors.length}
                      </div>
                      <div className="text-red-800 font-medium">Errores</div>
                      <div className="text-sm text-red-600 mt-1">
                        Registros con problemas
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                        <h4 className="text-lg font-semibold text-red-900">
                          Errores Detallados ({importResult.errors.length})
                        </h4>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-start">
                              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  Fila {error.row}: {error.error}
                                </div>
                                {error.data && Object.keys(error.data).length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {Object.entries(error.data).map(([key, value]) => (
                                      <span key={key} className="mr-4">
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Actions */}
                  {importResult.success && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        ¿Qué sigue?
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Users className="w-5 h-5 text-green-600 mt-1 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">Ver Socios</div>
                            <div className="text-sm text-gray-600">
                              Revisa la lista de socios importados
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <TrendingUp className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900">Ver Estadísticas</div>
                            <div className="text-sm text-gray-600">
                              Analiza el crecimiento de tu asociación
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer with Navigation */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {currentStep > 0 && currentStep < 4 && (
                <button
                  onClick={prevStep}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStep === 0 && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              )}

              {currentStep === 1 && (
                <button
                  onClick={nextStep}
                  disabled={!columnMappings.every(m => !m.required || m.validated)}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  onClick={validateData}
                  disabled={isProcessing}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      Validar y Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}

              {currentStep === 3 && (
                <button
                  onClick={handleImport}
                  disabled={isProcessing || validationErrors.filter(e => e.severity === 'error').length > 0}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 border border-transparent rounded-xl text-sm font-medium text-white hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all transform hover:scale-105 disabled:transform-none"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Importación
                    </>
                  )}
                </button>
              )}

              {currentStep === 5 && (
                <>
                  <button
                    onClick={() => {
                      resetState();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Nueva Importación
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-blue-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Finalizar
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};