import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Gift, 
  Store, 
  Award,
  Calendar,
  Target,
  Zap,
  Sparkles,
  Star,
  Trophy
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface SocioStatsProps {
  estadisticas: {
    totalValidaciones: number;
    ahorroTotal: number;
    beneficiosMasUsados: Array<{ titulo: string; usos: number }>;
    comerciosFavoritos: Array<{ nombre: string; visitas: number }>;
    validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
  };
}

export const SocioStats: React.FC<SocioStatsProps> = ({ estadisticas }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const pieData = estadisticas.beneficiosMasUsados.slice(0, 5).map((item, index) => ({
    name: item.titulo,
    value: item.usos,
    color: COLORS[index % COLORS.length]
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-celestial-50/30 rounded-3xl"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-100/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-celestial-100/20 to-transparent rounded-full blur-3xl"></div>
      
      <motion.div 
        className="relative z-10 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div 
          variants={itemVariants}
          className="text-center py-8"
        >
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-sky-500/10 to-celestial-500/10 backdrop-blur-sm rounded-full px-6 py-3 mb-4">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <span className="text-sky-700 font-medium">Estadísticas Personales</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 via-celestial-600 to-sky-700 bg-clip-text text-transparent mb-2">
            Tu Actividad
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubre tu progreso y los beneficios que has aprovechado
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-5 h-5 text-sky-100" />
                    <span className="text-sky-100 text-sm font-medium">Total Validaciones</span>
                  </div>
                  <div className="text-4xl font-bold mb-1">{estadisticas.totalValidaciones}</div>
                  <div className="text-sky-100 text-sm">Beneficios utilizados</div>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <motion.div 
                    className="bg-white rounded-full h-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((estadisticas.totalValidaciones / 50) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
                <span className="text-xs text-sky-100">Meta: 50</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-emerald-100" />
                    <span className="text-emerald-100 text-sm font-medium">Ahorro Total</span>
                  </div>
                  <div className="text-4xl font-bold mb-1">{formatCurrency(estadisticas.ahorroTotal)}</div>
                  <div className="text-emerald-100 text-sm">En beneficios</div>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-100" />
                <span className="text-emerald-100 text-sm">+12% este mes</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-celestial-500 to-purple-600 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-celestial-400/20 to-transparent rounded-2xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Store className="w-5 h-5 text-celestial-100" />
                    <span className="text-celestial-100 text-sm font-medium">Comercios Visitados</span>
                  </div>
                  <div className="text-4xl font-bold mb-1">{estadisticas.comerciosFavoritos.length}</div>
                  <div className="text-celestial-100 text-sm">Establecimientos únicos</div>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Store className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-celestial-100" />
                <span className="text-celestial-100 text-sm">Diversidad alta</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Validaciones por Mes */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-celestial-50/30 rounded-3xl"></div>
            
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Actividad Mensual
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <span className="text-sm text-gray-600">Últimos 6 meses</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-celestial-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-sky-600" />
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={estadisticas.validacionesPorMes}>
                    <defs>
                      <linearGradient id="colorValidaciones" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#64748b"
                      fontSize={12}
                      fontWeight={500}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      fontWeight={500}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'validaciones' ? value : formatCurrency(value),
                        name === 'validaciones' ? 'Validaciones' : 'Ahorro'
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(14, 165, 233, 0.2)',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="validaciones"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorValidaciones)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Beneficios Más Usados */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-celestial-50/50 to-sky-50/30 rounded-3xl"></div>
            
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Beneficios Favoritos
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-celestial-500" />
                    <span className="text-sm text-gray-600">Top 5 más usados</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-celestial-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-celestial-600" />
                </div>
              </div>
              
              {estadisticas.beneficiosMasUsados.length > 0 ? (
                <div className="flex items-center justify-center">
                  <div className="w-56 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value} usos`, 'Cantidad']}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="ml-8 space-y-3">
                    {pieData.map((item, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40"
                        whileHover={{ scale: 1.05, x: 5 }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">{item.value} usos</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">No hay beneficios utilizados aún</p>
                  <p className="text-gray-400 text-sm mt-1">¡Comienza a usar beneficios para ver estadísticas!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Comercios Favoritos */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -5 }}
          className="group relative"
        >
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-sky-50/30 rounded-3xl"></div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Comercios Favoritos
                </h3>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-600">Tus lugares más visitados</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            
            {estadisticas.comerciosFavoritos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {estadisticas.comerciosFavoritos.slice(0, 6).map((comercio, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative group/card"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl border border-white/40"></div>
                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {comercio.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {comercio.visitas} {comercio.visitas === 1 ? 'visita' : 'visitas'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progreso</span>
                          <span>{comercio.visitas} visitas</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${(comercio.visitas / Math.max(...estadisticas.comerciosFavoritos.map(c => c.visitas))) * 100}%` 
                            }}
                            transition={{ duration: 1, delay: 0.2 * index }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Store className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No has visitado comercios aún</p>
                <p className="text-gray-400 text-sm mt-1">¡Explora y descubre nuevos lugares!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Achievement Section */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -5 }}
          className="group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent rounded-3xl"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">
                    ¡Sigue ahorrando!
                  </h3>
                  <p className="text-amber-100 text-lg">
                    Has ahorrado {formatCurrency(estadisticas.ahorroTotal)} hasta ahora
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span className="text-amber-200 text-sm">¡Excelente progreso!</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">
                    {estadisticas.totalValidaciones}
                  </div>
                  <div className="text-amber-100 text-sm font-medium">Beneficios</div>
                  <div className="w-16 bg-white/20 rounded-full h-1 mt-2">
                    <motion.div 
                      className="bg-white rounded-full h-1"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((estadisticas.totalValidaciones / 50) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">
                    {estadisticas.comerciosFavoritos.length}
                  </div>
                  <div className="text-orange-100 text-sm font-medium">Comercios</div>
                  <div className="w-16 bg-white/20 rounded-full h-1 mt-2">
                    <motion.div 
                      className="bg-white rounded-full h-1"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((estadisticas.comerciosFavoritos.length / 20) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
