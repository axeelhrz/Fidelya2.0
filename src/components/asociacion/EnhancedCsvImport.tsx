import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  Loader2,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  BookOpen,
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

// Ejemplo de CSV mejorado con datos más realistas
const CSV_EXAMPLE_DATA = [
  {
    nombre: 'Juan Carlos Pérez',
    email: 'juan.perez@email.com',
    dni: '12345678',
    telefono: '+54 9 11 1234-5678',
    fechaNacimiento: '1985-03-15',
    direccion: 'Av. Corrientes 1234, CABA',
    numeroSocio: '001',
    montoCuota: '5000'
  },
  {
    nombre: 'María Elena García',
    email: 'maria.garcia@email.com',
    dni: '87654321',
    telefono: '+54 9 11 8765-4321',
    fechaNacimiento: '1990-07-22',
    direccion: 'Av. Santa Fe 5678, CABA',
    numeroSocio: '002',
    montoCuota: '5000'
  },
  {
    nombre: 'Roberto Luis Martínez',
    email: 'roberto.martinez@email.com',
    dni: '11223344',
    telefono: '+54 9 11 2233-4455',
    fechaNacimiento: '1978-12-03',
    direccion: 'Calle Rivadavia 9876, Buenos Aires',
    numeroSocio: '003',
    montoCuota: '7500'
  }
];

export const EnhancedCsvImport: React.FC<EnhancedCsvImportProps> = ({
  open,
  onClose,
  loading = false
}) => {
  // Estados principales
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [, setValidationErrors] = useState<ValidationError[]>([]);

  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [, setPreviewData] = useState<Record<string, string>[]>([]);
  const [showExample, setShowExample] = useState(false);

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
    setShowExample(false);
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
  // const handleImport = useCallback(async () => {
  //   if (!csvData.length) return;

  //   setIsProcessing(true);
  //   setImportProgress({
  //     current: 0,
  //     total: csvData.length,
  //     stage: 'Iniciando importación...',
  //     percentage: 0,
  //     speed: 0,
  //     eta: 0
  //   });

  //   try {
  //     // Simular progreso en tiempo real
  //     const startTime = Date.now();
      
  //     for (let i = 0; i <= csvData.length; i += Math.ceil(csvData.length / 20)) {
  //       const current = Math.min(i, csvData.length);
  //       const elapsed = (Date.now() - startTime) / 1000;
  //       const speed = current / elapsed;
  //       const remaining = csvData.length - current;
  //       const eta = remaining / speed;
        
  //       setImportProgress({
  //         current,
  //         total: csvData.length,
  //         stage: current === csvData.length ? 'Finalizando...' : `Procesando registro ${current}`,
  //         percentage: (current / csvData.length) * 100,
  //         speed,
  //         eta
  //       });
        
  //       await new Promise(resolve => setTimeout(resolve, 100));
  //     }

  //     const result = await onImport(csvData, importOptions);
  //     setImportResult(result);
  //     nextStep();
      
  //     if (result.success) {
  //       toast.success('Importación completada exitosamente');
  //     } else {
  //       toast.error('Importación completada con errores');
  //     }
  //   } catch (error) {
  //     toast.error('Error durante la importación');
  //     console.error('Import error:', error);
  //   } finally {
  //     setIsProcessing(false);
  //     setImportProgress(null);
  //   }
  // }, [csvData, importOptions, onImport, nextStep]);

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
    const headers = ['nombre', 'email', 'dni', 'telefono', 'fechaNacimiento', 'direccion', 'numeroSocio', 'montoCuota'];
    const csvContent = [
      headers.join(','),
      ...CSV_EXAMPLE_DATA.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_socios_ejemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Plantilla con ejemplos descargada');
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

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  // Renderizar el modal usando createPortal para que salga del contenedor padre
  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop desenfocado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal centrado y más pequeño */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Progress - Fijo en la parte superior */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Importación de Socios
                </h3>
                <p className="text-blue-100 text-sm">
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
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps - Más compacto */}
          <div className="flex items-center justify-between">
            {IMPORT_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all text-xs ${
                  index < currentStep 
                    ? 'bg-white text-blue-600 border-white' 
                    : index === currentStep
                    ? 'bg-blue-500 text-white border-blue-300'
                    : 'bg-transparent text-blue-200 border-blue-300'
                }`}>
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                
                {index < IMPORT_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 transition-all ${
                    index < currentStep ? 'bg-white' : 'bg-blue-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-3">
            <div className="text-xs text-blue-100 font-medium">
              Paso {currentStep + 1} de {IMPORT_STEPS.length}: {IMPORT_STEPS[currentStep].title}
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Upload */}
              {currentStep === 0 && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Instructions - Más compacto */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Info className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Guía de Importación
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <h5 className="font-medium text-blue-800 mb-1 text-sm">Requisitos:</h5>
                            <ul className="text-xs text-blue-700 space-y-1">
                              <li className="flex items-center"><Check className="w-3 h-3 mr-1 text-green-600" />Formato CSV</li>
                              <li className="flex items-center"><Check className="w-3 h-3 mr-1 text-green-600" />Con encabezados</li>
                              <li className="flex items-center"><Check className="w-3 h-3 mr-1 text-green-600" />Máximo 10MB</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 mb-1 text-sm">Campos requeridos:</h5>
                            <ul className="text-xs text-blue-700 space-y-1">
                              <li className="flex items-center"><AlertCircle className="w-3 h-3 mr-1 text-orange-500" />Nombre</li>
                              <li className="flex items-center"><AlertCircle className="w-3 h-3 mr-1 text-orange-500" />Email</li>
                              <li className="flex items-center"><AlertCircle className="w-3 h-3 mr-1 text-orange-500" />DNI</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Download - Más compacto */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Plantilla CSV
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Descarga plantilla con ejemplos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowExample(!showExample)}
                          className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {showExample ? 'Ocultar' : 'Ver'}
                        </button>
                        <button
                          onClick={downloadTemplate}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      </div>
                    </div>

                    {/* CSV Example Preview - Más compacto */}
                    <AnimatePresence>
                      {showExample && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center">
                              <BookOpen className="w-4 h-4 text-gray-600 mr-2" />
                              <span className="text-xs font-medium text-gray-700">
                                Ejemplo de datos CSV
                              </span>
                            </div>
                            <div className="p-3">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-1 px-2 font-medium text-gray-700">Nombre</th>
                                    <th className="text-left py-1 px-2 font-medium text-gray-700">Email</th>
                                    <th className="text-left py-1 px-2 font-medium text-gray-700">DNI</th>
                                    <th className="text-left py-1 px-2 font-medium text-gray-700">Teléfono</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {CSV_EXAMPLE_DATA.map((row, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="py-1 px-2 text-gray-900">{row.nombre}</td>
                                      <td className="py-1 px-2 text-gray-600">{row.email}</td>
                                      <td className="py-1 px-2 text-gray-600">{row.dni}</td>
                                      <td className="py-1 px-2 text-gray-600">{row.telefono}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File Upload Zone - Más compacto */}
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
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
                    
                    <div className="space-y-4">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all ${
                        isDragOver ? 'bg-blue-100 scale-110' : 'bg-gray-100'
                      }`}>
                        <Upload className={`w-8 h-8 transition-colors ${
                          isDragOver ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {isDragOver ? '¡Suelta tu archivo!' : 'Selecciona tu CSV'}
                        </h3>
                        <p className="text-gray-600 text-sm max-w-sm mx-auto">
                          Arrastra y suelta tu archivo CSV aquí, o haz clic para seleccionarlo
                        </p>
                      </div>
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none font-medium"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            Seleccionar Archivo
                          </>
                        )}
                      </button>
                    </div>

                    {isDragOver && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-2xl flex items-center justify-center">
                        <div className="text-blue-600 font-semibold">
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
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Mapeo de Columnas
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Verifica y ajusta las columnas detectadas automáticamente
                    </p>
                  </div>

                  <div className="space-y-3">
                    {columnMappings.map((mapping, index) => (
                      <div key={mapping.targetField} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              mapping.validated ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {REQUIRED_FIELDS.find(f => f.key === mapping.targetField)?.label}
                                {mapping.required && <span className="text-red-500 ml-1">*</span>}
                              </div>
                              <div className="text-xs text-gray-500">
                                {mapping.required ? 'Requerido' : 'Opcional'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
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
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Seleccionar...</option>
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
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-blue-600 mr-2" />
                          <div>
                            <div className="font-medium text-blue-900 text-sm">{file.name}</div>
                            <div className="text-xs text-blue-700">
                              {csvData.length} registros • {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {columnMappings.filter(m => m.validated).length}/{columnMappings.length} mapeadas
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer - Fijo en la parte inferior */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {currentStep > 0 && currentStep < 4 && (
              <button
                onClick={prevStep}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep === 0 && (
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            )}

            {currentStep === 1 && (
              <button
                onClick={validateData}
                disabled={!columnMappings.every(m => !m.required || m.validated)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Usar createPortal para renderizar el modal fuera del contenedor padre
  return createPortal(modalContent, document.body);
};