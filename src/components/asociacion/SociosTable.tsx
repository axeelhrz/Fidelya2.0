'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  CalendarToday,
  People,
  FilterList,
} from '@mui/icons-material';
import { Socio } from '@/types/socio';
import { SelectChangeEvent } from '@mui/material/Select';

interface SociosTableProps {
  socios: Socio[];
  loading: boolean;
  onEdit: (socio: Socio) => void;
  onDelete: (socio: Socio) => void;
  onAdd: () => void;
}

const ITEMS_PER_PAGE = 10;

const TableSkeleton: React.FC = () => (
  <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 5 }}>
    <CardContent sx={{ p: 0 }}>
      <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box sx={{ width: 200, height: 24, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
            <Box sx={{ width: 150, height: 16, bgcolor: '#f1f5f9', borderRadius: 1 }} />
          </Box>
          <Box sx={{ width: 120, height: 40, bgcolor: '#f1f5f9', borderRadius: 2 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1, height: 48, bgcolor: '#f1f5f9', borderRadius: 3 }} />
          <Box sx={{ width: 200, height: 48, bgcolor: '#f1f5f9', borderRadius: 3 }} />
        </Box>
      </Box>
      <Box sx={{ p: 4 }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 2, borderBottom: index < 4 ? '1px solid #f1f5f9' : 'none' }}>
            <Box sx={{ width: 40, height: 40, bgcolor: '#f1f5f9', borderRadius: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ width: '60%', height: 16, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
              <Box sx={{ width: '40%', height: 14, bgcolor: '#f1f5f9', borderRadius: 1 }} />
            </Box>
            <Box sx={{ width: 80, height: 24, bgcolor: '#f1f5f9', borderRadius: 2 }} />
            <Box sx={{ width: 60, height: 32, bgcolor: '#f1f5f9', borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

export const SociosTable: React.FC<SociosTableProps> = ({
  socios,
  loading,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'vencido'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSocios = useMemo(() => {
    return socios.filter(socio => {
      const matchesSearch = 
        socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.telefono?.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || socio.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [socios, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredSocios.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSocios = filteredSocios.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusChip = (estado: string) => {
    const config = {
      activo: { color: '#10b981', bgcolor: alpha('#10b981', 0.1), label: 'Activo' },
      vencido: { color: '#ef4444', bgcolor: alpha('#ef4444', 0.1), label: 'Vencido' },
      inactivo: { color: '#6b7280', bgcolor: alpha('#6b7280', 0.1), label: 'Inactivo' }
    };

    const { color, bgcolor, label } = config[estado as keyof typeof config] || config.inactivo;

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          bgcolor,
          color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
        }}
      />
    );
  };
  
  /* Add this CSS to your global styles or in a <style jsx global> block if using Next.js */
  <style jsx global>{`
    .socio-row:hover {
      background-color: #fafbfc;
    }
  `}</style>

  const formatDate = (
    timestamp: Date | { toDate: () => Date } | string | number | undefined
  ) => {
    if (!timestamp) return '-';
    const date =
      typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp
        ? (timestamp as { toDate: () => Date }).toDate()
        : new Date(timestamp as string | number | Date);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TableSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: 5,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <CardContent sx={{ p: 4, borderBottom: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 3, mb: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Gestión de Socios
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {filteredSocios.length} socios encontrados
              </Typography>
            </Box>
            <Button
              onClick={onAdd}
              variant="contained"
              startIcon={<Add />}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 25px rgba(99, 102, 241, 0.4)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              Nuevo Socio
            </Button>
          </Box>

          {/* Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <TextField
              placeholder="Buscar por nombre, email, DNI o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#fafbfc',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                    borderWidth: 2,
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                  }
                },
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as 'all' | 'activo' | 'vencido')}
                label="Estado"
                startAdornment={<FilterList sx={{ color: '#94a3b8', mr: 1 }} />}
                sx={{
                  borderRadius: 3,
                  bgcolor: '#fafbfc',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                    borderWidth: 2,
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                  }
                }}
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="activo">Activos</MenuItem>
                <MenuItem value="vencido">Vencidos</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>

        {/* Table Content */}
        {paginatedSocios.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha('#6b7280', 0.1),
                color: '#6b7280',
                mx: 'auto',
                mb: 3,
              }}
            >
              <People sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              No hay socios
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 400, mx: 'auto' }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron socios con los filtros aplicados'
                : 'Comienza agregando tu primer socio'
              }
            </Typography>
            {(!searchTerm && statusFilter === 'all') && (
              <Button
                onClick={onAdd}
                variant="contained"
                startIcon={<Add />}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 25px rgba(99, 102, 241, 0.4)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Agregar Primer Socio
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafbfc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Socio
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Contacto
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Estado
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fecha de Alta
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSocios.map((socio, index) => (
                    <motion.tr
                      key={socio.uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      style={{ transition: 'background-color 0.2s ease' }}
                      className="socio-row"
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                            {socio.nombre}
                          </Typography>
                          {socio.dni && (
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              DNI: {socio.dni}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email sx={{ fontSize: 14, color: '#94a3b8' }} />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {socio.email}
                            </Typography>
                          </Box>
                          {socio.telefono && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone sx={{ fontSize: 14, color: '#94a3b8' }} />
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {socio.telefono}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(socio.estado)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 14, color: '#94a3b8' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {formatDate(socio.creadoEn)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            onClick={() => onEdit(socio)}
                            size="small"
                            sx={{
                              color: '#94a3b8',
                              '&:hover': {
                                color: '#6366f1',
                                bgcolor: alpha('#6366f1', 0.1),
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => onDelete(socio)}
                            size="small"
                            sx={{
                              color: '#94a3b8',
                              '&:hover': {
                                color: '#ef4444',
                                bgcolor: alpha('#ef4444', 0.1),
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredSocios.length)} de {filteredSocios.length} socios
                </Typography>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      fontWeight: 600,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                        }
                      }
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
};