'use client';

import React from 'react';
import {
  Receipt,
  CardGiftcard,
  Group,
  AccessTime,
  TrendingUp,
  CheckCircle,
  Schedule,
  Analytics,
  Speed,
  Timeline,
} from '@mui/icons-material';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useValidaciones } from '@/hooks/useValidaciones';
import { useComercios } from '@/hooks/useComercios';
import { format, subDays, startOfMonth } from 'date-fns';
import { useRouter } from 'next/navigation';
import UnifiedMetricsCard from '@/components/ui/UnifiedMetricsCard';

export const StatsCards: React.FC = () => {
  const { beneficios } = useBeneficios();
  const activeBeneficios = beneficios.filter(b => b.activo);
  const { validaciones } = useValidaciones();
  const { comerciosVinculados } = useComercios();
  const router = useRouter();

  // Calculate stats
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const validacionesEsteMes = validaciones.filter(v => 
    v.fechaHora.toDate() >= startOfThisMonth
  );

  const validacionesExitosas = validacionesEsteMes.filter(v => v.resultado === 'habilitado');
  const tasaExito = validacionesEsteMes.length > 0 
    ? (validacionesExitosas.length / validacionesEsteMes.length) * 100 
    : 0;

  const ultimaValidacion = validaciones.length > 0 
    ? validaciones.sort((a, b) => b.fechaHora.toDate().getTime() - a.fechaHora.toDate().getTime())[0]
    : null;

  const tiempoUltimaValidacion = ultimaValidacion 
    ? getTimeAgo(ultimaValidacion.fechaHora.toDate())
    : 'Nunca';

  // Ajusta esta línea según la estructura real de tus comercios vinculados
  const asociacionesVinculadas = comerciosVinculados?.[0]?.asociacionesVinculadas?.length || 0;

  // Calculate growth rates (mock calculations for demo)
  const validacionesAyer = validaciones.filter(v => {
    const fecha = v.fechaHora.toDate();
    const ayer = subDays(now, 1);
    return fecha.toDateString() === ayer.toDateString();
  }).length;

  const validacionesHoy = validaciones.filter(v => {
    const fecha = v.fechaHora.toDate();
    return fecha.toDateString() === now.toDateString();
  }).length;

  const cambioValidaciones = validacionesAyer > 0 
    ? ((validacionesHoy - validacionesAyer) / validacionesAyer) * 100 
    : validacionesHoy > 0 ? 100 : 0;

  const kpiMetrics = [
    {
      title: 'Validaciones del Mes',
      value: validacionesEsteMes.length,
      change: Math.round(cambioValidaciones),
      icon: <Receipt />,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      delay: 0,
      subtitle: `${(validacionesEsteMes.length / new Date().getDate()).toFixed(1)} validaciones por día`,
      description: 'Total de validaciones realizadas durante este mes. Incluye exitosas y fallidas.',
      trend: cambioValidaciones > 0 ? 'up' as const : cambioValidaciones < 0 ? 'down' as const : 'neutral' as const,
      onClick: () => router.push('/dashboard/comercio/validaciones'),
      progressValue: Math.min((validacionesEsteMes.length / 100) * 100, 100),
    },
    {
      title: 'Tasa de Éxito',
      value: `${tasaExito.toFixed(1)}%`,
      change: tasaExito > 80 ? 15 : tasaExito > 60 ? 5 : -10,
      icon: <CheckCircle />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      delay: 0.1,
      subtitle: `${validacionesExitosas.length} de ${validacionesEsteMes.length} exitosas`,
      description: 'Porcentaje de validaciones que se completaron exitosamente sin errores.',
      trend: tasaExito > 80 ? 'up' as const : tasaExito < 60 ? 'down' as const : 'neutral' as const,
      onClick: () => router.push('/dashboard/comercio/analytics'),
      progressValue: tasaExito,
      badge: tasaExito > 90 ? 'Excelente' : tasaExito > 70 ? 'Bueno' : undefined,
    },
    {
      title: 'Beneficios Activos',
      value: activeBeneficios.length,
      change: 0,
      icon: <CardGiftcard />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      delay: 0.2,
      subtitle: `${beneficios.length} beneficios en total`,
      description: 'Beneficios disponibles para validación por parte de los socios.',
      trend: 'neutral' as const,
      onClick: () => router.push('/dashboard/comercio/beneficios'),
      badge: activeBeneficios.length > 5 ? 'Activo' : activeBeneficios.length > 0 ? 'Disponible' : 'Inactivo',
      progressValue: beneficios.length > 0 ? (activeBeneficios.length / beneficios.length) * 100 : 0,
    },
    {
      title: 'Asociaciones Vinculadas',
      value: asociacionesVinculadas,
      change: 5.2,
      icon: <Group />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      delay: 0.3,
      subtitle: 'Asociaciones activas conectadas',
      description: 'Número de asociaciones que pueden utilizar tus beneficios actualmente.',
      trend: 'up' as const,
      onClick: () => router.push('/dashboard/comercio/perfil'),
      progressValue: Math.min(asociacionesVinculadas * 20, 100),
      badge: asociacionesVinculadas > 3 ? 'Múltiple' : undefined,
    },
  ];

  const secondaryMetrics = [
    {
      title: "Última Validación",
      value: tiempoUltimaValidacion,
      change: 0,
      icon: <AccessTime />,
      color: "#64748b",
      gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
      delay: 0.4,
      subtitle: ultimaValidacion ? `${format(ultimaValidacion.fechaHora.toDate(), 'dd/MM/yyyy HH:mm')}` : 'No hay validaciones',
      description: "Tiempo transcurrido desde la última validación procesada en el sistema",
      trend: "neutral" as const,
      size: "medium" as const,
      variant: "detailed" as const,
      showProgress: false,
    },
    {
      title: "Promedio Diario",
      value: (validacionesEsteMes.length / new Date().getDate()).toFixed(1),
      change: 12,
      icon: <TrendingUp />,
      color: "#ec4899",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      delay: 0.5,
      subtitle: "validaciones por día este mes",
      description: "Media de validaciones procesadas diariamente durante el mes actual",
      trend: "up" as const,
      size: "medium" as const,
      variant: "detailed" as const,
      progressValue: Math.min((validacionesEsteMes.length / new Date().getDate()) * 10, 100),
    },
    {
      title: "Índice de Rendimiento",
      value: `${Math.min(tasaExito + (asociacionesVinculadas * 5), 100).toFixed(0)}%`,
      change: 8,
      icon: <Analytics />,
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      delay: 0.6,
      subtitle: "índice general de rendimiento",
      description: "Índice calculado basado en tasa de éxito, asociaciones y actividad general",
      trend: "up" as const,
      size: "medium" as const,
      variant: "detailed" as const,
      onClick: () => router.push('/dashboard/comercio/analytics'),
      progressValue: Math.min(tasaExito + (asociacionesVinculadas * 5), 100),
      badge: "Calculado",
    },
  ];

  const additionalMetrics = [
    {
      title: "Eficiencia Operativa",
      value: `${Math.min((tasaExito * 0.7) + (asociacionesVinculadas * 10), 100).toFixed(0)}%`,
      change: 6,
      icon: <Speed />,
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      delay: 0.7,
      subtitle: "eficiencia del sistema",
      description: "Medida de la eficiencia operativa general del comercio",
      trend: "up" as const,
      size: "medium" as const,
      variant: "detailed" as const,
      progressValue: Math.min((tasaExito * 0.7) + (asociacionesVinculadas * 10), 100),
    },
    {
      title: "Actividad Reciente",
      value: validacionesHoy,
      change: validacionesHoy > validacionesAyer ? 25 : -15,
      icon: <Timeline />,
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      delay: 0.8,
      subtitle: "validaciones hoy",
      description: "Número de validaciones procesadas en el día actual",
      trend: validacionesHoy > validacionesAyer ? 'up' as const : validacionesHoy < validacionesAyer ? 'down' as const : 'neutral' as const,
      size: "medium" as const,
      variant: "detailed" as const,
      progressValue: Math.min(validacionesHoy * 20, 100),
    },
    {
      title: "Tiempo Promedio",
      value: "2.3 min",
      change: -8,
      icon: <Schedule />,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      delay: 0.9,
      subtitle: "por validación",
      description: "Tiempo promedio que toma procesar cada validación",
      trend: "down" as const,
      size: "medium" as const,
      variant: "detailed" as const,
      progressValue: 75,
      badge: "Optimizado",
    },
    {
      title: "Estado General",
      value: "Excelente",
      change: 0,
      icon: <CheckCircle />,
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      delay: 1.0,
      subtitle: "sistema operativo",
      description: "Estado general del sistema basado en todas las métricas",
      trend: "neutral" as const,
      size: "medium" as const,
      variant: "detailed" as const,
      showProgress: false,
      badge: "Activo",
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiMetrics.map((metric, index) => (
          <div key={index}>
            <UnifiedMetricsCard
              {...metric}
              size="large"
              variant="detailed"
              showProgress={true}
            />
          </div>
        ))}
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {secondaryMetrics.map((metric, index) => (
          <div key={index}>
            <UnifiedMetricsCard {...metric} />
          </div>
        ))}
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {additionalMetrics.map((metric, index) => (
          <div key={index}>
            <UnifiedMetricsCard {...metric} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
}