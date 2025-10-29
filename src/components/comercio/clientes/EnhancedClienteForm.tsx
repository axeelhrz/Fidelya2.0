'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Tag,
  Bell,
  MessageSquare,
  Gift,
  Camera,
  X,
  Plus,
  Check
} from 'lucide-react';
import { ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

interface EnhancedClienteFormProps {
  formData: ClienteFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClienteFormData>>;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEdit?: boolean;
  onImageUpload?: (file: File) => Promise<void>;
  currentImage?: string;
}

export const EnhancedClienteForm: React.FC<EnhancedClienteFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEdit = false,
  onImageUpload,
  currentImage
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const totalSteps = 3;

  // Validación de campos requeridos por paso
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.nombre.trim() !== '' && formData.email.trim() !== '';
      case 2:
        return true; // Información de contacto es opcional
      case 3:
        return true; // Configuración es opcional
      default:
        return false;
    }
  };

  // Manejar subida de imagen
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Crear preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Subir imagen si hay función disponible
      if (onImageUpload) {
        await onImageUpload(file);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Agregar tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Navegar entre pasos
  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (isStepValid(1)) {
      await onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step <= currentStep
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step < currentStep ? <Check size={16} /> : step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-16 h-1 mx-2 transition-all ${
                  step < currentStep ? 'bg-purple-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Paso 1: Información Básica */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Información Básica
              </h3>
              <p className="text-slate-600">
                Datos principales del cliente
              </p>
            </div>

            {/* Foto de perfil */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 hover:border-purple-400 transition-colors relative">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <User size={32} className="text-slate-400" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Nombre completo *"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  label="DNI/Documento"
                  value={formData.dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                  placeholder="12345678"
                />
              </div>

              <div className="relative">
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <span className={`text-sm ${isStepValid(1) ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isStepValid(1) 
                    ? 'Información básica completa' 
                    : 'Complete el nombre y email para continuar'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Paso 2: Información de Contacto */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Información de Contacto
              </h3>
              <p className="text-slate-600">
                Datos adicionales del cliente (opcional)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+54 9 11 1234-5678"
              />
              <Input
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Calle 123, Ciudad"
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs border border-slate-200"
                  >
                    <Tag size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Agregar etiqueta..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Paso 3: Configuración de Comunicación */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Configuración de Comunicación
              </h3>
              <p className="text-slate-600">
                Preferencias de contacto del cliente
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'recibirNotificaciones',
                  label: 'Recibir notificaciones',
                  description: 'Notificaciones generales del sistema',
                  icon: <Bell size={20} />
                },
                {
                  key: 'recibirPromociones',
                  label: 'Recibir promociones',
                  description: 'Ofertas especiales y descuentos',
                  icon: <Gift size={20} />
                },
                {
                  key: 'recibirEmail',
                  label: 'Comunicación por email',
                  description: 'Recibir comunicaciones por correo electrónico',
                  icon: <Mail size={20} />
                },
                {
                  key: 'recibirSMS',
                  label: 'Comunicación por SMS',
                  description: 'Recibir mensajes de texto al teléfono',
                  icon: <MessageSquare size={20} />
                },
              ].map((config) => (
                <div
                  key={config.key}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      formData.configuracion[config.key as keyof typeof formData.configuracion]
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{config.label}</h4>
                      <p className="text-sm text-slate-600">{config.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      configuracion: {
                        ...prev.configuracion,
                        [config.key]: !prev.configuracion[config.key as keyof typeof prev.configuracion]
                      }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.configuracion[config.key as keyof typeof formData.configuracion]
                        ? 'bg-purple-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.configuracion[config.key as keyof typeof formData.configuracion]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-medium text-purple-900 mb-2">Resumen del Cliente</h4>
              <div className="space-y-1 text-sm text-purple-800">
                <p><strong>Nombre:</strong> {formData.nombre || 'Sin especificar'}</p>
                <p><strong>Email:</strong> {formData.email || 'Sin especificar'}</p>
                {formData.telefono && <p><strong>Teléfono:</strong> {formData.telefono}</p>}
                {formData.direccion && <p><strong>Dirección:</strong> {formData.direccion}</p>}
                {formData.tags && formData.tags.length > 0 && (
                  <p><strong>Etiquetas:</strong> {formData.tags.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Anterior
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!isStepValid(1)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isEdit ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="text-center text-sm text-slate-500">
        Paso {currentStep} de {totalSteps}
      </div>
    </div>
  );
};