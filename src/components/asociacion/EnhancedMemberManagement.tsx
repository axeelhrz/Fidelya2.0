'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Download,
  Calendar,
  Mail,
  Phone,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { useSocios } from '@/hooks/useSocios';
import { useSocioAsociacion } from '@/hooks/useSocioAsociacion';
import { SocioDialog } from './SocioDialog';
import { AddRegisteredSocioButton } from './AddRegisteredSocioButton';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UnlinkConfirmDialog } from './UnlinkConfirmDialog';
import { EnhancedCsvImport } from './EnhancedCsvImport';
import { BulkEditDialog, BulkUpdateData } from './BulkEditDialog';
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
  const [, setRefreshing] = useState(false);
  
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
  const [importing] = useState(false);
  
  // Estados para importación CSV mejorada
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Estados para selección múltiple
  const [selectedSocios, setSelectedSocios] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

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
      console.log('🔄 Refreshing member management data...');
      await Promise.all([forceReload(), loadVinculados()]);
      
      // Also trigger a stats refresh to ensure metrics are up to date
      // This helps sync the dashboard metrics when membership statuses change
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('refreshSocioStats'));
      }
      
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

  // Función para crear/actualizar socio con mejor manejo de errores
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
        toast.success('✅ Socio actualizado exitosamente');
      } else {
        await createSocio(processedData);
        toast.success('✅ Socio creado exitosamente');
      }
      
      // Cerrar el diálogo después de guardar exitosamente
      setDialogOpen(false);
      setSelectedSocio(null);
      
      // Refrescar datos
      await handleRefresh();
    } catch (error) {
      // Mejorar el manejo de errores específicos
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el socio';
      
      if (errorMessage.includes('DNI') && errorMessage.includes('asociación')) {
        toast.error('❌ El DNI ya está siendo usado por otro socio en esta asociación');
      } else if (errorMessage.includes('email') && errorMessage.includes('asociación')) {
        toast.error('❌ El email ya está siendo usado por otro socio en esta asociación');
      } else if (errorMessage.includes('número') && errorMessage.includes('asociación')) {
        toast.error('❌ El número de socio ya está siendo usado en esta asociación');
      } else if (errorMessage.includes('DNI')) {
        toast.error('❌ El DNI ya está registrado en el sistema');
      } else if (errorMessage.includes('email')) {
        toast.error('❌ El email ya está registrado en el sistema');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Error saving socio:', error);
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

  // Función para manejar importación CSV con el componente mejorado
  const handleCsvImport = async (csvData: Record<string, string>[]) => {
    try {
      // Convertir los datos del CSV al formato esperado por importSocios
      const allowedEstados = ['activo', 'inactivo', 'pendiente', 'suspendido', 'vencido'] as const;
      const sociosData = csvData.map(row => ({
        nombre: row.nombre || '',
        email: row.email || '',
        dni: row.dni || '',
        telefono: row.telefono || '',
        numeroSocio: row.numeroSocio || '',
        estado: allowedEstados.includes((row.estado || '').toLowerCase() as typeof allowedEstados[number])
          ? ((row.estado || '').toLowerCase() as typeof allowedEstados[number])
          : 'activo',
        montoCuota: parseFloat(row.montoCuota) || 0,
        direccion: row.direccion || '',
        fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento) : undefined,
        fechaVencimiento: undefined
      }));

      await importSocios(sociosData);
      await handleRefresh();
      
      return {
        success: true,
        imported: sociosData.length,
        duplicates: 0,
        errors: []
      };
    } catch (error) {
      console.error('Error en importación CSV:', error);
      return {
        success: false,
        imported: 0,
        duplicates: 0,
        errors: [{ row: 0, error: 'Error general en la importación', data: {} }]
      };
    }
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

  // Funciones para selección múltiple
  const handleToggleSelect = (socioId: string) => {
    setSelectedSocios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(socioId)) {
        newSet.delete(socioId);
      } else {
        newSet.add(socioId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedSocios.size === filteredSocios.length) {
      setSelectedSocios(new Set());
    } else {
      setSelectedSocios(new Set(filteredSocios.map(s => s.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedSocios(new Set());
  };

  // Función para aplicar edición masiva
  const handleBulkEdit = async (updates: BulkUpdateData) => {
    const loadingToast = toast.loading(`Actualizando ${selectedSocios.size} socios...`);
    
    try {
      let successCount = 0;
      let errorCount = 0;

      // Actualizar cada socio seleccionado
      for (const socioId of selectedSocios) {
        try {
          const updateData: Partial<SocioFormData> = {};
          
          if (updates.estado) {
            updateData.estado = updates.estado as 'activo' | 'inactivo' | 'pendiente' | 'suspendido' | 'vencido';
          }
          if (updates.estadoMembresia) {
            updateData.estadoMembresia = updates.estadoMembresia as 'al_dia' | 'vencido' | 'pendiente';
          }
          if (updates.montoCuota !== undefined) {
            updateData.montoCuota = updates.montoCuota;
          }
          if (updates.fechaVencimiento) {
            updateData.fechaVencimiento = convertDateToTimestamp(updates.fechaVencimiento);
          }

          await updateSocio(socioId, updateData);
          successCount++;
        } catch (error) {
          console.error(`Error updating socio ${socioId}:`, error);
          errorCount++;
        }
      }

      toast.dismiss(loadingToast);
      
      if (errorCount === 0) {
        toast.success(`✅ ${successCount} socios actualizados exitosamente`);
      } else {
        toast.error(`⚠️ ${successCount} socios actualizados, ${errorCount} con errores`);
      }

      // Limpiar selección y refrescar
      setSelectedSocios(new Set());
      await handleRefresh();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error en la actualización masiva');
      console.error('Bulk update error:', error);
    }
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

  // Verificar si todos los socios filtrados están seleccionados
  const allSelected = filteredSocios.length > 0 && selectedSocios.size === filteredSocios.length;
  const someSelected = selectedSocios.size > 0 && selectedSocios.size < filteredSocios.length;

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
      {/* Metrics removed to avoid redundancy with Dashboard KPIs */}

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

              {/* Botón de Exportar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportExcel}
                disabled={exporting || socios.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-5 py-2.5 rounded-2xl hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl border border-white/20 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar socios a Excel"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                ) : (
                  <Download className="w-4 h-4 relative z-10" />
                )}
                <span className="hidden sm:inline relative z-10">
                  {exporting ? 'Exportando...' : 'Exportar'}
                </span>
              </motion.button>

              {/* Botón de Importación CSV Mejorado */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCsvImportOpen(true)}
                disabled={importing}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 text-white px-5 py-2.5 rounded-2xl hover:from-purple-600 hover:via-violet-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl border border-white/20 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Importar socios desde CSV con ejemplos"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {importing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                ) : (
                  <Upload className="w-4 h-4 relative z-10" />
                )}
                <span className="hidden sm:inline relative z-10">
                  {importing ? 'Importando...' : 'Importar CSV'}
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
                        {(socio.beneficiosUsados ?? 0) > 0 && (
                          <div className="flex items-center text-xs text-slate-600">
                            <CheckCircle className="w-3 h-3 mr-2" />
                            <span>{socio.beneficiosUsados ?? 0} beneficios usados</span>
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
              {/* Barra de acciones para selección múltiple */}
              <AnimatePresence>
                {selectedSocios.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200 px-6 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-semibold text-slate-900">
                            {selectedSocios.size} {selectedSocios.size === 1 ? 'socio seleccionado' : 'socios seleccionados'}
                          </span>
                        </div>
                        <button
                          onClick={handleClearSelection}
                          className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                        >
                          Limpiar selección
                        </button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBulkEditOpen(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Editar Seleccionados</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <table className="min-w-full">
                <thead className="bg-slate-50/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-5 h-5 rounded border-2 border-slate-300 hover:border-indigo-500 transition-colors"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : someSelected ? (
                          <Square className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </th>
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
                        <button
                          onClick={() => handleToggleSelect(socio.id)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 border-slate-300 hover:border-indigo-500 transition-colors"
                        >
                          {selectedSocios.has(socio.id) ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </td>
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

        {/* Enhanced CSV Import Dialog */}
        {csvImportOpen && (
          <EnhancedCsvImport
            open={csvImportOpen}
            onClose={() => setCsvImportOpen(false)}
            onImport={handleCsvImport}
            loading={importing}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Eliminar Socio Completamente"
            message={`¿Estás seguro de que deseas eliminar completamente al socio "${socioToDelete?.nombre}"? 

Esta acción:
• Eliminará PERMANENTEMENTE todos los datos del socio de la base de datos
• Eliminará su cuenta de Firebase Authentication 
• Eliminará su historial de beneficios, validaciones y actividades
• Permitirá que su email (${socioToDelete?.email}) pueda ser reutilizado para crear una nueva cuenta

⚠️ Esta acción NO se puede deshacer.`}
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

        {/* Bulk Edit Dialog */}
        {bulkEditOpen && (
          <BulkEditDialog
            open={bulkEditOpen}
            onClose={() => setBulkEditOpen(false)}
            onSave={handleBulkEdit}
            selectedCount={selectedSocios.size}
          />
        )}
      </AnimatePresence>
    </div>
  );
};