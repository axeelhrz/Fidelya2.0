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
  CheckCircle,
  XCircle,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface EnhancedCsvImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (csvData: Record<string, string>[]) => Promise<{
    success: boolean;
    imported: number;
    duplicates: number;
    errors: Array<{ row: number; error: string; data: Record<string, string> }>;
  }>;
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

interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  errors: Array<{ row: number; error: string; data: Record<string, string> }>;
}

const IMPORT_STEPS = [
  { id: 'upload', title: 'Seleccionar Archivo', description: 'Sube tu archivo CSV o Excel' },
  { id: 'mapping', title: 'Mapear Columnas', description: 'Configura las columnas' },
  { id: 'validation', title: 'Validar Datos', description: 'Revisa y corrige errores' },
  { id: 'import', title: 'Importar', description: 'Procesando e importando datos' }
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
    sendWelcomeEmail: false,
    generateCredentials: false
  });

  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
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
    setImportOptions({
      skipDuplicates: true,
      updateExisting: false,
      validateData: true,
      sendWelcomeEmail: false,
      generateCredentials: false
    });
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
        field.label.toLowerCase().includes(header.toLowerCase()) ||
        (field.key === 'nombre' && (header.toLowerCase().includes('name') || header.toLowerCase().includes('apellido'))) ||
        (field.key === 'email' && (header.toLowerCase().includes('mail') || header.toLowerCase().includes('correo'))) ||
        (field.key === 'telefono' && (header.toLowerCase().includes('phone') || header.toLowerCase().includes('celular'))) ||
        (field.key === 'fechaNacimiento' && (header.toLowerCase().includes('nacimiento') || header.toLowerCase().includes('birth'))) ||
        (field.key === 'numeroSocio' && (header.toLowerCase().includes('numero') || header.toLowerCase().includes('member')))
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

  // Función para parsear archivos Excel
  const parseExcel = useCallback((file: File) => {
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBufferData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(arrayBufferData, { type: 'array' });
        
        // Tomar la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length < 2) {
          toast.error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
          setIsProcessing(false);
          return;
        }

        // Procesar headers y datos
        const headers = jsonData[0].map(h => String(h || '').trim());
        const rowDataArray = jsonData.slice(1).map((row, index) => {
          const rowData: Record<string, string> = { _rowNumber: String(index + 2) };
          
          headers.forEach((header, i) => {
            rowData[header] = String(row[i] || '').trim();
          });
          
          return rowData;
        }).filter(row => {
          // Filtrar filas completamente vacías
          const values = Object.values(row).filter(v => v && v !== row._rowNumber);
          return values.length > 0;
        });

        setCsvData(rowDataArray);
        setPreviewData(rowDataArray.slice(0, 10));
        
        // Auto-generate column mappings
        const mappings = generateColumnMappings(headers);
        setColumnMappings(mappings);
        
        toast.success(`Archivo Excel procesado: ${rowDataArray.length} registros encontrados`);
        nextStep();
      } catch (error) {
        toast.error('Error al procesar el archivo Excel');
        console.error('Excel parsing error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [nextStep, generateColumnMappings]);

  // Manejo de archivos CSV
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
        }).filter(row => {
          // Filtrar filas completamente vacías
          const values = Object.values(row).filter(v => v && v !== row._rowNumber);
          return values.length > 0;
        });

        setCsvData(data);
        setPreviewData(data.slice(0, 10));
        
        // Auto-generate column mappings
        const mappings = generateColumnMappings(headers);
        setColumnMappings(mappings);
        
        toast.success(`Archivo CSV procesado: ${data.length} registros encontrados`);
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

    const isCSV = selectedFile.name.toLowerCase().endsWith('.csv');
    const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast.error('Por favor selecciona un archivo CSV o Excel válido');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('El archivo es demasiado grande. Máximo 10MB permitido');
      return;
    }

    setFile(selectedFile);
    
    if (isExcel) {
      parseExcel(selectedFile);
    } else {
      parseCSV(selectedFile);
    }
  }, [parseCSV, parseExcel]);

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
            if (!/^\d{7,8}$/.test(value.replace(/\D/g, ''))) {
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

          if (mapping.targetField === 'montoCuota' && value) {
            const amount = parseFloat(value);
            if (isNaN(amount) || amount < 0) {
              errors.push({
                row: index + 1,
                field: mapping.targetField,
                value,
                error: 'Monto debe ser un número válido',
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
    
    const criticalErrors = errors.filter(e => e.severity === 'error').length;
    
    if (criticalErrors === 0) {
      toast.success('Validación completada sin errores críticos');
      nextStep();
    } else {
      toast.error(`Se encontraron ${criticalErrors} errores críticos que deben corregirse`);
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
      // Preparar datos para importación
      const processedData = csvData.map(row => {
        const processedRow: Record<string, string> = {};
        
        columnMappings.forEach(mapping => {
          if (mapping.csvColumn && row[mapping.csvColumn]) {
            let value = row[mapping.csvColumn].trim();
            
            // Procesar valores específicos
            if (mapping.targetField === 'dni') {
              value = value.replace(/\D/g, ''); // Solo números
            }
            
            if (mapping.targetField === 'montoCuota') {
              const amount = parseFloat(value);
              value = isNaN(amount) ? '0' : amount.toString();
            }
            
            processedRow[mapping.targetField] = value;
          }
        });
        
        return processedRow;
      });

      // Simular progreso en tiempo real
      const startTime = Date.now();
      const batchSize = Math.max(1, Math.ceil(csvData.length / 20));
      
      for (let i = 0; i <= csvData.length; i += batchSize) {
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

      const result = await onImport(processedData);
      setImportResult(result);
      nextStep();
      
      if (result.success) {
        toast.success(`Importación completada: ${result.imported} socios importados`);
      } else {
        toast.error(`Importación completada con ${result.errors.length} errores`);
      }
    } catch (error) {
      toast.error('Error durante la importación');
      console.error('Import error:', error);
      setImportResult({
        success: false,
        imported: 0,
        duplicates: 0,
        errors: [{ row: 0, error: 'Error general en la importación', data: {} }]
      });
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  }, [csvData, columnMappings, onImport, nextStep]);

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
    const validFile = files.find(file => 
      file.name.toLowerCase().endsWith('.csv') || 
      file.name.toLowerCase().endsWith('.xlsx') || 
      file.name.toLowerCase().endsWith('.xls')
    );
    
    if (validFile) {
      handleFileSelect(validFile);
    } else {
      toast.error('Por favor suelta un archivo CSV o Excel');
    }
  }, [handleFileSelect]);

  const downloadTemplate = useCallback(() => {
    const headers = ['nombre', 'email', 'dni', 'telefono', 'fechaNacimiento', 'direccion', 'numeroSocio', 'montoCuota'];
    
    // Crear workbook de Excel
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja con datos de ejemplo
    const worksheetData = [
      headers,
      ...CSV_EXAMPLE_DATA.map(row => 
        headers.map(header => row[header as keyof typeof row] || '')
      )
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Configurar anchos de columna
    worksheet['!cols'] = [
      { wch: 25 }, // nombre
      { wch: 30 }, // email
      { wch: 12 }, // dni
      { wch: 18 }, // telefono
      { wch: 15 }, // fechaNacimiento
      { wch: 30 }, // direccion
      { wch: 12 }, // numeroSocio
      { wch: 12 }  // montoCuota
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Socios');
    
    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_socios_ejemplo.xlsx');
    
    toast.success('Plantilla Excel con ejemplos descargada');
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

      {/* Modal centrado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
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

          {/* Progress Steps - Círculos más juntos */}
          <div className="flex items-center justify-center space-x-2">
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
                  <div className={`w-4 h-0.5 ml-2 transition-all ${
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
                  {/* Instructions */}
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
                            <h5 className="font-medium text-blue-800 mb-1 text-sm">Formatos soportados:</h5>
                            <ul className="text-xs text-blue-700 space-y-1">
                              <li className="flex items-center"><FileText className="w-3 h-3 mr-1 text-green-600" />CSV (.csv)</li>
                              <li className="flex items-center"><FileSpreadsheet className="w-3 h-3 mr-1 text-green-600" />Excel (.xlsx, .xls)</li>
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

                  {/* Template Download */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Plantilla Excel
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

                    {/* Example Preview */}
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
                                Ejemplo de datos
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

                  {/* File Upload Zone */}
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
                      accept=".csv,.xlsx,.xls"
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
                          {isDragOver ? '¡Suelta tu archivo!' : 'Selecciona tu archivo'}
                        </h3>
                        <p className="text-gray-600 text-sm max-w-sm mx-auto">
                          Arrastra y suelta tu archivo CSV o Excel aquí, o haz clic para seleccionarlo
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

                  {/* Preview Data */}
                  {previewData.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900 text-sm">Vista previa (primeros 5 registros)</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              {columnMappings.filter(m => m.csvColumn).map(mapping => (
                                <th key={mapping.csvColumn} className="px-3 py-2 text-left font-medium text-gray-700">
                                  {mapping.csvColumn}
                                  {mapping.required && <span className="text-red-500 ml-1">*</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.slice(0, 5).map((row, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                {columnMappings.filter(m => m.csvColumn).map(mapping => (
                                  <td key={mapping.csvColumn} className="px-3 py-2 text-gray-900">
                                    {row[mapping.csvColumn] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Validation */}
              {currentStep === 2 && (
                <motion.div
                  key="validation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Validación de Datos
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Revisa los errores encontrados antes de continuar
                    </p>
                  </div>

                  {isProcessing ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                      <p className="text-gray-600">Validando datos...</p>
                    </div>
                  ) : (
                    <>
                      {/* Validation Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <div>
                              <div className="font-semibold text-green-900">Registros Válidos</div>
                              <div className="text-2xl font-bold text-green-600">
                                {csvData.length - validationErrors.filter(e => e.severity === 'error').length}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <div>
                              <div className="font-semibold text-yellow-900">Advertencias</div>
                              <div className="text-2xl font-bold text-yellow-600">
                                {validationErrors.filter(e => e.severity === 'warning').length}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-600 mr-2" />
                            <div>
                              <div className="font-semibold text-red-900">Errores Críticos</div>
                              <div className="text-2xl font-bold text-red-600">
                                {validationErrors.filter(e => e.severity === 'error').length}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Validation Errors List */}
                      {validationErrors.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h4 className="font-medium text-gray-900">Errores Encontrados</h4>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {validationErrors.map((error, index) => (
                              <div key={index} className={`px-4 py-3 border-b border-gray-100 ${
                                error.severity === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                              }`}>
                                <div className="flex items-start">
                                  {error.severity === 'error' ? (
                                    <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      Fila {error.row}: {error.error}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Campo: {error.field} | Valor: &quot;{error.value}&quot;
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {validationErrors.length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            ¡Validación Exitosa!
                          </h3>
                          <p className="text-gray-600">
                            Todos los datos están correctos y listos para importar
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 4: Configuration */}
              {currentStep === 3 && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Configuración de Importación
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Configura las opciones para la importación
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Manejo de Duplicados</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.skipDuplicates}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              skipDuplicates: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Omitir registros duplicados (por DNI o email)
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.updateExisting}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              updateExisting: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Actualizar socios existentes con nueva información
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Validación y Notificaciones</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.validateData}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              validateData: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Validar formato de datos (emails, DNI, etc.)
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.sendWelcomeEmail}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              sendWelcomeEmail: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Enviar email de bienvenida a nuevos socios
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importOptions.generateCredentials}
                            onChange={(e) => setImportOptions(prev => ({
                              ...prev,
                              generateCredentials: e.target.checked
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Generar credenciales de acceso automáticamente
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Import Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Resumen de Importación</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Archivo:</span>
                          <span className="ml-2 font-medium text-blue-900">{file?.name}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Registros:</span>
                          <span className="ml-2 font-medium text-blue-900">{csvData.length}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Campos mapeados:</span>
                          <span className="ml-2 font-medium text-blue-900">
                            {columnMappings.filter(m => m.csvColumn).length}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">Errores críticos:</span>
                          <span className="ml-2 font-medium text-blue-900">
                            {validationErrors.filter(e => e.severity === 'error').length}
                          </span>
                        </div>
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
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Importando Socios
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Por favor espera mientras procesamos los datos
                    </p>
                  </div>

                  {importProgress && (
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${importProgress.percentage}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Progress Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {importProgress.current}
                          </div>
                          <div className="text-xs text-gray-600">Procesados</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {importProgress.total}
                          </div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(importProgress.percentage)}%
                          </div>
                          <div className="text-xs text-gray-600">Completado</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {importProgress.eta > 0 ? Math.round(importProgress.eta) : 0}s
                          </div>
                          <div className="text-xs text-gray-600">Restante</div>
                        </div>
                      </div>

                      {/* Current Stage */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                          <div>
                            <div className="font-medium text-blue-900">{importProgress.stage}</div>
                            <div className="text-sm text-blue-700">
                              Velocidad: {Math.round(importProgress.speed)} registros/seg
                            </div>
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
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      importResult.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {importResult.success ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {importResult.success ? '¡Importación Completada!' : 'Importación con Errores'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {importResult.success 
                        ? 'Los socios han sido importados exitosamente'
                        : 'La importación se completó pero con algunos errores'
                      }
                    </p>
                  </div>

                  {/* Results Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-green-600 mr-2" />
                        <div>
                          <div className="font-semibold text-green-900">Importados</div>
                          <div className="text-2xl font-bold text-green-600">
                            {importResult.imported}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <div>
                          <div className="font-semibold text-yellow-900">Duplicados</div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {importResult.duplicates}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                          <div className="font-semibold text-red-900">Errores</div>
                          <div className="text-2xl font-bold text-red-600">
                            {importResult.errors.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">Detalles de Errores</h4>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-start">
                              <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  Fila {error.row}: {error.error}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Datos: {JSON.stringify(error.data)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {importResult.success && importResult.imported > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <div className="text-sm text-green-800">
                          <strong>{importResult.imported} socios</strong> han sido importados exitosamente.
                          {importResult.duplicates > 0 && (
                            <span> Se omitieron <strong>{importResult.duplicates} duplicados</strong>.</span>
                          )}
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
                disabled={!columnMappings.every(m => !m.required || m.validated) || isProcessing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    Validar Datos
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={nextStep}
                disabled={validationErrors.filter(e => e.severity === 'error').length > 0}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-lg text-sm font-medium text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Iniciar Importación
                  </>
                )}
              </button>
            )}

            {currentStep === 5 && (
              <button
                onClick={handleClose}
                className="inline-flex items-center px-6 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4 mr-2" />
                Finalizar
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