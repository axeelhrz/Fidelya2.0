import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { qrStatsService, QRStats } from '@/services/qr-stats.service';

export const useQRStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<QRStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const comercioId = user?.role === 'comercio' ? user.uid : null;

  // Load QR stats
  const loadStats = useCallback(async (dateRange: string = '7d') => {
    if (!comercioId) return;

    setLoading(true);
    setError('');

    try {
      const statsData = await qrStatsService.getQRStats(comercioId, dateRange);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [comercioId]);

  // Refresh stats
  const refreshStats = useCallback(async (dateRange: string = '7d') => {
    await loadStats(dateRange);
  }, [loadStats]);

  // Track QR scan
  const trackQRScan = useCallback(async (scanData: {
    socioId?: string;
    location?: { latitude: number; longitude: number };
    device?: string;
    userAgent?: string;
  }) => {
    if (!comercioId) return;

    try {
      await qrStatsService.trackQRScan(comercioId, scanData);
    } catch (err) {
      console.error('Error tracking QR scan:', err);
    }
  }, [comercioId]);

  // Track QR validation
  const trackQRValidation = useCallback(async (validationData: {
    socioId: string;
    beneficioId?: string;
    success: boolean;
    amount?: number;
  }) => {
    if (!comercioId) return;

    try {
      await qrStatsService.trackQRValidation(comercioId, validationData);
    } catch (err) {
      console.error('Error tracking QR validation:', err);
    }
  }, [comercioId]);

  // Get real-time stats
  const getRealTimeStats = useCallback(async () => {
    if (!comercioId) return null;

    try {
      return await qrStatsService.getRealTimeStats(comercioId);
    } catch (err) {
      console.error('Error getting real-time stats:', err);
      return null;
    }
  }, [comercioId]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Load initial stats
  useEffect(() => {
    if (comercioId) {
      loadStats();
    }
  }, [comercioId, loadStats]);

  return {
    // Data
    stats,
    loading,
    error,
    
    // Actions
    loadStats,
    refreshStats,
    trackQRScan,
    trackQRValidation,
    getRealTimeStats,
    clearError,
  };
};
