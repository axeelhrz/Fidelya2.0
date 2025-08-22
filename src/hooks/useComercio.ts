import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { comercioService, Comercio, ComercioFormData, ComercioStats } from '@/services/comercio.service';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useComercio = () => {
  const { user } = useAuth();
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [stats, setStats] = useState<ComercioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const comercioId = user?.role === 'comercio' ? user.uid : null;

  // Load comercio data
  const loadComercio = useCallback(async () => {
    if (!comercioId) return;

    setLoading(true);
    setError('');

    try {
      const comercioData = await comercioService.getComercioById(comercioId);
      if (comercioData) {
        setComercio(comercioData);
      } else {
        setError('Comercio no encontrado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar comercio';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [comercioId]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!comercioId) return;

    try {
      const statsData = await comercioService.getComercioStats(comercioId);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      console.error(errorMessage);
    }
  }, [comercioId]);

  // Update comercio profile
  const updateProfile = useCallback(async (data: Partial<ComercioFormData>): Promise<boolean> => {
    if (!comercioId) {
      toast.error('No se pudo identificar el comercio');
      return false;
    }

    setLoading(true);
    try {
      const success = await comercioService.updateComercio(comercioId, data);
      
      if (success) {
        toast.success('Perfil actualizado exitosamente');
        await loadComercio(); // Reload the data
        return true;
      } else {
        toast.error('Error al actualizar el perfil');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadComercio]);

  // Generate QR Code with CORS fix
  const generateQRCode = useCallback(async (beneficioId?: string): Promise<boolean> => {
    if (!comercioId) {
      toast.error('No se pudo identificar el comercio');
      return false;
    }

    setLoading(true);
    try {
      const qrCodeDataURL = await comercioService.generateQRCode(comercioId, beneficioId);
      
      if (qrCodeDataURL) {
        toast.success('Código QR generado exitosamente');
        await loadComercio(); // Reload to get updated QR data
        return true;
      } else {
        toast.error('Error al generar el código QR');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar código QR';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadComercio]);

  // Upload logo
  const uploadLogo = useCallback(async (file: File): Promise<boolean> => {
    if (!comercioId) {
      toast.error('No se pudo identificar el comercio');
      return false;
    }

    setLoading(true);
    try {
      const logoUrl = await comercioService.uploadLogo(comercioId, file);
      
      if (logoUrl) {
        toast.success('Logo subido exitosamente');
        await loadComercio(); // Reload to get updated logo
        return true;
      } else {
        toast.error('Error al subir el logo');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir logo';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadComercio]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Real-time listener for comercio data
  useEffect(() => {
    if (!comercioId) return;

    const comercioRef = doc(db, 'comercios', comercioId);
    const unsubscribe = onSnapshot(
      comercioRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setComercio({
            id: doc.id,
            ...data,
            creadoEn: data.creadoEn?.toDate() || new Date(),
            actualizadoEn: data.actualizadoEn?.toDate() || new Date(),
          } as Comercio);
        }
      },
      (error) => {
        console.error('Error listening to comercio changes:', error);
      }
    );

    return () => unsubscribe();
  }, [comercioId]);

  // Load initial data
  useEffect(() => {
    if (comercioId) {
      loadComercio();
      loadStats();
    }
  }, [comercioId, loadComercio, loadStats]);

  return {
    // Data
    comercio,
    stats,
    loading,
    error,
    
    // Actions
    loadComercio,
    loadStats,
    updateProfile,
    generateQRCode,
    uploadLogo,
    clearError,
  };
};
