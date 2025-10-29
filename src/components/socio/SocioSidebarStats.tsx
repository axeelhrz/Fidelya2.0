'use client';

import React, { memo, useMemo } from 'react';
import { 
  Gift, 
  TrendingUp, 
  Calendar, 
} from 'lucide-react';

interface SocioSidebarStatsProps {
  totalBeneficios: number;
  beneficiosUsados: number;
  beneficiosEstesMes: number;
  isOpen: boolean;
}

// Componente de estadística individual memoizado
const StatCard = memo<{
  icon: React.ReactNode;
  value: number;
  label: string;
  gradient: string;
  iconGradient: string;
}>(({ icon, value, label, gradient, iconGradient }) => (
  <div className={`${gradient} rounded-2xl p-3 border border-opacity-50 shadow-sm`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`w-8 h-8 ${iconGradient} rounded-xl flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
      <span className="text-sm font-black">{value}</span>
    </div>
    <p className="text-xs font-bold opacity-80">{label}</p>
  </div>
));

StatCard.displayName = 'StatCard';

// Componente de barra de progreso memoizado
const ProgressBar = memo<{
  percentage: number;
  beneficiosEstesMes: number;
}>(({ percentage, beneficiosEstesMes }) => (
  <div className="bg-white rounded-2xl p-3 border border-gray-200/50 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
          <Calendar className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-700">Este mes</span>
      </div>
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <span className="font-bold">{beneficiosEstesMes}</span>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <span className="font-bold">{percentage.toFixed(0)}%</span>
      </div>
    </div>
    
    {/* Barra de progreso optimizada */}
    <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
      <div 
        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
        style={{ 
          width: `${percentage}%`,
          willChange: 'width' // Optimización para animaciones
        }}
      />
    </div>
    
    {/* Indicador de actividad */}
    <div className="flex items-center justify-center mt-3 space-x-2">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      <span className="text-xs text-gray-500 font-medium">Actividad reciente</span>
    </div>
  </div>
));

ProgressBar.displayName = 'ProgressBar';

const SocioSidebarStats: React.FC<SocioSidebarStatsProps> = memo(({
  totalBeneficios,
  beneficiosUsados,
  beneficiosEstesMes,
  isOpen
}) => {
  // Memoizar el cálculo del porcentaje para evitar recálculos innecesarios
  const progressPercentage = useMemo(() => {
    if (totalBeneficios === 0) return 0;
    return Math.min((beneficiosUsados / totalBeneficios) * 100, 100);
  }, [totalBeneficios, beneficiosUsados]);

  // Memoizar las props de las tarjetas de estadísticas
  const statCards = useMemo(() => [
    {
      icon: <Gift className="w-4 h-4 text-white" />,
      value: totalBeneficios,
      label: 'Disponibles',
      gradient: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600',
      iconGradient: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-white" />,
      value: beneficiosUsados,
      label: 'Usados',
      gradient: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600',
      iconGradient: 'bg-gradient-to-r from-emerald-500 to-green-500'
    }
  ], [totalBeneficios, beneficiosUsados]);

  // Early return si el sidebar está cerrado
  if (!isOpen) return null;

  return (
    <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50/50 to-white">
      {/* Grid de estadísticas modernas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>
      
      {/* Resumen mensual moderno */}
      <ProgressBar 
        percentage={progressPercentage} 
        beneficiosEstesMes={beneficiosEstesMes} 
      />
    </div>
  );
});

SocioSidebarStats.displayName = 'SocioSidebarStats';

export default SocioSidebarStats;