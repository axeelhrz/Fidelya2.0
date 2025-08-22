import { Timestamp } from 'firebase/firestore';

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
  icon?: string;
  color?: string;
  gradient?: string;
  popularity?: number;
  dataPoints?: number;
}

export interface ReportParameters {
  dateRange: string;
  categoryFilter: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  includeCharts?: boolean;
  format?: 'pdf' | 'excel' | 'csv';
  filters?: Record<string, unknown>;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportData {
  id?: string;
  templateId: string;
  title: string;
  description: string;
  generatedAt: Timestamp;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: string;
  parameters: ReportParameters;
  userId: string;
  asociacionId: string;
  data?: Record<string, unknown>;
  progress?: number;
  errorMessage?: string;
  expiresAt?: Timestamp;
  downloadCount?: number;
  lastDownloaded?: Timestamp;
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
  tendenciaCrecimiento?: Array<{
    periodo: string;
    nuevos: number;
    activos: number;
    vencidos: number;
  }>;
  metricsGeneratedAt: Timestamp;
}

export interface ReportFilter {
  category?: string;
  status?: ReportData['status'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  templateId?: string;
  searchTerm?: string;
}

export interface ReportStats {
  total: number;
  completed: number;
  generating: number;
  failed: number;
  completionRate: number;
  averageGenerationTime?: number;
  totalDownloads?: number;
  mostPopularTemplate?: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: string[];
}

export interface ReportSchedule {
  id: string;
  templateId: string;
  userId: string;
  asociacionId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  parameters: ReportParameters;
  isActive: boolean;
  nextRun: Timestamp;
  lastRun?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
