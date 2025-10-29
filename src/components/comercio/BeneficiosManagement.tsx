'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Gift,
  Edit,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  Package,
  AlertCircle,
  RefreshCw,
  Clock,
  Users
} from 'lucide-react';
import { BeneficioForm } from '@/components/beneficios/BeneficioForm';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { BeneficiosService } from '@/services/beneficios.service';
import type { Beneficio } from '@/types/beneficio';
import toast from 'react-hot-toast';

// Componente para cada beneficio
const BeneficioCard: React.FC<{
  beneficio: Beneficio;
  onEdit: (beneficio: Beneficio) => void;
  onDelete: (id: string) => void;
}> = ({ beneficio, onEdit, onDelete }) => {
  const getTipoIcon = () => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return <Percent className="w-5 h-5 text-white" />;
      case 'monto_fijo':
        return <DollarSign className="w-5 h-5 text-white" />;
      case 'producto_gratis':
        return <Package className="w-5 h-5 text-white" />;
      default:
        return <Gift className="w-5 h-5 text-white" />;
    }
  };

  const getTipoValue = () => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return `${beneficio.descuento}% OFF`;
      case 'monto_fijo':
        return `$${beneficio.descuento} OFF`;
      case 'producto_gratis':
        return 'GRATIS';
      default:
        return '';
    }
  };

  const getEstadoColor = () => {
    if (beneficio.estado === 'inactivo') return 'bg-gray-100 text-gray-700';
    if (beneficio.estado === 'vencido') return 'bg-red-100 text-red-700';
    if (beneficio.estado === 'agotado') return 'bg-orange-100 text-orange-700';
    if (beneficio.estado === 'activo') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getEstadoTexto = () => {
    switch (beneficio.estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'vencido': return 'Vencido';
      case 'agotado': return 'Agotado';
      default: return beneficio.estado;
    }
  };

  const formatearFecha = (
    timestamp: Date | { toDate: () => Date } | string | number | undefined
  ) => {
    try {
      let fecha: Date;
      if (timestamp && typeof (timestamp as { toDate: () => Date }).toDate === 'function') {
        fecha = (timestamp as { toDate: () => Date }).toDate();
      } else if (timestamp instanceof Date) {
        fecha = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        fecha = new Date(timestamp);
      } else {
        return 'Fecha inválida';
      }
      return fecha.toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            {getTipoIcon()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{beneficio.titulo}</h3>
            <p className="text-sm text-gray-600">{beneficio.categoria}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(beneficio)}
            className="text-gray-600 hover:text-blue-600"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(beneficio.id)}
            className="text-gray-600 hover:text-red-600"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-gray-700 mb-4 line-clamp-2">{beneficio.descripcion}</p>

      {/* Descuento */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold text-green-600">
          {getTipoValue()}
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor()}`}>
          {getEstadoTexto()}
        </div>
      </div>

      {/* Información adicional */}
      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>Hasta {formatearFecha(beneficio.fechaFin)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{beneficio.usosActuales || 0} usos</span>
            {beneficio.limiteTotal && (
              <span> / {beneficio.limiteTotal}</span>
            )}
          </div>
        </div>
        
        {beneficio.limitePorSocio && (
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>Máx. {beneficio.limitePorSocio} por socio</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente principal
export const BeneficiosManagement: React.FC = () => {
  const { user } = useAuth();
  
  // Estados locales simples
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBeneficio, setEditingBeneficio] = useState<Beneficio | null>(null);
  
  // Ref para evitar llamadas múltiples
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Función para cargar beneficios - completamente estable
  const loadBeneficios = useCallback(async () => {
    if (!user || user.role !== 'comercio' || loadingRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando beneficios para comercio:', user.uid);
      
      const data = await BeneficiosService.obtenerBeneficiosPorComercio(user.uid);
      
      if (mountedRef.current) {
        setBeneficios(data);
        console.log('✅ Beneficios cargados:', data.length);
      }
    } catch (err) {
      console.error('❌ Error cargando beneficios:', err);
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar beneficios';
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [user?.uid, user?.role]); // Solo depende de user.uid y user.role

  // Efecto para cargar beneficios - solo se ejecuta una vez por cambio de usuario
  useEffect(() => {
    mountedRef.current = true;
    
    if (user && user.role === 'comercio') {
      loadBeneficios();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [user?.uid]); // Solo cuando cambia el ID del usuario

  const handleCreateNew = useCallback(() => {
    setEditingBeneficio(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((beneficio: Beneficio) => {
    setEditingBeneficio(beneficio);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (beneficioId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este beneficio?')) {
      return;
    }

    try {
      setLoading(true);
      await BeneficiosService.eliminarBeneficio(beneficioId);
      toast.success('Beneficio eliminado exitosamente');
      
      // Actualizar la lista local inmediatamente
      setBeneficios(prev => prev.filter(b => b.id !== beneficioId));
    } catch (error) {
      console.error('Error eliminando beneficio:', error);
      toast.error('Error al eliminar el beneficio');
      // Recargar en caso de error
      loadBeneficios();
    } finally {
      setLoading(false);
    }
  }, [loadBeneficios]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingBeneficio(null);
    // Recargar beneficios después de cerrar el modal
    loadBeneficios();
  }, [loadBeneficios]);

  const handleRefresh = useCallback(() => {
    loadBeneficios();
  }, [loadBeneficios]);

  // Renderizado condicional para errores
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar beneficios</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw size={16} className="mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Beneficios</h2>
          <p className="text-gray-600">Gestiona los beneficios de tu comercio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-gray-600 hover:text-blue-600"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center gap-2"
          >
            <Plus size={20} />
            Crear Beneficio
          </Button>
        </div>
      </div>

      {/* Lista de beneficios */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : beneficios.length === 0 ? (
        <div className="text-center py-12">
          <Gift size={64} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes beneficios</h3>
          <p className="text-gray-600 mb-6">Crea tu primer beneficio para atraer más clientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((beneficio) => (
            <BeneficioCard
              key={beneficio.id}
              beneficio={beneficio}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Formulario de beneficio */}
      {user && (
        <BeneficioForm
          isOpen={formOpen}
          onClose={handleFormClose}
          beneficio={editingBeneficio}
          comercioId={user.uid}
        />
      )}
    </div>
  );
};