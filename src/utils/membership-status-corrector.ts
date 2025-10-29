import { membershipSyncService, MembershipStatus } from '@/services/membership-sync.service';
import { socioAsociacionService } from '@/services/socio-asociacion.service';

export interface StatusCorrectionResult {
  success: boolean;
  correctedUsers: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
  summary: {
    totalChecked: number;
    inconsistentFound: number;
    correctionAttempts: number;
    successfulCorrections: number;
  };
}

export class MembershipStatusCorrector {
  /**
   * Correct membership status for a single user
   */
  static async correctUserMembershipStatus(userId: string): Promise<boolean> {
    try {
      console.log('🔧 Correcting membership status for user:', userId);

      // First, check current status
      const status = await membershipSyncService.checkMembershipStatus(userId);
      if (!status) {
        console.error('❌ Could not retrieve membership status for user:', userId);
        return false;
      }

      console.log('📊 Current status:', status);

      // If status is consistent, no correction needed
      if (status.isConsistent) {
        console.log('✅ Status is already consistent for user:', userId);
        return true;
      }

      // Apply corrections based on the specific issue
      if (status.membershipStatus === 'pendiente' && status.asociacionId) {
        console.log('🔧 Fixing pending membership with association...');
        return await membershipSyncService.fixPendingMembershipStatus(userId);
      }

      // General synchronization
      console.log('🔄 Applying general status synchronization...');
      return await membershipSyncService.syncMembershipStatus(userId);

    } catch (error) {
      console.error('❌ Error correcting membership status:', error);
      return false;
    }
  }

  /**
   * Correct membership status for multiple users
   */
  static async correctMultipleUsersMembershipStatus(userIds: string[]): Promise<StatusCorrectionResult> {
    const result: StatusCorrectionResult = {
      success: false,
      correctedUsers: 0,
      errors: [],
      summary: {
        totalChecked: userIds.length,
        inconsistentFound: 0,
        correctionAttempts: 0,
        successfulCorrections: 0,
      },
    };

    try {
      console.log('🔧 Starting batch correction for', userIds.length, 'users');

      for (const userId of userIds) {
        try {
          // Check status first
          const status = await membershipSyncService.checkMembershipStatus(userId);
          if (!status) {
            result.errors.push({
              userId,
              error: 'Could not retrieve membership status',
            });
            continue;
          }

          if (!status.isConsistent) {
            result.summary.inconsistentFound++;
            result.summary.correctionAttempts++;

            const correctionSuccess = await this.correctUserMembershipStatus(userId);
            if (correctionSuccess) {
              result.summary.successfulCorrections++;
              result.correctedUsers++;
            } else {
              result.errors.push({
                userId,
                error: 'Failed to correct membership status',
              });
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
      console.log('✅ Batch correction completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Error in batch correction:', error);
      result.errors.push({
        userId: 'batch',
        error: 'General batch correction error',
      });
      return result;
    }
  }

  /**
   * Correct membership status for all members of an association
   */
  static async correctAssociationMembershipStatus(asociacionId: string): Promise<StatusCorrectionResult> {
    try {
      console.log('🔧 Correcting membership status for association:', asociacionId);

      // Get all socios in the association
      const socios = await socioAsociacionService.getSociosByAsociacion(asociacionId);
      const userIds = socios.map(socio => socio.id);

      console.log('📊 Found', userIds.length, 'socios in association');

      if (userIds.length === 0) {
        return {
          success: true,
          correctedUsers: 0,
          errors: [],
          summary: {
            totalChecked: 0,
            inconsistentFound: 0,
            correctionAttempts: 0,
            successfulCorrections: 0,
          },
        };
      }

      return await this.correctMultipleUsersMembershipStatus(userIds);
    } catch (error) {
      console.error('❌ Error correcting association membership status:', error);
      return {
        success: false,
        correctedUsers: 0,
        errors: [{
          userId: 'association',
          error: 'Failed to correct association membership status',
        }],
        summary: {
          totalChecked: 0,
          inconsistentFound: 0,
          correctionAttempts: 0,
          successfulCorrections: 0,
        },
      };
    }
  }

  /**
   * Generate a report of membership status issues
   */
  static async generateMembershipStatusReport(userIds: string[]): Promise<{
    consistent: MembershipStatus[];
    inconsistent: MembershipStatus[];
    errors: Array<{ userId: string; error: string }>;
    summary: {
      total: number;
      consistent: number;
      inconsistent: number;
      errors: number;
      pendingWithAssociation: number;
      activeWithoutAssociation: number;
    };
  }> {
    const report = {
      consistent: [] as MembershipStatus[],
      inconsistent: [] as MembershipStatus[],
      errors: [] as Array<{ userId: string; error: string }>,
      summary: {
        total: userIds.length,
        consistent: 0,
        inconsistent: 0,
        errors: 0,
        pendingWithAssociation: 0,
        activeWithoutAssociation: 0,
      },
    };

    try {
      console.log('📊 Generating membership status report for', userIds.length, 'users');

      for (const userId of userIds) {
        try {
          const status = await membershipSyncService.checkMembershipStatus(userId);
          if (!status) {
            report.errors.push({
              userId,
              error: 'Could not retrieve membership status',
            });
            report.summary.errors++;
            continue;
          }

          if (status.isConsistent) {
            report.consistent.push(status);
            report.summary.consistent++;
          } else {
            report.inconsistent.push(status);
            report.summary.inconsistent++;

            // Specific issue tracking
            if (status.membershipStatus === 'pendiente' && status.asociacionId) {
              report.summary.pendingWithAssociation++;
            }
            if (status.userStatus === 'activo' && !status.asociacionId) {
              report.summary.activeWithoutAssociation++;
            }
          }
        } catch (error) {
          report.errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          report.summary.errors++;
        }
      }

      console.log('📊 Report generated:', report.summary);
      return report;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      return report;
    }
  }

  /**
   * Quick fix for the most common issue: pending membership with association
   */
  static async quickFixPendingMemberships(asociacionId: string): Promise<{
    success: boolean;
    fixed: number;
    errors: string[];
  }> {
    try {
      console.log('⚡ Quick fix for pending memberships in association:', asociacionId);

      const socios = await socioAsociacionService.getSociosByAsociacion(asociacionId);
      const pendingSocios = socios.filter(socio => 
        socio.estadoMembresia === 'pendiente' && socio.asociacionId
      );

      console.log('📊 Found', pendingSocios.length, 'pending socios with association');

      const result = {
        success: true,
        fixed: 0,
        errors: [] as string[],
      };

      for (const socio of pendingSocios) {
        try {
          const fixed = await membershipSyncService.fixPendingMembershipStatus(socio.id);
          if (fixed) {
            result.fixed++;
            console.log('✅ Fixed pending membership for socio:', socio.id);
          } else {
            result.errors.push(`Failed to fix socio ${socio.id}`);
          }
        } catch (error) {
          const errorMsg = `Error fixing socio ${socio.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      console.log('⚡ Quick fix completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Error in quick fix:', error);
      return {
        success: false,
        fixed: 0,
        errors: ['General quick fix error'],
      };
    }
  }
}

export default MembershipStatusCorrector;
