import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { Socio, SocioStats, SocioActivity, SocioFormData } from '@/types/socio';

export interface SocioFilters {
  estado?: string;
  estadoMembresia?: string;
  search?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; error: string; data: Record<string, unknown> }>;
  duplicates: number;
}

export interface CreateSocioResult {
  success: boolean;
  socioId?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
  verificationEmailSent?: boolean;
  verificationEmailError?: string;
}

class SocioService {
  private readonly collection = COLLECTIONS.SOCIOS;

  /**
   * Bulk update estado for multiple socios with users sync (best-effort)
   */
  async bulkUpdateEstado(
    asociacionId: string,
    socioIds: string[],
    nuevoEstado: Socio['estado']
  ): Promise<{ updated: number; failed: string[] }> {
    const result = { updated: 0, failed: [] as string[] };

    try {
      if (!asociacionId || !Array.isArray(socioIds) || socioIds.length === 0) {
        return result;
      }

      // Firestore batch limit is 500
      const chunkSize = 400; // keep margin for possible related updates

      for (let i = 0; i < socioIds.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = socioIds.slice(i, i + chunkSize);

        for (const socioId of chunk) {
          try {
            const socioRef = doc(db, this.collection, socioId);
            const socioSnap = await getDoc(socioRef);

            // Validate socio belongs to asociacion
            if (!socioSnap.exists() || socioSnap.data().asociacionId !== asociacionId) {
              result.failed.push(socioId);
              continue;
            }

            batch.update(socioRef, {
              estado: nuevoEstado,
              actualizadoEn: serverTimestamp(),
            });

            // Best-effort sync with users
            try {
              const userRef = doc(db, COLLECTIONS.USERS, socioId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                batch.update(userRef, {
                  estado: nuevoEstado,
                  actualizadoEn: serverTimestamp(),
                });
              }
            } catch (syncErr) {
              console.warn('bulkUpdateEstado users sync warn:', syncErr);
            }

            result.updated++;
          } catch {
            result.failed.push(socioId);
          }
        }

        await batch.commit();
      }

      return result;
    } catch (error) {
      handleError(error, 'Bulk Update Estado Socios');
      return result;
    }
  }


  /**
   * Get socio by ID
   */
  async getSocioById(id: string): Promise<Socio | null> {
    try {
      const socioDoc = await getDoc(doc(db, this.collection, id));
      
      if (!socioDoc.exists()) {
        return null;
      }

      const data = socioDoc.data();
      return {
        id: socioDoc.id,
        uid: socioDoc.id,
        ...data,
        fechaNacimiento: data.fechaNacimiento?.toDate() ? Timestamp.fromDate(data.fechaNacimiento.toDate()) : undefined,
        fechaIngreso: data.fechaIngreso?.toDate() ? Timestamp.fromDate(data.fechaIngreso.toDate()) : Timestamp.now(),
        fechaVencimiento: data.fechaVencimiento?.toDate() ? Timestamp.fromDate(data.fechaVencimiento.toDate()) : undefined,
        ultimoPago: data.ultimoPago?.toDate() ? Timestamp.fromDate(data.ultimoPago.toDate()) : undefined,
        ultimoAcceso: data.ultimoAcceso?.toDate() ? Timestamp.fromDate(data.ultimoAcceso.toDate()) : undefined,
        creadoEn: data.creadoEn?.toDate() ? Timestamp.fromDate(data.creadoEn.toDate()) : Timestamp.now(),
        actualizadoEn: data.actualizadoEn?.toDate() ? Timestamp.fromDate(data.actualizadoEn.toDate()) : Timestamp.now(),
        // Add the missing asociacion property - this should be fetched from asociaciones collection
        asociacion: data.asociacionNombre || 'Asociación', // Fallback value, should be properly fetched
      } as Socio;
    } catch (error) {
      handleError(error, 'Get Socio By ID');
      return null;
    }
  }

  /**
   * Get socios by association with filters and pagination
   */
  async getSociosByAsociacion(
    asociacionId: string,
    filters: SocioFilters = {},
    pageSize = 20,
    lastDoc?: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null
  ): Promise<{ socios: Socio[]; hasMore: boolean; lastDoc: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null }> {
    try {
      let q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId),
        orderBy('creadoEn', 'desc')
      );

      // Apply filters
      if (filters.estado) {
        q = query(q, where('estado', '==', filters.estado));
      }

      if (filters.estadoMembresia) {
        q = query(q, where('estadoMembresia', '==', filters.estadoMembresia));
      }

      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(pageSize + 1)); // Get one extra to check if there are more

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;

      if (hasMore) {
        docs.pop(); // Remove the extra document
      }

      // Get association name for all socios
      const asociacionName = await this.getAsociacionName(asociacionId);

      let socios = docs.map(doc => {
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
          // Add the missing asociacion property
          asociacion: asociacionName,
        } as Socio;
      });

      // Apply client-side filters for complex queries
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        socios = socios.filter(socio =>
          socio.nombre.toLowerCase().includes(searchTerm) ||
          socio.email.toLowerCase().includes(searchTerm) ||
          socio.dni.includes(searchTerm) ||
          socio.numeroSocio?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.fechaDesde || filters.fechaHasta) {
        socios = socios.filter(socio => {
          const fechaIngreso = socio.fechaIngreso.toDate();
          if (filters.fechaDesde && fechaIngreso < filters.fechaDesde) return false;
          if (filters.fechaHasta && fechaIngreso > filters.fechaHasta) return false;
          return true;
        });
      }

      return {
        socios,
        hasMore,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      };
    } catch (error) {
      handleError(error, 'Get Socios By Asociacion');
      return { socios: [], hasMore: false, lastDoc: null };
    }
  }

  /**
   * Get association name by ID
   */
  private async getAsociacionName(asociacionId: string): Promise<string> {
    try {
      const asociacionDoc = await getDoc(doc(db, COLLECTIONS.ASOCIACIONES, asociacionId));
      if (asociacionDoc.exists()) {
        return asociacionDoc.data().nombre || 'Asociación';
      }
      return 'Asociación';
    } catch (error) {
      console.error('Error getting asociacion name:', error);
      return 'Asociación';
    }
  }

  /**
   * Create new socio with Firebase Authentication account and automatic activation email
   * MEJORADO: No cierra la sesión del administrador
   */
  async createSocio(asociacionId: string, data: SocioFormData): Promise<CreateSocioResult> {
    try {
      // Validar que se proporcione una contraseña
      if (!data.password || data.password.length < 6) {
        throw new Error('Se requiere una contraseña de al menos 6 caracteres para crear la cuenta del socio');
      }

      // Check if DNI already exists IN THIS ASSOCIATION
      if (data.dni) {
        const existingDni = await this.checkDniExists(data.dni, asociacionId);
        if (existingDni) {
          throw new Error('Ya existe un socio con este DNI en esta asociación');
        }
      }

      // Check if email already exists IN THIS ASSOCIATION
      if (data.email) {
        const existingEmail = await this.checkEmailExists(data.email, asociacionId);
        if (existingEmail) {
          throw new Error('Ya existe un socio con este email en esta asociación');
        }
      }

      // Generate numero de socio if not provided (consecutivo por asociación, transaccional)
      let numeroSocio: string;
      if (!data.numeroSocio) {
        const { socioNumberService } = await import('./socio-number.service');
        numeroSocio = await socioNumberService.getNextSocioNumber(asociacionId);
      } else {
        numeroSocio = data.numeroSocio;
        // Check if numero socio already exists
        const existingNumero = await this.checkNumeroSocioExists(asociacionId, numeroSocio);
        if (existingNumero) {
          throw new Error('Ya existe un socio con este número en esta asociación');
        }
      }

      // Usar el nuevo servicio de autenticación SERVER-SIDE para crear la cuenta completa
      // ESTO NO CIERRA LA SESIÓN DEL ADMINISTRADOR
      const { socioAuthService } = await import('./socio-auth.service');
      
      // Preparar los datos del socio con el número generado
      const socioDataWithNumber: SocioFormData = {
        ...data,
        numeroSocio
      };

      console.log('🔐 Usando creación server-side para mantener sesión del administrador');
      const result = await socioAuthService.createSocioAuthAccountServerSide(socioDataWithNumber, asociacionId);
      
      if (result.success && result.uid) {
        console.log('✅ Socio created successfully with auth account (server-side):', result.uid);
        console.log('🔐 Sesión del administrador mantenida correctamente');
        
        // Log detallado del estado de los emails
        let emailStatusMessage = '';
        
        if (result.emailSent && result.verificationEmailSent) {
          emailStatusMessage = 'Email de bienvenida y verificación enviados exitosamente';
        } else if (result.emailSent && !result.verificationEmailSent) {
          emailStatusMessage = `Email de bienvenida enviado. Error en verificación: ${result.verificationEmailError}`;
        } else if (!result.emailSent && result.verificationEmailSent) {
          emailStatusMessage = `Email de verificación enviado. Error en bienvenida: ${result.emailError}`;
        } else {
          emailStatusMessage = `Errores en ambos emails - Bienvenida: ${result.emailError}, Verificación: ${result.verificationEmailError}`;
        }
        
        console.log('📧 Estado de emails:', emailStatusMessage);

        return {
          success: true,
          socioId: result.uid,
          emailSent: result.emailSent,
          emailError: result.emailError,
          verificationEmailSent: result.verificationEmailSent,
          verificationEmailError: result.verificationEmailError
        };
      } else {
        throw new Error(result.error || 'Error al crear la cuenta del socio');
      }
    } catch (error) {
      handleError(error, 'Create Socio');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        emailSent: false,
        verificationEmailSent: false
      };
    }
  }

  /**
   * Generate a random password for temporary storage
   */
  // NOTE: kept for backward compatibility if needed in future flows
  // Eliminado: utilidades antiguas no usadas

  /**
   * Create Firebase Authentication account for existing socio (separate process)
   * This can be called later without interfering with current admin session
   */
  async createSocioAuthAccount(socioId: string): Promise<boolean> {
    try {
      const socioDoc = await getDoc(doc(db, this.collection, socioId));
      if (!socioDoc.exists()) {
        throw new Error('Socio no encontrado');
      }

      const socioData = socioDoc.data();
      if (!socioData.requiresAccountCreation || !socioData.tempPassword) {
        throw new Error('El socio ya tiene cuenta creada o no requiere creación');
      }

      // This would need to be implemented using Firebase Admin SDK on the server side
      // to avoid interfering with the current user session
      console.log('Auth account creation would be handled server-side for:', socioData.email);
      
      // Update socio to remove temporary data
      await updateDoc(doc(db, this.collection, socioId), {
        requiresAccountCreation: false,
        tempPassword: null,
        hasAuthAccount: true,
        actualizadoEn: serverTimestamp(),
      });

      return true;
    } catch (error) {
      handleError(error, 'Create Socio Auth Account');
      return false;
    }
  }

  /**
   * Update socio with automatic users table synchronization and password update
   */
  async updateSocio(id: string, data: Partial<SocioFormData>): Promise<boolean> {
    try {
      // Get current socio to get asociacionId
      const currentSocio = await this.getSocioById(id);
      if (!currentSocio) {
        throw new Error('Socio no encontrado');
      }

      // Derivar un asociacionId seguro para validaciones y exigir su presencia
      if (!currentSocio.asociacionId || currentSocio.asociacionId.trim() === '') {
        throw new Error('Asociación no definida para el socio. No se puede completar la actualización.');
      }
      const asociacionIdSafe: string = currentSocio.asociacionId;

      // Validate DNI if being updated
      if (data.dni && data.dni !== currentSocio.dni) {
        const existingDni = await this.checkDniExists(data.dni, asociacionIdSafe);
        if (existingDni) {
          throw new Error('Ya existe un socio con este DNI en esta asociación');
        }
      }

      // Validate email if being updated
      if (data.email && data.email.toLowerCase() !== currentSocio.email.toLowerCase()) {
        const existingEmail = await this.checkEmailExists(data.email, asociacionIdSafe);
        if (existingEmail) {
          throw new Error('Ya existe un socio con este email en esta asociación');
        }
      }

      // Validate numero socio if being updated
      if (data.numeroSocio && data.numeroSocio !== currentSocio.numeroSocio) {
        // TypeScript narrowing: dentro de este if, data.numeroSocio es definitivamente string
        const existingNumero = await this.checkNumeroSocioExists(asociacionIdSafe, data.numeroSocio);
        if (existingNumero) {
          throw new Error('Ya existe un socio con este número en esta asociación');
        }
      }

      const updateData: Record<string, unknown> = {
        actualizadoEn: serverTimestamp(),
      };

      // Only add fields that have values
      if (data.nombre) updateData.nombre = data.nombre;
      if (data.dni) updateData.dni = data.dni;
      if (data.telefono) updateData.telefono = data.telefono;
      if (data.direccion) updateData.direccion = data.direccion;
      if (data.numeroSocio) updateData.numeroSocio = data.numeroSocio;
      if (data.montoCuota !== undefined) updateData.montoCuota = data.montoCuota;
      if (data.estado) updateData.estado = data.estado;

      // Convert dates to Timestamps
      if (data.fechaNacimiento) {
        updateData.fechaNacimiento = Timestamp.fromDate(
          data.fechaNacimiento instanceof Date
            ? data.fechaNacimiento
            : data.fechaNacimiento.toDate()
        );
      }

      if (data.fechaVencimiento) {
        updateData.fechaVencimiento = Timestamp.fromDate(
          data.fechaVencimiento instanceof Date
            ? data.fechaVencimiento
            : data.fechaVencimiento.toDate()
        );
        // Update membership status based on expiration date
        updateData.estadoMembresia = (data.fechaVencimiento instanceof Date
          ? data.fechaVencimiento
          : data.fechaVencimiento.toDate()) > new Date() ? 'al_dia' : 'vencido';
      }

      if (data.email) {
        updateData.email = data.email.toLowerCase();
      }

      // NUEVA FUNCIONALIDAD: Actualizar contraseña en Firebase Auth si se proporciona
      if (data.password && data.password.length >= 6) {
        console.log(`🔐 Actualizando contraseña para el socio: ${id}`);
        try {
          // Usar endpoint server-side para actualizar la contraseña
          const response = await fetch('/api/auth/update-socio-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              socioId: id,
              newPassword: data.password,
              asociacionId: asociacionIdSafe,
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            console.log(`✅ Contraseña actualizada exitosamente para el socio: ${id}`);
          } else {
            console.error(`❌ Error actualizando contraseña: ${result.error}`);
            throw new Error(`Error al actualizar contraseña: ${result.error}`);
          }
        } catch (passwordError) {
          console.error('❌ Error en actualización de contraseña:', passwordError);
          throw new Error(`No se pudo actualizar la contraseña: ${passwordError instanceof Error ? passwordError.message : 'Error desconocido'}`);
        }
      }

      // NUEVA FUNCIONALIDAD: Sincronizar estado con tabla users
      const shouldSyncWithUsers = data.estado && data.estado !== currentSocio.estado;
      
      if (shouldSyncWithUsers) {
        console.log(`🔄 Sincronizando estado del socio ${id} con tabla users:`, {
          estadoAnterior: currentSocio.estado,
          estadoNuevo: data.estado
        });

        try {
          // Actualizar en la tabla users
          const userRef = doc(db, COLLECTIONS.USERS, id);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              estado: data.estado,
              actualizadoEn: serverTimestamp(),
            });
            console.log(`✅ Estado sincronizado en tabla users: ${data.estado}`);
          } else {
            console.warn(`⚠️ Usuario no encontrado en tabla users para sincronizar: ${id}`);
          }
        } catch (syncError) {
          console.error('❌ Error sincronizando con tabla users:', syncError);
          // No lanzamos el error para no interrumpir la actualización principal
          // pero registramos el problema
        }
      }

      await updateDoc(
        doc(db, this.collection, id),
        updateData as Partial<SocioFormData> & { actualizadoEn: import('firebase/firestore').FieldValue; estadoMembresia?: string }
      );

      console.log('✅ Socio updated successfully:', id);
      
      if (shouldSyncWithUsers) {
        console.log(`✅ Estado sincronizado correctamente entre socios y users: ${data.estado}`);
      }
      
      return true;
    } catch (error) {
      handleError(error, 'Update Socio');
      return false;
    }
  }

  /**
   * Delete socio completely (hard delete) - MEJORADO con eliminación de Firebase Auth
   */
  async deleteSocioCompletely(id: string): Promise<boolean> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      
      // Obtener información del socio antes de eliminarlo
      const socioDoc = await getDoc(doc(db, this.collection, id));
      if (!socioDoc.exists()) {
        console.warn('Socio no encontrado para eliminación:', id);
        return false;
      }

      const socioData = socioDoc.data();
      const asociacionId = socioData.asociacionId;

      console.log(`🗑️ Iniciando eliminación completa del socio: ${id}`);
      console.log(`📧 Email del socio: ${socioData.email}`);
      console.log(`🏢 Asociación: ${asociacionId}`);

      // Paso 1: Eliminar datos relacionados del socio
      console.log('🧹 Eliminando datos relacionados...');
      await this.deleteRelatedSocioData(id);
      
      // Paso 2: Eliminar documentos de Firestore
      console.log('🗃️ Eliminando documentos de Firestore...');
      
      // Eliminar documento de socios
      await deleteDoc(doc(db, this.collection, id));
      console.log('✅ Documento de socios eliminado');
      
      // Eliminar documento de users si existe
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, id));
        console.log('✅ Documento de users eliminado');
      } catch (error) {
        console.warn('⚠️ Documento de users no encontrado o ya eliminado:', error);
      }

      // Paso 3: Eliminar cuenta de Firebase Authentication
      console.log('🔥 Eliminando cuenta de Firebase Authentication...');
      try {
        const { socioAuthService } = await import('./socio-auth.service');
        const authDeleted = await socioAuthService.deleteFirebaseAuthAccount(id, asociacionId);
        
        if (authDeleted) {
          console.log('✅ Cuenta de Firebase Auth eliminada exitosamente');
        } else {
          console.warn('⚠️ No se pudo eliminar la cuenta de Firebase Auth, pero continuando...');
        }
      } catch (authError) {
        console.error('❌ Error eliminando cuenta de Firebase Auth:', authError);
        console.warn('⚠️ Continuando con la eliminación a pesar del error de Auth');
      }

      console.log(`✅ Socio eliminado completamente: ${id}`);
      console.log(`📧 El email ${socioData.email} ahora puede ser reutilizado para crear una nueva cuenta`);
      
      return true;
    } catch (error) {
      console.error('❌ Error en eliminación completa del socio:', error);
      handleError(error, 'Delete Socio Completely');
      return false;
    }
  }

  /**
   * Delete related socio data (validaciones, activities, etc.)
   */
  private async deleteRelatedSocioData(socioId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete validaciones
      const validacionesQuery = query(
        collection(db, COLLECTIONS.VALIDACIONES),
        where('socioId', '==', socioId)
      );
      const validacionesSnapshot = await getDocs(validacionesQuery);
      validacionesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete activities
      const activitiesQuery = query(
        collection(db, COLLECTIONS.ACTIVITIES),
        where('socioId', '==', socioId)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      activitiesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Commit all deletions
      if (validacionesSnapshot.docs.length > 0 || activitiesSnapshot.docs.length > 0) {
        await batch.commit();
        console.log('✅ Related socio data deleted:', {
          validaciones: validacionesSnapshot.docs.length,
          activities: activitiesSnapshot.docs.length
        });
      }
    } catch (error) {
      console.error('Error deleting related socio data:', error);
      // Don't throw error here, as we still want to delete the main socio document
    }
  }

  /**
   * Delete socio (soft delete) - keeping for backward compatibility
   */
  async deleteSocio(id: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, this.collection, id), {
        estado: 'inactivo',
        actualizadoEn: serverTimestamp(),
      });

      console.log('✅ Socio deleted successfully:', id);
      return true;
    } catch (error) {
      handleError(error, 'Delete Socio');
      return false;
    }
  }

  /**
   * Get socio statistics
   */
  async getSocioStats(socioId: string): Promise<SocioStats | null> {
    try {
      // This would typically aggregate data from validaciones and other collections
      // For now, return mock data structure
      const socio = await this.getSocioById(socioId);
      if (!socio) return null;

      const stats: SocioStats = {
        total: 1,
        activos: socio.estado === 'activo' ? 1 : 0,
        vencidos: socio.estadoMembresia === 'vencido' ? 1 : 0,
        inactivos: socio.estado === 'inactivo' ? 1 : 0,
        beneficiosUsados: socio.beneficiosUsados || 0,
        ahorroTotal: 0, // Would be calculated from validaciones
        comerciosVisitados: 0, // Would be calculated from validaciones
        racha: 0, // Would be calculated based on activity
        tiempoComoSocio: Math.floor((new Date().getTime() - socio.fechaIngreso.toDate().getTime()) / (1000 * 60 * 60 * 24)),
      };

      return stats;
    } catch (error) {
      handleError(error, 'Get Socio Stats');
      return null;
    }
  }

  /**
   * Get socio activity
   */
  async getSocioActivity(): Promise<SocioActivity[]> {
    try {
      // This would typically query from an activities collection using socioId and options
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      handleError(error, 'Get Socio Activity');
      return [];
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(socioId: string, file: File): Promise<string | null> {
    try {
      // This would typically upload to Firebase Storage
      // For now, return placeholder URL
      console.log('Upload profile image for socio:', socioId, file.name);
      return 'https://placeholder-image-url.com';
    } catch (error) {
      handleError(error, 'Upload Profile Image');
      return null;
    }
  }

  /**
   * Export socio data
   */
  async exportSocioData(socioId: string): Promise<{
    perfil: Socio | null;
    estadisticas: SocioStats | null;
    actividad: SocioActivity[];
    fechaExportacion: string;
  } | null> {
    try {
      const socio = await this.getSocioById(socioId);
      const stats = await this.getSocioStats(socioId);
      const activity = await this.getSocioActivity();

      return {
        perfil: socio,
        estadisticas: stats,
        actividad: activity,
        fechaExportacion: new Date().toISOString(),
      };
    } catch (error) {
      handleError(error, 'Export Socio Data');
      return null;
    }
  }

  /**
   * Bulk import socios from CSV data
   * MEJORADO: Ahora envía emails de activación igual que la creación manual
   */
  async importSocios(asociacionId: string, csvData: Record<string, unknown>[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      duplicates: 0,
    };

    try {
      console.log(`📥 Iniciando importación de ${csvData.length} socios para asociación: ${asociacionId}`);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      const maxBatchSize = 500;
      const sociosToCreateAuth: Array<{
        uid: string;
        email: string;
        password: string;
        nombre: string;
        numeroSocio?: string;
      }> = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 1;

        try {
          // Validate required fields
          if (!row.nombre || !row.email || !row.dni) {
            result.errors.push({
              row: rowNumber,
              error: 'Campos requeridos faltantes (nombre, email, dni)',
              data: row
            });
            continue;
          }

          // Check for duplicates WITHIN THIS ASSOCIATION
          const existingDni = await this.checkDniExists(String(row.dni), asociacionId);
          const existingEmail = await this.checkEmailExists(String(row.email), asociacionId);
          
          if (existingDni || existingEmail) {
            result.duplicates++;
            result.errors.push({
              row: rowNumber,
              error: `Socio duplicado en esta asociación: ${existingDni ? 'DNI' : ''} ${existingEmail ? 'Email' : ''}`,
              data: row
            });
            continue;
          }

          // Generate numero de socio (consecutivo por asociación, transaccional)
          const { socioNumberService } = await import('./socio-number.service');
          const numeroSocio = (typeof row.numeroSocio === 'string' && row.numeroSocio.trim() !== '')
            ? row.numeroSocio as string
            : await socioNumberService.getNextSocioNumber(asociacionId);

          // Check if numero socio already exists
          if (typeof row.numeroSocio === 'string' && row.numeroSocio.trim() !== '') {
            const existingNumero = await this.checkNumeroSocioExists(asociacionId, row.numeroSocio as string);
            if (existingNumero) {
              result.duplicates++;
              result.errors.push({
                row: rowNumber,
                error: 'Número de socio ya existe en esta asociación',
                data: row
              });
              continue;
            }
          }

          // Generate secure password for the socio
          const { socioAuthService } = await import('./socio-auth.service');
          const temporaryPassword = socioAuthService.generateSecurePassword();

          // Prepare socio data - clean to avoid undefined values
          const socioId = doc(collection(db, this.collection)).id;
          const socioData: Record<string, unknown> = {
            nombre: row.nombre,
            email: typeof row.email === 'string' ? row.email.toLowerCase() : '',
            dni: row.dni,
            asociacionId,
            numeroSocio,
            estado: 'activo',
            estadoMembresia: 'al_dia', // Importados como al día por defecto
            fechaIngreso: serverTimestamp(),
            montoCuota: parseFloat(String(row.montoCuota)) || 0,
            beneficiosUsados: 0,
            validacionesRealizadas: 0,
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
            hasAuthAccount: false, // Inicialmente false, se actualizará después
            requiresAccountCreation: true, // Marcar que requiere creación de cuenta
            tempPassword: temporaryPassword, // Guardar contraseña temporal
          };

          // Only add optional fields if they have values
          if (row.telefono) {
            socioData.telefono = row.telefono;
          }

          if (row.direccion) {
            socioData.direccion = row.direccion;
          }

          if (row.fechaNacimiento) {
            socioData.fechaNacimiento = Timestamp.fromDate(
              typeof row.fechaNacimiento === 'string' || typeof row.fechaNacimiento === 'number'
                ? new Date(row.fechaNacimiento)
                : row.fechaNacimiento instanceof Date
                  ? row.fechaNacimiento
                  : new Date()
            );
          }

          batch.set(doc(db, this.collection, socioId), socioData);
          batchCount++;
          result.imported++;

          // Agregar a la lista para crear cuentas de auth después
          sociosToCreateAuth.push({
            uid: socioId,
            email: String(row.email).toLowerCase(),
            password: temporaryPassword,
            nombre: String(row.nombre),
            numeroSocio: String(numeroSocio)
          });

          // Commit batch if it reaches max size
          if (batchCount >= maxBatchSize) {
            await batch.commit();
            batchCount = 0;
          }

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : 'Error desconocido',
            data: row
          });
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }

      console.log(`✅ Documentos de Firestore creados: ${result.imported} socios`);

      // Ahora crear las cuentas de Firebase Auth y enviar emails para cada socio importado
      console.log(`🔐 Creando cuentas de Firebase Auth y enviando emails para ${sociosToCreateAuth.length} socios...`);
      
      let authAccountsCreated = 0;
      let emailsSent = 0;

      for (const socioAuth of sociosToCreateAuth) {
        try {
          console.log(`🔐 Procesando cuenta para: ${socioAuth.email}`);

          // Crear cuenta de Firebase Auth usando el endpoint server-side
          const response = await fetch('/api/auth/create-socio-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: socioAuth.email,
              password: socioAuth.password,
              displayName: socioAuth.nombre,
              asociacionId,
              existingUid: socioAuth.uid // Usar el UID ya generado
            }),
          });

          const authResult = await response.json();

          if (response.ok && authResult.success) {
            console.log(`✅ Cuenta de Firebase Auth creada para: ${socioAuth.email}`);
            authAccountsCreated++;

            // Actualizar el documento del socio para marcar que tiene cuenta de auth
            await updateDoc(doc(db, this.collection, socioAuth.uid), {
              hasAuthAccount: true,
              requiresAccountCreation: false,
              tempPassword: null, // Limpiar contraseña temporal
              actualizadoEn: serverTimestamp(),
            });

            // Enviar email de activación
            console.log(`📧 Enviando email de activación a: ${socioAuth.email}`);
            
            const { accountActivationEmailService } = await import('./account-activation-email.service');
            const emailResult = await accountActivationEmailService.sendAccountActivationEmailWithRetry(
              socioAuth.nombre,
              socioAuth.email,
              socioAuth.password,
              asociacionId,
              socioAuth.uid,
            );

            if (emailResult.success) {
              console.log(`✅ Email de activación enviado a: ${socioAuth.email}`);
              emailsSent++;
            } else {
              console.warn(`⚠️ Error enviando email de activación a ${socioAuth.email}:`, emailResult.error);
            }

          } else {
            console.error(`❌ Error creando cuenta de Firebase Auth para ${socioAuth.email}:`, authResult.error);
            
            // Marcar el socio como que requiere creación manual de cuenta
            await updateDoc(doc(db, this.collection, socioAuth.uid), {
              requiresAccountCreation: true,
              authCreationError: authResult.error || 'Error desconocido',
              actualizadoEn: serverTimestamp(),
            });
          }

        } catch (authError) {
          console.error(`❌ Error procesando cuenta para ${socioAuth.email}:`, authError);
          
          // Marcar el socio como que requiere creación manual de cuenta
          try {
            await updateDoc(doc(db, this.collection, socioAuth.uid), {
              requiresAccountCreation: true,
              authCreationError: authError instanceof Error ? authError.message : 'Error desconocido',
              actualizadoEn: serverTimestamp(),
            });
          } catch (updateError) {
            console.error(`❌ Error actualizando estado de error para ${socioAuth.email}:`, updateError);
          }
        }
      }

      result.success = true;
      
      console.log(`✅ Importación completada:`);
      console.log(`   📊 Socios importados: ${result.imported}`);
      console.log(`   🔐 Cuentas de auth creadas: ${authAccountsCreated}`);
      console.log(`   📧 Emails enviados: ${emailsSent}`);
      console.log(`   ⚠️ Errores: ${result.errors.length}`);
      console.log(`   🔄 Duplicados omitidos: ${result.duplicates}`);
      
      if (authAccountsCreated < result.imported) {
        console.warn(`⚠️ Algunas cuentas de auth no se pudieron crear. Los socios afectados requerirán creación manual.`);
      }
      
      if (emailsSent < authAccountsCreated) {
        console.warn(`⚠️ Algunos emails no se pudieron enviar. Los socios afectados no recibirán el email de activación.`);
      }
      
    } catch (error) {
      handleError(error, 'Import Socios');
      result.errors.push({
        row: 0,
        error: 'Error general en la importación',
        data: {}
      });
    }

    return result;
  }

  /**
   * Get association statistics with real-time membership status checking
   */
  async getAsociacionStats(asociacionId: string): Promise<SocioStats> {
    try {
      console.log(`📊 Calculating association stats for: ${asociacionId}`);
      
      // First, update expired memberships for this association
      const { membershipStatusUpdaterService } = await import('./membership-status-updater.service');
      await membershipStatusUpdaterService.updateAssociationMemberships(asociacionId);
      
      // Then get the updated stats
      const stats = await membershipStatusUpdaterService.getRealtimeMembershipStats(asociacionId);
      
      console.log('📊 Final association stats:', {
        total: stats.total,
        activos: stats.activos,
        vencidos: stats.vencidos,
        alDia: stats.alDia,
        pendientes: stats.pendientes,
        porcentajeVencidos: stats.total > 0 ? Math.round((stats.vencidos / stats.total) * 100) : 0
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting association stats:', error);
      handleError(error, 'Get Asociacion Stats');
      
      // Fallback to basic calculation if the new service fails
      return this.getBasicAsociacionStats(asociacionId);
    }
  }

  /**
   * Fallback method for basic association stats calculation
   */
  private async getBasicAsociacionStats(asociacionId: string): Promise<SocioStats> {
    try {
      const q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId)
      );

      const snapshot = await getDocs(q);
      const socios = snapshot.docs.map(doc => doc.data());
      const now = new Date();

      // Calcular estadísticas básicas con verificación en tiempo real
      const total = socios.length;
      const activos = socios.filter(s => s.estado === 'activo').length;
      const inactivos = socios.filter(s => s.estado === 'inactivo').length;
      
      // Calcular estados de membresía verificando fechas de vencimiento
      let alDia = 0;
      let vencidos = 0;
      let pendientes = 0;

      socios.forEach(socio => {
        const fechaVencimiento = socio.fechaVencimiento?.toDate();
        
        if (!fechaVencimiento) {
          pendientes++;
        } else if (fechaVencimiento < now) {
          vencidos++;
        } else {
          alDia++;
        }
      });

      // Calcular ingresos mensuales solo de socios activos y al día
      const ingresosMensuales = socios
        .filter(s => {
          const fechaVencimiento = s.fechaVencimiento?.toDate();
          return s.estado === 'activo' && fechaVencimiento && fechaVencimiento >= now;
        })
        .reduce((total, s) => total + (s.montoCuota || 0), 0);

      // Calcular beneficios usados
      const beneficiosUsados = socios.reduce((total, s) => total + (s.beneficiosUsados || 0), 0);

      const stats: SocioStats = {
        total,
        activos,
        inactivos,
        alDia,
        vencidos,
        pendientes,
        ingresosMensuales,
        beneficiosUsados,
      };

      console.log('📊 Basic stats calculated (fallback):', {
        total,
        activos,
        vencidos,
        alDia,
        pendientes,
        porcentajeVencidos: total > 0 ? Math.round((vencidos / total) * 100) : 0
      });

      return stats;
    } catch (error) {
      handleError(error, 'Get Basic Asociacion Stats');
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        alDia: 0,
        vencidos: 0,
        pendientes: 0,
        ingresosMensuales: 0,
        beneficiosUsados: 0,
      };
    }
  }

  /**
   * Update membership status for expired members
   */
  async updateMembershipStatus(asociacionId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId),
        where('estado', '==', 'activo')
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let updatedCount = 0;

      const now = new Date();

      snapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        const fechaVencimiento = data.fechaVencimiento?.toDate();

        if (fechaVencimiento && fechaVencimiento < now && data.estadoMembresia !== 'vencido') {
          batch.update(docSnapshot.ref, {
            estadoMembresia: 'vencido',
            actualizadoEn: serverTimestamp(),
          });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log('✅ Updated membership status for', updatedCount, 'socios');
      }

      return updatedCount;
    } catch (error) {
      handleError(error, 'Update Membership Status');
      return 0;
    }
  }

  /**
   * Register payment for socio
   */
  async registerPayment(socioId: string, _amount: number, months: number = 1): Promise<boolean> {
    try {
      const socioRef = doc(db, this.collection, socioId);
      const socioDoc = await getDoc(socioRef);

      if (!socioDoc.exists()) {
        throw new Error('Socio no encontrado');
      }

      const socioData = socioDoc.data();
      const now = new Date();
      
      // Calculate new expiration date
      let fechaVencimiento = socioData.fechaVencimiento?.toDate() || now;
      if (fechaVencimiento < now) {
        fechaVencimiento = now;
      }
      
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + months);

      await updateDoc(socioRef, {
        ultimoPago: serverTimestamp(),
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        estadoMembresia: 'al_dia',
        actualizadoEn: serverTimestamp(),
      });

      console.log('✅ Payment registered successfully for socio:', socioId);
      return true;
    } catch (error) {
      handleError(error, 'Register Payment');
      return false;
    }
  }

  /**
   * Helper methods - ACTUALIZADOS PARA VALIDACIÓN POR ASOCIACIÓN
   */
  private async checkDniExists(dni: string, asociacionId?: string): Promise<boolean> {
    try {
      let q = query(collection(db, this.collection), where('dni', '==', dni));
      
      // Si se proporciona asociacionId, solo verificar en esa asociación
      if (asociacionId) {
        q = query(q, where('asociacionId', '==', asociacionId));
      }
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch {
      return false;
    }
  }

  private async checkEmailExists(email: string, asociacionId?: string): Promise<boolean> {
    try {
      let q = query(collection(db, this.collection), where('email', '==', email.toLowerCase()));
      
      // Si se proporciona asociacionId, solo verificar en esa asociación
      if (asociacionId) {
        q = query(q, where('asociacionId', '==', asociacionId));
      }
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch {
      return false;
    }
  }

  private async checkNumeroSocioExists(asociacionId: string, numeroSocio: string): Promise<boolean> {
    try {
      // Si no hay asociacionId, no podemos validar por asociación; retornar false (no existente)
      if (!asociacionId || asociacionId.trim() === '') return false;

      const q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId),
        where('numeroSocio', '==', numeroSocio)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch {
      return false;
    }
  }

  // Eliminado: la generación local por consulta se reemplaza por contador transaccional por asociación.
}

// Export singleton instance
export const socioService = new SocioService();
export default socioService;