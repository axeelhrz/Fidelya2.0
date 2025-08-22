'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Collapse,
  alpha,
  SelectChangeEvent,
} from '@mui/material';
import {
  FilterList,
  Clear,
  Search,
  ExpandMore,
} from '@mui/icons-material';
import { NotificationType, NotificationPriority, NotificationStatus, NotificationCategory } from '@/types/notification';



const typeLabels: Record<NotificationType, string> = {
  info: 'Información',
  success: 'Éxito',
  warning: 'Advertencia',
  error: 'Error',
  announcement: 'Anuncio'
};

const priorityLabels: Record<NotificationPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

const statusLabels: Record<NotificationStatus, string> = {
  unread: 'No leída',
  read: 'Leída',
  archived: 'Archivada'
};

const categoryLabels: Record<NotificationCategory, string> = {
  system: 'Sistema',
  membership: 'Socios',
  payment: 'Pagos',
  event: 'Eventos',
  general: 'General'
};

interface NotificationFilters {
  search?: string;
  status?: NotificationStatus[];
  type?: NotificationType[];
  priority?: NotificationPriority[];
  category?: NotificationCategory[];
  dateRange?: { from: Date; to: Date };
}

interface NotificationFiltersProps {
  filters: NotificationFilters;
  onFiltersChange: (filters: NotificationFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleMultiSelectChange = (
    field: keyof NotificationFilters,
    event: SelectChangeEvent<string[]>
  ) => {
    const value = event.target.value as string[];
    onFiltersChange({
      ...filters,
      [field]: value.length > 0 ? value : undefined
    });
  };

  const removeFilter = (field: keyof NotificationFilters, value?: string) => {
    if (field === 'search') {
      setSearchValue('');
      onFiltersChange({ ...filters, search: undefined });
    } else if (value && Array.isArray(filters[field])) {
      const currentValues = filters[field] as string[];
      const newValues = currentValues.filter(v => v !== value);
      onFiltersChange({
        ...filters,
        [field]: newValues.length > 0 ? newValues : undefined
      });
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.type?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.category?.length) count++;
    if (filters.dateRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          bgcolor: alpha('#6366f1', 0.02),
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList sx={{ color: '#6366f1' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Filtros de Notificaciones
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} activo${activeFiltersCount > 1 ? 's' : ''}`}
                size="small"
                sx={{
                  bgcolor: alpha('#6366f1', 0.1),
                  color: '#6366f1',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeFiltersCount > 0 && (
              <Button
                onClick={onClearFilters}
                startIcon={<Clear />}
                size="small"
                sx={{
                  color: '#64748b',
                  '&:hover': {
                    bgcolor: alpha('#ef4444', 0.1),
                    color: '#ef4444',
                  }
                }}
              >
                Limpiar
              </Button>
            )}
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                color: '#6366f1',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            >
              <ExpandMore />
            </IconButton>
          </Box>
        </Box>

        {/* Search Bar - Always visible */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar en notificaciones..."
            value={searchValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ color: '#94a3b8', mr: 1 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#ffffff',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Status Filter */}
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                multiple
                value={filters.status || []}
                onChange={(e) => handleMultiSelectChange('status', e)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={statusLabels[value as NotificationStatus]}
                        size="small"
                        onDelete={() => removeFilter('status', value)}
                        sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Type Filter */}
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                multiple
                value={filters.type || []}
                onChange={(e) => handleMultiSelectChange('type', e)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={typeLabels[value as NotificationType]}
                        size="small"
                        onDelete={() => removeFilter('type', value)}
                        sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select
                multiple
                value={filters.priority || []}
                onChange={(e) => handleMultiSelectChange('priority', e)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={priorityLabels[value as NotificationPriority]}
                        size="small"
                        onDelete={() => removeFilter('priority', value)}
                        sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Category Filter */}
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                multiple
                value={filters.category || []}
                onChange={(e) => handleMultiSelectChange('category', e)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={categoryLabels[value as NotificationCategory]}
                        size="small"
                        onDelete={() => removeFilter('category', value)}
                        sx={{ bgcolor: alpha('#ec4899', 0.1), color: '#ec4899' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};