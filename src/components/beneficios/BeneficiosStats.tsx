'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  DollarSign, 
  Users, 
  Award,
  Target,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { BeneficioStats, Beneficio, BeneficioUso } from '@/types/beneficio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BeneficiosStatsProps {
  stats?: BeneficioStats | null;
  loading?: boolean;
  userRole?: 'socio' | 'comercio' | 'asociacion';
  className?: string;
  // Props para datos reales
  beneficios?: Beneficio[];
  beneficiosUsados?: BeneficioUso[];
  estadisticasRapidas?: {
    total: number;
    activos: number;
    usados: number;
    ahorroTotal: number;
    ahorroEsteMes: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  subtitle,
  trend = 'neutral',
  loading = false
}) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            icon
          )}
        </div>

        {change !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </h3>
        <p className="text-3xl font-black text-gray-900 mb-1">
          {loading ? '...' : value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export const BeneficiosStats: React.FC<BeneficiosStatsProps> = ({
  loading = false,
  userRole = 'comercio',
  className = '',
  beneficios = [],
  beneficiosUsados = [],
}) => {
  // Calcular estadísticas reales basadas en los datos locales
  const realStats = useMemo(() => {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const finMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0);

    // Beneficios activos (no vencidos y con estado activo)
    const beneficiosActivos = beneficios.filter(b => 
      b.estado === 'activo' && b.fechaFin.toDate() > now
    );

    // Beneficios vencidos
    const beneficiosVencidos = beneficios.filter(b => 
      b.estado === 'vencido' || (b.estado === 'activo' && b.fechaFin.toDate() <= now)
    );

    // Usos este mes
    const usosEsteMes = beneficiosUsados.filter(uso => 
      uso.fechaUso.toDate() >= inicioMes
    );

    // Usos mes anterior
    const usosMesAnterior = beneficiosUsados.filter(uso => {
      const fechaUso = uso.fechaUso.toDate();
      return fechaUso >= mesAnterior && fechaUso <= finMesAnterior;
    });

    // Ahorro total
    const ahorroTotal = beneficiosUsados.reduce((total, uso) => 
      total + (uso.montoDescuento || 0), 0
    );

    // Ahorro este mes
    const ahorroEsteMes = usosEsteMes.reduce((total, uso) => 
      total + (uso.montoDescuento || 0), 0
    );

    // Ahorro mes anterior
    const ahorroMesAnterior = usosMesAnterior.reduce((total, uso) => 
      total + (uso.montoDescuento || 0), 0
    );

    // Calcular cambios porcentuales
    const cambioUsos = usosMesAnterior.length > 0 
      ? ((usosEsteMes.length - usosMesAnterior.length) / usosMesAnterior.length) * 100 
      : usosEsteMes.length > 0 ? 100 : 0;

    const cambioAhorro = ahorroMesAnterior > 0 
      ? ((ahorroEsteMes - ahorroMesAnterior) / ahorroMesAnterior) * 100 
      : ahorroEsteMes > 0 ? 100 : 0;

    return {
      totalBeneficios: beneficios.length,
      beneficiosActivos: beneficiosActivos.length,
      beneficiosVencidos: beneficiosVencidos.length,
      totalUsados: beneficiosUsados.length,
      usosEsteMes: usosEsteMes.length,
      ahorroTotal,
      ahorroEsteMes,
      cambioUsos,
      cambioAhorro,
      porcentajeActivos: beneficios.length > 0 ? (beneficiosActivos.length / beneficios.length) * 100 : 0
    };
  }, [beneficios, beneficiosUsados]);

  // Top beneficios más utilizados
  const topBeneficios = useMemo(() => {
    if (beneficiosUsados.length === 0) return [];

    // Crear mapa de usos por beneficio
    const usosPorBeneficio = new Map<string, {
      titulo: string;
      comercio: string;
      usos: number;
      ahorro: number;
      ultimoUso: Date;
    }>();

    beneficiosUsados.forEach(uso => {
      const key = uso.beneficioId || 'unknown';
      const existing = usosPorBeneficio.get(key);
      
      if (existing) {
        existing.usos += 1;
        existing.ahorro += uso.montoDescuento || 0;
        if (uso.fechaUso.toDate() > existing.ultimoUso) {
          existing.ultimoUso = uso.fechaUso.toDate();
        }
      } else {
        usosPorBeneficio.set(key, {
          titulo: uso.beneficioTitulo || 'Beneficio',
          comercio: uso.comercioNombre || 'Comercio',
          usos: 1,
          ahorro: uso.montoDescuento || 0,
          ultimoUso: uso.fechaUso.toDate()
        });
      }
    });

    return Array.from(usosPorBeneficio.values())
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 5);
  }, [beneficiosUsados]);

  // Categorías más populares
  const topCategorias = useMemo(() => {
    if (beneficios.length === 0) return [];

    const categoriaMap = new Map<string, {
      cantidad: number;
      usos: number;
      ahorro: number;
    }>();

    // Contar beneficios por categoría
    beneficios.forEach(beneficio => {
      const categoria = beneficio.categoria || 'Sin categoría';
      const existing = categoriaMap.get(categoria) || { cantidad: 0, usos: 0, ahorro: 0 };
      categoriaMap.set(categoria, {
        ...existing,
        cantidad: existing.cantidad + 1
      });
    });

    // Agregar usos y ahorros por categoría
    beneficiosUsados.forEach(uso => {
      const beneficio = beneficios.find(b => b.id === uso.beneficioId);
      const categoria = beneficio?.categoria || 'Sin categoría';
      const existing = categoriaMap.get(categoria);
      
      if (existing) {
        existing.usos += 1;
        existing.ahorro += uso.montoDescuento || 0;
      }
    });

    return Array.from(categoriaMap.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [beneficios, beneficiosUsados]);

  // Tendencia mensual (últimos 6 meses)
  const tendenciaMensual = useMemo(() => {
    const meses = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const siguienteMes = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const usosDelMes = beneficiosUsados.filter(uso => {
        const fechaUso = uso.fechaUso.toDate();
        return fechaUso >= fecha && fechaUso < siguienteMes;
      });

      const ahorroDelMes = usosDelMes.reduce((total, uso) => 
        total + (uso.montoDescuento || 0), 0
      );

      meses.push({
        mes: format(fecha, 'yyyy-MM'),
        nombre: format(fecha, 'MMM', { locale: es }),
        usos: usosDelMes.length,
        ahorro: ahorroDelMes
      });
    }

    return meses;
  }, [beneficiosUsados]);

  // Estadísticas principales sin porcentajes y sin "Ahorro Este Mes"
  const statsCards = [
    {
      title: 'Total Beneficios',
      value: realStats.totalBeneficios.toLocaleString(),
      icon: <Gift size={24} />,
      color: '#6366f1',
      subtitle: userRole === 'socio' ? 'Disponibles para ti' : 'En la plataforma',
    },
    {
      title: 'Beneficios Activos',
      value: realStats.beneficiosActivos.toLocaleString(),
      icon: <Target size={24} />,
      color: '#10b981',
      subtitle: 'Disponibles para usar',
    },
    {
      title: 'Total Usado',
      value: realStats.totalUsados.toLocaleString(),
      icon: <Users size={24} />,
      color: '#8b5cf6',
      subtitle: 'Beneficios utilizados',
      change: realStats.cambioUsos,
      trend: realStats.cambioUsos > 0 ? 'up' : realStats.cambioUsos < 0 ? 'down' : 'neutral'
    },
    {
      title: 'Ahorro Total',
      value: `$${realStats.ahorroTotal.toLocaleString()}`,
      icon: <DollarSign size={24} />,
      color: '#f59e0b',
      subtitle: 'Dinero ahorrado',
      change: realStats.cambioAhorro,
      trend: realStats.cambioAhorro > 0 ? 'up' : realStats.cambioAhorro < 0 ? 'down' : 'neutral'
    }
  ];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCard
              key={index}
              title="Cargando..."
              value="..."
              icon={<Gift size={24} />}
              color="#6366f1"
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (realStats.totalBeneficios === 0 && beneficiosUsados.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
          <BarChart3 size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay estadísticas disponibles
        </h3>
        <p className="text-gray-500">
          {userRole === 'socio' 
            ? 'Cuando uses beneficios, las estadísticas aparecerán aquí'
            : 'Las estadísticas aparecerán cuando haya datos disponibles'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatCard key={index} {...card} trend={card.trend as 'up' | 'down' | 'neutral'} />
        ))}
      </div>

      {/* Gráficos y datos adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Beneficios */}
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Beneficios</h3>
              <p className="text-sm text-gray-600">Más utilizados</p>
            </div>
          </div>

          <div className="space-y-4">
            {topBeneficios.length > 0 ? (
              topBeneficios.map((beneficio, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {beneficio.titulo}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {beneficio.comercio} • Último uso: {format(beneficio.ultimoUso, 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {beneficio.usos}
                    </div>
                    <div className="text-xs text-green-600 font-semibold">
                      ${beneficio.ahorro.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PieChart size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Categorías */}
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Categorías Populares</h3>
              <p className="text-sm text-gray-600">Por cantidad de beneficios</p>
            </div>
          </div>

          <div className="space-y-4">
            {topCategorias.length > 0 ? (
              topCategorias.map((categoria, index) => {
                const maxCantidad = Math.max(...topCategorias.map(c => c.cantidad));
                const percentage = maxCantidad > 0 ? (categoria.cantidad / maxCantidad) * 100 : 0;
                
                return (
                  <div key={categoria.nombre} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {categoria.nombre}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {categoria.cantidad} • {categoria.usos} usos
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                    {categoria.ahorro > 0 && (
                      <div className="text-xs text-green-600 font-semibold">
                        ${categoria.ahorro.toLocaleString()} ahorrado
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BarChart3 size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Gráfico de tendencia mensual */}
      {tendenciaMensual.some(mes => mes.usos > 0) && (
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tendencia Mensual</h3>
              <p className="text-sm text-gray-600">Usos y ahorros por mes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {tendenciaMensual.map((mes, index) => {
              const maxUsos = Math.max(...tendenciaMensual.map(m => m.usos));
              const height = maxUsos > 0 ? (mes.usos / maxUsos) * 100 : 0;
              
              return (
                <div key={mes.mes} className="text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <motion.div
                      className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {mes.nombre}
                  </div>
                  <div className="text-xs text-gray-500">
                    {mes.usos} usos
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    ${mes.ahorro.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};
