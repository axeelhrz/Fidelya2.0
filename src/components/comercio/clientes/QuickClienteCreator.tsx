'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  X,
  Zap,
  Clock,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

interface QuickClienteCreatorProps {
  onCreateCliente: (clienteData: ClienteFormData) => Promise<string | null>;
  loading: boolean;
}

export const QuickClienteCreator: React.FC<QuickClienteCreatorProps> = ({
  onCreateCliente,
  loading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quickFormData, setQuickFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validar formulario rápido
  const validateQuickForm = () => {
    const newErrors: Record<string, string> = {};

    if (!quickFormData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!quickFormData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(quickFormData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear socio rápido
  const handleQuickCreate = async () => {
    if (!validateQuickForm()) return;

    const clienteData: ClienteFormData = {
      nombre: quickFormData.nombre,
      email: quickFormData.email,
      telefono: quickFormData.telefono || undefined,
      direccion: quickFormData.direccion || undefined,
      dni: '',
      fechaNacimiento: '',
      notas: '',
      tags: [],
      configuracion: {
        recibirNotificaciones: true,
        recibirPromociones: true,
        recibirEmail: true,
        recibirSMS: false,
      },
    };

    try {
      console.log('🚀 Creando socio rápido...');
      const clienteId = await onCreateCliente(clienteData);
      if (clienteId) {
        toast.success('Socio creado exitosamente');
        resetForm();
        setIsOpen(false);
        console.log('✅ Socio rápido creado correctamente');
      }
    } catch (error) {
      console.error('❌ Error creating socio:', error);
      toast.error('Error al crear socio');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setQuickFormData({
      nombre: '',
      email: '',
      telefono: '',
      direccion: ''
    });
    setErrors({});
  };

  // Cerrar modal
  const closeModal = () => {
    setIsOpen(false);
    resetForm();
  };

  // Prevenir scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center">
          {/* Backdrop mejorado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal mejorado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header mejorado */}
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 px-8 py-6 text-white relative overflow-hidden">
              {/* Efectos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-violet-600/20 backdrop-blur-3xl"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      Crear Socio Rápido
                      <Sparkles size={20} className="text-yellow-300" />
                    </h3>
                    <p className="text-purple-100 text-sm">Solo datos esenciales</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-105"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content mejorado */}
            <div className="p-8 space-y-6">
              {/* Información sobre creación rápida */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-white" />
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Creación rápida optimizada</p>
                  <p>Solo necesitas nombre y email. Podrás completar más información después desde la gestión de socios.</p>
                </div>
              </div>

              {/* Formulario mejorado */}
              <div className="space-y-5">
                <div>
                  <Input
                    label="Nombre completo *"
                    value={quickFormData.nombre}
                    onChange={(e) => {
                      setQuickFormData(prev => ({ ...prev, nombre: e.target.value }));
                      if (errors.nombre) setErrors(prev => ({ ...prev, nombre: '' }));
                    }}
                    placeholder="Ej: Juan Pérez"
                    error={errors.nombre}
                    required
                    className="text-lg py-3"
                  />
                </div>
                <div>
                  <Input
                    label="Email *"
                    type="email"
                    value={quickFormData.email}
                    onChange={(e) => {
                      setQuickFormData(prev => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="ejemplo@correo.com"
                    error={errors.email}
                    required
                    className="text-lg py-3"
                  />
                </div>
                <div>
                  <Input
                    label="Teléfono (opcional)"
                    value={quickFormData.telefono}
                    onChange={(e) => setQuickFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+54 9 11 1234-5678"
                    className="text-lg py-3"
                  />
                </div>
                <div>
                  <Input
                    label="Dirección (opcional)"
                    value={quickFormData.direccion}
                    onChange={(e) => setQuickFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Calle 123, Ciudad"
                    className="text-lg py-3"
                  />
                </div>
                
                {/* Configuración por defecto mejorada */}
                <div className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
                  <h4 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    Configuración por defecto:
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span>Notificaciones activas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span>Promociones activas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span>Email habilitado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X size={14} className="text-slate-400" />
                      <span>SMS deshabilitado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer mejorado */}
            <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-500" />
                Podrás editar toda la información después
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 px-6 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleQuickCreate}
                  loading={loading}
                  disabled={!quickFormData.nombre.trim() || !quickFormData.email.trim()}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-2 shadow-lg shadow-purple-500/30"
                >
                  <UserPlus size={16} className="mr-2" />
                  Crear Socio
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Botón flotante mejorado */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center z-50 group overflow-hidden"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
        
        <UserPlus size={28} className="relative z-10" />
        
        {/* Tooltip mejorado */}
        <div className="absolute right-full mr-4 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            Crear socio rápido
          </div>
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900"></div>
        </div>

        {/* Indicador de pulso */}
        <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20"></div>
      </motion.button>

      {/* Modal usando portal */}
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
};
