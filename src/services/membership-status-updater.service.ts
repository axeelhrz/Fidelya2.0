import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

interface MembershipUpdateResult {
  success: boolean;
  updatedCount: number;
  errors: string[];
  details?: {
    markedAsExpired: number;
    markedAsUpToDate: number;
    alreadyCorrect: number;
  };
}

class MembershipStatusUpdaterService {
  private readonly collection = COLLECTIONS.SOCIOS;

  /**
   * Update membership status for all expired members across all associations
   */
  async updateAllExpiredMemberships(): Promise<MembershipUpdateResult> {
    try {
      console.log('🔄 Starting global membership status update...');
      
      const now = new Date();
      const batch = writeBatch(db);
      let updatedCount = 0;
      const errors: string[] = [];
      const details = {
        markedAsExpired: 0,
        markedAsUpToDate: 0,
        alreadyCorrect: 0
      };

      // Query all active socios that might be expired
      const q = query(
        collection(db, this.collection),
        where('estado', '==', 'activo')
      );

      const snapshot = await getDocs(q);
      console.log(`📊 Found ${snapshot.docs.length} active socios to check`);

      snapshot.docs.forEach(docSnapshot => {
        try {
          const data = docSnapshot.data();
          const fechaVencimiento = data.fechaVencimiento?.toDate();
          const currentEstadoMembresia = data.estadoMembresia;
          const socioName = data.nombre || docSnapshot.id;

          // Check if membership is expired and needs update
          if (fechaVencimiento && fechaVencimiento < now) {
            if (currentEstadoMembresia !== 'vencido') {
              batch.update(docSnapshot.ref, {
                estadoMembresia: 'vencido',
                actualizadoEn: serverTimestamp(),
              });
              updatedCount++;
              details.markedAsExpired++;
              console.log(`⏰ Marking socio ${socioName} as expired (vencimiento: ${fechaVencimiento.toLocaleDateString()})`);
            } else {
              details.alreadyCorrect++;
            }
          } else if (fechaVencimiento && fechaVencimiento >= now) {
            // If membership is not expired but marked as expired, update to 'al_dia'
            if (currentEstadoMembresia === 'vencido') {
              batch.update(docSnapshot.ref, {
                estadoMembresia: 'al_dia',
                actualizadoEn: serverTimestamp(),
              });
              updatedCount++;
              details.markedAsUpToDate++;
              console.log(`✅ Marking socio ${socioName} as up to date (vencimiento: ${fechaVencimiento.toLocaleDateString()})`);
            } else {
              details.alreadyCorrect++;
            }
          } else {
            // No expiration date - keep as is
            details.alreadyCorrect++;
          }
        } catch (error) {
          const errorMsg = `Error processing socio ${docSnapshot.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      });

      // Commit all updates
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully updated ${updatedCount} membership statuses:`, details);
      } else {
        console.log('ℹ️ No membership statuses needed updating');
      }

      return {
        success: true,
        updatedCount,
        errors,
        details
      };
    } catch (error) {
      const errorMsg = `Failed to update membership statuses: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      handleError(error, 'Update All Expired Memberships');
      
      return {
        success: false,
        updatedCount: 0,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Update membership status for a specific association
   */
  async updateAssociationMemberships(asociacionId: string): Promise<MembershipUpdateResult> {
    try {
      console.log(`🔄 Updating membership statuses for association: ${asociacionId}`);
      
      const now = new Date();
      const batch = writeBatch(db);
      let updatedCount = 0;
      const errors: string[] = [];
      const details = {
        markedAsExpired: 0,
        markedAsUpToDate: 0,
        alreadyCorrect: 0
      };

      const q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId),
        where('estado', '==', 'activo')
      );

      const snapshot = await getDocs(q);
      console.log(`📊 Found ${snapshot.docs.length} active socios in association to check`);

      snapshot.docs.forEach(docSnapshot => {
        try {
          const data = docSnapshot.data();
          const fechaVencimiento = data.fechaVencimiento?.toDate();
          const currentEstadoMembresia = data.estadoMembresia;
          const socioName = data.nombre || docSnapshot.id;

          if (fechaVencimiento && fechaVencimiento < now && currentEstadoMembresia !== 'vencido') {
            batch.update(docSnapshot.ref, {
              estadoMembresia: 'vencido',
              actualizadoEn: serverTimestamp(),
            });
            updatedCount++;
            details.markedAsExpired++;
            console.log(`⏰ Marking socio ${socioName} as expired (vencimiento: ${fechaVencimiento.toLocaleDateString()})`);
          } else if (fechaVencimiento && fechaVencimiento >= now && currentEstadoMembresia === 'vencido') {
            batch.update(docSnapshot.ref, {
              estadoMembresia: 'al_dia',
              actualizadoEn: serverTimestamp(),
            });
            updatedCount++;
            details.markedAsUpToDate++;
            console.log(`✅ Marking socio ${socioName} as up to date (vencimiento: ${fechaVencimiento.toLocaleDateString()})`);
          } else {
            details.alreadyCorrect++;
          }
        } catch (error) {
          const errorMsg = `Error processing socio ${docSnapshot.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully updated ${updatedCount} membership statuses for association ${asociacionId}:`, details);
      } else {
        console.log(`ℹ️ No membership statuses needed updating for association ${asociacionId}`);
      }

      return {
        success: true,
        updatedCount,
        errors,
        details
      };
    } catch (error) {
      const errorMsg = `Failed to update association memberships: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      handleError(error, 'Update Association Memberships');
      
      return {
        success: false,
        updatedCount: 0,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Get real-time membership statistics with automatic status checking
   */
  async getRealtimeMembershipStats(asociacionId: string) {
    try {
      console.log(`📊 Calculating real-time membership stats for association: ${asociacionId}`);
      
      const q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId)
      );

      const snapshot = await getDocs(q);
      const socios = snapshot.docs.map(doc => doc.data());
      const now = new Date();

      // Calculate stats with real-time expiration checking
      const total = socios.length;
      const activos = socios.filter(s => s.estado === 'activo').length;
      const inactivos = socios.filter(s => s.estado === 'inactivo').length;
      
      // Real-time calculation of membership status
      let alDia = 0;
      let vencidos = 0;
      let pendientes = 0;

      // Track discrepancies for logging
      let discrepanciasDetectadas = 0;

      socios.forEach(socio => {
        const fechaVencimiento = socio.fechaVencimiento?.toDate();
        const estadoMembresia = socio.estadoMembresia;
        
        if (!fechaVencimiento) {
          // No expiration date set - consider as pending
          pendientes++;
        } else if (fechaVencimiento < now) {
          // Expired
          vencidos++;
          
          // Check for discrepancy
          if (estadoMembresia !== 'vencido') {
            discrepanciasDetectadas++;
            console.log(`⚠️ Discrepancy detected: Socio ${socio.nombre || 'Unknown'} is expired but marked as '${estadoMembresia}'`);
          }
        } else {
          // Up to date
          alDia++;
          
          // Check for discrepancy
          if (estadoMembresia === 'vencido') {
            discrepanciasDetectadas++;
            console.log(`⚠️ Discrepancy detected: Socio ${socio.nombre || 'Unknown'} is up to date but marked as 'vencido'`);
          }
        }
      });

      const stats = {
        total,
        activos,
        inactivos,
        alDia,
        vencidos,
        pendientes,
        ingresosMensuales: socios
          .filter(s => s.estado === 'activo' && (s.fechaVencimiento?.toDate() || new Date()) >= now)
          .reduce((total, s) => total + (s.montoCuota || 0), 0),
        beneficiosUsados: socios.reduce((total, s) => total + (s.beneficiosUsados || 0), 0),
      };

      console.log('📊 Real-time membership stats calculated:', {
        total,
        activos,
        vencidos,
        alDia,
        pendientes,
        porcentajeVencidos: total > 0 ? Math.round((vencidos / total) * 100) : 0,
        discrepanciasDetectadas
      });

      // If discrepancies detected, suggest an update
      if (discrepanciasDetectadas > 0) {
        console.log(`⚠️ ${discrepanciasDetectadas} discrepancies detected. Consider running updateAssociationMemberships()`);
      }

      return stats;
    } catch (error) {
      console.error('❌ Error calculating real-time membership stats:', error);
      handleError(error, 'Get Realtime Membership Stats');
      
      // Return default stats on error
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        alDia: 0,
        vencidos: 0,
        pendientes: 0,
        ingresosMensuales: 0,
        beneficiosUsados: 0,
      };
    }
  }

  /**
   * Force update membership statuses and return fresh stats
   */
  async updateAndGetStats(asociacionId: string) {
    try {
      console.log(`🔄 Force updating membership statuses and getting fresh stats for: ${asociacionId}`);
      
      // First update the membership statuses
      const updateResult = await this.updateAssociationMemberships(asociacionId);
      
      // Then get the fresh stats
      const stats = await this.getRealtimeMembershipStats(asociacionId);
      
      console.log(`✅ Update and stats complete. Updated ${updateResult.updatedCount} memberships.`);
      
      return {
        stats,
        updateResult
      };
    } catch (error) {
      console.error('❌ Error in updateAndGetStats:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic membership status updates
   */
  startPeriodicUpdates(intervalMinutes: number = 60): NodeJS.Timeout | null {
    if (typeof window !== 'undefined') {
      console.log(`🕐 Starting periodic membership updates every ${intervalMinutes} minutes`);
      
      return setInterval(async () => {
        console.log('🔄 Running scheduled membership status update...');
        const result = await this.updateAllExpiredMemberships();
        
        if (result.success && result.updatedCount > 0) {
          console.log(`✅ Scheduled update completed: ${result.updatedCount} memberships updated`, result.details);
        } else if (result.errors.length > 0) {
          console.error('❌ Scheduled update had errors:', result.errors);
        }
      }, intervalMinutes * 60 * 1000);
    }
    
    return null;
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates(intervalId: NodeJS.Timeout): void {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('🛑 Stopped periodic membership updates');
    }
  }
}

// Export singleton instance
export const membershipStatusUpdaterService = new MembershipStatusUpdaterService();
export default membershipStatusUpdaterService;