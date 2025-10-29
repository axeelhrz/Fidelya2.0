'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit3, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  CreditCard,
  Settings,
  Save,
  X
} from 'lucide-react';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProfileFormData {
  nombre: string;
  telefono: string;
  dni: string;
  direccion: string;
}

export const ProfileCard: React.FC = () => {
  const { socio, stats, loading, updating, updateProfile } = useSocioProfile();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: '',
    telefono: '',
    dni: '',
    direccion: ''
  });

  // Initialize form data when socio data loads
  React.useEffect(() => {
    if (socio) {
      setFormData({
        nombre: socio.nombre || '',
        telefono: socio.telefono || '',
        dni: socio.dni || '',
        direccion: socio.direccion || ''
      });
    }
  }, [socio]);

  const handleSave = async () => {
    try {
      await updateProfile({
        nombre: formData.nombre,
        telefono: formData.telefono || undefined,
        dni: formData.dni || undefined,
        direccion: formData.direccion || undefined
      });
      setEditModalOpen(false);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingSkeleton className="h-96" />;
  }

  if (!socio) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <User size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se pudo cargar el perfil</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-500';
      case 'vencido':
        return 'bg-yellow-500';
      case 'inactivo':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'Socio Activo';
      case 'vencido':
        return 'Membresía Vencida';
      case 'inactivo':
        return 'Socio Inactivo';
      default:
        return 'Estado Desconocido';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Header con gradiente */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings size={16} />}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setEditModalOpen(true)}
            >
              Configurar
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar y estado */}
          <div className="flex items-start justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(socio.estado)} rounded-full border-2 border-white`}></div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit3 size={16} />}
              onClick={() => setEditModalOpen(true)}
              className="mt-4"
            >
              Editar
            </Button>
          </div>

          {/* Información del usuario */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{socio.nombre}</h2>
              <p className="text-sm text-gray-500">{getStatusText(socio.estado)}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail size={16} className="text-gray-600" />
                </div>
                <span className="text-gray-900">{socio.email}</span>
              </div>

              {socio.telefono && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-gray-600" />
                  </div>
                  <span className="text-gray-900">{socio.telefono}</span>
                </div>
              )}

              {socio.dni && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={16} className="text-gray-600" />
                  </div>
                  <span className="text-gray-900">DNI: {socio.dni}</span>
                </div>
              )}

              {socio.direccion && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MapPin size={16} className="text-gray-600" />
                  </div>
                  <span className="text-gray-900">{socio.direccion}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar size={16} className="text-gray-600" />
                </div>
                <span className="text-gray-900">
                  Socio desde {format(
                    socio.creadoEn && typeof ((socio.creadoEn as unknown as { toDate?: () => Date }).toDate) === 'function'
                      ? (socio.creadoEn as unknown as { toDate: () => Date }).toDate()
                      : socio.creadoEn instanceof Date
                        ? socio.creadoEn
                        : new Date(socio.creadoEn as unknown as string | number),
                    'MMMM yyyy',
                    { locale: es }
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {stats?.totalAsociaciones || 0}
                </div>
                <div className="text-xs text-gray-500">Beneficios Usados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {stats?.totalActivas || 0}
                </div>
                <div className="text-xs text-gray-500">Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.totalVencidas || 0}
                </div>
                <div className="text-xs text-gray-500">Este Mes</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal de edición */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label="Nombre completo"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Tu nombre completo"
              required
            />

            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              placeholder="Tu número de teléfono"
            />

            <Input
              label="DNI"
              value={formData.dni}
              onChange={(e) => handleInputChange('dni', e.target.value)}
              placeholder="Tu número de documento"
            />

            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              placeholder="Tu dirección"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              leftIcon={<X size={16} />}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              loading={updating}
              leftIcon={<Save size={16} />}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};