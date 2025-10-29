'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { membershipStatusUpdaterService } from '@/services/membership-status-updater.service';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

interface UseMembershipStatusReturn {
  isUpdating: boolean;
  lastUpdateTime: Date | null;
  updateCount: number;
  error: string | null;
  updateMembershipStatus: () => Promise<void>;
  startPeriodicUpdates: (intervalMinutes?: number) => void;
  stopPeriodicUpdates: () => void;
  isPeriodicUpdatesActive: boolean;
}

export function useMembershipStatus(): UseMembershipStatusReturn {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPeriodicUpdatesActive, setIsPeriodicUpdatesActive] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const asociacionId = user?.uid;

  // Manual update function
  const updateMembershipStatus = useCallback(async () => {
    if (!asociacionId || isUpdating) return;

    try {
      setIsUpdating(true);
      setError(null);

      console.log('🔄 Manually updating membership statuses...');
      const result = await membershipStatusUpdaterService.updateAssociationMemberships(asociacionId);

      if (result.success) {
        setUpdateCount(result.updatedCount);
        setLastUpdateTime(new Date());
        
        if (result.updatedCount > 0) {
          toast.success(`${result.updatedCount} membresías actualizadas`);
          console.log(`✅ Manual update completed: ${result.updatedCount} memberships updated`);
        } else {
          console.log('ℹ️ Manual update completed: No memberships needed updating');
        }

        if (result.errors.length > 0) {
          console.warn('⚠️ Some errors occurred during update:', result.errors);
          toast(`${result.errors.length} errores encontrados`, { icon: '⚠️' });
        }
      } else {
        throw new Error('Failed to update membership statuses');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar membresías';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Manual membership update failed:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [asociacionId, isUpdating]);

  // Start periodic updates
  const startPeriodicUpdates = useCallback((intervalMinutes: number = 60) => {
    if (!asociacionId || isPeriodicUpdatesActive) return;

    console.log(`🕐 Starting periodic membership updates every ${intervalMinutes} minutes`);
    
    const interval = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled membership status update...');
        const result = await membershipStatusUpdaterService.updateAssociationMemberships(asociacionId);
        
        if (result.success) {
          setUpdateCount(result.updatedCount);
          setLastUpdateTime(new Date());
          
          if (result.updatedCount > 0) {
            console.log(`✅ Scheduled update completed: ${result.updatedCount} memberships updated`);
            // Only show toast for significant updates to avoid spam
            if (result.updatedCount > 5) {
              toast(`${result.updatedCount} membresías actualizadas automáticamente`, { 
                icon: '🔄',
                duration: 3000 
              });
            }
          }

          if (result.errors.length > 0) {
            console.error('❌ Scheduled update had errors:', result.errors);
          }
        }
      } catch (err) {
        console.error('❌ Scheduled membership update failed:', err);
        setError(err instanceof Error ? err.message : 'Error en actualización automática');
      }
    }, intervalMinutes * 60 * 1000);

    intervalRef.current = interval;
    setIsPeriodicUpdatesActive(true);
  }, [asociacionId, isPeriodicUpdatesActive]);

  // Stop periodic updates
  const stopPeriodicUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPeriodicUpdatesActive(false);
      console.log('🛑 Stopped periodic membership updates');
    }
  }, []);

  // Auto-start periodic updates when component mounts and user is available
  useEffect(() => {
    if (asociacionId && user?.role === 'asociacion') {
      // Start with a 30-minute interval for associations
      startPeriodicUpdates(30);
      
      // Also run an initial update after a short delay
      const initialUpdateTimeout = setTimeout(() => {
        updateMembershipStatus();
      }, 5000); // 5 seconds delay to avoid overwhelming on page load

      return () => {
        clearTimeout(initialUpdateTimeout);
        stopPeriodicUpdates();
      };
    }
  }, [asociacionId, user?.role, startPeriodicUpdates, stopPeriodicUpdates, updateMembershipStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPeriodicUpdates();
    };
  }, [stopPeriodicUpdates]);

  return {
    isUpdating,
    lastUpdateTime,
    updateCount,
    error,
    updateMembershipStatus,
    startPeriodicUpdates,
    stopPeriodicUpdates,
    isPeriodicUpdatesActive,
  };
}