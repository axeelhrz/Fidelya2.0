'use client';

import { useState, useCallback } from 'react';
import { Socio } from '@/types/socio';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  fields: string[];
  filters: {
    status?: string;
    dateRange?: string;
  };
}

export interface ExportProgress {
  step: string;
  progress: number;
  message: string;
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const calculateAnalytics = useCallback((socio: Socio) => {
    const now = new Date();
    const createdDate = socio.creadoEn.toDate();
    const antiguedad = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const pagos = socio.pagos || [];
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const promedioMensual = totalPagos > 0 ? montoTotal / Math.max(1, Math.ceil(antiguedad / 30)) : 0;
    
    // Calculate engagement score based on activity
    const engagement = Math.min(100, Math.max(0, 
      (totalPagos * 20) + 
      (antiguedad > 365 ? 30 : antiguedad / 365 * 30) + 
      (socio.estado === 'activo' ? 50 : 0)
    ));

    return {
      antiguedad,
      totalPagos,
      montoTotal,
      promedioMensual: Math.round(promedioMensual * 100) / 100,
      engagement: Math.round(engagement),
      ultimaActividad: pagos.length > 0 ? pagos[pagos.length - 1].fecha.toDate() : createdDate
    };
  }, []);

  const generateExportData = useCallback((socios: Socio[], fields: string[], format: string) => {
    return socios.map(socio => {
      const analytics = calculateAnalytics(socio);
      const row: Record<string, unknown> = {};
      
      fields.forEach(field => {
        switch (field) {
          case 'nombre':
            row.nombre = socio.nombre;
            break;
          case 'email':
            row.email = socio.email;
            break;
          case 'estado':
            row.estado = socio.estado;
            break;
          case 'telefono':
            row.telefono = socio.telefono || '';
            break;
          case 'dni':
            row.dni = socio.dni || '';
            break;
          case 'creadoEn':
            row.fechaAlta = socio.creadoEn.toDate().toLocaleDateString('es-ES');
            break;
          case 'ultimaActividad':
            row.ultimaActividad = analytics.ultimaActividad.toLocaleDateString('es-ES');
            break;
          case 'antiguedad':
            row.antiguedad = analytics.antiguedad;
            break;
          case 'totalPagos':
            row.totalPagos = analytics.totalPagos;
            break;
          case 'montoTotal':
            row.montoTotal = analytics.montoTotal;
            break;
          case 'promedioMensual':
            row.promedioMensual = analytics.promedioMensual;
            break;
          case 'engagement':
            row.engagement = analytics.engagement;
            break;
          case 'asociacionId':
            row.asociacionId = socio.asociacionId;
            break;
          case 'tipoMembresia':
            row.tipoMembresia = socio.estado === 'activo' ? 'Premium' : 'Básica';
            break;
          case 'notas':
            row.notas = '';
            break;
          case 'tags':
            row.tags = format === 'json' ? [] : '';
            break;
          default:
            row[field] = '';
        }
      });
      
      return row;
    });
  }, [calculateAnalytics]);

  const downloadFile = useCallback((content: string | object, filename: string, mimeType: string) => {
    let blob: Blob;
    
    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = new Blob([JSON.stringify(content, null, 2)], { type: mimeType });
    }
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportData = useCallback(async (socios: Socio[], options: ExportOptions) => {
    if (options.fields.length === 0) {
      toast.error('Selecciona al menos un campo para exportar');
      return;
    }

    setIsExporting(true);
    
    try {
      // Step 1: Preparing data
      setProgress({
        step: 'Preparando datos...',
        progress: 10,
        message: 'Recopilando información de socios'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Processing
      setProgress({
        step: 'Procesando información...',
        progress: 40,
        message: 'Calculando métricas y análisis'
      });
      
      const exportData = generateExportData(socios, options.fields, options.format);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 3: Generating file
      setProgress({
        step: 'Generando archivo...',
        progress: 70,
        message: `Creando archivo ${options.format.toUpperCase()}`
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      const fileExtensions = {
        csv: '.csv',
        json: '.json',
        excel: '.xlsx',
        pdf: '.pdf'
      };
      
      const filename = `socios_export_${timestamp}${fileExtensions[options.format]}`;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Download
      setProgress({
        step: 'Descargando archivo...',
        progress: 90,
        message: 'Preparando descarga'
      });
      
      const fieldLabels = {
        nombre: 'Nombre Completo',
        email: 'Email',
        estado: 'Estado',
        telefono: 'Teléfono',
        dni: 'DNI/Documento',
        fechaAlta: 'Fecha de Alta',
        ultimaActividad: 'Última Actividad',
        antiguedad: 'Antigüedad (días)',
        totalPagos: 'Total de Pagos',
        montoTotal: 'Monto Total',
        promedioMensual: 'Promedio Mensual',
        engagement: 'Engagement (%)',
        asociacionId: 'ID Asociación',
        tipoMembresia: 'Tipo de Socio',
        notas: 'Notas',
        tags: 'Etiquetas'
      };
      
      switch (options.format) {
        case 'csv':
          const headers = options.fields.map(field => fieldLabels[field as keyof typeof fieldLabels] || field);
          
          const csvContent = Papa.unparse({
            fields: headers,
            data: exportData.map(row => headers.map((_, index) => {
              const fieldId = options.fields[index];
              return row[fieldId] || '';
            }))
          });
          
          downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
          break;
          
        case 'json':
          const jsonData = {
            metadata: {
              exportDate: new Date().toISOString(),
              totalRecords: exportData.length,
              fields: options.fields,
              filters: options.filters,
              version: '1.0'
            },
            data: exportData
          };
          
          downloadFile(jsonData, filename, 'application/json');
          break;
          
        case 'excel':
          // For now, export as CSV with Excel-friendly format
          const excelHeaders = options.fields.map(field => fieldLabels[field as keyof typeof fieldLabels] || field);
          
          const excelContent = Papa.unparse({
            fields: excelHeaders,
            data: exportData.map(row => excelHeaders.map((_, index) => {
              const fieldId = options.fields[index];
              return row[fieldId] || '';
            }))
          });
          
          downloadFile(excelContent, filename.replace('.xlsx', '.csv'), 'text/csv;charset=utf-8;');
          toast('Archivo exportado como CSV compatible con Excel');
          break;
          
        case 'pdf':
          // Create a structured text report
          const pdfContent = `
REPORTE DE SOCIOS - FIDELYA
==============================

Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}
Hora de exportación: ${new Date().toLocaleTimeString('es-ES')}

CAMPOS EXPORTADOS:
------------------
${options.fields.map(field => `• ${fieldLabels[field as keyof typeof fieldLabels] || field}`).join('\n')}

DATOS DE SOCIOS:
==================

${exportData.map((row, index) => {
  const memberInfo = [
    `${index + 1}. ${row.nombre || 'Sin nombre'}`,
    `   Email: ${row.email || 'Sin email'}`,
    `   Estado: ${row.estado || 'Sin estado'}`,
    row.telefono ? `   Teléfono: ${row.telefono}` : '',
    row.fechaAlta ? `   Fecha de alta: ${row.fechaAlta}` : '',
    row.engagement ? `   Engagement: ${row.engagement}%` : ''
  ].filter(Boolean).join('\n');
  
  return memberInfo;
}).join('\n\n')}

==========================================
Generado por Fidelya - Sistema de Gestión de Socios
Versión 1.0 - ${new Date().getFullYear()}
          `.trim();
          
          downloadFile(pdfContent, filename.replace('.pdf', '.txt'), 'text/plain;charset=utf-8;');
          toast('Reporte exportado como archivo de texto estructurado');
          break;
      }
      
      // Step 5: Complete
      setProgress({
        step: 'Completado',
        progress: 100,
        message: 'Archivo descargado exitosamente'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success(`Archivo ${filename} descargado correctamente`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  }, [generateExportData, downloadFile]);

  const getExportStats = useCallback((socios: Socio[], fields: string[]) => {
    const totalSize = socios.length * fields.length;
    const estimatedFileSize = totalSize < 1000 ? '< 1KB' : 
                             totalSize < 10000 ? '< 10KB' : 
                             totalSize < 100000 ? '< 100KB' : '> 100KB';
    
    return {
      totalRecords: socios.length,
      totalFields: fields.length,
      estimatedSize: estimatedFileSize,
      dataPoints: totalSize
    };
  }, []);

  return {
    exportData,
    isExporting,
    progress,
    getExportStats
  };
};