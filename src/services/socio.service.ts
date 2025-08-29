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
}

class SocioService {
  private readonly collection = COLLECTIONS.SOCIOS;

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
      const existingEmail = await this.checkEmailExists(data.email, asociacionId);
      if (existingEmail) {
        throw new Error('Ya existe un socio con este email en esta asociación');
      }

      // Generate numero de socio if not provided
      let numeroSocio = data.numeroSocio;
      if (!numeroSocio) {
        numeroSocio = await this.generateNumeroSocio(asociacionId);
      } else {
        // Check if numero socio already exists
        const existingNumero = await this.checkNumeroSocioExists(asociacionId, numeroSocio);
        if (existingNumero) {
          throw new Error('Ya existe un socio con este número en esta asociación');
        }
      }

      // Usar el nuevo servicio de autenticación para crear la cuenta completa
      const { socioAuthService } = await import('./socio-auth.service');
      
      // Preparar los datos del socio con el número generado
      const socioDataWithNumber: SocioFormData = {
        ...data,
        numeroSocio
      };

      const result = await socioAuthService.createSocioAuthAccount(socioDataWithNumber, asociacionId);
      
      if (result.success && result.uid) {
        console.log('✅ Socio created successfully with auth account:', result.uid);
        
        // Log del estado del email
        if (result.emailSent) {
          console.log('📧 Email de activación enviado exitosamente');
        } else if (result.emailError) {
          console.warn('⚠️ Socio creado pero falló el envío del email:', result.emailError);
        }

        return {
          success: true,
          socioId: result.uid,
          emailSent: result.emailSent,
          emailError: result.emailError
        };
      } else {
        throw new Error(result.error || 'Error al crear la cuenta del socio');
      }
    } catch (error) {
      handleError(error, 'Create Socio');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        emailSent: false
      };
    }
  }

  /**
   * Generate a random password for temporary storage
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

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
   * Update socio
   */
  async updateSocio(id: string, data: Partial<SocioFormData>): Promise<boolean> {
    try {
      // Get current socio to get asociacionId
      const currentSocio = await this.getSocioById(id);
      if (!currentSocio) {
        throw new Error('Socio no encontrado');
      }

      // Validate DNI if being updated
      if (data.dni && data.dni !== currentSocio.dni) {
        const existingDni = await this.checkDniExists(data.dni, currentSocio.asociacionId);
        if (existingDni) {
          throw new Error('Ya existe un socio con este DNI en esta asociación');
        }
      }

      // Validate email if being updated
      if (data.email && data.email.toLowerCase() !== currentSocio.email.toLowerCase()) {
        const existingEmail = await this.checkEmailExists(data.email, currentSocio.asociacionId);
        if (existingEmail) {
          throw new Error('Ya existe un socio con este email en esta asociación');
        }
      }

      // Validate numero socio if being updated
      if (data.numeroSocio && data.numeroSocio !== currentSocio.numeroSocio) {
        const existingNumero = await this.checkNumeroSocioExists(currentSocio.asociacionId, data.numeroSocio);
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

      await updateDoc(
        doc(db, this.collection, id),
        updateData as Partial<SocioFormData> & { actualizadoEn: import('firebase/firestore').FieldValue; estadoMembresia?: string }
      );

      console.log('✅ Socio updated successfully:', id);
      return true;
    } catch (error) {
      handleError(error, 'Update Socio');
      return false;
    }
  }

  /**
   * Delete socio completely (hard delete)
   */
  async deleteSocioCompletely(id: string): Promise<boolean> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      
      // First, delete related data
      await this.deleteRelatedSocioData(id);
      
      // Then delete the socio document
      await deleteDoc(doc(db, this.collection, id));
      
      // Also delete from users collection if exists
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, id));
      } catch (error) {
        console.warn('User document not found or already deleted:', error);
      }

      console.log('✅ Socio deleted completely:', id);
      return true;
    } catch (error) {
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
   */
  async importSocios(asociacionId: string, csvData: Record<string, unknown>[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      duplicates: 0,
    };

    try {
      const batch = writeBatch(db);
      let batchCount = 0;
      const maxBatchSize = 500;

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

          // Generate numero de socio
          const numeroSocio = row.numeroSocio || await this.generateNumeroSocio(asociacionId);

          // Check if numero socio already exists
          if (row.numeroSocio) {
            const existingNumero = await this.checkNumeroSocioExists(asociacionId, String(row.numeroSocio));
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

          // Prepare socio data - clean to avoid undefined values
          const socioId = doc(collection(db, this.collection)).id;
          const socioData: Record<string, unknown> = {
            nombre: row.nombre,
            email: typeof row.email === 'string' ? row.email.toLowerCase() : '',
            dni: row.dni,
            asociacionId,
            numeroSocio,
            estado: 'activo',
            estadoMembresia: 'pendiente',
            fechaIngreso: serverTimestamp(),
            montoCuota: parseFloat(String(row.montoCuota)) || 0,
            beneficiosUsados: 0,
            validacionesRealizadas: 0,
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
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

      result.success = true;
      console.log('✅ Socios imported successfully:', result.imported);
      
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
  async registerPayment(socioId: string, amount: number, months: number = 1): Promise<boolean> {
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

  private async generateNumeroSocio(asociacionId: string): Promise<string> {
    try {
      const q = query(
        collection(db, this.collection),
        where('asociacionId', '==', asociacionId),
        orderBy('numeroSocio', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return '001';
      }

      const lastSocio = snapshot.docs[0].data();
      const lastNumber = parseInt(lastSocio.numeroSocio || '0');
      const newNumber = lastNumber + 1;
      
      return newNumber.toString().padStart(3, '0');
    } catch {
      // Fallback to timestamp-based number
      return Date.now().toString().slice(-6);
    }
  }
}

// Export singleton instance
export const socioService = new SocioService();
export default socioService;