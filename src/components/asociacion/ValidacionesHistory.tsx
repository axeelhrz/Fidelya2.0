'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Eye,
  TrendingUp,
  AlertTriangle,
  X,
  Users,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Validacion {
  id: string;
  socioId: string;
  socioNombre: string;
  comercioId: string;
  comercioNombre: string;
  beneficioId: string;
  beneficioTitulo: string;
  asociacionId: string;
  asociacionNombre: string;
  fechaValidacion: Timestamp;
  montoDescuento: number;
  estado: 'exitosa' | 'fallida' | 'pendiente';
  codigoValidacion: string;
  tipoDescuento: string;
  descuento: number;
  tipoAcceso?: string;
}

interface ValidacionStats {
  totalValidaciones: number;
  validacionesExitosas: number;
  validacionesFallidas: number;
  ahorroTotal: number;
  ahorroEsteMes: number;
  promedioValidacionesDiarias: number;
  comercioMasActivo: string;
  beneficioMasUsado: string;
  socioMasActivo: string;
  validacionesHoy: number;
}

export const ValidacionesHistory: React.FC = () => {
  const { user } = useAuth();
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [stats, setStats] = useState<ValidacionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComercio, setSelectedComercio] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedSocio, setSelectedSocio] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedValidacion, setSelectedValidacion] = useState<Validacion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Cargar validaciones SOLO de la asociación
  const loadValidaciones = React.useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando validaciones para asociación:', user.uid);

      // PASO 1: Obtener TODOS los socios de esta asociación
      const sociosQuery = query(
        collection(db, 'socios'),
        where('asociacionId', '==', user.uid),
        where('estado', 'in', ['activo', 'vencido', 'pendiente']) // Incluir todos los estados
      );

      const sociosSnapshot = await getDocs(sociosQuery);
      const sociosIds = sociosSnapshot.docs.map(doc => doc.id);
      
      console.log(`📋 Socios encontrados en la asociación: ${sociosIds.length}`);

      if (sociosIds.length === 0) {
        console.log('⚠️ No se encontraron socios en esta asociación');
        setValidaciones([]);
        setStats({
          totalValidaciones: 0,
          validacionesExitosas: 0,
          validacionesFallidas: 0,
          ahorroTotal: 0,
          ahorroEsteMes: 0,
          promedioValidacionesDiarias: 0,
          comercioMasActivo: 'Ninguno',
          beneficioMasUsado: 'Ninguno',
          socioMasActivo: 'Ninguno',
          validacionesHoy: 0
        });
        return;
      }

      // PASO 2: Obtener validaciones SOLO de los socios de esta asociación
      // Dividir en lotes de 10 para evitar límite de Firestore
      const validacionesData: Validacion[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < sociosIds.length; i += batchSize) {
        const batch = sociosIds.slice(i, i + batchSize);
        
        const validacionesQuery = query(
          collection(db, 'validaciones'),
          where('socioId', 'in', batch),
          where('estado', '==', 'exitosa'),
          orderBy('fechaValidacion', 'desc')
        );

        const snapshot = await getDocs(validacionesQuery);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // VALIDACIÓN ADICIONAL: Verificar que el socio realmente pertenece a esta asociación
          if (sociosIds.includes(data.socioId)) {
            validacionesData.push({
              id: doc.id,
              socioId: data.socioId || '',
              socioNombre: data.socioNombre || 'Socio sin nombre',
              comercioId: data.comercioId || '',
              comercioNombre: data.comercioNombre || 'Comercio sin nombre',
              beneficioId: data.beneficioId || '',
              beneficioTitulo: data.beneficioTitulo || 'Beneficio sin título',
              asociacionId: user.uid, // FORZAR el ID de la asociación actual
              asociacionNombre: data.asociacionNombre || 'Asociación',
              fechaValidacion: data.fechaValidacion,
              montoDescuento: data.montoDescuento || 0,
              estado: data.estado || 'exitosa',
              codigoValidacion: data.codigoValidacion || '',
              tipoDescuento: data.tipoDescuento || 'porcentaje',
              descuento: data.descuento || 0,
              tipoAcceso: data.tipoAcceso || 'asociacion'
            } as Validacion);
          }
        });
      }

      console.log(`✅ Validaciones filtradas por socios de la asociación: ${validacionesData.length}`);
      
      // Ordenar por fecha descendente
      validacionesData.sort((a, b) => b.fechaValidacion.toDate().getTime() - a.fechaValidacion.toDate().getTime());
      
      setValidaciones(validacionesData);
      
      // Calcular estadísticas
      calculateStats(validacionesData);
      
    } catch (err) {
      console.error('❌ Error loading validaciones:', err);
      setError('Error al cargar las validaciones de la asociación');
      toast.error('Error al cargar las validaciones de la asociación');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Calcular estadísticas mejoradas
  const calculateStats = (validacionesData: Validacion[]) => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const validacionesExitosas = validacionesData.filter(v => v.estado === 'exitosa');
    const validacionesFallidas = validacionesData.filter(v => v.estado === 'fallida');
    
    const validacionesEsteMes = validacionesData.filter(v => {
      const fecha = v.fechaValidacion.toDate();
      return fecha >= startOfCurrentMonth && fecha <= endOfCurrentMonth;
    });

    const validacionesHoy = validacionesData.filter(v => {
      const fecha = v.fechaValidacion.toDate();
      return fecha >= startOfToday;
    });

    const ahorroTotal = validacionesExitosas.reduce((total, v) => total + (v.montoDescuento || 0), 0);
    const ahorroEsteMes = validacionesEsteMes
      .filter(v => v.estado === 'exitosa')
      .reduce((total, v) => total + (v.montoDescuento || 0), 0);

    // Comercio más activo
    const comercioCount: { [key: string]: number } = {};
    validacionesData.forEach(v => {
      comercioCount[v.comercioNombre] = (comercioCount[v.comercioNombre] || 0) + 1;
    });
    const comercioMasActivo = Object.keys(comercioCount).reduce((a, b) => 
      comercioCount[a] > comercioCount[b] ? a : b, 'Ninguno'
    );

    // Beneficio más usado
    const beneficioCount: { [key: string]: number } = {};
    validacionesData.forEach(v => {
      beneficioCount[v.beneficioTitulo] = (beneficioCount[v.beneficioTitulo] || 0) + 1;
    });
    const beneficioMasUsado = Object.keys(beneficioCount).reduce((a, b) => 
      beneficioCount[a] > beneficioCount[b] ? a : b, 'Ninguno'
    );

    // Socio más activo
    const socioCount: { [key: string]: number } = {};
    validacionesData.forEach(v => {
      socioCount[v.socioNombre] = (socioCount[v.socioNombre] || 0) + 1;
    });
    const socioMasActivo = Object.keys(socioCount).reduce((a, b) => 
      socioCount[a] > socioCount[b] ? a : b, 'Ninguno'
    );

    const promedioValidacionesDiarias = validacionesEsteMes.length / now.getDate();

    setStats({
      totalValidaciones: validacionesData.length,
      validacionesExitosas: validacionesExitosas.length,
      validacionesFallidas: validacionesFallidas.length,
      ahorroTotal,
      ahorroEsteMes,
      promedioValidacionesDiarias,
      comercioMasActivo,
      beneficioMasUsado,
      socioMasActivo,
      validacionesHoy: validacionesHoy.length
    });
  };

  // Filtrar validaciones (siempre solo de la asociación)
  const filteredValidaciones = useMemo(() => {
    return validaciones.filter(validacion => {
      // SIEMPRE filtrar solo validaciones de la asociación actual
      if (validacion.asociacionId !== user?.uid) {
        return false;
      }
      
      const matchesSearch = searchTerm === '' || 
        validacion.socioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validacion.comercioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validacion.beneficioTitulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validacion.codigoValidacion.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesComercio = selectedComercio === '' || validacion.comercioNombre === selectedComercio;
      const matchesEstado = selectedEstado === '' || validacion.estado === selectedEstado;
      const matchesSocio = selectedSocio === '' || validacion.socioNombre === selectedSocio;
      
      const validacionDate = validacion.fechaValidacion.toDate();
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      const matchesDateRange = validacionDate >= startDate && validacionDate <= endDate;
      
      return matchesSearch && matchesComercio && matchesEstado && matchesSocio && matchesDateRange;
    });
  }, [validaciones, searchTerm, selectedComercio, selectedEstado, selectedSocio, dateRange, user]);

  // Obtener listas únicas para filtros
  const comerciosUnicos = useMemo(() => {
    const comercios = [...new Set(validaciones.map(v => v.comercioNombre))];
    return comercios.sort();
  }, [validaciones]);

  const sociosUnicos = useMemo(() => {
    const socios = [...new Set(validaciones.map(v => v.socioNombre))];
    return socios.sort();
  }, [validaciones]);

  // Exportar datos
  const handleExport = () => {
    const csvContent = [
      ['Fecha', 'Socio', 'Comercio', 'Beneficio', 'Estado', 'Código', 'Descuento'].join(','),
      ...filteredValidaciones.map(v => [
        format(v.fechaValidacion.toDate(), 'dd/MM/yyyy HH:mm'),
        v.socioNombre,
        v.comercioNombre,
        v.beneficioTitulo,
        v.estado,
        v.codigoValidacion,
        `$${v.montoDescuento}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `validaciones_asociacion_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Datos exportados exitosamente');
  };

  // Obtener color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'exitosa': return 'text-green-600 bg-green-100';
      case 'fallida': return 'text-red-600 bg-red-100';
      case 'pendiente': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'exitosa': return <CheckCircle className="w-4 h-4" />;
      case 'fallida': return <XCircle className="w-4 h-4" />;
      case 'pendiente': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    loadValidaciones();
  }, [loadValidaciones]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando validaciones de la asociación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar validaciones</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadValidaciones}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información de la asociación */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6" />
          <h2 className="text-xl font-bold">Validaciones de la Asociación</h2>
        </div>
        <p className="text-purple-100">
          Mostrando únicamente las validaciones realizadas por socios de tu asociación
        </p>
      </div>

      {/* Estadísticas superiores removidas por redundancia según US#10 */}

      {/* Información adicional */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Comercio más activo</p>
                <p className="font-semibold text-gray-900">{stats.comercioMasActivo}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Socio más activo</p>
                <p className="font-semibold text-gray-900">{stats.socioMasActivo}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Beneficio más usado</p>
                <p className="font-semibold text-gray-900">{stats.beneficioMasUsado}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles y filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar validaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comercio
                  </label>
                  <select
                    value={selectedComercio}
                    onChange={(e) => setSelectedComercio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Todos los comercios</option>
                    {comerciosUnicos.map(comercio => (
                      <option key={comercio} value={comercio}>{comercio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Socio
                  </label>
                  <select
                    value={selectedSocio}
                    onChange={(e) => setSelectedSocio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Todos los socios</option>
                    {sociosUnicos.map(socio => (
                      <option key={socio} value={socio}>{socio}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedEstado}
                    onChange={(e) => setSelectedEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="exitosa">Exitosa</option>
                    <option value="fallida">Fallida</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedComercio('');
                    setSelectedEstado('');
                    setSelectedSocio('');
                    setSearchTerm('');
                    setDateRange({
                      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de validaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredValidaciones.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {validaciones.length === 0 ? 'No hay validaciones de la asociación' : 'No se encontraron validaciones'}
            </h3>
            <p className="text-gray-600">
              {validaciones.length === 0 
                ? 'Las validaciones de tus socios aparecerán aquí cuando usen beneficios'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Socio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comercio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredValidaciones.map((validacion) => (
                  <motion.tr
                    key={validacion.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(validacion.fechaValidacion.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {validacion.socioNombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{validacion.comercioNombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{validacion.beneficioTitulo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(validacion.estado)}`}>
                        {getStatusIcon(validacion.estado)}
                        {validacion.estado.charAt(0).toUpperCase() + validacion.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          setSelectedValidacion(validacion);
                          setShowDetailModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <AnimatePresence>
        {showDetailModal && selectedValidacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detalles de Validación
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código de Validación
                      </label>
                      <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                        {selectedValidacion.codigoValidacion}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedValidacion.estado)}`}>
                        {getStatusIcon(selectedValidacion.estado)}
                        {selectedValidacion.estado.charAt(0).toUpperCase() + selectedValidacion.estado.slice(1)}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha y Hora
                      </label>
                      <p className="text-gray-900">
                        {format(selectedValidacion.fechaValidacion.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Socio
                      </label>
                      <p className="text-gray-900">{selectedValidacion.socioNombre}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comercio
                      </label>
                      <p className="text-gray-900">{selectedValidacion.comercioNombre}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descuento
                      </label>
                      <p className="text-gray-900">${selectedValidacion.montoDescuento}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beneficio Utilizado
                    </label>
                    <p className="text-gray-900">{selectedValidacion.beneficioTitulo}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Validación de Asociación</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Esta validación fue realizada por un socio de tu asociación: {selectedValidacion.asociacionNombre}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};