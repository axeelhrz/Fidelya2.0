'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  User,
  Trash2,
  Unlink,
  FileText,
  FileSpreadsheet,
  MoreVertical,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  Grid3X3,
  List,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useSocios } from '@/hooks/useSocios';
import { useSocioAsociacion } from '@/hooks/useSocioAsociacion';
import { SocioDialog } from './SocioDialog';
import { AddRegisteredSocioButton } from './AddRegisteredSocioButton';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UnlinkConfirmDialog } from './UnlinkConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Socio, SocioFormData } from '@/types/socio';
import toast from 'react-hot-toast';
import Image from 'next/image';
import * as XLSX from 'xlsx';

// Props interface for the component
interface EnhancedMemberManagementProps {
  triggerNewSocio?: boolean;
  onNewSocioTriggered?: () => void;
}

export const EnhancedMemberManagement = ({ 
  triggerNewSocio = false, 
  onNewSocioTriggered 
}: EnhancedMemberManagementProps) => {
  const { 
    socios, 
    loading, 
    error, 
    stats,
    loadSocios,
    createSocio,
    updateSocio,
    deleteSocio,
    importSocios,
    forceReload
  } = useSocios();

  const {
    loadSocios: loadVinculados,
    desvincularSocio
  } = useSocioAsociacion();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState({
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para el diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [socioToDelete, setSocioToDelete] = useState<Socio | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados para el diálogo de desvinculación
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [socioToUnlink, setSocioToUnlink] = useState<Socio | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Estados para importación/exportación
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadSocios();
    loadVinculados();
  }, [loadSocios, loadVinculados]);

  // Handle trigger for new socio from external sources
  useEffect(() => {
    console.log('🔥 EnhancedMemberManagement - triggerNewSocio changed:', triggerNewSocio, 'dialogOpen:', dialogOpen);
    if (triggerNewSocio && !dialogOpen) {
      console.log('🔥 Opening new socio dialog from trigger');
      setSelectedSocio(null);
      setDialogOpen(true);
      if (onNewSocioTriggered) {
        onNewSocioTriggered();
      }
    }
  }, [triggerNewSocio, dialogOpen, onNewSocioTriggered]);

  // Función para refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([forceReload(), loadVinculados()]);
      toast.success('Datos actualizados');
    } catch {
      toast.error('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para convertir fechas a formato compatible
  const convertDateToTimestamp = (date: Date | Timestamp | string | undefined): Timestamp | undefined => {
    if (!date) return undefined;
    
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    
    if (date instanceof Timestamp) {
      return date;
    }
    
    if (typeof date === 'string') {
      try {
        return Timestamp.fromDate(new Date(date));
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  };

  // Función para crear/actualizar socio
  const handleSaveSocio = async (data: SocioFormData) => {
    try {
      // Convertir fechas al formato correcto
      const processedData: SocioFormData = {
        ...data,
        fechaNacimiento: convertDateToTimestamp(data.fechaNacimiento),
        fechaVencimiento: convertDateToTimestamp(data.fechaVencimiento)
      };

      if (selectedSocio) {
        await updateSocio(selectedSocio.id, processedData);
        toast.success('Socio actualizado exitosamente');
      } else {
        await createSocio(processedData);
        toast.success('Socio creado exitosamente');
      }
      await handleRefresh();
    } catch {
      toast.error('Error al guardar el socio');
    }
  };

  // Función para abrir el diálogo de eliminación
  const handleDeleteClick = (socio: Socio) => {
    setSocioToDelete(socio);
    setDeleteDialogOpen(true);
  };

  // Función para confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!socioToDelete) return;

    setDeleting(true);
    try {
      const success = await deleteSocio(socioToDelete.id);
      if (success) {
        toast.success('Socio eliminado exitosamente');
        setDeleteDialogOpen(false);
        setSocioToDelete(null);
        await handleRefresh();
      }
    } catch {
      toast.error('Error al eliminar el socio');
    } finally {
      setDeleting(false);
    }
  };

  // Función para cancelar eliminación
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSocioToDelete(null);
  };

  // Función para abrir el diálogo de desvinculación
  const handleUnlinkClick = (socio: Socio) => {
    setSocioToUnlink(socio);
    setUnlinkDialogOpen(true);
  };

  // Función para confirmar desvinculación
  const handleUnlinkConfirm = async () => {
    if (!socioToUnlink) return;

    setUnlinking(true);
    try {
      await desvincularSocio(socioToUnlink.id);
      toast.success('Socio desvinculado exitosamente');
      setUnlinkDialogOpen(false);
      setSocioToUnlink(null);
      await handleRefresh();
    } catch {
      toast.error('Error al desvincular el socio');
    } finally {
      setUnlinking(false);
    }
  };

  // Función para cancelar desvinculación
  const handleUnlinkCancel = () => {
    setUnlinkDialogOpen(false);
    setSocioToUnlink(null);
  };

  // Función mejorada para exportar datos a Excel con diseño atractivo
  const handleExportExcel = async () => {
    if (exporting) return;
    
    setExporting(true);
    const loadingToast = toast.loading('Preparando exportación Excel...');
    
    try {
      if (socios.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay socios para exportar');
        return;
      }

      // Crear un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new();

      // Función para formatear fechas de manera segura
      const formatDate = (date: Date | Timestamp | undefined): string => {
        try {
          if (!date) return '';
          if (date instanceof Timestamp) {
            return format(date.toDate(), 'dd/MM/yyyy', { locale: es });
          }
          if (date instanceof Date) {
            return format(date, 'dd/MM/yyyy', { locale: es });
          }
          return '';
        } catch {
          return '';
        }
      };

      // Preparar datos para la hoja principal
      const sociosData = socios.map((socio, index) => ({
        '#': index + 1,
        'Nombre Completo': socio.nombre || '',
        'Correo Electrónico': socio.email || '',
        'DNI/Documento': socio.dni || '',
        'Teléfono': socio.telefono || '',
        'Número de Socio': socio.numeroSocio || '',
        'Estado': socio.estado || '',
        'Fecha de Ingreso': formatDate(socio.fechaIngreso),
        'Fecha de Vencimiento': formatDate(socio.fechaVencimiento),
        'Monto de Cuota': socio.montoCuota || 0,
        'Beneficios Utilizados': socio.beneficiosUsados || 0,
        'Dirección': socio.direccion || '',
        'Fecha de Nacimiento': formatDate(socio.fechaNacimiento)
      }));

      // Crear hoja principal con datos de socios
      const mainSheet = XLSX.utils.json_to_sheet(sociosData);

      // Configurar anchos de columna
      const columnWidths = [
        { wch: 5 },   // #
        { wch: 25 },  // Nombre
        { wch: 30 },  // Email
        { wch: 15 },  // DNI
        { wch: 18 },  // Teléfono
        { wch: 15 },  // Número Socio
        { wch: 12 },  // Estado
        { wch: 15 },  // Fecha Ingreso
        { wch: 15 },  // Fecha Vencimiento
        { wch: 12 },  // Monto Cuota
        { wch: 15 },  // Beneficios
        { wch: 30 },  // Dirección
        { wch: 15 }   // Fecha Nacimiento
      ];
      mainSheet['!cols'] = columnWidths;

      // Agregar la hoja principal al libro
      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Socios');

      // Crear hoja de resumen/estadísticas
      const statsData = [
        ['RESUMEN EJECUTIVO', ''],
        ['', ''],
        ['Total de Socios', stats?.total || 0],
        ['Socios Activos', stats?.activos || 0],
        ['Socios Vencidos', stats?.vencidos || 0],
        ['Socios Inactivos', (stats?.total || 0) - (stats?.activos || 0) - (stats?.vencidos || 0)],
        ['', ''],
        ['DISTRIBUCIÓN POR ESTADO', ''],
        ['', ''],
      ];

      // Agregar distribución por estado
      const estadosCount = socios.reduce((acc, socio) => {
        acc[socio.estado] = (acc[socio.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(estadosCount).forEach(([estado, count]) => {
        statsData.push([`${estado.charAt(0).toUpperCase() + estado.slice(1)}`, count]);
      });

      statsData.push(['', '']);

      // Agregar información de exportación
      statsData.push(['', '']);
      statsData.push(['INFORMACIÓN DE EXPORTACIÓN', '']);
      statsData.push(['', '']);
      statsData.push(['Fecha de Exportación', format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })]);
      statsData.push(['Total de Registros', socios.length]);
      statsData.push(['Exportado por', 'Sistema Fidelya']);

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      
      // Configurar anchos para la hoja de estadísticas
      statsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }];

      // Agregar la hoja de estadísticas
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Resumen');

      // Crear hoja de plantilla para importación
      const templateData = [
        ['PLANTILLA PARA IMPORTACIÓN DE SOCIOS', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['Instrucciones:', '', '', '', '', '', '', ''],
        ['1. Complete los datos en las filas siguientes', '', '', '', '', '', '', ''],
        ['2. No modifique los encabezados de las columnas', '', '', '', '', '', '', ''],
        ['3. Los campos marcados con * son obligatorios', '', '', '', '', '', '', ''],
        ['4. Estados válidos: activo, inactivo, suspendido, pendiente', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        [
          'Nombre Completo *',
          'Correo Electrónico *',
          'DNI/Documento',
          'Teléfono',
          'Número de Socio',
          'Estado',
          'Monto de Cuota',
          'Dirección'
        ],
        [
          'Juan Pérez',
          'juan.perez@email.com',
          '12345678',
          '+54 9 11 1234-5678',
          'SOC001',
          'activo',
          '1500',
          'Av. Corrientes 1234, CABA'
        ]
      ];

      const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
      templateSheet['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 18 },
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];

      XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla');

      // Generar el archivo Excel
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `Socios_Export_${timestamp}.xlsx`;
      
      // Escribir el archivo
      XLSX.writeFile(workbook, filename);
      
      toast.dismiss(loadingToast);
      toast.success(`Archivo Excel exportado exitosamente (${socios.length} socios)`);
    } catch (error) {
      console.error('Error en exportación Excel:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al exportar el archivo Excel. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // Función optimizada para exportar datos a CSV (mantener como opción alternativa)
  const handleExportCSV = async () => {
    if (exporting) return;
    
    setExporting(true);
    const loadingToast = toast.loading('Preparando exportación CSV...');
    
    try {
      if (socios.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay socios para exportar');
        return;
      }

      // Crear encabezados CSV con mejor formato
      const headers = [
        'Nombre Completo',
        'Correo Electrónico',
        'DNI/Documento',
        'Teléfono',
        'Número de Socio',
        'Estado',
        'Monto de Cuota',
        'Beneficios Utilizados',
        'Dirección',
        'Fecha de Nacimiento'
      ];

      // Función para escapar valores CSV
      const escapeCSV = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Función para formatear fechas de manera segura
      const formatDate = (date: Date | Timestamp | undefined): string => {
        try {
          if (!date) return '';
          if (date instanceof Timestamp) {
            return format(date.toDate(), 'dd/MM/yyyy', { locale: es });
          }
          if (date instanceof Date) {
            return format(date, 'dd/MM/yyyy', { locale: es });
          }
          return '';
        } catch {
          return '';
        }
      };

      // Convertir datos a formato CSV con mejor manejo de errores
      const csvData = socios.map(socio => {
        try {
          return [
            escapeCSV(socio.nombre || ''),
            escapeCSV(socio.email || ''),
            escapeCSV(socio.dni || ''),
            escapeCSV(socio.telefono || ''),
            escapeCSV(socio.numeroSocio || ''),
            escapeCSV(socio.estado || ''),
            escapeCSV(socio.montoCuota || 0),
            escapeCSV(socio.beneficiosUsados || 0),
            escapeCSV(socio.direccion || ''),
            escapeCSV(formatDate(socio.fechaNacimiento))
          ].join(',');
        } catch (error) {
          console.error('Error procesando socio:', socio.id, error);
          return '';
        }
      }).filter(row => row !== '');

      // Crear contenido CSV con BOM para mejor compatibilidad con Excel
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.map(escapeCSV).join(','),
        ...csvData
      ].join('\n');

      // Crear y descargar archivo con mejor nombre
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `socios_export_${timestamp}.csv`;
      
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success(`Datos exportados exitosamente (${socios.length} socios)`);
    } catch (error) {
      console.error('Error en exportación:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al exportar los datos. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // Función optimizada para importar datos desde Excel
  const handleImportExcel = async (file: File) => {
    if (importing) return;
    
    setImporting(true);
    const loadingToast = toast.loading('Procesando archivo Excel...');
    
    try {
      // Validar tipo de archivo
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast.dismiss(loadingToast);
        toast.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }

      // Validar tamaño del archivo (máximo 10MB para Excel)
      if (file.size > 10 * 1024 * 1024) {
        toast.dismiss(loadingToast);
        toast.error('El archivo es demasiado grande. Máximo 10MB permitido.');
        return;
      }

      // Leer el archivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Obtener la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      if (jsonData.length < 2) {
        toast.dismiss(loadingToast);
        toast.error('El archivo Excel debe tener al menos una fila de encabezados y una fila de datos');
        return;
      }

      toast.dismiss(loadingToast);
      const processingToast = toast.loading('Procesando datos...');

      // Encontrar la fila de encabezados (buscar la primera fila que contenga "Nombre" o "Email")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row.some((cell: string) => 
          typeof cell === 'string' && 
          (cell.toLowerCase().includes('nombre') || cell.toLowerCase().includes('email'))
        )) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        toast.dismiss(processingToast);
        toast.error('No se encontraron encabezados válidos en el archivo');
        return;
      }

      const headers = jsonData[headerRowIndex].map((h: string) => 
        typeof h === 'string' ? h.toLowerCase().trim() : ''
      );
      
      // Mapeo de encabezados posibles
      const headerMap: Record<string, string> = {
        'nombre': 'nombre',
        'nombre completo': 'nombre',
        'email': 'email',
        'correo': 'email',
        'correo electrónico': 'email',
        'correo electronico': 'email',
        'dni': 'dni',
        'documento': 'dni',
        'dni/documento': 'dni',
        'telefono': 'telefono',
        'teléfono': 'telefono',
        'numero de socio': 'numeroSocio',
        'número de socio': 'numeroSocio',
        'numero socio': 'numeroSocio',
        'estado': 'estado',
        'monto cuota': 'montoCuota',
        'monto de cuota': 'montoCuota',
        'cuota': 'montoCuota',
        'direccion': 'direccion',
        'dirección': 'direccion'
      };

      // Validar que existan campos obligatorios
      const requiredFields = ['nombre', 'email'];
      const mappedHeaders = headers.map(h => headerMap[h] || h);
      const missingFields = requiredFields.filter(field => 
        !mappedHeaders.includes(field)
      );

      if (missingFields.length > 0) {
        toast.dismiss(processingToast);
        toast.error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
        return;
      }

      // Procesar datos línea por línea
      const sociosData: SocioFormData[] = [];
      const errors: string[] = [];

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        try {
          const values = jsonData[i];
          
          if (!values || values.length === 0 || values.every((v: string) => !v)) {
            continue; // Saltar líneas vacías
          }

          const socio: Partial<SocioFormData> = {};
          
          headers.forEach((header, idx) => {
            const mappedField = headerMap[header] || header;
            const value = values[idx] ? String(values[idx]).trim() : '';
            
            if (!value) return;

            switch (mappedField) {
              case 'nombre':
                socio.nombre = value;
                break;
              case 'email':
                if (value.includes('@') && value.includes('.')) {
                  socio.email = value.toLowerCase();
                } else {
                  errors.push(`Línea ${i + 1}: Email inválido "${value}"`);
                }
                break;
              case 'dni':
                socio.dni = value;
                break;
              case 'telefono':
                socio.telefono = value;
                break;
              case 'numeroSocio':
                socio.numeroSocio = value;
                break;
              case 'estado':
                const validStates = ['activo', 'inactivo', 'suspendido', 'pendiente'];
                const normalizedState = value.toLowerCase();
                if (validStates.includes(normalizedState)) {
                  socio.estado = normalizedState as SocioFormData['estado'];
                } else {
                  socio.estado = 'activo';
                }
                break;
              case 'montoCuota':
                const amount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
                if (!isNaN(amount) && amount >= 0) {
                  socio.montoCuota = amount;
                }
                break;
              case 'direccion':
                socio.direccion = value;
                break;
            }
          });

          // Validar campos obligatorios
          if (!socio.nombre || !socio.email) {
            errors.push(`Línea ${i + 1}: Faltan campos obligatorios (nombre o email)`);
            continue;
          }

          // Establecer valores por defecto
          const completeSocio: SocioFormData = {
            nombre: socio.nombre,
            email: socio.email,
            dni: socio.dni || '',
            telefono: socio.telefono || '',
            numeroSocio: socio.numeroSocio || '',
            estado: socio.estado || 'activo',
            montoCuota: socio.montoCuota || 0,
            direccion: socio.direccion || '',
            fechaNacimiento: undefined,
            fechaVencimiento: undefined
          };

          sociosData.push(completeSocio);
        } catch (error) {
          errors.push(`Línea ${i + 1}: Error procesando datos - ${error}`);
        }
      }

      toast.dismiss(processingToast);

      if (sociosData.length === 0) {
        toast.error('No se encontraron datos válidos para importar');
        return;
      }

      // Mostrar resumen antes de importar
      if (errors.length > 0) {
        const proceed = window.confirm(
          `Se encontraron ${errors.length} errores en el archivo.\n` +
          `Se importarán ${sociosData.length} socios válidos.\n` +
          `¿Deseas continuar?`
        );
        
        if (!proceed) {
          toast('Importación cancelada');
          return;
        }
      }

      const importingToast = toast.loading(`Importando ${sociosData.length} socios...`);

      try {
        await importSocios(sociosData);
        toast.dismiss(importingToast);
        toast.success(
          `Importación completada: ${sociosData.length} socios importados` +
          (errors.length > 0 ? ` (${errors.length} errores omitidos)` : '')
        );
        await handleRefresh();
      } catch (importError) {
        toast.dismiss(importingToast);
        toast.error('Error durante la importación. Algunos datos pueden no haberse guardado.');
        console.error('Import error:', importError);
      }

    } catch (error) {
      console.error('Error en importación Excel:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al procesar el archivo Excel. Verifica que sea un archivo válido.');
    } finally {
      setImporting(false);
      // Limpiar el input file
      const fileInput = document.getElementById('import-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Función para manejar la importación (detecta automáticamente el tipo de archivo)
  const handleImport = async (file: File) => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      await handleImportExcel(file);
    } else if (fileName.endsWith('.csv')) {
      // Mantener la función CSV existente para compatibilidad
      await handleImportCSV(file);
    } else {
      toast.error('Formato de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)');
    }
  };

  // Función CSV original (mantener para compatibilidad)
  const handleImportCSV = async (file: File) => {
    if (importing) return;
    
    setImporting(true);
    const loadingToast = toast.loading('Procesando archivo CSV...');
    
    try {
      const text = await file.text();
      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.dismiss(loadingToast);
        toast.error('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos');
        return;
      }

      toast.dismiss(loadingToast);
      const processingToast = toast.loading('Procesando datos...');

      // Función para parsear CSV de manera más robusta
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      
      const headerMap: Record<string, string> = {
        'nombre': 'nombre',
        'nombre completo': 'nombre',
        'email': 'email',
        'correo': 'email',
        'correo electrónico': 'email',
        'correo electronico': 'email',
        'dni': 'dni',
        'documento': 'dni',
        'dni/documento': 'dni',
        'telefono': 'telefono',
        'teléfono': 'telefono',
        'numero de socio': 'numeroSocio',
        'número de socio': 'numeroSocio',
        'numero socio': 'numeroSocio',
        'estado': 'estado',
        'monto cuota': 'montoCuota',
        'monto de cuota': 'montoCuota',
        'cuota': 'montoCuota',
        'direccion': 'direccion',
        'dirección': 'direccion'
      };

      const requiredFields = ['nombre', 'email'];
      const mappedHeaders = headers.map(h => headerMap[h] || h);
      const missingFields = requiredFields.filter(field => 
        !mappedHeaders.includes(field)
      );

      if (missingFields.length > 0) {
        toast.dismiss(processingToast);
        toast.error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
        return;
      }

      const sociosData: SocioFormData[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          
          if (values.length === 0 || values.every(v => !v.trim())) {
            continue;
          }

          const socio: Partial<SocioFormData> = {};
          
          headers.forEach((header, idx) => {
            const mappedField = headerMap[header] || header;
            const value = values[idx]?.trim() || '';
            
            if (!value) return;

            switch (mappedField) {
              case 'nombre':
                socio.nombre = value;
                break;
              case 'email':
                if (value.includes('@') && value.includes('.')) {
                  socio.email = value.toLowerCase();
                } else {
                  errors.push(`Línea ${i + 1}: Email inválido "${value}"`);
                }
                break;
              case 'dni':
                socio.dni = value;
                break;
              case 'telefono':
                socio.telefono = value;
                break;
              case 'numeroSocio':
                socio.numeroSocio = value;
                break;
              case 'estado':
                const validStates = ['activo', 'inactivo', 'suspendido', 'pendiente'];
                const normalizedState = value.toLowerCase();
                if (validStates.includes(normalizedState)) {
                  socio.estado = normalizedState as SocioFormData['estado'];
                } else {
                  socio.estado = 'activo';
                }
                break;
              case 'montoCuota':
                const amount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
                if (!isNaN(amount) && amount >= 0) {
                  socio.montoCuota = amount;
                }
                break;
              case 'direccion':
                socio.direccion = value;
                break;
            }
          });

          if (!socio.nombre || !socio.email) {
            errors.push(`Línea ${i + 1}: Faltan campos obligatorios (nombre o email)`);
            continue;
          }

          const completeSocio: SocioFormData = {
            nombre: socio.nombre,
            email: socio.email,
            dni: socio.dni || '',
            telefono: socio.telefono || '',
            numeroSocio: socio.numeroSocio || '',
            estado: socio.estado || 'activo',
            montoCuota: socio.montoCuota || 0,
            direccion: socio.direccion || '',
            fechaNacimiento: undefined,
            fechaVencimiento: undefined
          };

          sociosData.push(completeSocio);
        } catch (error) {
          errors.push(`Línea ${i + 1}: Error procesando datos - ${error}`);
        }
      }

      toast.dismiss(processingToast);

      if (sociosData.length === 0) {
        toast.error('No se encontraron datos válidos para importar');
        return;
      }

      if (errors.length > 0) {
        const proceed = window.confirm(
          `Se encontraron ${errors.length} errores en el archivo.\n` +
          `Se importarán ${sociosData.length} socios válidos.\n` +
          `¿Deseas continuar?`
        );
        
        if (!proceed) {
          toast('Importación cancelada');
          return;
        }
      }

      const importingToast = toast.loading(`Importando ${sociosData.length} socios...`);

      try {
        await importSocios(sociosData);
        toast.dismiss(importingToast);
        toast.success(
          `Importación completada: ${sociosData.length} socios importados` +
          (errors.length > 0 ? ` (${errors.length} errores omitidos)` : '')
        );
        await handleRefresh();
      } catch (importError) {
        toast.dismiss(importingToast);
        toast.error('Error durante la importación. Algunos datos pueden no haberse guardado.');
        console.error('Import error:', importError);
      }

    } catch (error) {
      console.error('Error en importación CSV:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al procesar el archivo CSV. Verifica que sea un CSV válido.');
    } finally {
      setImporting(false);
      const fileInput = document.getElementById('import-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Función para descargar plantilla Excel
  const downloadExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();

    // Crear datos de la plantilla
    const templateData = [
      ['PLANTILLA PARA IMPORTACIÓN DE SOCIOS', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Instrucciones:', '', '', '', '', '', '', ''],
      ['1. Complete los datos en las filas siguientes', '', '', '', '', '', '', ''],
      ['2. No modifique los encabezados de las columnas', '', '', '', '', '', '', ''],
      ['3. Los campos marcados con * son obligatorios', '', '', '', '', '', '', ''],
      ['4. Estados válidos: activo, inactivo, suspendido, pendiente', '', '', '', '', '', '', ''],
      ['5. Guarde el archivo como Excel (.xlsx) antes de importar', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      [
        'Nombre Completo *',
        'Correo Electrónico *',
        'DNI/Documento',
        'Teléfono',
        'Número de Socio',
        'Estado',
        'Monto de Cuota',
        'Dirección'
      ],
      [
        'Juan Pérez',
        'juan.perez@email.com',
        '12345678',
        '+54 9 11 1234-5678',
        'SOC001',
        'activo',
        1500,
        'Av. Corrientes 1234, CABA'
      ],
      [
        'María García',
        'maria.garcia@email.com',
        '87654321',
        '+54 9 11 8765-4321',
        'SOC002',
        'activo',
        2000,
        'Av. Santa Fe 5678, CABA'
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Configurar anchos de columna
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Generar y descargar el archivo
    XLSX.writeFile(workbook, 'Plantilla_Socios.xlsx');
    toast.success('Plantilla Excel descargada exitosamente');
  };

  // Función para descargar plantilla CSV (mantener para compatibilidad)
  const downloadCSVTemplate = () => {
    const headers = [
      'Nombre Completo',
      'Correo Electrónico',
      'DNI/Documento',
      'Teléfono',
      'Número de Socio',
      'Estado',
      'Monto de Cuota',
      'Dirección'
    ];

    const exampleData = [
      'Juan Pérez',
      'juan.perez@email.com',
      '12345678',
      '+54 9 11 1234-5678',
      'SOC001',
      'activo',
      '1500',
      'Av. Corrientes 1234, CABA'
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      exampleData.map(field => `"${field}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_socios.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Plantilla CSV descargada exitosamente');
  };

  // Filtrar socios
  const filteredSocios = socios.filter(socio => {
    const matchesSearch = 
      socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (socio.dni && socio.dni.includes(searchTerm)) ||
      (socio.numeroSocio && socio.numeroSocio.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = !filters.estado || socio.estado === filters.estado;

    let matchesFecha = true;
    if (filters.fechaDesde || filters.fechaHasta) {
      const fechaIngreso = socio.fechaIngreso.toDate();
      if (filters.fechaDesde && new Date(filters.fechaDesde) > fechaIngreso) {
        matchesFecha = false;
      }
      if (filters.fechaHasta && new Date(filters.fechaHasta) < fechaIngreso) {
        matchesFecha = false;
      }
    }

    return matchesSearch && matchesEstado && matchesFecha;
  });

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full mx-auto"
            />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Cargando socios...</h3>
          <p className="text-slate-600">Preparando la información de tu comunidad</p>
        </motion.div>
      </div>
    );
  }

  // Renderizar estado de error
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar los socios</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 
            hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reintentar
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
      >
        {/* Total Socios */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Socios</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.total || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">Comunidad activa</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Socios Activos */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Socios Activos</p>
                <p className="text-3xl font-bold text-emerald-600">{stats?.activos || 0}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm text-emerald-600 font-medium">Al día</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Socios Vencidos */}
        <div className="group relative sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Socios Vencidos</p>
                <p className="text-3xl font-bold text-red-600">{stats?.vencidos || 0}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 font-medium">Requieren atención</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-blue-50/40 rounded-3xl blur-2xl" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
          {/* Top Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar socios por nombre, email, DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-slate-200/50 shadow-sm">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-md text-blue-600 scale-105' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-300'
                  }`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-md text-blue-600 scale-105' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-300'
                  }`}
                  title="Vista de cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Filters Toggle */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md ${
                  showFilters 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 shadow-md' 
                    : 'bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
                {showFilters && (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.button>

              {/* Botón de Importación Directo - NUEVO */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={importing}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-2xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl border border-white/20 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Importar socios desde Excel o CSV"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {importing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                ) : (
                  <Upload className="w-4 h-4 relative z-10" />
                )}
                <span className="hidden sm:inline relative z-10">
                  {importing ? 'Importando...' : 'Importar'}
                </span>
              </motion.button>

              {/* Add Registered Socio */}
              <AddRegisteredSocioButton 
                onSocioAdded={handleRefresh}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border border-white/20 relative overflow-hidden group"
              />

              {/* New Socio Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedSocio(null);
                  setDialogOpen(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl border border-white/20 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="hidden sm:inline relative z-10">Nuevo Socio</span>
              </motion.button>

              {/* More Actions Dropdown */}
              <div className="relative group">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all duration-200 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                >
                  <MoreVertical className="w-5 h-5" />
                </motion.button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                  <div className="p-2">
                    {/* Import Section - DESTACADO */}
                    <div className="px-3 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 rounded-lg mb-2">
                      🚀 Importar Socios
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => document.getElementById('import-file')?.click()}
                      disabled={importing}
                      className="w-full text-left px-3 py-3 text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl flex items-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg mb-2"
                    >
                      <Upload className="w-5 h-5 text-white" />
                      <div className="flex-1">
                        <div>Importar Datos</div>
                        <div className="text-xs text-blue-100">Excel o CSV</div>
                      </div>
                      {importing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    </motion.button>

                    <div className="h-px bg-slate-200 my-2" />

                    {/* Templates Section */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Plantillas
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={downloadExcelTemplate}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-3 transition-all duration-200"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Descargar Excel</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={downloadCSVTemplate}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-3 transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Descargar CSV</span>
                    </motion.button>

                    <div className="h-px bg-slate-200 my-2" />

                    {/* Export Section */}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Exportar
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleExportExcel}
                      disabled={exporting || socios.length === 0}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Exportar Excel</span>
                      {exporting && <div className="w-3 h-3 border border-slate-300 border-t-emerald-600 rounded-full animate-spin ml-auto" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleExportCSV}
                      disabled={exporting || socios.length === 0}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Exportar CSV</span>
                      {exporting && <div className="w-3 h-3 border border-slate-300 border-t-blue-600 rounded-full animate-spin ml-auto" />}
                    </motion.button>

                    <div className="h-px bg-slate-200 my-2" />

                    {/* Refresh */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                      <span>Actualizar datos</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={filters.estado}
                        onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="suspendido">Suspendido</option>
                        <option value="pendiente">Pendiente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha Desde
                      </label>
                      <input
                        type="date"
                        value={filters.fechaDesde}
                        onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha Hasta
                      </label>
                      <input
                        type="date"
                        value={filters.fechaHasta}
                        onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFilters({
                          estado: '',
                          fechaDesde: '',
                          fechaHasta: ''
                        });
                        setSearchTerm('');
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all duration-200"
                    >
                      Limpiar todos los filtros
                    </motion.button>
                    <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                      Mostrando {filteredSocios.length} de {socios.length} socios
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input
        id="import-file"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImport(e.target.files[0]);
          }
        }}
      />

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-slate-50/40 rounded-3xl blur-2xl" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {filteredSocios.length === 0 ? (
            <div className="text-center py-16 px-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <User className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {socios.length === 0 ? 'No hay socios vinculados' : 'No se encontraron socios'}
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  {socios.length === 0 
                    ? 'Comienza vinculando socios existentes o creando nuevos miembros para tu asociación'
                    : 'Intenta ajustar los filtros de búsqueda para encontrar los socios que buscas'
                  }
                </p>
                {socios.length === 0 && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <AddRegisteredSocioButton 
                      onSocioAdded={handleRefresh}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedSocio(null);
                        setDialogOpen(true);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Crear Nuevo Socio
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSocios.map((socio, index) => (
                  <motion.div
                    key={socio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6">
                      {/* Avatar and Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="relative">
                          {socio.avatar ? (
                            <Image
                              className="w-12 h-12 rounded-xl object-cover"
                              src={socio.avatar}
                              alt={socio.nombre}
                              width={48}
                              height={48}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            socio.estado === 'activo' ? 'bg-emerald-500' :
                            socio.estado === 'inactivo' ? 'bg-slate-400' :
                            socio.estado === 'suspendido' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                      </div>

                      {/* Member Info */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-900 mb-1 truncate">{socio.nombre}</h3>
                        <p className="text-sm text-slate-600 truncate">{socio.email}</p>
                        {socio.numeroSocio && (
                          <p className="text-xs text-slate-500 mt-1">#{socio.numeroSocio}</p>
                        )}
                      </div>

                      {/* Quick Info */}
                      <div className="space-y-2 mb-4">
                        {socio.telefono && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Phone className="w-3 h-3 mr-2" />
                            <span className="truncate">{socio.telefono}</span>
                          </div>
                        )}
                        <div className="flex items-center text-xs text-slate-600">
                          <Calendar className="w-3 h-3 mr-2" />
                          <span>Ingreso: {format(socio.fechaIngreso.toDate(), 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                        {socio.montoCuota > 0 && (
                          <div className="flex items-center text-xs text-slate-600">
                            <CreditCard className="w-3 h-3 mr-2" />
                            <span>${socio.montoCuota}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedSocio(socio);
                            setDialogOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteClick(socio)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleUnlinkClick(socio)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
                          title="Desvincular"
                        >
                          <Unlink className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // List View (Table)
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Socio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                      Número
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                      Fecha de Ingreso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                      Vencimiento
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSocios.map((socio, index) => (
                    <motion.tr 
                      key={socio.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            {socio.avatar ? (
                              <Image
                                className="h-12 w-12 rounded-xl object-cover"
                                src={socio.avatar}
                                alt={socio.nombre}
                                width={48}
                                height={48}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              socio.estado === 'activo' ? 'bg-emerald-500' :
                              socio.estado === 'inactivo' ? 'bg-slate-400' :
                              socio.estado === 'suspendido' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {socio.nombre}
                            </div>
                            <div className="text-sm text-slate-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {socio.email}
                            </div>
                            {socio.telefono && (
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {socio.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                        {socio.numeroSocio ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            #{socio.numeroSocio}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            socio.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : socio.estado === 'inactivo'
                              ? 'bg-slate-100 text-slate-800'
                              : socio.estado === 'suspendido'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {socio.estado.charAt(0).toUpperCase() + socio.estado.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {format(socio.fechaIngreso.toDate(), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell">
                        {socio.fechaVencimiento ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {format(socio.fechaVencimiento.toDate(), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedSocio(socio);
                              setDialogOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Editar socio"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </motion.button>
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteClick(socio)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                              title="Eliminar socio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUnlinkClick(socio)}
                              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-200 border border-transparent hover:border-orange-200"
                              title="Desvincular socio"
                            >
                              <Unlink className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Dialogs */}
      <AnimatePresence>
        {/* Socio Dialog */}
        {dialogOpen && (
          <SocioDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onSave={handleSaveSocio}
            socio={selectedSocio}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Eliminar Socio Completamente"
            message={`¿Estás seguro de que deseas eliminar completamente al socio "${socioToDelete?.nombre}"? Esta acción eliminará permanentemente todos los datos del socio de la base de datos, incluyendo su historial de beneficios, validaciones y actividades. Esta acción NO se puede deshacer.`}
            confirmText="Eliminar Completamente"
            cancelText="Cancelar"
            loading={deleting}
          />
        )}

        {/* Unlink Confirmation Dialog */}
        {unlinkDialogOpen && (
          <UnlinkConfirmDialog
            open={unlinkDialogOpen}
            onClose={handleUnlinkCancel}
            onConfirm={handleUnlinkConfirm}
            title="Desvincular Socio"
            message={`¿Estás seguro de que deseas desvincular al socio "${socioToUnlink?.nombre}" de esta asociación? El socio mantendrá su cuenta pero perderá acceso a los beneficios de esta asociación.`}
            confirmText="Desvincular"
            cancelText="Cancelar"
            loading={unlinking}
          />
        )}
      </AnimatePresence>
    </div>
  );
};