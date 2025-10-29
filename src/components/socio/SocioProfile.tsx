'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3,
  Shield,
  Award,
  TrendingUp,
  Gift,
  Store,
  Save,
  X,
  RefreshCw,
  Camera,
  Upload,
  CheckCircle,
  Target,
  Trophy,
  Activity,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useAuth } from '@/hooks/useAuth';
import { uploadImage, validateImageFile } from '@/utils/storage/uploadImage';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Interfaces
interface ProfileFormData {
  nombre: string;
  telefono: string;
  dni: string;
  direccion: string;
  fechaNacimiento: string;
}

// Utility functions
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'activo':
      return 'bg-green-500';
    case 'vencido':
      return 'bg-amber-500';
    case 'pendiente':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (estado: string) => {
  switch (estado) {
    case 'activo':
      return 'Activo';
    case 'vencido':
      return 'Vencido';
    case 'pendiente':
      return 'Pendiente';
    default:
      return 'Inactivo';
  }
};

// Helper function to convert Firebase Timestamp to Date
const convertToDate = (value: Date | Timestamp | string | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

// Simple Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = 'bg-blue-50 text-blue-600' }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border">
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xl lg:text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  </div>
);

// Main component
export const SocioProfile: React.FC = () => {
  const { user } = useAuth();
  const { 
    socio, 
    loading: socioLoading, 
    updateProfile, 
    refreshData,
  } = useSocioProfile();

  const { 
    beneficiosUsados, 
    estadisticasRapidas, 
    loading: beneficiosLoading,
    refrescar
  } = useBeneficios();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // UI states
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Photo upload states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form validation errors
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  // Calcular beneficios más usados desde beneficiosUsados
  const beneficiosMasUsados = useMemo(() => {
    const beneficiosCount: { [key: string]: { titulo: string; usos: number } } = {};
    
    beneficiosUsados.forEach(uso => {
      const key = uso.beneficioTitulo || 'Beneficio';
      if (beneficiosCount[key]) {
        beneficiosCount[key].usos++;
      } else {
        beneficiosCount[key] = { titulo: key, usos: 1 };
      }
    });

    return Object.values(beneficiosCount)
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 5);
  }, [beneficiosUsados]);

  // Calcular comercios únicos visitados
  const comerciosUnicos = useMemo(() => {
    const comerciosSet = new Set(beneficiosUsados.map(uso => uso.comercioId));
    return comerciosSet.size;
  }, [beneficiosUsados]);

  // Profile data with safe fallbacks
  const profileData = useMemo(() => {
    const fechaNacimientoDate = convertToDate(socio?.fechaNacimiento);
    const creadoEnDate = convertToDate(socio?.creadoEn) || new Date();
    
    return {
      nombre: socio?.nombre || user?.nombre || 'Usuario',
      email: socio?.email || user?.email || '',
      telefono: socio?.telefono || '',
      dni: socio?.dni || '',
      direccion: socio?.direccion || '',
      fechaNacimiento: fechaNacimientoDate,
      estado: socio?.estado || 'activo',
      creadoEn: creadoEnDate,
      numeroSocio: socio?.numeroSocio || '',
      fotoPerfil: socio?.fotoPerfil || '',
      nivel: {
        nivel: 'Bronze' as const,
        puntos: Math.floor(estadisticasRapidas.usados * 10),
        puntosParaProximoNivel: 1000,
        proximoNivel: 'Silver',
      }
    };
  }, [socio, user, estadisticasRapidas.usados]);

  // Enhanced stats usando datos de beneficios consistentes
  const enhancedStats = useMemo(() => {
    const creadoEnDate = convertToDate(profileData.creadoEn);
    const tiempoComoSocio = creadoEnDate ? differenceInDays(new Date(), creadoEnDate) : 0;
    
    // Calcular beneficios este mes
    const beneficiosEsteMes = beneficiosUsados.filter(uso => {
      const fechaUso = uso.fechaUso.toDate();
      const ahora = new Date();
      return fechaUso.getMonth() === ahora.getMonth() && fechaUso.getFullYear() === ahora.getFullYear();
    }).length;
    
    return {
      beneficiosUsados: estadisticasRapidas.usados || 0,
      comerciosVisitados: comerciosUnicos,
      tiempoComoSocio,
      beneficiosEsteMes,
    };
  }, [estadisticasRapidas, profileData.creadoEn, beneficiosUsados, comerciosUnicos]);

  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: profileData.nombre,
    telefono: profileData.telefono,
    dni: profileData.dni,
    direccion: profileData.direccion,
    fechaNacimiento: profileData.fechaNacimiento 
      ? format(profileData.fechaNacimiento, 'yyyy-MM-dd')
      : ''
  });

  // Update form data when socio data changes
  useEffect(() => {
    if (socio) {
      const fechaNacimientoDate = convertToDate(socio.fechaNacimiento);
      setFormData({
        nombre: socio.nombre || '',
        telefono: socio.telefono || '',
        dni: socio.dni || '',
        direccion: socio.direccion || '',
        fechaNacimiento: fechaNacimientoDate 
          ? format(fechaNacimientoDate, 'yyyy-MM-dd')
          : ''
      });
    }
  }, [socio]);

  // Photo upload handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Archivo no válido');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Partial<ProfileFormData> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (formData.telefono && !/^\+?[\d\s-()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }
    
    if (formData.dni && !/^\d{7,8}$/.test(formData.dni.replace(/\D/g, ''))) {
      newErrors.dni = 'DNI debe tener 7-8 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        refrescar()
      ]);
      toast.success('Datos actualizados');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Error al actualizar');
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshData, refrescar, refreshing]);

  const handleSaveProfile = useCallback(async () => {
    if (!validateForm()) return;
    
    setUpdating(true);
    try {
      const updateData = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        dni: formData.dni,
        direccion: formData.direccion,
        fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : undefined
      };
      
      const success = await updateProfile(updateData);
      if (success) {
        toast.success('Perfil actualizado exitosamente');
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setUpdating(false);
    }
  }, [formData, updateProfile, validateForm]);

  const handlePhotoUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setUploadingPhoto(true);
    setUploadProgress(0);
    
    try {
      const photoPath = `socios/${user?.uid}/profile/foto_perfil`;
      
      const photoUrl = await uploadImage(selectedFile, photoPath, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        quality: 0.8,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      // Update profile with new photo URL
      const success = await updateProfile({
        fotoPerfil: photoUrl
      });

      if (success) {
        toast.success('Foto de perfil actualizada exitosamente');
        setPhotoModalOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto de perfil');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  }, [selectedFile, user?.uid, updateProfile]);

  const handleClosePhotoModal = useCallback(() => {
    if (uploadingPhoto) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoModalOpen(false);
  }, [uploadingPhoto]);

  const handleCloseEditModal = useCallback(() => {
    if (updating) return;
    setErrors({});
    setEditModalOpen(false);
  }, [updating]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Loading state combinado
  const loading = socioLoading || beneficiosLoading;

  // Modern loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cargando perfil</h2>
          <p className="text-gray-600">Obteniendo tu información...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-sm text-gray-600">Información personal</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="p-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden lg:inline ml-2">
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </span>
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Header Background */}
            <div className="h-24 lg:h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <div className="absolute top-4 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden lg:inline ml-2">
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-4 lg:px-6 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between -mt-12 lg:-mt-16 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Avatar with Photo Upload */}
                  <div className="relative group">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white overflow-hidden">
                      {profileData.fotoPerfil ? (
                        <Image
                          src={profileData.fotoPerfil}
                          alt={profileData.nombre}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          style={{ width: '100%', height: '100%' }}
                          unoptimized
                        />
                      ) : (
                        <div className="w-20 h-20 lg:w-28 lg:h-28 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <User size={32} className="text-white lg:w-10 lg:h-10" />
                        </div>
                      )}
                    </div>
                    
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 lg:border-4 border-white shadow-lg flex items-center justify-center",
                      getStatusColor(profileData.estado)
                    )}>
                      <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                    
                    {/* Upload overlay */}
                    <div 
                      className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setPhotoModalOpen(true)}
                    >
                      <div className="text-center text-white">
                        <Camera className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="pb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      {profileData.nombre}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-sm lg:text-base text-gray-600 font-medium">
                        Socio #{profileData.numeroSocio}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-white text-xs font-bold shadow-sm",
                        getStatusColor(profileData.estado)
                      )}>
                        {getStatusText(profileData.estado)}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-sm">
                      <Award size={14} />
                      <span>Nivel {profileData.nivel.nivel}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPhotoModalOpen(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <Camera size={16} className="mr-2" />
                    Foto
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex-1 sm:flex-none"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Editar
                  </Button>
                </div>
              </div>

              {/* Level Progress - Mobile Optimized */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Target size={16} className="text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      Progreso a {profileData.nivel.proximoNivel}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-600">
                    {profileData.nivel.puntos} / {profileData.nivel.puntosParaProximoNivel} pts
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm transition-all duration-1000"
                    style={{ 
                      width: `${(profileData.nivel.puntos / profileData.nivel.puntosParaProximoNivel) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {profileData.nivel.puntosParaProximoNivel - profileData.nivel.puntos} puntos restantes
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Beneficios Usados"
              value={enhancedStats.beneficiosUsados}
              icon={<Gift size={20} />}
              color="bg-emerald-50 text-emerald-600"
            />
            
            <StatsCard
              title="Comercios Visitados"
              value={enhancedStats.comerciosVisitados}
              icon={<Store size={20} />}
              color="bg-blue-50 text-blue-600"
            />
            
            <StatsCard
              title="Este Mes"
              value={enhancedStats.beneficiosEsteMes}
              icon={<Calendar size={20} />}
              color="bg-purple-50 text-purple-600"
            />
            
            <StatsCard
              title="Días como Socio"
              value={enhancedStats.tiempoComoSocio}
              icon={<Trophy size={20} />}
              color="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Personal Information */}
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Edit3 size={16} className="mr-2" />
                  Editar
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Email</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-900 font-medium">{profileData.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Teléfono</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <Phone size={16} className="text-gray-500" />
                      <span className="text-gray-900 font-medium">{profileData.telefono || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">DNI</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <Shield size={16} className="text-gray-500" />
                      <span className="text-gray-900 font-medium">{profileData.dni || 'No especificado'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Dirección</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="text-gray-900 font-medium">{profileData.direccion || 'No especificado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {profileData.fechaNacimiento && (
                <div className="mt-6">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Fecha de Nacimiento</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-gray-900 font-medium">
                      {format(profileData.fechaNacimiento, 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Sidebar */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
              </div>
              
              {beneficiosMasUsados && beneficiosMasUsados.length > 0 ? (
                <div className="space-y-3">
                  {beneficiosMasUsados.slice(0, 5).map((beneficio, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:shadow-sm transition-all duration-200"
                    >
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {beneficio.usos}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate text-sm">{beneficio.titulo}</div>
                        <div className="text-xs text-gray-500">{beneficio.usos} usos</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold">No hay actividad reciente</p>
                  <p className="text-gray-500 text-sm mt-1">Comienza a usar beneficios</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <Dialog open={photoModalOpen} onClose={handleClosePhotoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Camera size={20} className="text-blue-500" />
              Cambiar Foto de Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Area */}
            <div
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300",
                dragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                uploadingPhoto && "pointer-events-none opacity-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploadingPhoto}
              />

              {previewUrl ? (
                <div className="space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <Image
                      src={previewUrl || ''}
                      alt="Preview"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                      style={{ width: '100%', height: '100%' }}
                      unoptimized
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFile?.name}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    Cambiar Imagen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                    <ImageIcon size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">
                      Arrastra una imagen aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      o haz clic para seleccionar
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Upload size={16} className="mr-2" />
                      Seleccionar Archivo
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, WEBP hasta 5MB
                  </p>
                </div>
              )}

              {/* Upload Progress */}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium text-gray-700">
                      Subiendo... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClosePhotoModal}
              disabled={uploadingPhoto}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!selectedFile || uploadingPhoto}
              loading={uploadingPhoto}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Upload size={16} className="mr-2" />
              Subir Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onClose={handleCloseEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Edit3 size={20} className="text-blue-500" />
              Editar Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Tu nombre completo"
                required
                error={errors.nombre}
              />

              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+54 11 1234-5678"
                error={errors.telefono}
              />
            </div>

            <div className="space-y-4">
              <Input
                label="DNI"
                value={formData.dni}
                onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                placeholder="12345678"
                error={errors.dni}
              />

              <Input
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Tu dirección completa"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
              />
            </div>

            {/* Info Card */}
            <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Información importante</h4>
                  <p className="text-blue-700 text-xs mt-1">
                    Mantén tu información actualizada para recibir beneficios y comunicaciones importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={updating}
              className="flex-1"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProfile}
              loading={updating}
              className="bg-blue-500 hover:bg-blue-600 flex-1"
            >
              <Save size={16} className="mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocioProfile;