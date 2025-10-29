'use client';

import { useState, useCallback } from 'react';
import { membershipStatusSyncService } from '@/services/membership-status-sync.service';
import { toast } from 'react-hot-toast';

interface UseMembershipStatusSyncReturn {
  syncing: boolean;
  syncSocioStatus: (socioId: string) => Promise<boolean>;
  syncAssociationStatuses: (asociacionId: string) => Promise<{ synced: number; total: number }>;
  forceRefreshStatus: (socioId: string) => Promise<boolean>;
  diagnoseInconsistencies: (asociacionId: string) => Promise<{
    totalSocios: number;
    inconsistentSocios: Array<{
      socioId: string;
      nombre: string;
      currentStatus: string;
      calculatedStatus: string;
      fechaVencimiento: Date | null;
    }>;
  }>;
  getCurrentStatus: (socioId: string) => Promise<{
    estadoMembresia: string;
    fechaVencimiento: Date | null;
    calculatedStatus: string;
    isConsistent: boolean;
  } | null>;
}

export function useMembershipStatusSync(): UseMembershipStatusSyncReturn {
  const [syncing, setSyncing] = useState(false);

  const syncSocioStatus = useCallback(async (socioId: string): Promise<boolean> => {
    if (syncing) return false;

    try {
      setSyncing(true);
      console.log(`🔄 Syncing status for socio: ${socioId}`);

      const result = await membershipStatusSyncService.syncSocioMembershipStatus(socioId);

      if (result.success) {
        if (result.previousStatus !== result.newStatus) {
          toast.success(`Estado actualizado: ${result.previousStatus} → ${result.newStatus}`);
          console.log(`✅ Status synced: ${result.previousStatus} → ${result.newStatus}`);
        } else {
          console.log(`✅ Status already correct: ${result.newStatus}`);
        }
        return true;
      } else {
        toast.error(`Error sincronizando estado: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing socio status:', error);
      toast.error('Error al sincronizar estado de membresía');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const syncAssociationStatuses = useCallback(async (asociacionId: string): Promise<{ synced: number; total: number }> => {
    if (syncing) return { synced: 0, total: 0 };

    try {
      setSyncing(true);
      console.log(`🔄 Syncing all statuses for association: ${asociacionId}`);

      const result = await membershipStatusSyncService.syncAssociationMembershipStatuses(asociacionId);

      if (result.success) {
        if (result.synced > 0) {
          toast.success(`${result.synced} estados de membresía actualizados`);
          console.log(`✅ Bulk sync completed: ${result.synced}/${result.totalProcessed} updated`);
        } else {
          toast.success('Todos los estados están correctos');
          console.log(`✅ All statuses already correct`);
        }

        if (result.errors.length > 0) {
          console.warn(`⚠️ ${result.errors.length} errors during sync:`, result.errors);
          toast(`${result.errors.length} errores encontrados`, { icon: '⚠️' });
        }

        return { synced: result.synced, total: result.totalProcessed };
      } else {
        toast.error('Error en sincronización masiva');
        return { synced: 0, total: 0 };
      }
    } catch (error) {
      console.error('❌ Error syncing association statuses:', error);
      toast.error('Error al sincronizar estados de membresía');
      return { synced: 0, total: 0 };
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const forceRefreshStatus = useCallback(async (socioId: string): Promise<boolean> => {
    if (syncing) return false;

    try {
      setSyncing(true);
      console.log(`🔄 Force refreshing status for socio: ${socioId}`);

      const result = await membershipStatusSyncService.forceRefreshSocioStatus(socioId);

      if (result.success) {
        if (result.previousStatus !== result.newStatus) {
          toast.success(`Estado actualizado: ${result.previousStatus} → ${result.newStatus}`);
          console.log(`✅ Status force refreshed: ${result.previousStatus} → ${result.newStatus}`);
        } else {
          toast.success('Estado verificado y correcto');
          console.log(`✅ Status verified as correct: ${result.newStatus}`);
        }
        return true;
      } else {
        toast.error(`Error refrescando estado: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error force refreshing status:', error);
      toast.error('Error al refrescar estado de membresía');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const diagnoseInconsistencies = useCallback(async (asociacionId: string) => {
    try {
      console.log(`🔍 Diagnosing inconsistencies for association: ${asociacionId}`);
      
      const result = await membershipStatusSyncService.diagnoseInconsistencies(asociacionId);
      
      console.log(`🔍 Diagnosis result:`, {
        totalSocios: result.totalSocios,
        inconsistentSocios: result.inconsistentSocios.length,
      });

      if (result.inconsistentSocios.length > 0) {
        console.log(`⚠️ Found ${result.inconsistentSocios.length} inconsistent socios:`, result.inconsistentSocios);
        toast(`${result.inconsistentSocios.length} inconsistencias encontradas`, { icon: '⚠️' });
      } else {
        console.log(`✅ All socios have consistent status`);
        toast.success('Todos los estados están consistentes');
      }

      return result;
    } catch (error) {
      console.error('❌ Error diagnosing inconsistencies:', error);
      toast.error('Error al diagnosticar inconsistencias');
      return { totalSocios: 0, inconsistentSocios: [] };
    }
  }, []);

  const getCurrentStatus = useCallback(async (socioId: string) => {
    try {
      console.log(`📊 Getting current status for socio: ${socioId}`);
      
      const result = await membershipStatusSyncService.getCurrentMembershipStatus(socioId);
      
      console.log(`📊 Current status result:`, result);

      if (!result.isConsistent) {
        console.warn(`⚠️ Status inconsistency detected:`, {
          current: result.estadoMembresia,
          calculated: result.calculatedStatus,
          fechaVencimiento: result.fechaVencimiento?.toLocaleDateString(),
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Error getting current status:', error);
      toast.error('Error al obtener estado actual');
      return null;
    }
  }, []);

  return {
    syncing,
    syncSocioStatus,
    syncAssociationStatuses,
    forceRefreshStatus,
    diagnoseInconsistencies,
    getCurrentStatus,
  };
}