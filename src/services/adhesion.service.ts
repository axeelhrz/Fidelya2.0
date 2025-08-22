import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface ComercioDisponible {
  id: string;
  nombreComercio: string;
  nombre: string;
  email: string;
  categoria: string;
  direccion?: string;
  telefono?: string;
  horario?: string;
  logoUrl?: string;
  imagenPrincipalUrl?: string;
  descripcion?: string;
  sitioWeb?: string;
  razonSocial?: string;
  cuit?: string;
  emailContacto?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  estado: 'activo' | 'inactivo' | 'pendiente' | 'suspendido';
  asociacionesVinculadas: string[];
  creadoEn: Timestamp;
  actualizadoEn?: Timestamp;
  verificado: boolean;
  puntuacion: number;
  totalReviews: number;
  configuracion?: {
    notificacionesEmail: boolean;
    notificacionesWhatsApp: boolean;
    autoValidacion: boolean;
    requiereAprobacion: boolean;
  };
  qrCode?: string;
  qrCodeUrl?: string;
  beneficiosActivos: number;
  validacionesRealizadas: number;
  clientesAtendidos: number;
  ingresosMensuales: number;
  rating: number;
  ubicacion?: {
    latitud: number;
    longitud: number;
  };
  visible: boolean;
}

export interface SolicitudAdhesion {
  id: string;
  asociacionId: string;
  nombreComercio: string;
  nombre: string;
  email: string;
  telefono?: string;
  categoria: string;
  direccion?: string;
  mensaje: string;
  documentos: string[];
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: Timestamp;
  fechaRespuesta?: Timestamp;
  motivoRechazo?: string;
  comercioData?: {
    cuit?: string;
    sitioWeb?: string;
    horario?: string;
    descripcion?: string;
    logoUrl?: string;
  };
  creadoEn: Timestamp;
  actualizadoEn?: Timestamp;
}

export interface AdhesionStats {
  totalComercios: number;
  comerciosActivos: number;
  solicitudesPendientes: number;
  adhesionesEsteMes: number;
  categorias: Record<string, number>;
  valiacionesHoy: number;
  validacionesMes: number;
  clientesUnicos: number;
  beneficiosActivos: number;
  validacionesHoy: number;
}

class AdhesionService {
  private readonly comerciosCollection = COLLECTIONS.COMERCIOS;
  private readonly asociacionesCollection = COLLECTIONS.ASOCIACIONES;
  private readonly solicitudesCollection = 'solicitudes_adhesion';

  /**
   * Obtener comercios disponibles para vinculación
   */
  async getComerciossDisponibles(
    asociacionId: string,
    filtros: {
      categoria?: string;
      busqueda?: string;
      soloNoVinculados?: boolean;
    } = {}
  ): Promise<ComercioDisponible[]> {
    try {
      let q = query(
        collection(db, this.comerciosCollection),
        where('estado', '==', 'activo'),
        orderBy('nombreComercio', 'asc')
      );

      if (filtros.categoria) {
        q = query(q, where('categoria', '==', filtros.categoria));
      }

      const snapshot = await getDocs(q);
      let comercios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioDisponible[];

      // Filtrar por búsqueda con validaciones de seguridad
      if (filtros.busqueda) {
        const searchTerm = filtros.busqueda.toLowerCase();
        comercios = comercios.filter(comercio => {
          // Validar que las propiedades existan antes de llamar toLowerCase()
          const nombreComercio = comercio.nombreComercio || '';
          const nombre = comercio.nombre || '';
          const email = comercio.email || '';
          
          return (
            nombreComercio.toLowerCase().includes(searchTerm) ||
            nombre.toLowerCase().includes(searchTerm) ||
            email.toLowerCase().includes(searchTerm)
          );
        });
      }

      // Filtrar solo no vinculados
      if (filtros.soloNoVinculados) {
        comercios = comercios.filter(comercio =>
          !comercio.asociacionesVinculadas.includes(asociacionId)
        );
      }

      return comercios;
    } catch (error) {
      handleError(error, 'Get Comercios Disponibles');
      return [];
    }
  }

  /**
   * Obtener comercios vinculados a una asociación
   */
  async getComerciossVinculados(asociacionId: string): Promise<ComercioDisponible[]> {
    try {
      const q = query(
        collection(db, this.comerciosCollection),
        where('asociacionesVinculadas', 'array-contains', asociacionId),
        orderBy('nombreComercio', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioDisponible[];
    } catch (error) {
      handleError(error, 'Get Comercios Vinculados');
      return [];
    }
  }

  /**
   * Obtener solicitudes de adhesión pendientes
   */
  async getSolicitudesPendientes(asociacionId: string): Promise<SolicitudAdhesion[]> {
    try {
      const q = query(
        collection(db, this.solicitudesCollection),
        where('asociacionId', '==', asociacionId),
        where('estado', '==', 'pendiente'),
        orderBy('fechaSolicitud', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SolicitudAdhesion[];
    } catch (error) {
      handleError(error, 'Get Solicitudes Pendientes');
      return [];
    }
  }

  /**
   * Crear nueva solicitud de adhesión
   */
  async crearSolicitudAdhesion(solicitudData: Omit<SolicitudAdhesion, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, this.solicitudesCollection), {
        ...solicitudData,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });

      console.log('✅ Solicitud de adhesión creada exitosamente');
      return docRef.id;
    } catch (error) {
      handleError(error, 'Crear Solicitud Adhesion');
      return null;
    }
  }

  /**
   * Aprobar solicitud de adhesión
   */
  async aprobarSolicitud(solicitudId: string): Promise<boolean> {
    try {
      const solicitudRef = doc(db, this.solicitudesCollection, solicitudId);
      const solicitudDoc = await getDoc(solicitudRef);

      if (!solicitudDoc.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const solicitudData = solicitudDoc.data() as SolicitudAdhesion;

      // Crear el comercio en la colección de comercios
      const comercioData: Omit<ComercioDisponible, 'id'> = {
        nombreComercio: solicitudData.nombreComercio,
        nombre: solicitudData.nombre,
        email: solicitudData.email,
        telefono: solicitudData.telefono,
        categoria: solicitudData.categoria,
        direccion: solicitudData.direccion,
        descripcion: solicitudData.comercioData?.descripcion || '',
        sitioWeb: solicitudData.comercioData?.sitioWeb || '',
        horario: solicitudData.comercioData?.horario || '',
        logoUrl: solicitudData.comercioData?.logoUrl || '',
        cuit: solicitudData.comercioData?.cuit || '',
        estado: 'activo',
        asociacionesVinculadas: [solicitudData.asociacionId],
        creadoEn: serverTimestamp() as Timestamp,
        actualizadoEn: serverTimestamp() as Timestamp,
        verificado: false,
        puntuacion: 0,
        totalReviews: 0,
        beneficiosActivos: 0,
        validacionesRealizadas: 0,
        clientesAtendidos: 0,
        ingresosMensuales: 0,
        rating: 0,
        visible: true,
        configuracion: {
          notificacionesEmail: true,
          notificacionesWhatsApp: false,
          autoValidacion: false,
          requiereAprobacion: true,
        }
      };

      const batch = writeBatch(db);

      // Crear comercio
      const comercioRef = doc(collection(db, this.comerciosCollection));
      batch.set(comercioRef, comercioData);

      // Actualizar solicitud
      batch.update(solicitudRef, {
        estado: 'aprobada',
        fechaRespuesta: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });

      // Actualizar estadísticas de la asociación
      const asociacionRef = doc(db, this.asociacionesCollection, solicitudData.asociacionId);
      const asociacionDoc = await getDoc(asociacionRef);

      if (asociacionDoc.exists()) {
        const asociacionData = asociacionDoc.data();
        const comerciosVinculados = (asociacionData.comerciosVinculados || 0) + 1;

        batch.update(asociacionRef, {
          comerciosVinculados,
          actualizadoEn: serverTimestamp(),
        });
      }

      await batch.commit();

      console.log('✅ Solicitud aprobada y comercio creado exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Aprobar Solicitud');
      return false;
    }
  }

  /**
   * Rechazar solicitud de adhesión
   */
  async rechazarSolicitud(solicitudId: string, motivoRechazo: string): Promise<boolean> {
    try {
      const solicitudRef = doc(db, this.solicitudesCollection, solicitudId);
      
      await updateDoc(solicitudRef, {
        estado: 'rechazada',
        fechaRespuesta: serverTimestamp(),
        motivoRechazo,
        actualizadoEn: serverTimestamp(),
      });

      console.log('✅ Solicitud rechazada exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Rechazar Solicitud');
      return false;
    }
  }

  /**
   * Eliminar solicitud de adhesión
   */
  async eliminarSolicitud(solicitudId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.solicitudesCollection, solicitudId));
      console.log('✅ Solicitud eliminada exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Eliminar Solicitud');
      return false;
    }
  }

  /**
   * Vincular comercio a asociación
   */
  async vincularComercio(comercioId: string, asociacionId: string): Promise<boolean> {
    try {
      const batch = writeBatch(db);

      // Actualizar comercio
      const comercioRef = doc(db, this.comerciosCollection, comercioId);
      const comercioDoc = await getDoc(comercioRef);

      if (!comercioDoc.exists()) {
        throw new Error('Comercio no encontrado');
      }

      const comercioData = comercioDoc.data();
      const asociacionesVinculadas = comercioData.asociacionesVinculadas || [];

      if (asociacionesVinculadas.includes(asociacionId)) {
        throw new Error('El comercio ya está vinculado a esta asociación');
      }

      asociacionesVinculadas.push(asociacionId);

      batch.update(comercioRef, {
        asociacionesVinculadas,
        actualizadoEn: serverTimestamp(),
      });

      // Actualizar estadísticas de la asociación
      const asociacionRef = doc(db, this.asociacionesCollection, asociacionId);
      const asociacionDoc = await getDoc(asociacionRef);

      if (asociacionDoc.exists()) {
        const asociacionData = asociacionDoc.data();
        const comerciosVinculados = (asociacionData.comerciosVinculados || 0) + 1;

        batch.update(asociacionRef, {
          comerciosVinculados,
          actualizadoEn: serverTimestamp(),
        });
      }

      await batch.commit();

      console.log('✅ Comercio vinculado exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Vincular Comercio');
      return false;
    }
  }

  /**
   * Desvincular comercio de asociación
   */
  async desvincularComercio(comercioId: string, asociacionId: string): Promise<boolean> {
    try {
      const batch = writeBatch(db);

      // Actualizar comercio
      const comercioRef = doc(db, this.comerciosCollection, comercioId);
      const comercioDoc = await getDoc(comercioRef);

      if (!comercioDoc.exists()) {
        throw new Error('Comercio no encontrado');
      }

      const comercioData = comercioDoc.data();
      const asociacionesVinculadas = comercioData.asociacionesVinculadas || [];

      const updatedAsociaciones = asociacionesVinculadas.filter(
        (id: string) => id !== asociacionId
      );

      batch.update(comercioRef, {
        asociacionesVinculadas: updatedAsociaciones,
        actualizadoEn: serverTimestamp(),
      });

      // Actualizar estadísticas de la asociación
      const asociacionRef = doc(db, this.asociacionesCollection, asociacionId);
      const asociacionDoc = await getDoc(asociacionRef);

      if (asociacionDoc.exists()) {
        const asociacionData = asociacionDoc.data();
        const comerciosVinculados = Math.max((asociacionData.comerciosVinculados || 1) - 1, 0);

        batch.update(asociacionRef, {
          comerciosVinculados,
          actualizadoEn: serverTimestamp(),
        });
      }

      await batch.commit();

      console.log('✅ Comercio desvinculado exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Desvincular Comercio');
      return false;
    }
  }

  /**
   * Obtener estadísticas de adhesiones
   */
  async getAdhesionStats(asociacionId: string): Promise<AdhesionStats> {
    try {
      const [comerciosVinculados, solicitudesPendientes] = await Promise.all([
        this.getComerciossVinculados(asociacionId),
        this.getSolicitudesPendientes(asociacionId)
      ]);
      
      const stats: AdhesionStats = {
        totalComercios: comerciosVinculados.length,
        comerciosActivos: comerciosVinculados.filter(c => c.estado === 'activo').length,
        solicitudesPendientes: solicitudesPendientes.length,
        adhesionesEsteMes: 0,
        categorias: {},
        valiacionesHoy: 0,
        validacionesMes: 0,
        clientesUnicos: 0,
        beneficiosActivos: 0,
        validacionesHoy: 0
      };

      // Contar por categorías
      comerciosVinculados.forEach(comercio => {
        stats.categorias[comercio.categoria] = (stats.categorias[comercio.categoria] || 0) + 1;
      });

      // Calcular adhesiones este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      stats.adhesionesEsteMes = comerciosVinculados.filter(comercio => {
        const fechaCreacion = comercio.creadoEn.toDate();
        return fechaCreacion >= inicioMes;
      }).length;

      return stats;
    } catch (error) {
      handleError(error, 'Get Adhesion Stats');
      // Return default stats in case of error
      return {
        totalComercios: 0,
        comerciosActivos: 0,
        solicitudesPendientes: 0,
        adhesionesEsteMes: 0,
        categorias: {},
        valiacionesHoy: 0,
        validacionesMes: 0,
        clientesUnicos: 0,
        beneficiosActivos: 0,
        validacionesHoy: 0
      };
    }
  }

  /**
   * Buscar comercios por término
   */
  async buscarComercios(
    termino: string,
    asociacionId: string,
    limite: number = 20
  ): Promise<ComercioDisponible[]> {
    try {
      const q = query(
        collection(db, this.comerciosCollection),
        where('estado', '==', 'activo'),
        limit(limite)
      );

      const snapshot = await getDocs(q);
      let comercios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioDisponible[];

      // Filtrar por término de búsqueda con validaciones de seguridad
      const searchTerm = termino.toLowerCase();
      comercios = comercios.filter(comercio => {
        // Validar que las propiedades existan antes de llamar toLowerCase()
        const nombreComercio = comercio.nombreComercio || '';
        const nombre = comercio.nombre || '';
        const email = comercio.email || '';
        const categoria = comercio.categoria || '';
        
        return (
          nombreComercio.toLowerCase().includes(searchTerm) ||
          nombre.toLowerCase().includes(searchTerm) ||
          email.toLowerCase().includes(searchTerm) ||
          categoria.toLowerCase().includes(searchTerm)
        );
      });

      return comercios;
    } catch (error) {
      handleError(error, 'Buscar Comercios');
      return [];
    }
  }

  /**
   * Validar si un comercio puede ser vinculado
   */
  async validarVinculacion(comercioId: string, asociacionId: string): Promise<{
    valido: boolean;
    motivo?: string;
  }> {
    try {
      const comercioDoc = await getDoc(doc(db, this.comerciosCollection, comercioId));
      
      if (!comercioDoc.exists()) {
        return { valido: false, motivo: 'Comercio no encontrado' };
      }

      const comercioData = comercioDoc.data();

      if (comercioData.estado !== 'activo') {
        return { valido: false, motivo: 'El comercio no está activo' };
      }

      if (comercioData.asociacionesVinculadas?.includes(asociacionId)) {
        return { valido: false, motivo: 'El comercio ya está vinculado a esta asociación' };
      }

      return { valido: true };
    } catch (error) {
      handleError(error, 'Validar Vinculacion');
      return { valido: false, motivo: 'Error al validar la vinculación' };
    }
  }

  /**
   * Listener en tiempo real para solicitudes pendientes
   */
  onSolicitudesPendientesChange(
    asociacionId: string,
    callback: (solicitudes: SolicitudAdhesion[]) => void
  ): () => void {
    const q = query(
      collection(db, this.solicitudesCollection),
      where('asociacionId', '==', asociacionId),
      where('estado', '==', 'pendiente'),
      orderBy('fechaSolicitud', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const solicitudes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SolicitudAdhesion[];
      
      callback(solicitudes);
    }, (error) => {
      handleError(error, 'Solicitudes Pendientes Listener');
      callback([]);
    });
  }

  /**
   * Listener en tiempo real para comercios vinculados
   */
  onComerciosVinculadosChange(
    asociacionId: string,
    callback: (comercios: ComercioDisponible[]) => void
  ): () => void {
    const q = query(
      collection(db, this.comerciosCollection),
      where('asociacionesVinculadas', 'array-contains', asociacionId),
      orderBy('nombreComercio', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const comercios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioDisponible[];
      
      callback(comercios);
    }, (error) => {
      handleError(error, 'Comercios Vinculados Listener');
      callback([]);
    });
  }
}

// Export singleton instance
export const adhesionService = new AdhesionService();
export default adhesionService;