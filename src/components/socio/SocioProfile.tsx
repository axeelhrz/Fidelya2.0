'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Zap,
  Star,
  Crown,
  Sparkles,
  Save,
  X,
  RefreshCw,
  BarChart3,
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
      return 'bg-gradient-to-r from-emerald-500 to-green-500';
    case 'vencido':
      return 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 'pendiente':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    default:
      return 'bg-gradient-to-r from-gray-500 to-slate-500';
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

const getNivelIcon = (nivel: string) => {
  switch (nivel) {
    case 'Bronze':
      return <Award className="w-5 h-5 text-white" />;
    case 'Silver':
      return <Star className="w-5 h-5 text-white" />;
    case 'Gold':
      return <Crown className="w-5 h-5 text-white" />;
    case 'Platinum':
      return <Sparkles className="w-5 h-5 text-white" />;
    case 'Diamond':
      return <Zap className="w-5 h-5 text-white" />;
    default:
      return <Award className="w-5 h-5 text-white" />;
  }
};

const getNivelGradient = (nivel: string) => {
  switch (nivel) {
    case 'Bronze':
      return 'from-amber-500 to-orange-600';
    case 'Silver':
      return 'from-gray-400 to-gray-600';
    case 'Gold':
      return 'from-yellow-400 to-yellow-600';
    case 'Platinum':
      return 'from-purple-400 to-purple-600';
    case 'Diamond':
      return 'from-blue-400 to-blue-600';
    default:
      return 'from-gray-400 to-gray-500';
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

// Modern Stats Card Component
const ModernStatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  change?: number;
  subtitle?: string;
  onClick?: () => void;
}> = ({ title, value, icon, gradient, change, subtitle, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -4 }}
    className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl ${onClick ? 'hover:bg-white/90' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
      {change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
          change >= 0 ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100"
        )}>
          <TrendingUp size={12} className={change >= 0 ? "text-emerald-600" : "text-red-600 rotate-180"} />
          {Math.abs(change)}%
        </div>
      )}
    </div>
    
    <div className="space-y-2">
      <div className="text-3xl font-black text-gray-900">{value}</div>
      <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">{title}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 font-medium">{subtitle}</div>
      )}
    </div>
  </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-indigo-300 rounded-full animate-pulse mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Cargando perfil
          </h2>
          <p className="text-slate-600 text-lg">
            Obteniendo tu información...
          </p>
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl space-y-8">
          
          {/* Modern Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 overflow-hidden"
          >
            {/* Header Background with Gradient */}
            <div className="h-40 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Floating elements */}
              <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="absolute top-6 right-6">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm font-bold"
                >
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 sm:px-8 pb-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between -mt-20 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                  {/* Modern Avatar with Photo Upload */}
                  <div className="relative group">
                    <div className="w-32 h-32 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden">
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
                        <div className="w-28 h-28 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                          <User size={48} className="text-white z-10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${getStatusColor(profileData.estado)} rounded-2xl border-4 border-white shadow-lg flex items-center justify-center`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Upload overlay */}
                    <div 
                      className="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setPhotoModalOpen(true)}
                    >
                      <div className="text-center text-white">
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">Cambiar</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="pb-2">
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                      {profileData.nombre}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-lg text-gray-600 font-medium">
                        Socio #{profileData.numeroSocio}
                      </span>
                      <span className={`px-3 py-1 rounded-2xl text-white text-sm font-bold shadow-lg ${getStatusColor(profileData.estado)}`}>
                        {getStatusText(profileData.estado)}
                      </span>
                    </div>
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r ${getNivelGradient(profileData.nivel.nivel)} text-white font-bold shadow-lg`}>
                      {getNivelIcon(profileData.nivel.nivel)}
                      <span className="text-lg">Nivel {profileData.nivel.nivel}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 lg:mt-0">
                  <Button
                    variant="outline"
                    size="lg"
                    leftIcon={<Camera size={20} />}
                    onClick={() => setPhotoModalOpen(true)}
                    className="font-bold"
                  >
                    Cambiar Foto
                  </Button>
                  <Button
                    size="lg"
                    leftIcon={<Edit3 size={20} />}
                    onClick={() => setEditModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Editar Perfil
                  </Button>
                </div>
              </div>

              {/* Modern Level Progress */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-6 mb-8 border border-gray-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getNivelGradient(profileData.nivel.proximoNivel)} flex items-center justify-center shadow-lg`}>
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-700">
                      Progreso a {profileData.nivel.proximoNivel}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">
                    {profileData.nivel.puntos} / {profileData.nivel.puntosParaProximoNivel} pts
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                  <motion.div 
                    className={`h-4 rounded-full bg-gradient-to-r ${getNivelGradient(profileData.nivel.proximoNivel)} shadow-lg`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(profileData.nivel.puntos / profileData.nivel.puntosParaProximoNivel) * 100}%` 
                    }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  {profileData.nivel.puntosParaProximoNivel - profileData.nivel.puntos} puntos restantes
                </p>
              </div>

              {/* Modern Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <ModernStatsCard
                  title="Beneficios Usados"
                  value={enhancedStats.beneficiosUsados}
                  icon={<Gift className="w-7 h-7 text-white" />}
                  gradient="bg-gradient-to-r from-emerald-500 to-green-500"
                  subtitle="Total acumulado"
                />
                <ModernStatsCard
                  title="Comercios Visitados"
                  value={enhancedStats.comerciosVisitados}
                  icon={<Store className="w-7 h-7 text-white" />}
                  gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
                  subtitle="Establecimientos únicos"
                />
                <ModernStatsCard
                  title="Beneficios Este Mes"
                  value={enhancedStats.beneficiosEsteMes}
                  icon={<Calendar className="w-7 h-7 text-white" />}
                  gradient="bg-gradient-to-r from-purple-500 to-pink-500"
                  subtitle="Mes actual"
                />
                <ModernStatsCard
                  title="Días como Socio"
                  value={enhancedStats.tiempoComoSocio}
                  icon={<Trophy className="w-7 h-7 text-white" />}
                  gradient="bg-gradient-to-r from-amber-500 to-orange-500"
                  subtitle="Desde registro"
                />
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Información Personal</h3>
                </div>
                <Button
                  variant="outline"
                  leftIcon={<Edit3 size={16} />}
                  onClick={() => setEditModalOpen(true)}
                  className="font-bold"
                >
                  Editar Información Personal
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wider">Email</label>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Mail size={18} className="text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{profileData.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wider">Teléfono</label>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Phone size={18} className="text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{profileData.telefono || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wider">DNI</label>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield size={18} className="text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{profileData.dni || 'No especificado'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wider">Dirección</label>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                      <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <MapPin size={18} className="text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{profileData.direccion || 'No especificado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {profileData.fechaNacimiento && (
                <div className="mt-8">
                  <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wider">Fecha de Nacimiento</label>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar size={18} className="text-white" />
                    </div>
                    <span className="text-gray-900 font-medium">
                      {format(profileData.fechaNacimiento, 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Activity Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Actividad Reciente</h3>
              </div>
              
              {beneficiosMasUsados && beneficiosMasUsados.length > 0 ? (
                <div className="space-y-4">
                  {beneficiosMasUsados.slice(0, 5).map((beneficio, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                        {beneficio.usos}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{beneficio.titulo}</div>
                        <div className="text-sm text-gray-500 font-medium">{beneficio.usos} usos</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-bold text-lg">No hay actividad reciente</p>
                  <p className="text-gray-500 mt-2">Comienza a usar beneficios para ver tu actividad</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <Dialog open={photoModalOpen} onClose={handleClosePhotoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              Cambiar Foto de Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Area */}
            <div
              className={cn(
                "relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300",
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
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={previewUrl || ''}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover rounded-2xl shadow-lg"
                      style={{ width: '100%', height: '100%' }}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
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
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      Arrastra una imagen aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      o haz clic para seleccionar
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      leftIcon={<Upload size={16} />}
                    >
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
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                        style={{
                          background: `conic-gradient(from 0deg, transparent ${uploadProgress * 3.6}deg, #e5e7eb ${uploadProgress * 3.6}deg)`
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Subiendo imagen...
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
              leftIcon={<X size={16} />}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!selectedFile || uploadingPhoto}
              loading={uploadingPhoto}
              leftIcon={<Upload size={16} />}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Subir Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onClose={handleCloseEditModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Edit3 size={24} className="text-white" />
              </div>
              <div>
                <span>Editar Perfil</span>
                <p className="text-sm font-normal text-gray-600 mt-1">
                  Actualiza tu información personal
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                  <Input
                    label="                    Nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Tu nombre completo"
                    required
                    error={errors.nombre}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                  <Input
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+54 11 1234-5678"
                    error={errors.telefono}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                  <Input
                    label="DNI"
                    value={formData.dni}
                    onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                    placeholder="12345678"
                    error={errors.dni}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Input
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Tu dirección completa"
                />
              </div>

              <div>
                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                />
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Información importante</h4>
                    <p className="text-blue-700 text-xs mt-1">
                      Mantén tu información actualizada para recibir beneficios y comunicaciones importantes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={updating}
              leftIcon={<X size={16} />}
              className="flex-1 md:flex-none"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProfile}
              loading={updating}
              leftIcon={<Save size={16} />}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 md:flex-none"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocioProfile;

