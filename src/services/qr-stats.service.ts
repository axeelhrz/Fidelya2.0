import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleError } from '@/lib/error-handler';

export interface QRScanData {
  id: string;
  comercioId: string;
  socioId?: string;
  fechaEscaneo: Date;
  ubicacion?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  dispositivo?: string;
  userAgent?: string;
  ip?: string;
  validado: boolean;
  beneficioId?: string;
  creadoEn: Date;
}

export interface QRValidationData {
  id: string;
  comercioId: string;
  socioId: string;
  qrScanId: string;
  beneficioId?: string;
  exitoso: boolean;
  montoDescuento?: number;
  fechaValidacion: Date;
  creadoEn: Date;
}

export interface QRStats {
  totalScans: number;
  totalValidations: number;
  uniqueUsers: number;
  conversionRate: number;
  scansGrowth: number;
  validationsGrowth: number;
  usersGrowth: number;
  conversionGrowth: number;
  dailyScans: Array<{
    date: string;
    scans: number;
    validations: number;
    uniqueUsers: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    scans: number;
  }>;
  deviceStats: Array<{
    name: string;
    value: number;
  }>;
  topLocations: Array<{
    city: string;
    country: string;
    scans: number;
  }>;
  recentActivity: Array<{
    time: string;
    location: string;
    device: string;
    type: 'scan' | 'validation';
  }>;
}

export interface RealTimeQRStats {
  scansToday: number;
  scansThisWeek: number;
  validationsToday: number;
  validationsThisWeek: number;
  activeUsers: number;
}

class QRStatsService {
  private readonly qrScansCollection = 'qr_scans';
  private readonly qrValidationsCollection = 'qr_validations';

  /**
   * Track QR scan
   */
  async trackQRScan(
    comercioId: string,
    scanData: {
      socioId?: string;
      location?: { latitude: number; longitude: number };
      device?: string;
      userAgent?: string;
    }
  ): Promise<string | null> {
    try {
      const scanRecord = {
        comercioId,
        socioId: scanData.socioId || null,
        fechaEscaneo: serverTimestamp(),
        ubicacion: scanData.location ? {
          latitude: scanData.location.latitude,
          longitude: scanData.location.longitude,
          city: await this.getCityFromCoordinates(),
          country: 'Argentina' // Default, could be enhanced with geolocation API
        } : null,
        dispositivo: scanData.device || this.getDeviceFromUserAgent(scanData.userAgent),
        userAgent: scanData.userAgent || null,
        ip: null, // Would be set by server-side function
        validado: false,
        beneficioId: null,
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.qrScansCollection), scanRecord);
      
      console.log('✅ QR scan tracked successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      handleError(error, 'Track QR Scan');
      return null;
    }
  }

  /**
   * Track QR validation
   */
  async trackQRValidation(
    comercioId: string,
    validationData: {
      socioId: string;
      qrScanId?: string;
      beneficioId?: string;
      success: boolean;
      amount?: number;
    }
  ): Promise<string | null> {
    try {
      const validationRecord = {
        comercioId,
        socioId: validationData.socioId,
        qrScanId: validationData.qrScanId || null,
        beneficioId: validationData.beneficioId || null,
        exitoso: validationData.success,
        montoDescuento: validationData.amount || 0,
        fechaValidacion: serverTimestamp(),
        creadoEn: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.qrValidationsCollection), validationRecord);
      
      console.log('✅ QR validation tracked successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      handleError(error, 'Track QR Validation');
      return null;
    }
  }

  /**
   * Get QR statistics for a date range
   */
  async getQRStats(comercioId: string, dateRange: string = '7d'): Promise<QRStats> {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Get scans data
      const scansQuery = query(
        collection(db, this.qrScansCollection),
        where('comercioId', '==', comercioId),
        where('fechaEscaneo', '>=', Timestamp.fromDate(startDate)),
        where('fechaEscaneo', '<=', Timestamp.fromDate(endDate)),
        orderBy('fechaEscaneo', 'desc')
      );

      const scansSnapshot = await getDocs(scansQuery);
      const scans = scansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaEscaneo: doc.data().fechaEscaneo?.toDate() || new Date(),
        creadoEn: doc.data().creadoEn?.toDate() || new Date(),
      })) as QRScanData[];

      // Get validations data
      const validationsQuery = query(
        collection(db, this.qrValidationsCollection),
        where('comercioId', '==', comercioId),
        where('fechaValidacion', '>=', Timestamp.fromDate(startDate)),
        where('fechaValidacion', '<=', Timestamp.fromDate(endDate)),
        orderBy('fechaValidacion', 'desc')
      );

      const validationsSnapshot = await getDocs(validationsQuery);
      const validations = validationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaValidacion: doc.data().fechaValidacion?.toDate() || new Date(),
        creadoEn: doc.data().creadoEn?.toDate() || new Date(),
      })) as QRValidationData[];

      // Calculate previous period for growth comparison
      const previousPeriod = this.getPreviousPeriod(startDate, endDate);
      const previousScans = await this.getScansForPeriod(comercioId, previousPeriod.start, previousPeriod.end);
      const previousValidations = await this.getValidationsForPeriod(comercioId, previousPeriod.start, previousPeriod.end);

      // Calculate stats
      const totalScans = scans.length;
      const totalValidations = validations.length;
      const uniqueUsers = new Set(scans.map(scan => scan.socioId).filter(Boolean)).size;
      const conversionRate = totalScans > 0 ? (totalValidations / totalScans) * 100 : 0;

      // Calculate growth rates
      const scansGrowth = this.calculateGrowth(totalScans, previousScans.length);
      const validationsGrowth = this.calculateGrowth(totalValidations, previousValidations.length);
      const previousUniqueUsers = new Set(previousScans.map(scan => scan.socioId).filter(Boolean)).size;
      const usersGrowth = this.calculateGrowth(uniqueUsers, previousUniqueUsers);
      const previousConversionRate = previousScans.length > 0 ? (previousValidations.length / previousScans.length) * 100 : 0;
      const conversionGrowth = this.calculateGrowth(conversionRate, previousConversionRate);

      // Process daily data
      const dailyScans = this.processDailyData(scans, validations, startDate, endDate);

      // Process hourly activity
      const hourlyActivity = this.processHourlyActivity(scans);

      // Process device stats
      const deviceStats = this.processDeviceStats(scans);

      // Process location stats
      const topLocations = this.processLocationStats(scans);

      // Process recent activity
      const recentActivity = this.processRecentActivity(scans, validations);

      return {
        totalScans,
        totalValidations,
        uniqueUsers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        scansGrowth: Math.round(scansGrowth * 100) / 100,
        validationsGrowth: Math.round(validationsGrowth * 100) / 100,
        usersGrowth: Math.round(usersGrowth * 100) / 100,
        conversionGrowth: Math.round(conversionGrowth * 100) / 100,
        dailyScans,
        hourlyActivity,
        deviceStats,
        topLocations,
        recentActivity,
      };
    } catch (error) {
      handleError(error, 'Get QR Stats');
      return this.getEmptyStats();
    }
  }

  /**
   * Get real-time QR statistics
   */
  async getRealTimeStats(comercioId: string): Promise<RealTimeQRStats> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get today's scans
      const todayScansQuery = query(
        collection(db, this.qrScansCollection),
        where('comercioId', '==', comercioId),
        where('fechaEscaneo', '>=', Timestamp.fromDate(today))
      );

      const todayScansSnapshot = await getDocs(todayScansQuery);
      const scansToday = todayScansSnapshot.size;

      // Get week's scans
      const weekScansQuery = query(
        collection(db, this.qrScansCollection),
        where('comercioId', '==', comercioId),
        where('fechaEscaneo', '>=', Timestamp.fromDate(weekAgo))
      );

      const weekScansSnapshot = await getDocs(weekScansQuery);
      const scansThisWeek = weekScansSnapshot.size;

      // Get today's validations
      const todayValidationsQuery = query(
        collection(db, this.qrValidationsCollection),
        where('comercioId', '==', comercioId),
        where('fechaValidacion', '>=', Timestamp.fromDate(today))
      );

      const todayValidationsSnapshot = await getDocs(todayValidationsQuery);
      const validationsToday = todayValidationsSnapshot.size;

      // Get week's validations
      const weekValidationsQuery = query(
        collection(db, this.qrValidationsCollection),
        where('comercioId', '==', comercioId),
        where('fechaValidacion', '>=', Timestamp.fromDate(weekAgo))
      );

      const weekValidationsSnapshot = await getDocs(weekValidationsQuery);
      const validationsThisWeek = weekValidationsSnapshot.size;

      // Calculate active users (unique users who scanned in the last week)
      const activeUsers = new Set(
        weekScansSnapshot.docs
          .map(doc => doc.data().socioId)
          .filter(Boolean)
      ).size;

      return {
        scansToday,
        scansThisWeek,
        validationsToday,
        validationsThisWeek,
        activeUsers,
      };
    } catch (error) {
      handleError(error, 'Get Real Time QR Stats');
      return {
        scansToday: 0,
        scansThisWeek: 0,
        validationsToday: 0,
        validationsThisWeek: 0,
        activeUsers: 0,
      };
    }
  }

  /**
   * Private helper methods
   */
  private getDateRange(range: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
    const periodLength = endDate.getTime() - startDate.getTime();
    return {
      start: new Date(startDate.getTime() - periodLength),
      end: new Date(startDate.getTime())
    };
  }

  private async getScansForPeriod(comercioId: string, startDate: Date, endDate: Date): Promise<QRScanData[]> {
    const scansQuery = query(
      collection(db, this.qrScansCollection),
      where('comercioId', '==', comercioId),
      where('fechaEscaneo', '>=', Timestamp.fromDate(startDate)),
      where('fechaEscaneo', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(scansQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaEscaneo: doc.data().fechaEscaneo?.toDate() || new Date(),
      creadoEn: doc.data().creadoEn?.toDate() || new Date(),
    })) as QRScanData[];
  }

  private async getValidationsForPeriod(comercioId: string, startDate: Date, endDate: Date): Promise<QRValidationData[]> {
    const validationsQuery = query(
      collection(db, this.qrValidationsCollection),
      where('comercioId', '==', comercioId),
      where('fechaValidacion', '>=', Timestamp.fromDate(startDate)),
      where('fechaValidacion', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(validationsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaValidacion: doc.data().fechaValidacion?.toDate() || new Date(),
      creadoEn: doc.data().creadoEn?.toDate() || new Date(),
    })) as QRValidationData[];
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private processDailyData(
    scans: QRScanData[],
    validations: QRValidationData[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; scans: number; validations: number; uniqueUsers: number }> {
    const dailyData: { [key: string]: { scans: number; validations: number; users: Set<string> } } = {};

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData[dateKey] = { scans: 0, validations: 0, users: new Set() };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process scans
    scans.forEach(scan => {
      const dateKey = scan.fechaEscaneo.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].scans++;
        if (scan.socioId) {
          dailyData[dateKey].users.add(scan.socioId);
        }
      }
    });

    // Process validations
    validations.forEach(validation => {
      const dateKey = validation.fechaValidacion.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].validations++;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      scans: data.scans,
      validations: data.validations,
      uniqueUsers: data.users.size,
    }));
  }

  private processHourlyActivity(scans: QRScanData[]): Array<{ hour: number; scans: number }> {
    const hourlyData: { [key: number]: number } = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    // Process scans
    scans.forEach(scan => {
      const hour = scan.fechaEscaneo.getHours();
      hourlyData[hour]++;
    });

    return Object.entries(hourlyData).map(([hour, scans]) => ({
      hour: parseInt(hour),
      scans,
    }));
  }

  private processDeviceStats(scans: QRScanData[]): Array<{ name: string; value: number }> {
    const deviceCounts: { [key: string]: number } = {};
    const total = scans.length;

    scans.forEach(scan => {
      const device = scan.dispositivo || 'Desconocido';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    return Object.entries(deviceCounts)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  private processLocationStats(scans: QRScanData[]): Array<{ city: string; country: string; scans: number }> {
    const locationCounts: { [key: string]: { country: string; scans: number } } = {};

    scans.forEach(scan => {
      if (scan.ubicacion?.city) {
        const city = scan.ubicacion.city;
        const country = scan.ubicacion.country || 'Argentina';
        
        if (locationCounts[city]) {
          locationCounts[city].scans++;
        } else {
          locationCounts[city] = { country, scans: 1 };
        }
      }
    });

    return Object.entries(locationCounts)
      .map(([city, data]) => ({
        city,
        country: data.country,
        scans: data.scans,
      }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5);
  }

  private processRecentActivity(
    scans: QRScanData[],
    validations: QRValidationData[]
  ): Array<{ time: string; location: string; device: string; type: 'scan' | 'validation' }> {
    const activities: Array<{ time: string; location: string; device: string; type: 'scan' | 'validation' }> = [];

    // Add recent scans
    scans.slice(0, 5).forEach(scan => {
      activities.push({
        time: this.formatTimeAgo(scan.fechaEscaneo),
        location: scan.ubicacion?.city || 'Ubicación desconocida',
        device: scan.dispositivo || 'Dispositivo desconocido',
        type: 'scan',
      });
    });

    // Add recent validations
    validations.slice(0, 5).forEach(validation => {
      activities.push({
        time: this.formatTimeAgo(validation.fechaValidacion),
        location: 'Validación exitosa',
        device: 'Sistema',
        type: 'validation',
      });
    });

    return activities.slice(0, 10);
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  }

  private async getCityFromCoordinates(): Promise<string> {
    // This would typically use a geocoding service
    // For now, return a placeholder
    return 'Ciudad desconocida';
  }

  private getDeviceFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Desconocido';

    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';

    return 'Otro';
  }

  private getEmptyStats(): QRStats {
    return {
      totalScans: 0,
      totalValidations: 0,
      uniqueUsers: 0,
      conversionRate: 0,
      scansGrowth: 0,
      validationsGrowth: 0,
      usersGrowth: 0,
      conversionGrowth: 0,
      dailyScans: [],
      hourlyActivity: [],
      deviceStats: [],
      topLocations: [],
      recentActivity: [],
    };
  }
}

// Export singleton instance
export const qrStatsService = new QRStatsService();
export default qrStatsService;
