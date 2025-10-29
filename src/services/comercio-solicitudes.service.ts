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
  serverTimestamp,
  writeBatch,
  Timestamp,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface SolicitudAsociacion {
  id: string;
  comercioId: string;
  asociacionId: string;
  nombreAsociacion: string;
  emailAsociacion: string;
  telefonoAsociacion?: string;
  descripcionAsociacion?: string;
  logoAsociacion?: string;
  mensaje: string;
  beneficiosOfrecidos?: string[];
  condicionesEspeciales?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: Timestamp;
  fechaRespuesta?: Timestamp;
  motivoRechazo?: string;
  datosAsociacion?: {
    totalSocios?: number;
    totalComercios?: number;
    categoriasPrincipales?: string[];
    ubicacion?: string;
    sitioWeb?: string;
  };
  creadoEn: Timestamp;
  actualizadoEn?: Timestamp;
}

export interface SolicitudAsociacionStats {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  asociacionesVinculadas: number;
  solicitudesEsteMes: number;
}

class ComercioSolicitudesService {
  private readonly solicitudesCollection = 'solicitudes_asociacion';
  private readonly comerciosCollection = COLLECTIONS.COMERCIOS;
  private readonly asociacionesCollection = COLLECTIONS.ASOCIACIONES;

  /**
   * Obtener solicitudes de asociación pendientes para un comercio
   */
  async getSolicitudesPendientes(comercioId: string): Promise<SolicitudAsociacion[]> {
    try {
      const q = query(
        collection(db, this.solicitudesCollection),
        where('comercioId', '==', comercioId),
        where('estado', '==', 'pendiente'),
        orderBy('fechaSolicitud', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SolicitudAsociacion[];
    } catch (error) {
      handleError(error, 'Get Solicitudes Pendientes Comercio');
      return [];
    }
  }

  /**
   * Obtener todas las solicitudes de un comercio
   */
  async getSolicitudesComercio(comercioId: string): Promise<SolicitudAsociacion[]> {
    try {
      const q = query(
        collection(db, this.solicitudesCollection),
        where('comercioId', '==', comercioId),
        orderBy('fechaSolicitud', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SolicitudAsociacion[];
    } catch (error) {
      handleError(error, 'Get Solicitudes Comercio');
      return [];
    }
  }

  /**
   * Crear nueva solicitud de asociación (enviada por una asociación a un comercio)
   */
  async crearSolicitudAsociacion(solicitudData: Omit<SolicitudAsociacion, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<string | null> {
    try {
      // Verificar que no exista ya una solicitud pendiente entre esta asociación y comercio
      const existingQuery = query(
        collection(db, this.solicitudesCollection),
        where('comercioId', '==', solicitudData.comercioId),
        where('asociacionId', '==', solicitudData.asociacionId),
        where('estado', '==', 'pendiente')
      );

      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        throw new Error('Ya existe una solicitud pendiente entre esta asociación y comercio');
      }

      const docRef = await addDoc(collection(db, this.solicitudesCollection), {
        ...solicitudData,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });

      console.log('✅ Solicitud de asociación creada exitosamente');
      return docRef.id;
    } catch (error) {
      handleError(error, 'Crear Solicitud Asociacion');
      return null;
    }
  }

  /**
   * Aprobar solicitud de asociación (desde el comercio)
   */
  async aprobarSolicitud(solicitudId: string): Promise<boolean> {
    try {
      const solicitudRef = doc(db, this.solicitudesCollection, solicitudId);
      const solicitudDoc = await getDoc(solicitudRef);

      if (!solicitudDoc.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const solicitudData = solicitudDoc.data() as SolicitudAsociacion;

      const batch = writeBatch(db);

      // Actualizar solicitud
      batch.update(solicitudRef, {
        estado: 'aprobada',
        fechaRespuesta: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });

      // Vincular comercio a la asociación
      const comercioRef = doc(db, this.comerciosCollection, solicitudData.comercioId);
      const comercioDoc = await getDoc(comercioRef);

      if (comercioDoc.exists()) {
        const comercioData = comercioDoc.data();
        const asociacionesVinculadas = comercioData.asociacionesVinculadas || [];

        if (!asociacionesVinculadas.includes(solicitudData.asociacionId)) {
          asociacionesVinculadas.push(solicitudData.asociacionId);

          batch.update(comercioRef, {
            asociacionesVinculadas,
            actualizadoEn: serverTimestamp(),
          });
        }
      }

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

      console.log('✅ Solicitud aprobada y comercio vinculado exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Aprobar Solicitud Comercio');
      return false;
    }
  }

  /**
   * Rechazar solicitud de asociación (desde el comercio)
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
      handleError(error, 'Rechazar Solicitud Comercio');
      return false;
    }
  }

  /**
   * Eliminar solicitud de asociación
   */
  async eliminarSolicitud(solicitudId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.solicitudesCollection, solicitudId));
      console.log('✅ Solicitud eliminada exitosamente');
      return true;
    } catch (error) {
      handleError(error, 'Eliminar Solicitud Comercio');
      return false;
    }
  }

  /**
   * Obtener estadísticas de solicitudes para un comercio
   */
  async getSolicitudesStats(comercioId: string): Promise<SolicitudAsociacionStats> {
    try {
      const todasSolicitudes = await this.getSolicitudesComercio(comercioId);
      
      const stats: SolicitudAsociacionStats = {
        totalSolicitudes: todasSolicitudes.length,
        solicitudesPendientes: todasSolicitudes.filter(s => s.estado === 'pendiente').length,
        solicitudesAprobadas: todasSolicitudes.filter(s => s.estado === 'aprobada').length,
        solicitudesRechazadas: todasSolicitudes.filter(s => s.estado === 'rechazada').length,
        asociacionesVinculadas: 0, // Se calculará desde el comercio
        solicitudesEsteMes: 0
      };

      // Calcular solicitudes este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      stats.solicitudesEsteMes = todasSolicitudes.filter(solicitud => {
        const fechaSolicitud = solicitud.fechaSolicitud.toDate();
        return fechaSolicitud >= inicioMes;
      }).length;

      // Obtener número real de asociaciones vinculadas
      const comercioDoc = await getDoc(doc(db, this.comerciosCollection, comercioId));
      if (comercioDoc.exists()) {
        const comercioData = comercioDoc.data();
        stats.asociacionesVinculadas = (comercioData.asociacionesVinculadas || []).length;
      }

      return stats;
    } catch (error) {
      handleError(error, 'Get Solicitudes Stats Comercio');
      return {
        totalSolicitudes: 0,
        solicitudesPendientes: 0,
        solicitudesAprobadas: 0,
        solicitudesRechazadas: 0,
        asociacionesVinculadas: 0,
        solicitudesEsteMes: 0
      };
    }
  }

  /**
   * Validar si una asociación puede enviar solicitud a un comercio
   */
  async validarSolicitud(comercioId: string, asociacionId: string): Promise<{
    valido: boolean;
    motivo?: string;
  }> {
    try {
      // Verificar que el comercio existe y está activo
      const comercioDoc = await getDoc(doc(db, this.comerciosCollection, comercioId));
      
      if (!comercioDoc.exists()) {
        return { valido: false, motivo: 'Comercio no encontrado' };
      }

      const comercioData = comercioDoc.data();

      if (comercioData.estado !== 'activo') {
        return { valido: false, motivo: 'El comercio no está activo' };
      }

      // Verificar que no esté ya vinculado
      if (comercioData.asociacionesVinculadas?.includes(asociacionId)) {
        return { valido: false, motivo: 'El comercio ya está vinculado a esta asociación' };
      }

      // Verificar que no haya solicitud pendiente
      const solicitudPendiente = query(
        collection(db, this.solicitudesCollection),
        where('comercioId', '==', comercioId),
        where('asociacionId', '==', asociacionId),
        where('estado', '==', 'pendiente')
      );

      const solicitudSnapshot = await getDocs(solicitudPendiente);
      if (!solicitudSnapshot.empty) {
        return { valido: false, motivo: 'Ya existe una solicitud pendiente' };
      }

      return { valido: true };
    } catch (error) {
      handleError(error, 'Validar Solicitud Comercio');
      return { valido: false, motivo: 'Error al validar la solicitud' };
    }
  }

  /**
   * Listener en tiempo real para solicitudes pendientes de un comercio
   */
  onSolicitudesPendientesChange(
    comercioId: string,
    callback: (solicitudes: SolicitudAsociacion[]) => void
  ): () => void {
    const q = query(
      collection(db, this.solicitudesCollection),
      where('comercioId', '==', comercioId),
      where('estado', '==', 'pendiente'),
      orderBy('fechaSolicitud', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const solicitudes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SolicitudAsociacion[];
      
      callback(solicitudes);
    }, (error) => {
      handleError(error, 'Solicitudes Pendientes Comercio Listener');
      callback([]);
    });
  }

  /**
   * Obtener información de una asociación para mostrar en la solicitud
   */
  async getAsociacionInfo(asociacionId: string): Promise<{
    nombre: string;
    email: string;
    telefono?: string;
    descripcion?: string;
    logo?: string;
    totalSocios?: number;
    totalComercios?: number;
    sitioWeb?: string;
  } | null> {
    try {
      const asociacionDoc = await getDoc(doc(db, this.asociacionesCollection, asociacionId));
      
      if (!asociacionDoc.exists()) {
        return null;
      }

      const data = asociacionDoc.data();
      return {
        nombre: data.nombre || 'Asociación sin nombre',
        email: data.email || '',
        telefono: data.telefono,
        descripcion: data.descripcion,
        logo: data.logo,
        totalSocios: data.totalSocios || 0,
        totalComercios: data.totalComercios || 0,
        sitioWeb: data.sitioWeb
      };
    } catch (error) {
      handleError(error, 'Get Asociacion Info');
      return null;
    }
  }
}

// Export singleton instance
export const comercioSolicitudesService = new ComercioSolicitudesService();
export default comercioSolicitudesService;
