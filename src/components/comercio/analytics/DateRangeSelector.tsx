'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Stack,
  Typography,
  Chip,
  IconButton,
  alpha,
} from '@mui/material';
import {
  DateRange,
  CalendarToday,
  Close,
} from '@mui/icons-material';
import { DateRangePicker, RangeKeyDict } from 'react-date-range';
import { format, subDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DateRangeSelectorProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempRange, setTempRange] = useState([
    {
      startDate: dateRange.start,
      endDate: dateRange.end,
      key: 'selection',
    },
  ]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Reset temp range to current range
    setTempRange([
      {
        startDate: dateRange.start,
        endDate: dateRange.end,
        key: 'selection',
      },
    ]);
  };

  const handleApply = () => {
    onDateRangeChange({
      start: tempRange[0].startDate,
      end: tempRange[0].endDate,
    });
    setAnchorEl(null);
  };

  const handlePresetClick = (days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    onDateRangeChange({ start: startDate, end: endDate });
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const formatDateRange = () => {
    try {
      // Validar que las fechas sean válidas
      if (!isValid(dateRange.start) || !isValid(dateRange.end)) {
        return 'Seleccionar fechas';
      }
      
      const start = format(dateRange.start, 'dd MMM', { locale: es });
      const end = format(dateRange.end, 'dd MMM', { locale: es });
      return `${start} - ${end}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Seleccionar fechas';
    }
  };

  const presets = [
    { label: 'Últimos 7 días', days: 7 },
    { label: 'Últimos 15 días', days: 15 },
    { label: 'Últimos 30 días', days: 30 },
    { label: 'Últimos 90 días', days: 90 },
  ];

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DateRange />}
        onClick={handleClick}
        sx={{
          borderColor: '#e2e8f0',
          color: '#64748b',
          fontWeight: 600,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          '&:hover': {
            borderColor: '#06b6d4',
            bgcolor: alpha('#06b6d4', 0.05),
            color: '#06b6d4',
          },
        }}
      >
        {formatDateRange()}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ width: 650 }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              p: 3,
              borderBottom: '1px solid #f1f5f9',
              bgcolor: alpha('#06b6d4', 0.02),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <CalendarToday sx={{ color: '#06b6d4', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Seleccionar Período
              </Typography>
            </Stack>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Stack>

          {/* Presets */}
          <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
              Períodos Rápidos
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {presets.map((preset) => (
                <Chip
                  key={preset.days}
                  label={preset.label}
                  onClick={() => handlePresetClick(preset.days)}
                  sx={{
                    bgcolor: alpha('#06b6d4', 0.1),
                    color: '#0891b2',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha('#06b6d4', 0.2),
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Date Range Picker */}
          <Box sx={{ p: 2 }}>
            <DateRangePicker
              ranges={tempRange}
              onChange={(ranges: RangeKeyDict) => {
                const { startDate, endDate, key } = ranges.selection;
                setTempRange([
                  {
                    startDate: startDate ?? new Date(),
                    endDate: endDate ?? new Date(),
                    key: key ?? 'selection',
                  },
                ]);
              }}
              locale={es}
              months={2}
              direction="horizontal"
              moveRangeOnFirstSelection={false}
              editableDateInputs={true}
              rangeColors={['#06b6d4']}
            />
          </Box>

          {/* Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{
              p: 3,
              borderTop: '1px solid #f1f5f9',
              bgcolor: alpha('#f8fafc', 0.5),
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: alpha('#64748b', 0.05),
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              sx={{
                bgcolor: '#06b6d4',
                '&:hover': {
                  bgcolor: '#0891b2',
                },
              }}
            >
              Aplicar
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};