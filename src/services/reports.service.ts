import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Socio } from '@/types/socio';
import { Validacion } from '@/types/validacion';
import { Notification } from '@/types/notification';

export interface ReportData {
  id?: string;
  templateId: string;
  title: string;
  description: string;
  generatedAt: Timestamp;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: string;
  parameters: {
    dateRange: string;
    categoryFilter: string;
    startDate?: Timestamp;
    endDate?: Timestamp;
    includeCharts?: boolean;
    format?: 'pdf' | 'excel' | 'csv';
  };
  userId: string;
  asociacionId: string;
  data?: unknown;
  progress?: number;
  errorMessage?: string;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  category: 'members' | 'financial' | 'activity' | 'growth' | 'engagement';
  reportType: 'chart' | 'table' | 'summary' | 'dashboard';
  estimatedTime: string;
  isActive: boolean;
  isPremium?: boolean;
  isNew?: boolean;
  requiredData: string[];
  outputFormats: ('pdf' | 'excel' | 'csv')[];
}

export interface AnalyticsMetrics {
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  totalValidaciones: number;
  validacionesExitosas: number;
  tasaExito: number;
  crecimientoMensual: number;
  ingresosTotales: number;
  beneficiosMasUsados: Array<{
    id: string;
    nombre: string;
    usos: number;
  }>;
  actividadPorDia: Array<{
    fecha: string;
    validaciones: number;
    socios: number;
  }>;
  distribucionPorAsociacion: Array<{
    asociacionId: string;
    nombre: string;
    socios: number;
    validaciones: number;
  }>;
}

// Helper types for processed data
export interface ProcessedSocio extends Omit<Socio, 'creadoEn'> {
  id: string;
  creadoEn: Date;
}

export interface ProcessedValidacion extends Omit<Validacion, 'fechaHora'> {
  id: string;
  fechaHora: Date;
}

// Specific interfaces for each report type data
export interface MemberReportData {
  socios: (Socio & { id: string })[];
  validaciones: (Validacion & { id: string })[];
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  totalValidaciones: number;
  validacionesExitosas: number;
}

export interface GrowthReportData {
  socios: ProcessedSocio[];
  monthlyGrowth: Record<string, number>;
  totalGrowth: number;
  averageMonthlyGrowth: number;
}

export interface ActivityReportData {
  validaciones: ProcessedValidacion[];
  dailyActivity: Array<{
    fecha: string;
    validaciones: number;
    exitosas: number;
    fallidas: number;
    sociosUnicos: number;
  }>;
  totalValidaciones: number;
  promedioValidacionesDiarias: number;
}

export interface RetentionReportData {
  socios: ProcessedSocio[];
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  tasaRetencion: number;
  tasaAbandonoMensual: number;
}

export interface FinancialReportData {
  socios: (Socio & { id: string })[];
  sociosActivos: number;
  cuotaMensual: number;
  ingresosMensuales: number;
  ingresosAnuales: number;
  proyeccionTrimestral: number;
}

export interface DemographicReportData {
  socios: (Socio & { id: string })[];
  totalSocios: number;
  distribucionEstado: {
    activos: number;
    vencidos: number;
    inactivos: number;
  };
}

export interface EngagementReportData {
  validaciones: (Validacion & { id: string })[];
  sociosConActividad: number;
  promedioValidacionesPorSocio: number;
  totalValidaciones: number;
}

export interface CommunicationReportData {
  notifications: (Notification & { id: string })[];
  totalNotificaciones: number;
  notificacionesEnviadas: number;
}

// Union type for all report data types
export type ReportDataUnion = 
  | MemberReportData
  | GrowthReportData
  | ActivityReportData
  | RetentionReportData
  | FinancialReportData
  | DemographicReportData
  | EngagementReportData
  | CommunicationReportData;

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: unknown[];
  options: {
    responsive: boolean;
    plugins: {
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}

export interface ReportContent {
  template: ReportTemplate | null;
  data: ReportDataUnion;
  parameters: ReportData['parameters'];
  generatedAt: string;
  summary: string;
  charts: ChartData | null;
}

class ReportsService {
  private reportsCollection = 'reports';
  private templatesCollection = 'reportTemplates';

  // Generate real report with Firebase data
  async generateReport(
    templateId: string,
    userId: string,
    asociacionId: string,
    parameters: ReportData['parameters']
  ): Promise<string> {
    try {
      // Create report document
      const reportData: Omit<ReportData, 'id'> = {
        templateId,
        title: await this.getTemplateTitle(templateId),
        description: await this.getTemplateDescription(templateId),
        generatedAt: Timestamp.now(),
        status: 'generating',
        parameters,
        userId,
        asociacionId,
        progress: 0
      };

      const docRef = await addDoc(collection(db, this.reportsCollection), reportData);
      
      // Start background generation
      this.processReportGeneration(docRef.id, templateId, asociacionId, parameters);
      
      return docRef.id;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Error al generar el reporte');
    }
  }

  // Process report generation in background
  private async processReportGeneration(
    reportId: string,
    templateId: string,
    asociacionId: string,
    parameters: ReportData['parameters']
  ): Promise<void> {
    try {
      const reportRef = doc(db, this.reportsCollection, reportId);
      
      // Update progress
      await updateDoc(reportRef, { progress: 25 });

      // Fetch data based on template
      const data = await this.fetchReportData(templateId, asociacionId, parameters);
      
      await updateDoc(reportRef, { progress: 50 });

      // Generate report content
      const reportContent = await this.generateReportContent(templateId, data, parameters);
      
      await updateDoc(reportRef, { progress: 75 });

      // Simulate file generation and upload
      const downloadUrl = await this.uploadReportFile(reportContent, templateId);
      const fileSize = this.calculateFileSize(reportContent);

      await updateDoc(reportRef, { progress: 100 });

      // Mark as completed
      await updateDoc(reportRef, {
        status: 'completed',
        downloadUrl,
        fileSize,
        data: reportContent,
        progress: 100
      });

    } catch (error) {
      console.error('Error processing report:', error);
      
      // Mark as failed
      await updateDoc(doc(db, this.reportsCollection, reportId), {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Fetch data for report generation
  private async fetchReportData(
    templateId: string,
    asociacionId: string,
    parameters: ReportData['parameters']
  ): Promise<ReportDataUnion> {
    const startDate = parameters.startDate?.toDate() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = parameters.endDate?.toDate() || new Date();

    switch (templateId) {
      case 'member-summary':
        return await this.fetchMemberData(asociacionId, startDate, endDate);
      
      case 'growth-analysis':
        return await this.fetchGrowthData(asociacionId, startDate, endDate);
      
      case 'activity-timeline':
        return await this.fetchActivityData(asociacionId, startDate, endDate);
      
      case 'retention-analysis':
        return await this.fetchRetentionData(asociacionId);
      
      case 'financial-overview':
        return await this.fetchFinancialData(asociacionId);
      
      case 'demographic-analysis':
        return await this.fetchDemographicData(asociacionId);
      
      case 'engagement-metrics':
        return await this.fetchEngagementData(asociacionId, startDate, endDate);
      
      case 'communication-report':
        return await this.fetchCommunicationData(asociacionId, startDate, endDate);
      
      default:
        throw new Error('Template no encontrado');
    }
  }

  // Fetch member data
  private async fetchMemberData(asociacionId: string, startDate: Date, endDate: Date): Promise<MemberReportData> {
    const sociosQuery = query(
      collection(db, 'socios'),
      where('asociacionId', '==', asociacionId)
    );
    
    const sociosSnapshot = await getDocs(sociosQuery);
    const socios = sociosSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Socio & { id: string })[];

    const validacionesQuery = query(
      collection(db, 'validaciones'),
      where('asociacionId', '==', asociacionId),
      where('fechaHora', '>=', Timestamp.fromDate(startDate)),
      where('fechaHora', '<=', Timestamp.fromDate(endDate))
    );

    const validacionesSnapshot = await getDocs(validacionesQuery);
    const validaciones = validacionesSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Validacion & { id: string })[];

    return {
      socios,
      validaciones,
      totalSocios: socios.length,
      sociosActivos: socios.filter(s => s.estado === 'activo').length,
      sociosVencidos: socios.filter(s => s.estado === 'vencido').length,
      totalValidaciones: validaciones.length,
      validacionesExitosas: validaciones.filter(v => v.resultado === 'habilitado').length
    };
  }

  // Fetch growth data
  private async fetchGrowthData(asociacionId: string, startDate: Date, endDate: Date): Promise<GrowthReportData> {
    const sociosQuery = query(
      collection(db, 'socios'),
      where('asociacionId', '==', asociacionId),
      orderBy('creadoEn', 'desc')
    );

    const sociosSnapshot = await getDocs(sociosQuery);
    const socios: ProcessedSocio[] = sociosSnapshot.docs.map(doc => {
      const data = doc.data() as Socio;
      const creadoEnDate = (data.creadoEn && typeof data.creadoEn.toDate === 'function')
        ? data.creadoEn.toDate()
        : data.creadoEn instanceof Date
          ? data.creadoEn
          : new Date();
      
      return {
        ...data,
        id: doc.id,
        creadoEn: creadoEnDate
      };
    });

    // Group by month
    const monthlyGrowth: Record<string, number> = {};
    socios.forEach(socio => {
      if (socio.creadoEn >= startDate && socio.creadoEn <= endDate) {
        const monthKey = format(socio.creadoEn, 'yyyy-MM');
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
      }
    });

    const growthValues = Object.values(monthlyGrowth);
    const totalGrowth = growthValues.reduce((a, b) => a + b, 0);
    const averageMonthlyGrowth = growthValues.length > 0 ? totalGrowth / growthValues.length : 0;

    return {
      socios,
      monthlyGrowth,
      totalGrowth,
      averageMonthlyGrowth
    };
  }

  // Fetch activity data
  private async fetchActivityData(asociacionId: string, startDate: Date, endDate: Date): Promise<ActivityReportData> {
    const validacionesQuery = query(
      collection(db, 'validaciones'),
      where('asociacionId', '==', asociacionId),
      where('fechaHora', '>=', Timestamp.fromDate(startDate)),
      where('fechaHora', '<=', Timestamp.fromDate(endDate)),
      orderBy('fechaHora', 'desc')
    );

    const validacionesSnapshot = await getDocs(validacionesQuery);
    const validaciones: ProcessedValidacion[] = validacionesSnapshot.docs.map(doc => {
      const data = doc.data() as Validacion;
      const fechaHoraDate = (data.fechaHora && typeof data.fechaHora.toDate === 'function')
        ? data.fechaHora.toDate()
        : data.fechaHora instanceof Date
          ? data.fechaHora
          : new Date();
      
      return {
        ...data,
        id: doc.id,
        fechaHora: fechaHoraDate
      };
    });

    // Group by day
    const dailyActivity: Record<string, {
      fecha: string;
      validaciones: number;
      exitosas: number;
      fallidas: number;
      socios: Set<string>;
    }> = {};

    validaciones.forEach(validacion => {
      const dayKey = format(validacion.fechaHora, 'yyyy-MM-dd');
      if (!dailyActivity[dayKey]) {
        dailyActivity[dayKey] = {
          fecha: dayKey,
          validaciones: 0,
          exitosas: 0,
          fallidas: 0,
          socios: new Set()
        };
      }
      dailyActivity[dayKey].validaciones++;
      if (validacion.resultado === 'habilitado') {
        dailyActivity[dayKey].exitosas++;
      } else {
        dailyActivity[dayKey].fallidas++;
      }
      dailyActivity[dayKey].socios.add(validacion.socioId);
    });

    // Convert sets to counts
    const dailyActivityArray = Object.values(dailyActivity).map(day => ({
      fecha: day.fecha,
      validaciones: day.validaciones,
      exitosas: day.exitosas,
      fallidas: day.fallidas,
      sociosUnicos: day.socios.size
    }));

    const totalDays = Object.keys(dailyActivity).length;
    const promedioValidacionesDiarias = totalDays > 0 ? validaciones.length / totalDays : 0;

    return {
      validaciones,
      dailyActivity: dailyActivityArray,
      totalValidaciones: validaciones.length,
      promedioValidacionesDiarias
    };
  }

  // Fetch retention data
  private async fetchRetentionData(asociacionId: string): Promise<RetentionReportData> {
    const sociosQuery = query(
      collection(db, 'socios'),
      where('asociacionId', '==', asociacionId)
    );

    const sociosSnapshot = await getDocs(sociosQuery);
    const socios: ProcessedSocio[] = sociosSnapshot.docs.map(doc => {
      const data = doc.data() as Socio;
      const creadoEnDate = (data.creadoEn && typeof data.creadoEn.toDate === 'function')
        ? data.creadoEn.toDate()
        : data.creadoEn instanceof Date
          ? data.creadoEn
          : new Date();
      
      return {
        ...data,
        id: doc.id,
        creadoEn: creadoEnDate
      };
    });

    // Calculate retention metrics
    const totalSocios = socios.length;
    const sociosActivos = socios.filter(s => s.estado === 'activo').length;
    const sociosVencidos = socios.filter(s => s.estado === 'vencido').length;
    const tasaRetencion = totalSocios > 0 ? (sociosActivos / totalSocios) * 100 : 0;

    return {
      socios,
      totalSocios,
      sociosActivos,
      sociosVencidos,
      tasaRetencion,
      tasaAbandonoMensual: 100 - tasaRetencion
    };
  }

  // Fetch financial data
  private async fetchFinancialData(asociacionId: string): Promise<FinancialReportData> {
    const sociosQuery = query(
      collection(db, 'socios'),
      where('asociacionId', '==', asociacionId)
    );

    const sociosSnapshot = await getDocs(sociosQuery);
    const socios = sociosSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Socio & { id: string })[];

    // Calculate financial metrics (assuming monthly fee of $50)
    const cuotaMensual = 50;
    const sociosActivos = socios.filter(s => s.estado === 'activo').length;
    const ingresosMensuales = sociosActivos * cuotaMensual;
    const ingresosAnuales = ingresosMensuales * 12;

    return {
      socios,
      sociosActivos,
      cuotaMensual,
      ingresosMensuales,
      ingresosAnuales,
      proyeccionTrimestral: ingresosMensuales * 3
    };
  }

  // Fetch demographic data
  private async fetchDemographicData(asociacionId: string): Promise<DemographicReportData> {
    const sociosQuery = query(
      collection(db, 'socios'),
      where('asociacionId', '==', asociacionId)
    );

    const sociosSnapshot = await getDocs(sociosQuery);
    const socios = sociosSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Socio & { id: string })[];

    // Basic demographic analysis
    const distribucionEstado = {
      activos: socios.filter(s => s.estado === 'activo').length,
      vencidos: socios.filter(s => s.estado === 'vencido').length,
      inactivos: socios.filter(s => s.estado === 'inactivo').length
    };

    return {
      socios,
      totalSocios: socios.length,
      distribucionEstado
    };
  }

  // Fetch engagement data
  private async fetchEngagementData(asociacionId: string, startDate: Date, endDate: Date): Promise<EngagementReportData> {
    const validacionesQuery = query(
      collection(db, 'validaciones'),
      where('asociacionId', '==', asociacionId),
      where('fechaHora', '>=', Timestamp.fromDate(startDate)),
      where('fechaHora', '<=', Timestamp.fromDate(endDate))
    );

    const validacionesSnapshot = await getDocs(validacionesQuery);
    const validaciones = validacionesSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Validacion & { id: string })[];

    // Calculate engagement metrics
    const sociosConActividad = new Set(validaciones.map(v => v.socioId)).size;
    const promedioValidacionesPorSocio = sociosConActividad > 0 ? validaciones.length / sociosConActividad : 0;

    return {
      validaciones,
      sociosConActividad,
      promedioValidacionesPorSocio,
      totalValidaciones: validaciones.length
    };
  }

  // Fetch communication data
  private async fetchCommunicationData(asociacionId: string, startDate: Date, endDate: Date): Promise<CommunicationReportData> {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('asociacionId', '==', asociacionId),
      where('creadoEn', '>=', Timestamp.fromDate(startDate)),
      where('creadoEn', '<=', Timestamp.fromDate(endDate))
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as (Notification & { id: string })[];

    return {
      notifications,
      totalNotificaciones: notifications.length,
      notificacionesEnviadas: notifications.filter(n => n.status === 'read').length
    };
  }

  // Generate report content based on template and data
  private async generateReportContent(
    templateId: string, 
    data: ReportDataUnion, 
    parameters: ReportData['parameters']
  ): Promise<ReportContent> {
    const template = await this.getTemplate(templateId);
    
    return {
      template,
      data,
      parameters,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(templateId, data),
      charts: parameters.includeCharts ? this.generateChartData(templateId, data) : null
    };
  }

  // Generate summary based on template
  private generateSummary(templateId: string, data: ReportDataUnion): string {
    switch (templateId) {
      case 'member-summary': {
        const memberData = data as MemberReportData;
        return `Resumen de ${memberData.totalSocios} socios: ${memberData.sociosActivos} activos, ${memberData.sociosVencidos} vencidos. Total de ${memberData.totalValidaciones} validaciones con ${memberData.validacionesExitosas} exitosas.`;
      }
      
      case 'growth-analysis': {
        const growthData = data as GrowthReportData;
        return `Análisis de crecimiento: ${growthData.totalGrowth} nuevos socios en el período, con un promedio mensual de ${Math.round(growthData.averageMonthlyGrowth)} socios.`;
      }
      
      case 'activity-timeline': {
        const activityData = data as ActivityReportData;
        return `Análisis de actividad: ${activityData.totalValidaciones} validaciones totales con un promedio de ${Math.round(activityData.promedioValidacionesDiarias)} validaciones diarias.`;
      }
      
      case 'retention-analysis': {
        const retentionData = data as RetentionReportData;
        return `Análisis de retención: Tasa de retención del ${retentionData.tasaRetencion.toFixed(1)}% con ${retentionData.sociosActivos} socios activos de ${retentionData.totalSocios} totales.`;
      }
      
      case 'financial-overview': {
        const financialData = data as FinancialReportData;
        return `Resumen financiero: ${financialData.sociosActivos} socios activos generan $${financialData.ingresosMensuales} mensuales y $${financialData.ingresosAnuales} anuales.`;
      }
      
      case 'demographic-analysis': {
        const demographicData = data as DemographicReportData;
        return `Análisis demográfico: ${demographicData.totalSocios} socios totales distribuidos en ${demographicData.distribucionEstado.activos} activos, ${demographicData.distribucionEstado.vencidos} vencidos y ${demographicData.distribucionEstado.inactivos} inactivos.`;
      }
      
      case 'engagement-metrics': {
        const engagementData = data as EngagementReportData;
        return `Métricas de engagement: ${engagementData.sociosConActividad} socios con actividad, promedio de ${engagementData.promedioValidacionesPorSocio.toFixed(1)} validaciones por socio.`;
      }
      
      case 'communication-report': {
        const communicationData = data as CommunicationReportData;
        return `Reporte de comunicación: ${communicationData.totalNotificaciones} notificaciones totales, ${communicationData.notificacionesEnviadas} enviadas exitosamente.`;
      }
      
      default:
        return 'Reporte generado exitosamente.';
    }
  }

  // Generate chart data
  private generateChartData(templateId: string, data: ReportDataUnion): ChartData {
    switch (templateId) {
      case 'growth-analysis': {
        const growthData = data as GrowthReportData;
        return {
          type: 'line',
          data: Object.entries(growthData.monthlyGrowth).map(([month, count]) => ({
            x: month,
            y: count
          })),
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Crecimiento Mensual de Socios'
              }
            }
          }
        };
      }
      
      case 'activity-timeline': {
        const activityData = data as ActivityReportData;
        return {
          type: 'bar',
          data: activityData.dailyActivity,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Actividad Diaria de Validaciones'
              }
            }
          }
        };
      }
      
      default:
        return {
          type: 'line',
          data: [],
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Gráfico - ${templateId}`
              }
            }
          }
        };
    }
  }

  // Simulate file upload and return URL
  private async uploadReportFile(reportContent: ReportContent, templateId: string): Promise<string> {
    // In a real implementation, this would upload to Firebase Storage
    // For now, return a mock URL
    return `https://storage.googleapis.com/reports/${templateId}-${Date.now()}.pdf`;
  }

  // Calculate file size
  private calculateFileSize(reportContent: ReportContent): string {
    const sizeInBytes = JSON.stringify(reportContent).length;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    return sizeInKB > 1024 ? `${Math.round(sizeInKB / 1024)}MB` : `${sizeInKB}KB`;
  }

  // Get template info
  private async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    try {
      const templateDoc = await getDoc(doc(db, this.templatesCollection, templateId));
      return templateDoc.exists() ? { id: templateDoc.id, ...templateDoc.data() } as ReportTemplate : null;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  private async getTemplateTitle(templateId: string): Promise<string> {
    const template = await this.getTemplate(templateId);
    return template?.title || 'Reporte';
  }

  private async getTemplateDescription(templateId: string): Promise<string> {
    const template = await this.getTemplate(templateId);
    return template?.description || 'Descripción del reporte';
  }

  // Get user reports
  async getUserReports(userId: string, limitCount?: number): Promise<ReportData[]> {
    try {
      const reportsQuery = query(
        collection(db, this.reportsCollection),
        where('userId', '==', userId),
        orderBy('generatedAt', 'desc'),
        ...(limitCount ? [limit(limitCount)] : [])
      );

      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReportData[];
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }
  }

  // Subscribe to user reports
  subscribeToUserReports(userId: string, callback: (reports: ReportData[]) => void): () => void {
    const reportsQuery = query(
      collection(db, this.reportsCollection),
      where('userId', '==', userId),
      orderBy('generatedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(reportsQuery, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReportData[];
      callback(reports);
    });
  }

  // Delete report
  async deleteReport(reportId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.reportsCollection, reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Error al eliminar el reporte');
    }
  }

  // Get analytics metrics
  async getAnalyticsMetrics(asociacionId: string, startDate: Date, endDate: Date): Promise<AnalyticsMetrics> {
    const memberData = await this.fetchMemberData(asociacionId, startDate, endDate);
    const activityData = await this.fetchActivityData(asociacionId, startDate, endDate);

    return {
      totalSocios: memberData.totalSocios,
      sociosActivos: memberData.sociosActivos,
      sociosVencidos: memberData.sociosVencidos,
      totalValidaciones: memberData.totalValidaciones,
      validacionesExitosas: memberData.validacionesExitosas,
      tasaExito: memberData.totalValidaciones > 0 ? (memberData.validacionesExitosas / memberData.totalValidaciones) * 100 : 0,
      crecimientoMensual: 0, // Calculate based on historical data
      ingresosTotales: memberData.sociosActivos * 50, // Assuming $50 monthly fee
      beneficiosMasUsados: [],
      actividadPorDia: activityData.dailyActivity.map(day => ({
        fecha: day.fecha,
        validaciones: day.validaciones,
        socios: day.sociosUnicos
      })),
      distribucionPorAsociacion: []
    };
  }
}

export const reportsService = new ReportsService();