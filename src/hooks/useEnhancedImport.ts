import { useState, useCallback } from 'react';



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

export const useEnhancedImport = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validateDNI = useCallback((dni: string): boolean => {
    return /^\d{7,8}$/.test(dni);
  }, []);

  const validatePhoneNumber = useCallback((phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, []);

  const validateDate = useCallback((date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }, []);

  interface ColumnMapping {
    csvColumn: string;
    targetField: string;
    required: boolean;
  }

  const validateRow = useCallback((row: Record<string, string>, rowIndex: number, columnMappings: ColumnMapping[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    columnMappings.forEach(mapping => {
      if (mapping.csvColumn && mapping.required) {
        const value = row[mapping.csvColumn]?.trim();

        // Check required fields
        if (!value) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.targetField,
            value: value || '',
            error: `Campo requerido vacío`,
            severity: 'error',
            fixable: false
          });
          return;
        }

        // Field-specific validations
        switch (mapping.targetField) {
          case 'email':
            if (!validateEmail(value)) {
              errors.push({
                row: rowIndex + 1,
                field: mapping.targetField,
                value,
                error: 'Formato de email inválido',
                severity: 'error',
                fixable: true
              });
            }
            break;

          case 'dni':
            if (!validateDNI(value)) {
              errors.push({
                row: rowIndex + 1,
                field: mapping.targetField,
                value,
                error: 'DNI debe tener 7-8 dígitos numéricos',
                severity: 'warning',
                fixable: true
              });
            }
            break;

          case 'telefono':
            if (value && !validatePhoneNumber(value)) {
              errors.push({
                row: rowIndex + 1,
                field: mapping.targetField,
                value,
                error: 'Formato de teléfono inválido',
                severity: 'warning',
                fixable: true
              });
            }
            break;

          case 'fechaNacimiento':
            if (value && !validateDate(value)) {
              errors.push({
                row: rowIndex + 1,
                field: mapping.targetField,
                value,
                error: 'Fecha debe estar en formato YYYY-MM-DD',
                severity: 'warning',
                fixable: true
              });
            }
            break;

          case 'montoCuota':
            if (value && (isNaN(Number(value)) || Number(value) < 0)) {
              errors.push({
                row: rowIndex + 1,
                field: mapping.targetField,
                value,
                error: 'Monto debe ser un número positivo',
                severity: 'warning',
                fixable: true
              });
            }
            break;

          case 'nombre':
            if (value.length < 2) {
              errors.push({
                row: rowIndex + 1,
                field: mapping.targetField,
                value,
                error: 'Nombre debe tener al menos 2 caracteres',
                severity: 'error',
                fixable: true
              });
            }
            break;
        }
      }
    });

    return errors;
  }, [validateEmail, validateDNI, validatePhoneNumber, validateDate]);

  const validateAllData = useCallback((
    csvData: Record<string, string>[], 
    columnMappings: ColumnMapping[]
  ): ValidationError[] => {
    setIsProcessing(true);
    
    const allErrors: ValidationError[] = [];
    const emailSet = new Set<string>();
    const dniSet = new Set<string>();

    csvData.forEach((row, index) => {
      // Basic field validation
      const rowErrors = validateRow(row, index, columnMappings);
      allErrors.push(...rowErrors);

      // Duplicate detection within the file
      const emailMapping = columnMappings.find(m => m.targetField === 'email');
      const dniMapping = columnMappings.find(m => m.targetField === 'dni');

      if (emailMapping?.csvColumn) {
        const email = row[emailMapping.csvColumn]?.trim().toLowerCase();
        if (email) {
          if (emailSet.has(email)) {
            allErrors.push({
              row: index + 1,
              field: 'email',
              value: email,
              error: 'Email duplicado en el archivo',
              severity: 'warning',
              fixable: false
            });
          } else {
            emailSet.add(email);
          }
        }
      }

      if (dniMapping?.csvColumn) {
        const dni = row[dniMapping.csvColumn]?.trim();
        if (dni) {
          if (dniSet.has(dni)) {
            allErrors.push({
              row: index + 1,
              field: 'dni',
              value: dni,
              error: 'DNI duplicado en el archivo',
              severity: 'warning',
              fixable: false
            });
          } else {
            dniSet.add(dni);
          }
        }
      }
    });

    setValidationErrors(allErrors);
    setIsProcessing(false);

    return allErrors;
  }, [validateRow]);

  const simulateImportProgress = useCallback(async (
    total: number,
    onProgress: (progress: ImportProgress) => void
  ) => {
    const startTime = Date.now();
    const batchSize = Math.max(1, Math.ceil(total / 50)); // 50 updates max
    
    for (let i = 0; i <= total; i += batchSize) {
      const current = Math.min(i, total);
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? current / elapsed : 0;
      const remaining = total - current;
      const eta = speed > 0 ? remaining / speed : 0;

      const progress: ImportProgress = {
        current,
        total,
        stage: current === total ? 'Finalizando importación...' : `Procesando registro ${current} de ${total}`,
        percentage: (current / total) * 100,
        speed,
        eta
      };

      onProgress(progress);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  }, []);

  const generateSuggestions = useCallback((headers: string[], targetField: string): string[] => {
    const fieldMappings: Record<string, string[]> = {
      nombre: ['nombre', 'name', 'apellido', 'surname', 'full_name', 'fullname'],
      email: ['email', 'mail', 'correo', 'e-mail', 'electronic_mail'],
      dni: ['dni', 'document', 'documento', 'cedula', 'identification'],
      telefono: ['telefono', 'phone', 'tel', 'celular', 'mobile', 'movil'],
      fechaNacimiento: ['fecha_nacimiento', 'birth_date', 'birthday', 'nacimiento', 'fecha_nac'],
      direccion: ['direccion', 'address', 'domicilio', 'location', 'ubicacion'],
      numeroSocio: ['numero_socio', 'member_number', 'socio_number', 'numero', 'id_socio'],
      montoCuota: ['monto_cuota', 'cuota', 'fee', 'amount', 'precio', 'cost']
    };

    const keywords = fieldMappings[targetField] || [targetField];
    
    return headers.filter(header => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
      return keywords.some(keyword => 
        normalizedHeader.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(normalizedHeader)
      );
    }).sort((a, b) => {
      // Prioritize exact matches
      const aExact = keywords.some(k => a.toLowerCase() === k.toLowerCase());
      const bExact = keywords.some(k => b.toLowerCase() === k.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.localeCompare(b);
    });
  }, []);

  const cleanData = useCallback((
    csvData: Record<string, string>[],
    columnMappings: ColumnMapping[]
  ): Record<string, string>[] => {
    return csvData.map(row => {
      const cleanedRow: Record<string, string> = {};
      
      columnMappings.forEach(mapping => {
        if (mapping.csvColumn && row[mapping.csvColumn]) {
          let value = row[mapping.csvColumn].trim();
          
          // Field-specific cleaning
          switch (mapping.targetField) {
            case 'email':
              value = value.toLowerCase();
              break;
            case 'telefono':
              value = value.replace(/[\s\-\(\)]/g, '');
              break;
            case 'dni':
              value = value.replace(/\D/g, '');
              break;
            case 'nombre':
              value = value.replace(/\s+/g, ' ').trim();
              // Capitalize first letter of each word
              value = value.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
              break;
          }
          
          cleanedRow[mapping.targetField] = value;
        }
      });
      
      return cleanedRow;
    });
  }, []);

  return {
    isProcessing,
    progress,
    validationErrors,
    setValidationErrors,
    validateAllData,
    simulateImportProgress,
    generateSuggestions,
    cleanData,
    setProgress
  };
};
