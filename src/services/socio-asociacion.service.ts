import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, USER_STATES } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { Socio } from '@/types/socio';
import { membershipSyncService } from './membership-sync.service';

class SocioAsociacionService {
  private readonly sociosCollection = COLLECTIONS.SOCIOS;
  private readonly asociacionesCollection = COLLECTIONS.ASOCIACIONES;
  private readonly usersCollection = COLLECTIONS.USERS;

  /**
   * Vincula un socio a una asociación con sincronización de estado mejorada
   */
  async vincularSocioAsociacion(socioId: string, asociacionId: string): Promise<boolean> {
    try {
      console.log(`🔄 Vinculando socio ${socioId} con asociación ${asociacionId}`);
      
      // 1. Verificar que el socio existe en la colección socios
      const socioRef = doc(db, this.sociosCollection, socioId);
      const socioDoc = await getDoc(socioRef);
      
      if (!socioDoc.exists()) {
        throw new Error('El socio no existe en la colección socios');
      }
      
      // 2. Verificar que la asociación existe
      const asociacionRef = doc(db, this.asociacionesCollection, asociacionId);
      const asociacionDoc = await getDoc(asociacionRef);
      
      if (!asociacionDoc.exists()) {
        throw new Error('La asociación no existe');
      }
      
      // 3. Buscar el usuario correspondiente en la colección users
      const socioData = socioDoc.data();
      let userDoc = null;
      let userRef = null;
      
      // Buscar por email en la colección users
      if (socioData.email) {
        const userQuery = query(
          collection(db, this.usersCollection),
          where('email', '==', socioData.email.toLowerCase())
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          userDoc = userSnapshot.docs[0];
          userRef = userDoc.ref;
          console.log('👤 Usuario encontrado en colección users:', userDoc.id);
        }
      }
      
      // También intentar buscar por UID si no se encontró por email
      if (!userDoc) {
        try {
          userRef = doc(db, this.usersCollection, socioId);
          userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            console.log('👤 Usuario encontrado por UID en colección users:', socioId);
          } else {
            userDoc = null;
            userRef = null;
          }
        } catch {
          console.log('⚠️ No se encontró usuario por UID, continuando solo con socio');
        }
      }
      
      // Obtener datos actuales
      const asociacionData = asociacionDoc.data();
      
      // Verificar si ya está vinculado
      if (socioData.asociacionId === asociacionId) {
        console.log('⚠️ El socio ya está vinculado a esta asociación');
        // Aún así, sincronizar el estado para asegurar consistencia
        await membershipSyncService.syncMembershipStatus(socioId);
        return true;
      }
      
      // Usar batch para actualizar todos los documentos de forma atómica
      const batch = writeBatch(db);
      
      // 4. Actualizar socio con la asociación y estado activo
      batch.update(socioRef, {
        asociacionId: asociacionId,
        asociacion: asociacionData.nombre || 'Asociación',
        fechaVinculacion: serverTimestamp(),
        vinculadoPor: asociacionId,
        estado: 'activo', // Asegurar que el socio esté activo
        estadoMembresia: 'al_dia', // Establecer membresía al día
        actualizadoEn: serverTimestamp(),
      });
      
      // 5. Actualizar usuario en la colección users (si existe)
      if (userRef && userDoc) {
        console.log('🔄 Actualizando usuario en colección users');
        batch.update(userRef, {
          asociacionId: asociacionId,
          estado: USER_STATES.ACTIVO, // Asegurar que el usuario esté activo
          actualizadoEn: serverTimestamp(),
        });
      }
      
      // 6. Actualizar asociación con el socio (si mantiene lista de socios)
      if (Array.isArray(asociacionData.socios)) {
        if (!asociacionData.socios.includes(socioId)) {
          batch.update(asociacionRef, {
            socios: [...asociacionData.socios, socioId],
            actualizadoEn: serverTimestamp(),
          });
        }
      } else {
        // Si no existe el campo socios, lo creamos
        batch.update(asociacionRef, {
          socios: [socioId],
          actualizadoEn: serverTimestamp(),
        });
      }
      
      // Ejecutar las actualizaciones
      await batch.commit();
      
      console.log('✅ Socio vinculado exitosamente a la asociación');
      console.log(`📊 Documentos actualizados: socio (${socioId}), asociación (${asociacionId})${userRef ? ', usuario' : ''}`);
      
      // 7. Sincronizar estado de membresía después de la vinculación
      console.log('🔄 Sincronizando estado de membresía...');
      await membershipSyncService.syncMembershipStatus(socioId);
      
      return true;
    } catch (error) {
      console.error('❌ Error vinculando socio:', error);
      handleError(error, 'Vincular Socio Asociación');
      return false;
    }
  }

  /**
   * Desvincular un socio de una asociación
   */
  async desvincularSocioAsociacion(socioId: string, asociacionId: string): Promise<boolean> {
    try {
      console.log(`🔄 Desvinculando socio ${socioId} de asociación ${asociacionId}`);
      
      // 1. Verificar que el socio existe
      const socioRef = doc(db, this.sociosCollection, socioId);
      const socioDoc = await getDoc(socioRef);
      
      if (!socioDoc.exists()) {
        throw new Error('El socio no existe');
      }
      
      // 2. Verificar que la asociación existe
      const asociacionRef = doc(db, this.asociacionesCollection, asociacionId);
      const asociacionDoc = await getDoc(asociacionRef);
      
      if (!asociacionDoc.exists()) {
        throw new Error('La asociación no existe');
      }
      
      // 3. Buscar el usuario correspondiente en la colección users
      const socioData = socioDoc.data();
      let userDoc = null;
      let userRef = null;
      
      // Buscar por email en la colección users
      if (socioData.email) {
        const userQuery = query(
          collection(db, this.usersCollection),
          where('email', '==', socioData.email.toLowerCase())
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          userDoc = userSnapshot.docs[0];
          userRef = userDoc.ref;
        }
      }
      
      // También intentar buscar por UID si no se encontró por email
      if (!userDoc) {
        try {
          userRef = doc(db, this.usersCollection, socioId);
          userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            userDoc = null;
            userRef = null;
          }
        } catch {
          console.log('⚠️ No se encontró usuario por UID');
        }
      }
      
      // Obtener datos actuales
      const asociacionData = asociacionDoc.data();
      
      // Verificar si está vinculado a esta asociación
      if (socioData.asociacionId !== asociacionId) {
        console.log('⚠️ El socio no está vinculado a esta asociación');
        return true; // Ya no está vinculado, consideramos éxito
      }
      
      // Usar batch para actualizar todos los documentos de forma atómica
      const batch = writeBatch(db);
      
      // 4. Actualizar socio para quitar la asociación
      batch.update(socioRef, {
        asociacionId: null, // Eliminar la asociación
        asociacion: null,
        fechaVinculacion: null,
        vinculadoPor: null,
        estadoMembresia: 'pendiente', // Cambiar a pendiente al desvincular
        actualizadoEn: serverTimestamp(),
      });
      
      // 5. Actualizar usuario en la colección users (si existe)
      if (userRef && userDoc) {
        console.log('🔄 Actualizando usuario en colección users para desvinculación');
        batch.update(userRef, {
          asociacionId: null,
          actualizadoEn: serverTimestamp(),
        });
      }
      
      // 6. Actualizar asociación para quitar el socio
      if (Array.isArray(asociacionData.socios) && asociacionData.socios.includes(socioId)) {
        batch.update(asociacionRef, {
          socios: asociacionData.socios.filter(id => id !== socioId),
          actualizadoEn: serverTimestamp(),
        });
      }
      
      // Ejecutar las actualizaciones
      await batch.commit();
      
      console.log('✅ Socio desvinculado exitosamente de la asociación');
      return true;
    } catch (error) {
      console.error('❌ Error desvinculando socio:', error);
      handleError(error, 'Desvincular Socio Asociación');
      return false;
    }
  }

  /**
   * Obtener socios de una asociación
   */
  async getSociosByAsociacion(asociacionId: string): Promise<Socio[]> {
    try {
      console.log('🔍 Obteniendo socios de la asociación:', asociacionId);
      
      const q = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );
      
      const snapshot = await getDocs(q);
      
      const socios = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          ...data,
          fechaNacimiento: data.fechaNacimiento?.toDate() ? Timestamp.fromDate(data.fechaNacimiento.toDate()) : undefined,
          fechaIngreso: data.fechaIngreso?.toDate() ? Timestamp.fromDate(data.fechaIngreso.toDate()) : Timestamp.now(),
          fechaVencimiento: data.fechaVencimiento?.toDate() ? Timestamp.fromDate(data.fechaVencimiento.toDate()) : undefined,
          ultimoPago: data.ultimoPago?.toDate() ? Timestamp.fromDate(data.ultimoPago.toDate()) : undefined,
          ultimoAcceso: data.ultimoAcceso?.toDate() ? Timestamp.fromDate(data.ultimoAcceso.toDate()) : undefined,
          creadoEn: data.creadoEn?.toDate() ? Timestamp.fromDate(data.creadoEn.toDate()) : Timestamp.now(),
          actualizadoEn: data.actualizadoEn?.toDate() ? Timestamp.fromDate(data.actualizadoEn.toDate()) : Timestamp.now(),
          asociacion: data.asociacion || 'Asociación',
        } as Socio;
      });
      
      console.log(`✅ Se encontraron ${socios.length} socios en la asociación`);
      return socios;
    } catch (error) {
      console.error('❌ Error obteniendo socios de la asociación:', error);
      handleError(error, 'Get Socios By Asociacion');
      return [];
    }
  }

  /**
   * Obtener asociaciones de un socio
   */
  async getAsociacionesBySocio(socioId: string): Promise<string[]> {
    try {
      console.log('🔍 Obteniendo asociaciones del socio:', socioId);
      
      const socioRef = doc(db, this.sociosCollection, socioId);
      const socioDoc = await getDoc(socioRef);
      
      if (!socioDoc.exists()) {
        console.log('⚠️ Socio no encontrado en colección socios');
        return [];
      }
      
      const socioData = socioDoc.data();
      
      // Si el socio tiene una asociación asignada, la devolvemos
      if (socioData.asociacionId) {
        console.log('✅ Socio tiene asociación:', socioData.asociacionId);
        return [socioData.asociacionId];
      }
      
      console.log('⚠️ Socio no tiene asociación asignada');
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo asociaciones del socio:', error);
      handleError(error, 'Get Asociaciones By Socio');
      return [];
    }
  }

  /**
   * Verificar si un socio está vinculado a una asociación
   */
  async isSocioVinculado(socioId: string, asociacionId: string): Promise<boolean> {
    try {
      const socioRef = doc(db, this.sociosCollection, socioId);
      const socioDoc = await getDoc(socioRef);
      
      if (!socioDoc.exists()) {
        return false;
      }
      
      const socioData = socioDoc.data();
      
      return socioData.asociacionId === asociacionId;
    } catch (error) {
      handleError(error, 'Is Socio Vinculado');
      return false;
    }
  }

  /**
   * Sincronizar asociación entre colecciones users y socios con validación mejorada
   */
  async sincronizarAsociacionUsuario(userId: string): Promise<boolean> {
    try {
      console.log('🔄 Sincronizando asociación para usuario:', userId);
      
      // Usar el servicio de sincronización de membresía
      const success = await membershipSyncService.syncMembershipStatus(userId);
      
      if (success) {
        console.log('✅ Asociación sincronizada correctamente');
      } else {
        console.log('❌ Error sincronizando asociación');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error sincronizando asociación:', error);
      handleError(error, 'Sincronizar Asociación Usuario');
      return false;
    }
  }

  /**
   * Debug: Verificar estado de vinculación de un socio con sincronización
   */
  async debugSocioVinculacion(socioId: string): Promise<void> {
    try {
      console.log('🐛 DEBUG: Verificando vinculación del socio:', socioId);
      
      // Verificar en colección socios
      const socioRef = doc(db, this.sociosCollection, socioId);
      const socioDoc = await getDoc(socioRef);
      
      if (socioDoc.exists()) {
        const socioData = socioDoc.data();
        console.log('📄 Datos del socio:', {
          id: socioDoc.id,
          email: socioData.email,
          asociacionId: socioData.asociacionId,
          asociacion: socioData.asociacion,
          fechaVinculacion: socioData.fechaVinculacion,
          estado: socioData.estado,
          estadoMembresia: socioData.estadoMembresia,
        });
      } else {
        console.log('❌ Socio no encontrado en colección socios');
      }
      
      // Verificar en colección users
      const userRef = doc(db, this.usersCollection, socioId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('👤 Datos del usuario:', {
          id: userDoc.id,
          email: userData.email,
          asociacionId: userData.asociacionId,
          role: userData.role,
          estado: userData.estado,
        });
      } else {
        console.log('❌ Usuario no encontrado en colección users');
      }
      
      // Si existe el socio, buscar también por email en users
      if (socioDoc.exists()) {
        const socioData = socioDoc.data();
        if (socioData.email) {
          const userQuery = query(
            collection(db, this.usersCollection),
            where('email', '==', socioData.email.toLowerCase())
          );
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userByEmail = userSnapshot.docs[0];
            const userByEmailData = userByEmail.data();
            console.log('📧 Usuario encontrado por email:', {
              id: userByEmail.id,
              email: userByEmailData.email,
              asociacionId: userByEmailData.asociacionId,
              role: userByEmailData.role,
              estado: userByEmailData.estado,
            });
          }
        }
      }
      
      // Verificar estado de membresía
      const membershipStatus = await membershipSyncService.checkMembershipStatus(socioId);
      if (membershipStatus) {
        console.log('🔍 Estado de membresía:', membershipStatus);
        
        if (membershipStatus.needsSync) {
          console.log('⚠️ Se requiere sincronización');
        }
      }
      
    } catch (error) {
      console.error('❌ Error en debug:', error);
    }
  }

  /**
   * Corregir estados de membresía inconsistentes para una asociación
   */
  async fixAssociationMembershipStates(asociacionId: string): Promise<{
    success: boolean;
    fixed: number;
    errors: string[];
  }> {
    try {
      console.log('🔧 Corrigiendo estados de membresía para asociación:', asociacionId);
      
      const result = await membershipSyncService.syncAssociationMembers(asociacionId);
      
      return {
        success: result.success,
        fixed: result.syncedUsers,
        errors: result.errors.map(e => e.error),
      };
    } catch (error) {
      console.error('❌ Error corrigiendo estados de membresía:', error);
      handleError(error, 'Fix Association Membership States');
      return {
        success: false,
        fixed: 0,
        errors: ['Error general al corregir estados'],
      };
    }
  }
}

// Exportar instancia singleton
export const socioAsociacionService = new SocioAsociacionService();
export default socioAsociacionService;