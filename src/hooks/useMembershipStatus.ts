'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { membershipSyncService, MembershipStatus } from '@/services/membership-sync.service';
import { toast } from 'react-hot-toast';

interface UseMembershipStatusReturn {
  membershipStatus: MembershipStatus | null;
  loading: boolean;
  error: string | null;
  isConsistent: boolean;
  needsSync: boolean;
  checkStatus: () => Promise<void>;
  syncStatus: () => Promise<boolean>;
  fixPendingStatus: () => Promise<boolean>;
  validateAssociationMembership: () => Promise<boolean>;
  clearError: () => void;
}

export function useMembershipStatus(): UseMembershipStatusReturn {
  const { user } = useAuth();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid;

  // Check membership status
  const checkStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const status = await membershipSyncService.checkMembershipStatus(userId);
      setMembershipStatus(status);

      if (status && !status.isConsistent) {
        console.warn('⚠️ Membership status inconsistency detected:', status);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error checking membership status';
      setError(errorMessage);
      console.error('❌ Error checking membership status:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Synchronize membership status
  const syncStatus = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      setLoading(true);
      setError(null);

      const success = await membershipSyncService.syncMembershipStatus(userId);
      
      if (success) {
        toast.success('Estado de membresía sincronizado correctamente');
        await checkStatus(); // Refresh status after sync
      } else {
        toast.error('Error al sincronizar el estado de membresía');
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error synchronizing membership status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, checkStatus]);

  // Fix pending membership status
  const fixPendingStatus = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      setLoading(true);
      setError(null);

      const success = await membershipSyncService.fixPendingMembershipStatus(userId);
      
      if (success) {
        toast.success('Estado de membresía corregido exitosamente');
        await checkStatus(); // Refresh status after fix
      } else {
        toast.error('Error al corregir el estado de membresía');
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fixing pending status';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, checkStatus]);

  // Validate association membership
  const validateAssociationMembership = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      setLoading(true);
      setError(null);

      const success = await membershipSyncService.validateAssociationMembership(userId);
      
      if (success) {
        await checkStatus(); // Refresh status after validation
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error validating association membership';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, checkStatus]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-check status when user changes
  useEffect(() => {
    if (userId) {
      checkStatus();
    }
  }, [userId, checkStatus]);

  // Auto-fix pending status if detected
  useEffect(() => {
    if (membershipStatus && 
        membershipStatus.needsSync && 
        membershipStatus.membershipStatus === 'pendiente' &&
        membershipStatus.asociacionId) {
      console.log('🔧 Auto-fixing pending membership status...');
      fixPendingStatus();
    }
  }, [membershipStatus, fixPendingStatus]);

  return {
    membershipStatus,
    loading,
    error,
    isConsistent: membershipStatus?.isConsistent ?? true,
    needsSync: membershipStatus?.needsSync ?? false,
    checkStatus,
    syncStatus,
    fixPendingStatus,
    validateAssociationMembership,
    clearError,
  };
}

export default useMembershipStatus;
