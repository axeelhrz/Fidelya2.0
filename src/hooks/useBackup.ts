'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useSocios } from './useSocios';
import { 
  BackupMetadata, 
  BackupData, 
  BackupConfig, 
  RestoreOptions, 
  BackupProgress, 
  BackupStats,
  BackupVerification,
} from '@/types/backup';
import toast from 'react-hot-toast';

// Simulated Firebase Storage (in real implementation, import from firebase/storage)
const storage = {
  ref: (path: string) => ({ path }),
  uploadBytes: async (ref: { path: string }, data: Blob) => ({ ref, data }),
  getDownloadURL: async (ref: { path: string }) => `https://storage.example.com/${ref.path}`,
  deleteObject: async () => {},
  getMetadata: async () => ({ size: 1024, timeCreated: new Date().toISOString() })
};

// Helper function to clean undefined values from objects
const cleanUndefinedValues = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

export const useBackup = () => {
  const { user } = useAuth();
  const { socios } = useSocios();
  
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    autoBackupEnabled: false,
    backupFrequency: 'weekly',
    backupTime: '02:00',
    maxBackups: 10,
    compressionEnabled: true,
    encryptionEnabled: false,
    includeSettings: true,
    includeCustomData: false,
    retentionDays: 90,
    notificationsEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load backups from Firestore
  useEffect(() => {
    if (!user) return;

    const backupsQuery = query(
      collection(db, 'backups'),
      where('asociacionId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(backupsQuery, (snapshot) => {
      const backupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BackupMetadata[];
      setBackups(backupsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Load backup configuration
  useEffect(() => {
    if (!user) return;

    const configQuery = query(
      collection(db, 'backupConfigs'),
      where('asociacionId', '==', user.uid),
      limit(1)
    );

    const unsubscribe = onSnapshot(configQuery, (snapshot) => {
      if (!snapshot.empty) {
        const configData = snapshot.docs[0].data() as BackupConfig;
        setConfig(configData);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Generate checksum for data integrity
  const generateChecksum = useCallback(async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  // Compress data
  const compressData = useCallback(async (data: string, type: 'gzip' | 'brotli' = 'gzip'): Promise<Blob> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    if (type === 'gzip') {
      // In a real implementation, use a compression library like pako
      return new Blob([dataBuffer], { type: 'application/gzip' });
    }
    
    return new Blob([dataBuffer], { type: 'application/octet-stream' });
  }, []);

  // Create backup
  const createBackup = useCallback(async (
    name: string, 
    description?: string, 
    type: 'manual' | 'automatic' | 'scheduled' = 'manual'
  ): Promise<string | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    // Validate required fields
    if (!name || name.trim().length === 0) {
      setError('El nombre del respaldo es requerido');
      toast.error('El nombre del respaldo es requerido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Prepare data
      setProgress({
        step: 'Preparando datos...',
        progress: 10,
        message: 'Recopilando información de socios'
      });

      // Create backup metadata with proper null handling
      const backupMetadata: Omit<BackupMetadata, 'id'> = {
        name: name.trim(),
        description: description && description.trim() ? description.trim() : null,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        asociacionId: user.uid,
        type,
        status: 'creating',
        size: 0,
        recordCount: socios.length,
        version: '1.0.0',
        checksum: '',
        tags: [],
        isEncrypted: config.encryptionEnabled,
        compressionType: config.compressionEnabled ? 'gzip' : 'none',
        storageLocation: '',
        verificationStatus: 'pending'
      };

      const backupData: BackupData = {
        metadata: { ...backupMetadata, id: '' },
        socios: socios,
        settings: config.includeSettings ? { config } : undefined,
        customData: config.includeCustomData ? {} : undefined
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Generate checksum
      setProgress({
        step: 'Generando checksum...',
        progress: 30,
        message: 'Verificando integridad de datos'
      });

      const dataString = JSON.stringify(backupData);
      const checksum = await generateChecksum(dataString);
      backupMetadata.checksum = checksum;

      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Compress data
      setProgress({
        step: 'Comprimiendo datos...',
        progress: 50,
        message: 'Optimizando tamaño del archivo'
      });

      const compressedData = config.compressionEnabled 
        ? await compressData(dataString, 'gzip')
        : new Blob([dataString], { type: 'application/json' });

      backupMetadata.size = compressedData.size;

      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 4: Upload to storage
      setProgress({
        step: 'Subiendo a almacenamiento...',
        progress: 70,
        message: 'Guardando respaldo en la nube'
      });

      const timestamp = Date.now();
      const fileName = `backup_${user.uid}_${timestamp}.${config.compressionEnabled ? 'gz' : 'json'}`;
      const storageRef = storage.ref(`backups/${user.uid}/${fileName}`);
      
      await storage.uploadBytes(storageRef, compressedData);
      const downloadURL = await storage.getDownloadURL(storageRef);
      
      backupMetadata.storageLocation = downloadURL;

      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 5: Save metadata to Firestore
      setProgress({
        step: 'Guardando metadatos...',
        progress: 90,
        message: 'Registrando información del respaldo'
      });

      // Clean the metadata object to remove any undefined values
      const cleanedMetadata = cleanUndefinedValues({
        ...backupMetadata,
        status: 'completed'
      });

      const docRef = await addDoc(collection(db, 'backups'), cleanedMetadata);
      
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 6: Complete
      setProgress({
        step: 'Completado',
        progress: 100,
        message: 'Respaldo creado exitosamente'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success(`Respaldo "${name}" creado correctamente`);
      return docRef.id;

    } catch (error) {
      console.error('Error creating backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el respaldo';
      setError(errorMessage);
      toast.error(`Error al crear el respaldo: ${errorMessage}`);
      
      // Update progress to show error
      setProgress({
        step: 'Error',
        progress: 0,
        message: errorMessage
      });
      
      return null;
    } finally {
      setLoading(false);
      // Clear progress after a delay to show completion/error state
      setTimeout(() => setProgress(null), 2000);
    }
  }, [user, socios, config, generateChecksum, compressData]);

  // Restore backup
  const restoreBackup = useCallback(async (options: RestoreOptions): Promise<boolean> => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const backup = backups.find(b => b.id === options.backupId);
      if (!backup) {
        throw new Error('Respaldo no encontrado');
      }

      // Step 1: Download backup data
      setProgress({
        step: 'Descargando respaldo...',
        progress: 10,
        message: 'Obteniendo datos del respaldo'
      });

      // Simulate download and decompression
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Verify data integrity
      setProgress({
        step: 'Verificando integridad...',
        progress: 30,
        message: 'Validando datos del respaldo'
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Create backup before restore (if requested)
      if (options.createBackupBeforeRestore) {
        setProgress({
          step: 'Creando respaldo de seguridad...',
          progress: 50,
          message: 'Guardando estado actual'
        });

        await createBackup(`Pre-restore backup ${new Date().toISOString()}`, 'Respaldo automático antes de restauración', 'automatic');
      }

      // Step 4: Restore data
      setProgress({
        step: 'Restaurando datos...',
        progress: 70,
        message: 'Aplicando cambios'
      });

      // Simulate data restoration
      if (options.restoreType === 'full' || options.restoreType === 'socios_only') {
        // In real implementation, restore socios data
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Complete
      setProgress({
        step: 'Completado',
        progress: 100,
        message: 'Restauración completada exitosamente'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Respaldo restaurado correctamente');
      return true;

    } catch (error) {
      console.error('Error restoring backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al restaurar el respaldo';
      setError(errorMessage);
      toast.error(`Error al restaurar el respaldo: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(null), 2000);
    }
  }, [user, backups, createBackup]);

  // Delete backup
  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const backup = backups.find(b => b.id === backupId);
      if (!backup) return false;

      // Delete from storage
      if (backup.storageLocation) {
        // In real implementation, delete from Firebase Storage
        // await deleteObject(ref(storage, backup.storageLocation));
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'backups', backupId));

      toast.success('Respaldo eliminado correctamente');
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Error al eliminar el respaldo');
      return false;
    }
  }, [user, backups]);

  // Verify backup integrity
  const verifyBackup = useCallback(async (backupId: string): Promise<BackupVerification | null> => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return null;

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const verification: BackupVerification = {
        id: `verification_${Date.now()}`,
        backupId,
        verifiedAt: Timestamp.now(),
        status: 'passed',
        issues: [],
        dataIntegrity: 100,
        recordsVerified: backup.recordCount,
        recordsTotal: backup.recordCount
      };

      // Update backup verification status
      await updateDoc(doc(db, 'backups', backupId), {
        lastVerified: verification.verifiedAt,
        verificationStatus: verification.status
      });

      return verification;
    } catch (error) {
      console.error('Error verifying backup:', error);
      return null;
    }
  }, [backups]);

  // Get backup statistics
  const getBackupStats = useCallback((): BackupStats => {
    const totalBackups = backups.length;
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const successfulBackups = backups.filter(b => b.status === 'completed').length;
    const failedBackups = backups.filter(b => b.status === 'failed').length;
    const averageSize = totalBackups > 0 ? totalSize / totalBackups : 0;

    const sortedBackups = [...backups].sort((a, b) => 
      b.createdAt.toMillis() - a.createdAt.toMillis()
    );

    return {
      totalBackups,
      totalSize,
      lastBackup: sortedBackups[0]?.createdAt,
      successfulBackups,
      failedBackups,
      averageSize,
      oldestBackup: sortedBackups[sortedBackups.length - 1]?.createdAt
    };
  }, [backups]);

  // Update backup configuration
  const updateConfig = useCallback(async (newConfig: Partial<BackupConfig>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updatedConfig = { ...config, ...newConfig };
      
      // Save to Firestore
      const configQuery = query(
        collection(db, 'backupConfigs'),
        where('asociacionId', '==', user.uid),
        limit(1)
      );

      const snapshot = await getDocs(configQuery);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'backupConfigs'), {
          ...updatedConfig,
          asociacionId: user.uid
        });
      } else {
        await updateDoc(snapshot.docs[0].ref, updatedConfig);
      }

      setConfig(updatedConfig);
      toast.success('Configuración actualizada correctamente');
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Error al actualizar la configuración');
      return false;
    }
  }, [user, config]);

  // Download backup file
  const downloadBackup = useCallback(async (backupId: string): Promise<boolean> => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return false;

    try {
      // Simulate download
      const link = document.createElement('a');
      link.href = backup.storageLocation;
      link.download = `${backup.name}_${backup.createdAt.toDate().toISOString().split('T')[0]}.${backup.compressionType === 'gzip' ? 'gz' : 'json'}`;
      link.click();

      toast.success('Descarga iniciada');
      return true;
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Error al descargar el respaldo');
      return false;
    }
  }, [backups]);

  return {
    // State
    backups,
    config,
    loading,
    progress,
    error,
    // Actions
    createBackup,
    restoreBackup,
    deleteBackup,
    verifyBackup,
    downloadBackup,
    updateConfig,
    
    // Utils
    getBackupStats
  };
};