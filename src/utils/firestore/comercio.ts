import { 
  doc, 
  updateDoc, 
  getDoc, 
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Comercio, ComercioFormData } from '@/types/comercio';
import { QR_CONFIG } from '@/lib/constants';

export const updateComercioProfile = async (
  userId: string, 
  data: ComercioFormData
): Promise<void> => {
  try {
    const comercioRef = doc(db, 'comercios', userId);
    
    await updateDoc(comercioRef, {
      ...data,
      actualizadoEn: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating comercio profile:', error);
    throw new Error('Error al actualizar el perfil del comercio');
  }
};

export const getComercioById = async (userId: string): Promise<Comercio | null> => {
  try {
    const comercioRef = doc(db, 'comercios', userId);
    const comercioSnap = await getDoc(comercioRef);
    
    if (comercioSnap.exists()) {
      return { ...comercioSnap.data(), uid: comercioSnap.id } as unknown as Comercio;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting comercio:', error);
    throw new Error('Error al obtener los datos del comercio');
  }
};

export const getComerciosByAsociacion = async (asociacionId: string): Promise<Comercio[]> => {
  try {
    const comerciosRef = collection(db, 'comercios');
    const q = query(
      comerciosRef,
      where('asociacionesVinculadas', 'array-contains', asociacionId),
      where('estado', '==', 'activo')
    );
    
    const querySnapshot = await getDocs(q);
    const comercios: Comercio[] = [];
    
    querySnapshot.forEach((doc) => {
      comercios.push({ uid: doc.id, ...doc.data() } as unknown as Comercio);
    });
    
    return comercios;
  } catch (error) {
    console.error('Error getting comercios by asociacion:', error);
    throw new Error('Error al obtener comercios de la asociación');
  }
};

export const searchComerciosByCategory = async (categoria: string): Promise<Comercio[]> => {
  try {
    const comerciosRef = collection(db, 'comercios');
    const q = query(
      comerciosRef,
      where('categoria', '==', categoria),
      where('visible', '==', true),
      where('estado', '==', 'activo')
    );
    
    const querySnapshot = await getDocs(q);
    const comercios: Comercio[] = [];
    
    querySnapshot.forEach((doc) => {
      comercios.push({ ...doc.data(), uid: doc.id } as unknown as Comercio);
    });
    
    return comercios;
  } catch (error) {
    console.error('Error searching comercios by category:', error);
    throw new Error('Error al buscar comercios por categoría');
  }
};

export const getComerciosStats = async (userId: string) => {
  try {
    // This would typically involve multiple queries to get comprehensive stats
    // For now, we'll return a basic structure that can be expanded
    
    const comercioRef = doc(db, 'comercios', userId);
    const comercioSnap = await getDoc(comercioRef);
    
    if (!comercioSnap.exists()) {
      throw new Error('Comercio no encontrado');
    }
    
    // Here you would add queries for:
    // - Total validaciones
    // - Beneficios activos
    // - Socios alcanzados
    // - etc.
    
    return {
      totalValidaciones: 0,
      validacionesHoy: 0,
      validacionesMes: 0,
      beneficiosActivos: 0,
      beneficiosVencidos: 0,
      asociacionesVinculadas: comercioSnap.data()?.asociacionesVinculadas?.length || 0,
      sociosAlcanzados: 0,
      ingresosPotenciales: 0,
      tasaConversion: 0
    };
  } catch (error) {
    console.error('Error getting comercio stats:', error);
    throw new Error('Error al obtener las estadísticas del comercio');
  }
};

// Updated QR generation functions to match the service
export const generateQRValidationUrl = (comercioId: string, beneficioId?: string): string => {
  const timestamp = Date.now();
  const baseUrl = `fidelya://comercio/${comercioId}?t=${timestamp}`;
  return beneficioId ? `${baseUrl}&beneficio=${beneficioId}` : baseUrl;
};

export const generateWebValidationUrl = (comercioId: string, beneficioId?: string): string => {
  // Usar la URL de producción configurada en QR_CONFIG.baseUrl
  // en lugar de window.location.origin para evitar URLs de localhost
  const baseUrl = QR_CONFIG.baseUrl;
  const params = new URLSearchParams({ comercio: comercioId });
  if (beneficioId) {
    params.append('beneficio', beneficioId);
  }
  return `${baseUrl}/validar-beneficio?${params.toString()}`;
};

export const validateComercioData = (data: Partial<ComercioFormData>): string[] => {
  const errors: string[] = [];
  
  if (data.nombreComercio && data.nombreComercio.trim().length < 2) {
    errors.push('El nombre del comercio debe tener al menos 2 caracteres');
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('El email no tiene un formato válido');
  }
  
  if (data.telefono && !/^[\d\s\-\+\(\)]+$/.test(data.telefono)) {
    errors.push('El teléfono solo puede contener números, espacios y caracteres especiales básicos');
  }
  
  return errors;
};