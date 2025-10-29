'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  Avatar,
  Stack,
  Chip,
  Button,
  IconButton,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Backup,
  Settings,
  Schedule,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  Info,
  Download,
  Restore,
  Storage,
  Refresh,
  Add,
  ExpandMore,
  DataUsage,
  History,
  AutoMode,
  Person,
  Lock,
  ArrowUpward,
  ArrowDownward,
  Search,
  Save,
} from '@mui/icons-material';
import { useBackup } from '@/hooks/useBackup';
import { BackupMetadata, BackupConfig, RestoreOptions, BackupFilterType, BackupSortField, BackupSortOrder } from '@/types/backup';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface BackupManagementSectionProps {
  loading?: boolean;
}

interface BackupCardProps {
  backup: BackupMetadata;
  onRestore: (backup: BackupMetadata) => void;
  onDelete: (backup: BackupMetadata) => void;
  onDownload: (backup: BackupMetadata) => void;
  onVerify: (backup: BackupMetadata) => void;
  onViewDetails: (backup: BackupMetadata) => void;
  delay: number;
}

interface CreateBackupDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, description?: string) => void;
  loading: boolean;
}

interface RestoreDialogProps {
  open: boolean;
  backup: BackupMetadata | null;
  onClose: () => void;
  onConfirm: (options: RestoreOptions) => void;
  loading: boolean;
}

interface BackupConfigDialogProps {
  open: boolean;
  config: BackupConfig;
  onClose: () => void;
  onSave: (config: Partial<BackupConfig>) => void;
  loading: boolean;
}

const BackupCard: React.FC<BackupCardProps> = ({
  backup,
  onRestore,
  onDownload,
  delay
}) => {
  const getStatusColor = (status: BackupMetadata['status']) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'creating': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'corrupted': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: BackupMetadata['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'creating': return <CircularProgress size={20} />;
      case 'failed': return <ErrorIcon />;
      case 'corrupted': return <Warning />;
      default: return <Info />;
    }
  };

  const getTypeIcon = (type: BackupMetadata['type']) => {
    switch (type) {
      case 'manual': return <Person />;
      case 'automatic': return <AutoMode />;
      case 'scheduled': return <Schedule />;
      default: return <Backup />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Safe date formatting function
  const formatCreatedDate = (
    createdAt: Date | { toDate: () => Date } | number | string | undefined | null
  ) => {
    try {
      if (!createdAt) return 'Fecha desconocida';
      
      // If it's already a Date object
      if (createdAt instanceof Date) {
        return formatDistanceToNow(createdAt, { addSuffix: true, locale: es });
      }
      
      // If it's a Firestore Timestamp with toDate method
      if (
        createdAt &&
        typeof createdAt === 'object' &&
        typeof (createdAt as { toDate?: () => Date }).toDate === 'function'
      ) {
        return formatDistanceToNow((createdAt as { toDate: () => Date }).toDate(), { addSuffix: true, locale: es });
      }
      
      // If it's a timestamp number
      if (typeof createdAt === 'number') {
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es });
      }
      
      // If it's a string date
      if (typeof createdAt === 'string') {
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: es });
      }
      
      return 'Fecha desconocida';
    } catch (error) {
      console.error('Error formatting date:', error, createdAt);
      return 'Fecha inválida';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: 5,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: getStatusColor(backup.status),
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 60px -10px ${alpha(getStatusColor(backup.status), 0.25)}`,
          },
        }}
      >
        {/* Status indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: getStatusColor(backup.status),
          }}
        />

        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(getStatusColor(backup.status), 0.12),
                color: getStatusColor(backup.status),
                borderRadius: 3,
              }}
            >
              {getStatusIcon(backup.status)}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                  {backup.name}
                </Typography>
                <Chip
                  icon={getTypeIcon(backup.type)}
                  label={backup.type}
                  size="small"
                  sx={{
                    bgcolor: alpha('#6366f1', 0.1),
                    color: '#6366f1',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
                {backup.isEncrypted && (
                  <Tooltip title="Respaldo encriptado">
                    <Lock sx={{ fontSize: 16, color: '#f59e0b' }} />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                {backup.description || 'Sin descripción'}
              </Typography>
            </Box>
            
            <IconButton
              sx={{ color: '#94a3b8' }}
              disabled
            >
              <Settings />
            </IconButton>
          </Box>

          {/* Metrics - Replaced Grid with Flexbox */}
          <Box 
            sx={{ 
              display: 'flex',
              gap: 2,
              mb: 3
            }}
          >
            <Paper 
              sx={{ 
                flex: 1,
                p: 2, 
                bgcolor: alpha('#10b981', 0.05), 
                border: `1px solid ${alpha('#10b981', 0.1)}` 
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Registros
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                {backup.recordCount?.toLocaleString() || '0'}
              </Typography>
            </Paper>
            <Paper 
              sx={{ 
                flex: 1,
                p: 2, 
                bgcolor: alpha('#6366f1', 0.05), 
                border: `1px solid ${alpha('#6366f1', 0.1)}` 
              }}
            >
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Tamaño
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366f1' }}>
                {formatFileSize(backup.size || 0)}
              </Typography>
            </Paper>
          </Box>

          {/* Details */}
          <Box sx={{ mb: 3 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Creado:
                </Typography>
                <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700 }}>
                  {formatCreatedDate(backup.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Versión:
                </Typography>
                <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700 }}>
                  {backup.version || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Verificación:
                </Typography>
                <Chip
                  label={backup.verificationStatus || 'pending'}
                  size="small"
                  sx={{
                    bgcolor: backup.verificationStatus === 'verified' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                    color: backup.verificationStatus === 'verified' ? '#10b981' : '#f59e0b',
                    fontWeight: 600,
                    fontSize: '0.6rem',
                    height: 16,
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => onRestore(backup)}
              variant="contained"
              size="small"
              startIcon={<Restore />}
              disabled={backup.status !== 'completed'}
              sx={{
                flex: 1,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              Restaurar
            </Button>
            <Button
              onClick={() => onDownload(backup)}
              variant="outlined"
              size="small"
              startIcon={<Download />}
              disabled={backup.status !== 'completed'}
              sx={{
                flex: 1,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#6366f1',
                color: '#6366f1',
                '&:hover': { borderColor: '#4f46e5', bgcolor: alpha('#6366f1', 0.05) },
              }}
            >
              Descargar
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CreateBackupDialog: React.FC<CreateBackupDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const validateName = useCallback((value: string) => {
    if (!value.trim()) {
      setNameError('El nombre del respaldo es requerido');
      return false;
    }
    if (value.trim().length < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    setNameError('');
    return true;
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (nameError) {
      validateName(value);
    }
  }, [nameError, validateName]);

  const handleSubmit = useCallback(() => {
    if (validateName(name)) {
      // Pass description only if it has content, otherwise pass undefined
      const trimmedDescription = description.trim();
      onConfirm(name.trim(), trimmedDescription || undefined);
      setName('');
      setDescription('');
      setNameError('');
    }
  }, [name, description, validateName, onConfirm]);

  const handleClose = useCallback(() => {
    setName('');
    setDescription('');
    setNameError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
            <Backup />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Crear Nuevo Respaldo
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Genera un respaldo manual de tus datos
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Nombre del respaldo"
            value={name}
            onChange={handleNameChange}
            onBlur={() => validateName(name)}
            fullWidth
            required
            error={!!nameError}
            helperText={nameError || 'Ej: Respaldo mensual enero 2024'}
            placeholder="Ingresa un nombre descriptivo"
          />
          <TextField
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Describe el propósito de este respaldo..."
            helperText="Información adicional sobre este respaldo"
          />
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || !!nameError || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Backup />}
          sx={{
            bgcolor: '#10b981',
            '&:hover': { bgcolor: '#059669' },
          }}
        >
          {loading ? 'Creando...' : 'Crear Respaldo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RestoreDialog: React.FC<RestoreDialogProps> = ({
  open,
  backup,
  onClose,
  onConfirm,
  loading
}) => {
  const [restoreType, setRestoreType] = useState<'full' | 'socios_only' | 'settings_only'>('full');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [createBackupBefore, setCreateBackupBefore] = useState(true);

  const handleSubmit = useCallback(() => {
    if (backup) {
      const options: RestoreOptions = {
        backupId: backup.id,
        restoreType,
        overwriteExisting,
        createBackupBeforeRestore: createBackupBefore,
        validateData: true
      };
      onConfirm(options);
    }
  }, [backup, restoreType, overwriteExisting, createBackupBefore, onConfirm]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
            <Restore />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Restaurar Respaldo
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {backup?.name} - {backup?.recordCount?.toLocaleString() || '0'} registros
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={4} sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Tipo de restauración</InputLabel>
            <Select
              value={restoreType}
              onChange={(e) => setRestoreType(e.target.value as 'full' | 'socios_only' | 'settings_only')}
              label="Tipo de restauración"
            >
              <MenuItem value="full">Restauración completa</MenuItem>
              <MenuItem value="socios_only">Solo socios</MenuItem>
              <MenuItem value="settings_only">Solo configuración</MenuItem>
            </Select>
          </FormControl>

          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={createBackupBefore}
                  onChange={(e) => setCreateBackupBefore(e.target.checked)}
                />
              }
              label="Crear respaldo antes de restaurar"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                />
              }
              label="Sobrescribir datos existentes"
            />
          </Stack>

          <Alert severity="warning">
            <Typography variant="body2">
              Esta acción modificará tus datos actuales. Se recomienda crear un respaldo antes de continuar.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Restore />}
          sx={{
            bgcolor: '#f59e0b',
            '&:hover': { bgcolor: '#d97706' },
          }}
        >
          {loading ? 'Restaurando...' : 'Restaurar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const BackupManagementSection: React.FC<BackupManagementSectionProps> = ({
  loading: externalLoading = false
}) => {
  const {
    backups,
    config,
    loading,
    progress,
    error,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    verifyBackup,
    updateConfig,
    getBackupStats
  } = useBackup();

  const [filter, setFilter] = useState<BackupFilterType>('all');
  const [sortField, setSortField] = useState<BackupSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<BackupSortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);

  // Memoize stats with stable dependencies
  const stats = useMemo(() => {
    return getBackupStats();
  }, [getBackupStats]); // Only depend on getBackupStats

  const filteredBackups = useMemo(() => {
    let filtered = [...backups]; // Create a new array to avoid mutations

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(backup => {
        switch (filter) {
          case 'manual': return backup.type === 'manual';
          case 'automatic': return backup.type === 'automatic';
          case 'scheduled': return backup.type === 'scheduled';
          case 'failed': return backup.status === 'failed';
          default: return true;
        }
      });
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(backup =>
        backup.name.toLowerCase().includes(searchLower) ||
        backup.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortField as keyof BackupMetadata];
      let bValue: unknown = b[sortField as keyof BackupMetadata];

      if (sortField === 'createdAt') {
        type BackupDateType = Date | { toMillis: () => number } | number | string | undefined | null;
        const getMillis = (val: BackupDateType): number => {
          if (val && typeof (val as { toMillis?: () => number }).toMillis === 'function') {
            return (val as { toMillis: () => number }).toMillis();
          }
          if (val instanceof Date) {
            return val.getTime();
          }
          if (typeof val === 'number') {
            return val;
          }
          if (typeof val === 'string') {
            return new Date(val).getTime();
          }
          return 0;
        };
        aValue = getMillis(aValue as BackupDateType);
        bValue = getMillis(bValue as BackupDateType);
      }

      if (sortOrder === 'asc') {
        return (aValue as number | string) < (bValue as number | string) ? -1 : (aValue as number | string) > (bValue as number | string) ? 1 : 0;
      } else {
        return (aValue as number | string) > (bValue as number | string) ? -1 : (aValue as number | string) < (bValue as number | string) ? 1 : 0;
      }
    });

    return filtered;
  }, [backups, filter, searchTerm, sortField, sortOrder]);

  const handleCreateBackup = useCallback(async (name: string, description?: string) => {
    const result = await createBackup(name, description, 'manual');
    if (result) {
      setCreateDialogOpen(false);
    }
  }, [createBackup]);

  const handleRestoreBackup = useCallback(async (options: RestoreOptions) => {
    const result = await restoreBackup(options);
    if (result) {
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    }
  }, [restoreBackup]);

  const handleDeleteBackup = useCallback(async (backup: BackupMetadata) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el respaldo "${backup.name}"?`)) {
      await deleteBackup(backup.id);
    }
  }, [deleteBackup]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  if (externalLoading || loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 4
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 5 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: '#f1f5f9',
                      borderRadius: 3,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ width: '80%', height: 16, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                    <Box sx={{ width: '60%', height: 14, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 12px 40px rgba(245, 158, 11, 0.3)',
                }}
              >
                <Backup sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    fontSize: '2.5rem',
                    background: 'linear-gradient(135deg, #0f172a 0%, #f59e0b 60%, #d97706 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.03em',
                    lineHeight: 0.9,
                    mb: 1,
                  }}
                >
                  Gestión de Respaldos
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '1.2rem',
                  }}
                >
                  Protege y restaura tus datos con respaldos automáticos y manuales
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                onClick={() => setConfigDialogOpen(true)}
                variant="outlined"
                startIcon={<Settings />}
                sx={{
                  py: 1.5,
                  px: 3,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': {
                    borderColor: '#d97706',
                    bgcolor: alpha('#f59e0b', 0.05),
                  },
                }}
              >
                Configurar
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="contained"
                startIcon={<Add />}
                sx={{
                  py: 1.5,
                  px: 3,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(245, 158, 11, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Crear Respaldo
              </Button>
            </Stack>
          </Box>

          {/* Progress indicator */}
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Paper
                elevation={0}
                sx={{
                  bgcolor: progress.step === 'Error' ? alpha('#ef4444', 0.05) : alpha('#f59e0b', 0.05),
                  border: `1px solid ${progress.step === 'Error' ? alpha('#ef4444', 0.15) : alpha('#f59e0b', 0.15)}`,
                  borderRadius: 4,
                  p: 3,
                  mb: 4,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ 
                    color: progress.step === 'Error' ? '#ef4444' : '#f59e0b', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {progress.step === 'Error' && <ErrorIcon sx={{ fontSize: 16 }} />}
                    {progress.step}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                    {progress.progress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.progress} 
                  sx={{ 
                    borderRadius: 2, 
                    height: 8,
                    bgcolor: progress.step === 'Error' ? alpha('#ef4444', 0.1) : alpha('#f59e0b', 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: progress.step === 'Error' ? '#ef4444' : '#f59e0b',
                      borderRadius: 2,
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                  {progress.message}
                </Typography>
              </Paper>
            </motion.div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {error}
                </Typography>
              </Alert>
            </motion.div>
          )}

          {/* Stats Cards - Replaced Grid with CSS Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)'
              },
              gap: 3,
              mb: 4
            }}
          >
            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                    <Storage />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stats.totalBackups}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Total Respaldos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stats.successfulBackups}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Exitosos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
                    <DataUsage />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {formatFileSize(stats.totalSize)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Espacio Usado
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' }}>
                    <History />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stats.lastBackup && stats.lastBackup.toDate ? 
                        formatDistanceToNow(stats.lastBackup.toDate(), { locale: es }) : 
                        'Nunca'
                      }
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Último Respaldo
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Filters and Search - Replaced Grid with CSS Grid */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: alpha('#f59e0b', 0.05),
              border: `1px solid ${alpha('#f59e0b', 0.15)}`,
              borderRadius: 4,
              p: 3,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '2fr 1fr 1fr 1fr'
                },
                gap: 3,
                alignItems: 'center'
              }}
            >
              <TextField
                fullWidth
                placeholder="Buscar respaldos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#94a3b8', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: 3,
                  }
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as BackupFilterType)}
                  label="Filtrar por tipo"
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 3,
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="manual">Manuales</MenuItem>
                  <MenuItem value="automatic">Automáticos</MenuItem>
                  <MenuItem value="scheduled">Programados</MenuItem>
                  <MenuItem value="failed">Fallidos</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as BackupSortField)}
                  label="Ordenar por"
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 3,
                  }}
                >
                  <MenuItem value="createdAt">Fecha de creación</MenuItem>
                  <MenuItem value="name">Nombre</MenuItem>
                  <MenuItem value="size">Tamaño</MenuItem>
                  <MenuItem value="recordCount">Registros</MenuItem>
                  <MenuItem value="status">Estado</MenuItem>
                </Select>
              </FormControl>
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outlined"
                fullWidth
                startIcon={sortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: 'white',
                }}
              >
                {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
            </Box>
          </Paper>
        </Box>
      </motion.div>

      {/* Backup Cards */}
      {filteredBackups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #f1f5f9',
              borderRadius: 5,
              p: 8,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha('#f59e0b', 0.1),
                color: '#f59e0b',
                mx: 'auto',
                mb: 3,
              }}
            >
              <Backup sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
              {searchTerm || filter !== 'all' ? 'No se encontraron respaldos' : 'No hay respaldos disponibles'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 400, mx: 'auto' }}>
              {searchTerm || filter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda para encontrar los respaldos que buscas.'
                : 'Crea tu primer respaldo para proteger tus datos importantes y poder restaurarlos cuando sea necesario.'
              }
            </Typography>
            {(!searchTerm && filter === 'all') && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="contained"
                size="large"
                startIcon={<Add />}
                sx={{
                  py: 2,
                  px: 4,
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(245, 158, 11, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Crear Primer Respaldo
              </Button>
            )}
          </Paper>
        </motion.div>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 4
          }}
        >
          {filteredBackups.map((backup, index) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              onRestore={(backup) => {
                setSelectedBackup(backup);
                setRestoreDialogOpen(true);
              }}
              onDelete={handleDeleteBackup}
              onDownload={(backup) => downloadBackup(backup.id)}
              onVerify={(backup) => verifyBackup(backup.id)}
              onViewDetails={() => {
                // TODO: Implement view details
                toast('Funcionalidad de detalles próximamente');
              }}
              delay={index * 0.1}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <CreateBackupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onConfirm={handleCreateBackup}
        loading={loading}
      />

      <RestoreDialog
        open={restoreDialogOpen}
        backup={selectedBackup}
        onClose={() => {
          setRestoreDialogOpen(false);
          setSelectedBackup(null);
        }}
        onConfirm={handleRestoreBackup}
        loading={loading}
      />

      {/* Backup Configuration Dialog */}
      <BackupConfigDialog
        open={configDialogOpen}
        config={config}
        onClose={() => setConfigDialogOpen(false)}
        onSave={async (newConfig) => {
          const success = await updateConfig(newConfig);
          if (success) {
            setConfigDialogOpen(false);
          }
        }}
        loading={loading}
      />

      {/* Speed Dial for quick actions */}
      <SpeedDial
        ariaLabel="Acciones de respaldo"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          '& .MuiFab-primary': {
            bgcolor: '#f59e0b',
            '&:hover': {
              bgcolor: '#d97706',
            },
          },
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Crear respaldo manual"
          onClick={() => setCreateDialogOpen(true)}
        />
        <SpeedDialAction
          icon={<Schedule />}
          tooltipTitle="Programar respaldo"
          onClick={() => setConfigDialogOpen(true)}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="Verificar respaldos"
          onClick={() => {
            backups.forEach(backup => {
              if (backup.status === 'completed') {
                verifyBackup(backup.id);
              }
            });
            toast('Verificación de respaldos iniciada');
          }}
        />
      </SpeedDial>
    </Box>
  );
};

// Backup Configuration Dialog Component
const BackupConfigDialog: React.FC<BackupConfigDialogProps> = ({
  open,
  config,
  onClose,
  onSave,
  loading
}) => {
  const [localConfig, setLocalConfig] = useState<BackupConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = useCallback(() => {
    onSave(localConfig);
  }, [localConfig, onSave]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
            <Settings />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Configuración de Respaldos
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Personaliza cómo y cuándo se crean los respaldos
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={4} sx={{ mt: 2 }}>
          {/* Automatic Backup Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AutoMode sx={{ color: '#6366f1' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Respaldos Automáticos
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localConfig.autoBackupEnabled}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        autoBackupEnabled: e.target.checked
                      })}
                    />
                  }
                  label="Habilitar respaldos automáticos"
                />

                {localConfig.autoBackupEnabled && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Frecuencia</InputLabel>
                      <Select
                        value={localConfig.backupFrequency}
                        onChange={(e) => setLocalConfig({
                          ...localConfig,
                          backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                        })}
                        label="Frecuencia"
                      >
                        <MenuItem value="daily">Diario</MenuItem>
                        <MenuItem value="weekly">Semanal</MenuItem>
                        <MenuItem value="monthly">Mensual</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Hora de respaldo"
                      type="time"
                      value={localConfig.backupTime}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        backupTime: e.target.value
                      })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      label="Máximo de respaldos a mantener"
                      type="number"
                      value={localConfig.maxBackups}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        maxBackups: parseInt(e.target.value) || 10
                      })}
                      fullWidth
                      inputProps={{ min: 1, max: 100 }}
                    />
                  </>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Storage and Compression Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Storage sx={{ color: '#10b981' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Almacenamiento y Compresión
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localConfig.compressionEnabled}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        compressionEnabled: e.target.checked
                      })}
                    />
                  }
                  label="Habilitar compresión de datos"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={localConfig.encryptionEnabled}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        encryptionEnabled: e.target.checked
                      })}
                    />
                  }
                  label="Habilitar encriptación"
                />

                <TextField
                  label="Días de retención"
                  type="number"
                  value={localConfig.retentionDays}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    retentionDays: parseInt(e.target.value) || 90
                  })}
                  fullWidth
                  inputProps={{ min: 1, max: 365 }}
                  helperText="Los respaldos se eliminarán automáticamente después de este período"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Data Inclusion Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DataUsage sx={{ color: '#8b5cf6' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Datos a Incluir
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localConfig.includeSettings}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        includeSettings: e.target.checked
                      })}
                    />
                  }
                  label="Incluir configuraciones del sistema"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={localConfig.includeCustomData}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        includeCustomData: e.target.checked
                      })}
                    />
                  }
                  label="Incluir datos personalizados"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={localConfig.notificationsEnabled}
                      onChange={(e) => setLocalConfig({
                        ...localConfig,
                        notificationsEnabled: e.target.checked
                      })}
                    />
                  }
                  label="Habilitar notificaciones de respaldo"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          sx={{
            bgcolor: '#6366f1',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};