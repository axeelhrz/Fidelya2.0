import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

interface MembershipSyncResult {
  success: boolean;
  socioId: string;
  previousStatus: string;
  newStatus: string;
  syncedAt: Date;
  error?: string;
}

interface BulkSyncResult {
  success: boolean;
  totalProcessed: number;
  synced: number;
  errors: Array<{ socioId: string; error: string }>;
  details: MembershipSyncResult[];
}

class MembershipStatusSyncService {
  private readonly sociosCollection = COLLECTIONS.SOCIOS;
  private readonly usersCollection = COLLECTIONS.USERS;

  /**
   * Sync membership status for a specific socio
   * This ensures consistency between the database and what the user sees
   */
  async syncSocioMembershipStatus(socioId: string): Promise<MembershipSyncResult> {
    try {
      console.log(`🔄 Syncing membership status for socio: ${socioId}`);

      // Get socio document
      const socioDoc = await getDoc(doc(db, this.sociosCollection, socioId));
      if (!socioDoc.exists()) {
        throw new Error('Socio not found');
      }

      const socioData = socioDoc.data();
      const now = new Date();
      const fechaVencimiento = socioData.fechaVencimiento?.toDate();
      
      // Calculate the correct membership status based on expiration date
      let correctStatus: string;
      if (!fechaVencimiento) {
        correctStatus = 'pendiente'; // No expiration date set
      } else if (fechaVencimiento < now) {
        correctStatus = 'vencido'; // Expired
      } else {
        correctStatus = 'al_dia'; // Up to date
      }

      const currentStatus = socioData.estadoMembresia || 'pendiente';
      
      console.log(`📊 Status comparison for ${socioData.nombre}:`, {
        currentStatus,
        correctStatus,
        fechaVencimiento: fechaVencimiento?.toLocaleDateString(),
        needsUpdate: currentStatus !== correctStatus
      });

      // Update if there's a discrepancy
      if (currentStatus !== correctStatus) {
        const batch = writeBatch(db);
        
        // Update socio document
        const socioRef = doc(db, this.sociosCollection, socioId);
        batch.update(socioRef, {
          estadoMembresia: correctStatus,
          actualizadoEn: serverTimestamp(),
          lastStatusSync: serverTimestamp(),
        });

        // Also update user document if it exists
        try {
          const userDoc = await getDoc(doc(db, this.usersCollection, socioId));
          if (userDoc.exists()) {
            const userRef = doc(db, this.usersCollection, socioId);
            batch.update(userRef, {
              estadoMembresia: correctStatus,
              actualizadoEn: serverTimestamp(),
            });
            console.log(`📝 Will also update user document for consistency`);
          }
        } catch (userError) {
          console.warn(`⚠️ Could not update user document:`, userError);
        }

        await batch.commit();
        
        console.log(`✅ Updated membership status: ${currentStatus} → ${correctStatus}`);
        
        return {
          success: true,
          socioId,
          previousStatus: currentStatus,
          newStatus: correctStatus,
          syncedAt: new Date(),
        };
      } else {
        console.log(`✅ Status already correct: ${correctStatus}`);
        
        return {
          success: true,
          socioId,
          previousStatus: currentStatus,
          newStatus: correctStatus,
          syncedAt: new Date(),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error syncing membership status for ${socioId}:`, error);
      
      return {
        success: false,
        socioId,
        previousStatus: 'unknown',
        newStatus: 'unknown',
        syncedAt: new Date(),
        error: errorMessage,
      };
    }
  }

  /**
   * Sync membership status for all socios in an association
   */
  async syncAssociationMembershipStatuses(asociacionId: string): Promise<BulkSyncResult> {
    try {
      console.log(`🔄 Starting bulk sync for association: ${asociacionId}`);

      const q = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );

      const snapshot = await getDocs(q);
      const results: MembershipSyncResult[] = [];
      const errors: Array<{ socioId: string; error: string }> = [];

      console.log(`📊 Found ${snapshot.docs.length} socios to sync`);

      // Process each socio
      for (const docSnapshot of snapshot.docs) {
        try {
          const result = await this.syncSocioMembershipStatus(docSnapshot.id);
          results.push(result);
          
          if (!result.success && result.error) {
            errors.push({ socioId: docSnapshot.id, error: result.error });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ socioId: docSnapshot.id, error: errorMessage });
        }
      }

      const synced = results.filter(r => r.success && r.previousStatus !== r.newStatus).length;
      
      console.log(`✅ Bulk sync completed:`, {
        totalProcessed: results.length,
        synced,
        errors: errors.length,
      });

      return {
        success: true,
        totalProcessed: results.length,
        synced,
        errors,
        details: results,
      };
    } catch (error) {
      console.error(`❌ Error in bulk sync for association ${asociacionId}:`, error);
      handleError(error, 'Sync Association Membership Statuses');
      
      return {
        success: false,
        totalProcessed: 0,
        synced: 0,
        errors: [{ socioId: 'bulk', error: error instanceof Error ? error.message : 'Unknown error' }],
        details: [],
      };
    }
  }

  /**
   * Force refresh membership status for a socio (clears any caching issues)
   */
  async forceRefreshSocioStatus(socioId: string): Promise<MembershipSyncResult> {
    try {
      console.log(`🔄 Force refreshing status for socio: ${socioId}`);
      
      // Add a small delay to ensure any pending writes are completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Perform the sync
      const result = await this.syncSocioMembershipStatus(socioId);
      
      // Add additional metadata to indicate this was a force refresh
      return {
        ...result,
        syncedAt: new Date(), // Ensure fresh timestamp
      };
    } catch (error) {
      console.error(`❌ Error in force refresh for ${socioId}:`, error);
      throw error;
    }
  }

  /**
   * Get current membership status directly from database (bypasses cache)
   */
  async getCurrentMembershipStatus(socioId: string): Promise<{
    estadoMembresia: string;
    fechaVencimiento: Date | null;
    calculatedStatus: string;
    isConsistent: boolean;
  }> {
    try {
      const socioDoc = await getDoc(doc(db, this.sociosCollection, socioId));
      if (!socioDoc.exists()) {
        throw new Error('Socio not found');
      }

      const socioData = socioDoc.data();
      const fechaVencimiento = socioData.fechaVencimiento?.toDate() || null;
      const currentStatus = socioData.estadoMembresia || 'pendiente';
      
      // Calculate what the status should be
      let calculatedStatus: string;
      if (!fechaVencimiento) {
        calculatedStatus = 'pendiente';
      } else if (fechaVencimiento < new Date()) {
        calculatedStatus = 'vencido';
      } else {
        calculatedStatus = 'al_dia';
      }

      return {
        estadoMembresia: currentStatus,
        fechaVencimiento,
        calculatedStatus,
        isConsistent: currentStatus === calculatedStatus,
      };
    } catch (error) {
      console.error(`❌ Error getting current status for ${socioId}:`, error);
      throw error;
    }
  }

  /**
   * Diagnostic function to check for inconsistencies
   */
  async diagnoseInconsistencies(asociacionId: string): Promise<{
    totalSocios: number;
    inconsistentSocios: Array<{
      socioId: string;
      nombre: string;
      currentStatus: string;
      calculatedStatus: string;
      fechaVencimiento: Date | null;
    }>;
  }> {
    try {
      console.log(`🔍 Diagnosing inconsistencies for association: ${asociacionId}`);

      const q = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );

      const snapshot = await getDocs(q);
      const inconsistentSocios: Array<{
        socioId: string;
        nombre: string;
        currentStatus: string;
        calculatedStatus: string;
        fechaVencimiento: Date | null;
      }> = [];

      for (const docSnapshot of snapshot.docs) {
        const socioData = docSnapshot.data();
        const fechaVencimiento = socioData.fechaVencimiento?.toDate() || null;
        const currentStatus = socioData.estadoMembresia || 'pendiente';
        
        let calculatedStatus: string;
        if (!fechaVencimiento) {
          calculatedStatus = 'pendiente';
        } else if (fechaVencimiento < new Date()) {
          calculatedStatus = 'vencido';
        } else {
          calculatedStatus = 'al_dia';
        }

        if (currentStatus !== calculatedStatus) {
          inconsistentSocios.push({
            socioId: docSnapshot.id,
            nombre: socioData.nombre || 'Sin nombre',
            currentStatus,
            calculatedStatus,
            fechaVencimiento,
          });
        }
      }

      console.log(`🔍 Diagnosis complete:`, {
        totalSocios: snapshot.docs.length,
        inconsistentSocios: inconsistentSocios.length,
      });

      return {
        totalSocios: snapshot.docs.length,
        inconsistentSocios,
      };
    } catch (error) {
      console.error(`❌ Error diagnosing inconsistencies:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const membershipStatusSyncService = new MembershipStatusSyncService();
export default membershipStatusSyncService;