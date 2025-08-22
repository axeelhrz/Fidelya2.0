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
import { COLLECTIONS, USER_STATES } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface MembershipStatus {
  userId: string;
  userStatus: string;
  socioStatus: string;
  membershipStatus: string;
  asociacionId?: string;
  isConsistent: boolean;
  needsSync: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedUsers: number;
  errors: Array<{ userId: string; error: string }>;
  details: MembershipStatus[];
}

class MembershipSyncService {
  private readonly usersCollection = COLLECTIONS.USERS;
  private readonly sociosCollection = COLLECTIONS.SOCIOS;
  private readonly asociacionesCollection = COLLECTIONS.ASOCIACIONES;

  /**
   * Check membership status consistency for a specific user
   */
  async checkMembershipStatus(userId: string): Promise<MembershipStatus | null> {
    try {
      console.log('🔍 Checking membership status for user:', userId);

      // Get user document
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      if (!userDoc.exists()) {
        console.warn('⚠️ User document not found:', userId);
        return null;
      }

      const userData = userDoc.data();

      // Get socio document
      const socioDoc = await getDoc(doc(db, this.sociosCollection, userId));
      if (!socioDoc.exists()) {
        console.warn('⚠️ Socio document not found:', userId);
        return null;
      }

      const socioData = socioDoc.data();

      // Analyze status consistency
      const status: MembershipStatus = {
        userId,
        userStatus: userData.estado || 'unknown',
        socioStatus: socioData.estado || 'unknown',
        membershipStatus: socioData.estadoMembresia || 'unknown',
        asociacionId: socioData.asociacionId || userData.asociacionId,
        isConsistent: false,
        needsSync: false,
      };

      // Check consistency rules
      status.isConsistent = this.isStatusConsistent(status);
      status.needsSync = !status.isConsistent;

      console.log('📊 Status analysis:', status);
      return status;
    } catch (error) {
      console.error('❌ Error checking membership status:', error);
      handleError(error, 'Check Membership Status');
      return null;
    }
  }

  /**
   * Synchronize membership status for a specific user
   */
  async syncMembershipStatus(userId: string): Promise<boolean> {
    try {
      console.log('🔄 Synchronizing membership status for user:', userId);

      const status = await this.checkMembershipStatus(userId);
      if (!status || !status.needsSync) {
        console.log('✅ No synchronization needed for user:', userId);
        return true;
      }

      const batch = writeBatch(db);

      // Determine the correct status based on business rules
      const correctStatus = this.determineCorrectStatus(status);

      // Update user document
      const userRef = doc(db, this.usersCollection, userId);
      batch.update(userRef, {
        estado: correctStatus.userStatus,
        asociacionId: correctStatus.asociacionId,
        actualizadoEn: serverTimestamp(),
      });

      // Update socio document
      const socioRef = doc(db, this.sociosCollection, userId);
      batch.update(socioRef, {
        estado: correctStatus.socioStatus,
        estadoMembresia: correctStatus.membershipStatus,
        asociacionId: correctStatus.asociacionId,
        actualizadoEn: serverTimestamp(),
      });

      // Commit the batch
      await batch.commit();

      console.log('✅ Membership status synchronized successfully for user:', userId);
      console.log('📊 Applied corrections:', correctStatus);

      return true;
    } catch (error) {
      console.error('❌ Error synchronizing membership status:', error);
      handleError(error, 'Sync Membership Status');
      return false;
    }
  }

  /**
   * Batch synchronize membership status for multiple users
   */
  async batchSyncMembershipStatus(userIds: string[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      syncedUsers: 0,
      errors: [],
      details: [],
    };

    try {
      console.log('🔄 Starting batch synchronization for', userIds.length, 'users');

      for (const userId of userIds) {
        try {
          const status = await this.checkMembershipStatus(userId);
          if (status) {
            result.details.push(status);

            if (status.needsSync) {
              const syncSuccess = await this.syncMembershipStatus(userId);
              if (syncSuccess) {
                result.syncedUsers++;
              } else {
                result.errors.push({
                  userId,
                  error: 'Failed to synchronize status',
                });
              }
            }
          }
        } catch (error) {
          result.errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      result.success = result.errors.length === 0;
      console.log('✅ Batch synchronization completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Error in batch synchronization:', error);
      handleError(error, 'Batch Sync Membership Status');
      return result;
    }
  }

  /**
   * Synchronize all socios in an association
   */
  async syncAssociationMembers(asociacionId: string): Promise<SyncResult> {
    try {
      console.log('🔄 Synchronizing all members in association:', asociacionId);

      // Get all socios in the association
      const sociosQuery = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );

      const sociosSnapshot = await getDocs(sociosQuery);
      const userIds = sociosSnapshot.docs.map(doc => doc.id);

      console.log('📊 Found', userIds.length, 'socios in association');

      return await this.batchSyncMembershipStatus(userIds);
    } catch (error) {
      console.error('❌ Error synchronizing association members:', error);
      handleError(error, 'Sync Association Members');
      return {
        success: false,
        syncedUsers: 0,
        errors: [{ userId: 'association', error: 'Failed to sync association members' }],
        details: [],
      };
    }
  }

  /**
   * Fix membership status for a user who shows as "pendiente" but should be "activo"
   */
  async fixPendingMembershipStatus(userId: string): Promise<boolean> {
    try {
      console.log('🔧 Fixing pending membership status for user:', userId);

      const batch = writeBatch(db);

      // Update user document to active
      const userRef = doc(db, this.usersCollection, userId);
      batch.update(userRef, {
        estado: USER_STATES.ACTIVO,
        actualizadoEn: serverTimestamp(),
      });

      // Update socio document to active with proper membership status
      const socioRef = doc(db, this.sociosCollection, userId);
      batch.update(socioRef, {
        estado: 'activo',
        estadoMembresia: 'al_dia',
        actualizadoEn: serverTimestamp(),
      });

      await batch.commit();

      console.log('✅ Pending membership status fixed for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error fixing pending membership status:', error);
      handleError(error, 'Fix Pending Membership Status');
      return false;
    }
  }

  /**
   * Validate and correct membership status based on association link
   */
  async validateAssociationMembership(userId: string): Promise<boolean> {
    try {
      console.log('🔍 Validating association membership for user:', userId);

      const userDoc = await getDoc(doc(db, this.usersCollection, userId));
      const socioDoc = await getDoc(doc(db, this.sociosCollection, userId));

      if (!userDoc.exists() || !socioDoc.exists()) {
        console.warn('⚠️ User or socio document not found');
        return false;
      }

      const socioData = socioDoc.data();

      // Check if user has an association but status is pending
      if (socioData.asociacionId && socioData.estadoMembresia === 'pendiente') {
        // Verify the association exists and is active
        const asociacionDoc = await getDoc(doc(db, this.asociacionesCollection, socioData.asociacionId));
        
        if (asociacionDoc.exists()) {
          console.log('🔧 User has valid association, correcting status...');
          return await this.fixPendingMembershipStatus(userId);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating association membership:', error);
      handleError(error, 'Validate Association Membership');
      return false;
    }
  }

  /**
   * Get membership status summary for an association
   */
  async getAssociationMembershipSummary(asociacionId: string): Promise<{
    total: number;
    active: number;
    pending: number;
    expired: number;
    inconsistent: number;
    needsSync: number;
  }> {
    try {
      const sociosQuery = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );

      const sociosSnapshot = await getDocs(sociosQuery);
      const summary = {
        total: 0,
        active: 0,
        pending: 0,
        expired: 0,
        inconsistent: 0,
        needsSync: 0,
      };

      for (const socioDoc of sociosSnapshot.docs) {
        summary.total++;
        const socioData = socioDoc.data();

        // Check status
        if (socioData.estadoMembresia === 'al_dia') {
          summary.active++;
        } else if (socioData.estadoMembresia === 'pendiente') {
          summary.pending++;
        } else if (socioData.estadoMembresia === 'vencido') {
          summary.expired++;
        }

        // Check consistency
        const status = await this.checkMembershipStatus(socioDoc.id);
        if (status) {
          if (!status.isConsistent) {
            summary.inconsistent++;
          }
          if (status.needsSync) {
            summary.needsSync++;
          }
        }
      }

      return summary;
    } catch (error) {
      console.error('❌ Error getting membership summary:', error);
      handleError(error, 'Get Association Membership Summary');
      return {
        total: 0,
        active: 0,
        pending: 0,
        expired: 0,
        inconsistent: 0,
        needsSync: 0,
      };
    }
  }

  /**
   * Check if status is consistent across collections
   */
  private isStatusConsistent(status: MembershipStatus): boolean {
    // Rule 1: If user is active and has association, membership should not be pending
    if (status.userStatus === USER_STATES.ACTIVO && 
        status.socioStatus === 'activo' && 
        status.asociacionId && 
        status.membershipStatus === 'pendiente') {
      return false;
    }

    // Rule 2: User status and socio status should match
    if (status.userStatus === USER_STATES.ACTIVO && status.socioStatus !== 'activo') {
      return false;
    }

    // Rule 3: If user is pending but has association, it should be active
    if (status.userStatus === USER_STATES.PENDIENTE && status.asociacionId) {
      return false;
    }

    return true;
  }

  /**
   * Determine the correct status based on business rules
   */
  private determineCorrectStatus(status: MembershipStatus): {
    userStatus: string;
    socioStatus: string;
    membershipStatus: string;
    asociacionId?: string;
  } {
    // If user has an association, they should be active
    if (status.asociacionId) {
      return {
        userStatus: USER_STATES.ACTIVO,
        socioStatus: 'activo',
        membershipStatus: 'al_dia',
        asociacionId: status.asociacionId,
      };
    }

    // Default to current status if no association
    return {
      userStatus: status.userStatus,
      socioStatus: status.socioStatus,
      membershipStatus: status.membershipStatus,
      asociacionId: status.asociacionId,
    };
  }
}

// Export singleton instance
export const membershipSyncService = new MembershipSyncService();
export default membershipSyncService;
