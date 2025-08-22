import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface QRValidationRequest {
  socioId: string;
  comercioId: string;
  beneficioId?: string;
  asociacionId?: string;
  ubicacion?: {
    lat: number;
    lng: number;
  }; 
  dispositivo?: {
    tipo: string; // e.g., 'mobile', 'desktop'
    version: string; // e.g., '1.0.0'
  };
}

export interface QRValidationResponse {
  success: boolean;
  message: string;
  data?: {
    comercio: {
      id: string;
      nombre: string;
      categoria: string;
      direccion?: string;
      logo?: string;
    };
    beneficio?: {
      id: string;
      titulo: string;
      descripcion: string;
      descuento: number;
      tipo: string;
      condiciones?: string;
    };
    socio: {
      id: string;
      nombre: string;
      numeroSocio: string;
      estadoMembresia: string;
    };
    validacion: {
      id: string;
      fechaValidacion: Date;
      montoDescuento: number;
      codigoValidacion: string;
    };
  };
  error?: string;
}

class QRValidationService {
  private readonly sociosCollection = COLLECTIONS.SOCIOS;
  private readonly comerciosCollection = COLLECTIONS.COMERCIOS;
  private readonly beneficiosCollection = COLLECTIONS.BENEFICIOS;
  private readonly validacionesCollection = COLLECTIONS.VALIDACIONES;

  /**
   * Validate QR code and create validation record
   */
  async validateQRCode(request: QRValidationRequest): Promise<QRValidationResponse> {
    try {
      // Extract comercio ID from QR data
      const comercioId = request.comercioId;
      if (!comercioId) {
        return {
          success: false,
          message: 'Código QR inválido o dañado',
          error: 'INVALID_QR'
        };
      }

      // Run transaction to ensure data consistency
      const result = await runTransaction(db, async (transaction) => {
        // 1. Get and validate socio
        const socioRef = doc(db, this.sociosCollection, request.socioId);
        const socioDoc = await transaction.get(socioRef);
        if (!socioDoc.exists()) {
          throw new Error('Socio no encontrado');
        }
        const socioData = socioDoc.data();

        // Check socio status
        if (socioData.estado !== 'activo') {
          throw new Error('Tu cuenta de socio no está activa. Contacta a tu asociación.');
        }

        // Check membership status
        if (socioData.estadoMembresia === 'vencido') {
          throw new Error('Tu membresía está vencida. Renueva tu cuota para acceder a beneficios.');
        }
        if (socioData.estadoMembresia === 'pendiente') {
          throw new Error('Tu membresía está pendiente de activación. Contacta a tu asociación.');
        }

        // 2. Get and validate comercio
        const comercioRef = doc(db, this.comerciosCollection, comercioId);
        const comercioDoc = await transaction.get(comercioRef);
        if (!comercioDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }
        const comercioData = comercioDoc.data();
        if (comercioData.estado !== 'activo') {
          throw new Error('Este comercio no está disponible actualmente');
        }

        // Check if socio's association is linked to this comercio
        const socioAsociacionId = socioData.asociacionId;
        if (!comercioData.asociacionesVinculadas?.includes(socioAsociacionId)) {
          throw new Error('Tu asociación no tiene convenio con este comercio');
        }

        // 3. Get available benefits for this comercio and association
        const beneficiosQuery = query(
          collection(db, this.beneficiosCollection),
          where('comercioId', '==', comercioId),
          where('estado', '==', 'activo')
        );
        const beneficiosSnapshot = await getDocs(beneficiosQuery);
        
        // Filter benefits by association if needed
        interface Beneficio {
          id: string;
          titulo: string;
          descripcion: string;
          descuento: number;
          tipo: string;
          condiciones?: string;
          asociacionesDisponibles?: string[];
        }

        const availableBeneficios = beneficiosSnapshot.docs
          .map(docSnap => {
            const data = docSnap.data();
            return { id: docSnap.id, ...data } as Beneficio;
          })
          .filter((beneficio: Beneficio) => 
            !beneficio.asociacionesDisponibles || 
            beneficio.asociacionesDisponibles.includes(socioAsociacionId)
          );

        if (availableBeneficios.length === 0) {
          throw new Error('No hay beneficios disponibles para este comercio');
        }

        // 4. Create validation record
        const validationCode = this.generateValidationCode();
        
        // FIXED: Add null checks and fallback values for socio data
        const validationData = {
          socioId: request.socioId,
          socioNombre: socioData.nombre || 'Socio sin nombre',
          socioNumero: socioData.numeroSocio || 'SIN-NUMERO', // FIXED: Fallback value
          comercioId: comercioId,
          comercioNombre: comercioData.nombreComercio || comercioData.nombre || 'Comercio sin nombre',
          asociacionId: socioAsociacionId,
          asociacionNombre: socioData.asociacionNombre || null,
          fechaValidacion: serverTimestamp(),
          codigoValidacion: validationCode,
          estado: 'exitosa',
          beneficiosDisponibles: availableBeneficios.map(b => ({
            id: b.id,
            titulo: b.titulo,
            descuento: b.descuento,
            tipo: b.tipo
          })),
          beneficioUsado: null,
          montoDescuento: 0,
          codigoUso: null,
          ubicacion: request.ubicacion || null,
          dispositivo: request.dispositivo || null,
          metadata: {
            version: '2.2', // Updated version for socioNumero fix
            socioNumeroFallback: !socioData.numeroSocio // Track if we used fallback
          }
        };

        const validacionRef = doc(collection(db, this.validacionesCollection));
        transaction.set(validacionRef, validationData);

        // 5. Update comercio stats
        transaction.update(comercioRef, {
          validacionesRealizadas: (comercioData.validacionesRealizadas || 0) + 1,
          clientesAtendidos: (comercioData.clientesAtendidos || 0) + 1,
          'metadata.ultimaValidacion': serverTimestamp()
        });

        // 6. Update socio stats
        transaction.update(socioRef, {
          validacionesRealizadas: (socioData.validacionesRealizadas || 0) + 1,
          'metadata.ultimaValidacion': serverTimestamp()
        });

        // 7. Return success response
        return {
          success: true,
          message: 'Validación exitosa',
          data: {
            comercio: {
              id: comercioId,
              nombre: comercioData.nombreComercio || comercioData.nombre || 'Comercio sin nombre',
              categoria: comercioData.categoria || '',
              direccion: comercioData.direccion,
              logo: comercioData.logo
            },
            socio: {
              id: request.socioId,
              nombre: socioData.nombre || 'Socio sin nombre',
              numeroSocio: socioData.numeroSocio || 'SIN-NUMERO', // FIXED: Fallback value
              estadoMembresia: socioData.estadoMembresia || 'independiente'
            },
            validacion: {
              id: validacionRef.id,
              fechaValidacion: new Date(),
              montoDescuento: 0,
              codigoValidacion: validationCode
            }
          }
        };
      });

      return result;
    } catch (error) {
      console.error('Error validating QR code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al validar el código QR',
        error: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Use a benefit after validation
   */
  async useBenefit(
    validacionId: string,
    beneficioId: string,
    montoCompra?: number
  ): Promise<QRValidationResponse> {
    try {
      // Run transaction to ensure data consistency
      const result = await runTransaction(db, async (transaction) => {
        // 1. Get validation record
        const validacionRef = doc(db, this.validacionesCollection, validacionId);
        const validacionDoc = await transaction.get(validacionRef);
        if (!validacionDoc.exists()) {
          throw new Error('Validación no encontrada');
        }
        const validacionData = validacionDoc.data();

        // Check if benefit is already used
        if (validacionData.beneficioUsado) {
          throw new Error('Ya se ha utilizado un beneficio en esta validación');
        }

        // 2. Get benefit
        const beneficioRef = doc(db, this.beneficiosCollection, beneficioId);
        const beneficioDoc = await transaction.get(beneficioRef);
        if (!beneficioDoc.exists()) {
          throw new Error('Beneficio no encontrado');
        }
        const beneficioData = beneficioDoc.data();

        // Check if benefit is active
        if (beneficioData.estado !== 'activo') {
          throw new Error('Este beneficio no está disponible actualmente');
        }

        // Check if benefit is available for this socio's association
        const socioAsociacionId = validacionData.asociacionId;
        if (
          beneficioData.asociacionesDisponibles && 
          beneficioData.asociacionesDisponibles.length > 0 &&
          !beneficioData.asociacionesDisponibles.includes(socioAsociacionId)
        ) {
          throw new Error('Este beneficio no está disponible para tu asociación');
        }

        // Check if benefit has reached its total limit
        if (
          beneficioData.limiteTotal && 
          beneficioData.usosActuales >= beneficioData.limiteTotal
        ) {
          throw new Error('Este beneficio ha alcanzado su límite de usos');
        }

        // Check if socio has reached their limit for this benefit
        const socioId = validacionData.socioId;
        const socioUsosQuery = query(
          collection(db, this.validacionesCollection),
          where('socioId', '==', socioId),
          where('beneficioUsado.id', '==', beneficioId)
        );
        const socioUsosSnapshot = await getDocs(socioUsosQuery);
        
        if (
          beneficioData.limitePorSocio && 
          socioUsosSnapshot.size >= beneficioData.limitePorSocio
        ) {
          throw new Error(`Has alcanzado el límite de usos (${beneficioData.limitePorSocio}) para este beneficio`);
        }

        // Calculate discount amount
        const montoDescuento = this.calculateDiscountAmount(
          beneficioData.tipo,
          beneficioData.descuento,
          montoCompra
        );

        // Generate usage code
        const usageCode = this.generateUsageCode();

        // 3. Update validation record
        transaction.update(validacionRef, {
          beneficioUsado: {
            id: beneficioId,
            titulo: beneficioData.titulo,
            descuento: beneficioData.descuento,
            tipo: beneficioData.tipo
          },
          montoDescuento,
          codigoUso: usageCode,
          fechaUso: serverTimestamp(),
          montoCompra: montoCompra || 0
        });

        // 4. Update benefit usage count
        transaction.update(beneficioRef, {
          usosActuales: (beneficioData.usosActuales || 0) + 1,
          'metadata.ultimoUso': serverTimestamp()
        });

        // 5. Update comercio stats
        const comercioRef = doc(db, this.comerciosCollection, validacionData.comercioId);
        const comercioDoc = await transaction.get(comercioRef);
        if (comercioDoc.exists()) {
          const comercioData = comercioDoc.data();
          transaction.update(comercioRef, {
            ingresosMensuales: (comercioData.ingresosMensuales || 0) + (montoCompra || 0)
          });
        }

        // 6. Return success response
        return {
          success: true,
          message: 'Beneficio aplicado exitosamente',
          data: {
            comercio: {
              id: validacionData.comercioId,
              nombre: validacionData.comercioNombre,
              categoria: '',
              direccion: ''
            },
            beneficio: {
              id: beneficioId,
              titulo: beneficioData.titulo,
              descripcion: beneficioData.descripcion,
              descuento: beneficioData.descuento,
              tipo: beneficioData.tipo,
              condiciones: beneficioData.condiciones
            },
            socio: {
              id: validacionData.socioId,
              nombre: validacionData.socioNombre,
              numeroSocio: validacionData.socioNumero || 'SIN-NUMERO', // FIXED: Fallback value
              estadoMembresia: ''
            },
            validacion: {
              id: validacionId,
              fechaValidacion: validacionData.fechaValidacion?.toDate() || new Date(),
              montoDescuento,
              codigoValidacion: validacionData.codigoValidacion
            }
          }
        };
      });

      return result;
    } catch (error) {
      console.error('Error using benefit:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al aplicar el beneficio',
        error: 'BENEFIT_USAGE_ERROR'
      };
    }
  }

  /**
   * Get validation history for a socio
   */
  async getValidationHistory(
    socioId: string,
    limitCount: number = 20,
    lastDoc?: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData>
  ): Promise<{
    validaciones: Array<{
      id: string;
      comercioNombre: string;
      fechaValidacion: Date;
      beneficiosDisponibles: Array<{ id: string; titulo: string; descuento: number; tipo: string }>;
      beneficioUsado: { id: string; titulo: string; descuento: number; tipo: string } | null;
      montoDescuento: number;
      codigoValidacion: string;
    }>;
    hasMore: boolean;
    lastDoc: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null;
  }> {
    try {
      let q = query(
        collection(db, this.validacionesCollection),
        where('socioId', '==', socioId),
        orderBy('fechaValidacion', 'desc')
      );

      if (lastDoc) {
        q = query(q, limit(limitCount + 1));
      } else {
        q = query(q, limit(limitCount + 1));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > limitCount;

      if (hasMore) {
        docs.pop();
      }

      const validaciones = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          comercioNombre: data.comercioNombre,
          fechaValidacion: data.fechaValidacion?.toDate() || new Date(),
          beneficiosDisponibles: data.beneficiosDisponibles || [],
          beneficioUsado: data.beneficioUsado,
          montoDescuento: data.montoDescuento || 0,
          codigoValidacion: data.codigoValidacion
        };
      });

      return {
        validaciones,
        hasMore,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      };
    } catch (error) {
      console.error('Error getting validation history:', error);
      handleError(error, 'Get Validation History');
      return { validaciones: [], hasMore: false, lastDoc: null };
    }
  }

  /**
   * Get validation statistics for a comercio
   */
  async getValidationStatsForComercio(comercioId: string): Promise<{
    totalValidaciones: number;
    validacionesHoy: number;
    validacionesMes: number;
    clientesUnicos: number;
    beneficiosUsados: number;
  }> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all validations for this comercio
      const validacionesQuery = query(
        collection(db, this.validacionesCollection),
        where('comercioId', '==', comercioId)
      );
      const validacionesSnapshot = await getDocs(validacionesQuery);
      const validaciones = validacionesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          socioId: data.socioId,
          fechaValidacion: data.fechaValidacion?.toDate() || new Date(),
          beneficioUsado: data.beneficioUsado || null
        };
      });

      // Calculate stats
      const totalValidaciones = validaciones.length;
      
      const validacionesHoy = validaciones.filter(v => 
        v.fechaValidacion >= startOfDay
      ).length;
      
      const validacionesMes = validaciones.filter(v => 
        v.fechaValidacion >= startOfMonth
      ).length;
      
      const clientesUnicos = new Set(
        validaciones.map(v => v.socioId)
      ).size;
      
      const beneficiosUsados = validaciones.filter(v => 
        v.beneficioUsado
      ).length;

      return {
        totalValidaciones,
        validacionesHoy,
        validacionesMes,
        clientesUnicos,
        beneficiosUsados
      };
    } catch (error) {
      console.error('Error getting validation stats:', error);
      handleError(error, 'Get Validation Stats');
      return {
        totalValidaciones: 0,
        validacionesHoy: 0,
        validacionesMes: 0,
        clientesUnicos: 0,
        beneficiosUsados: 0
      };
    }
  }

  /**
   * Private helper methods
   */
  private extractComercioIdFromQR(qrData: string): string | null {
    try {
      // QR data format: https://fidelya.app/validar-beneficio?comercio=COMERCIO_ID
      const url = new URL(qrData);
      return url.searchParams.get('comercio');
    } catch{
      // Try to extract from simple format: COMERCIO_ID
      if (qrData && qrData.length > 10) {
        return qrData;
      }
      return null;
    }
  }

  private generateValidationCode(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private generateUsageCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private calculateDiscountAmount(
    tipo: string,
    descuento: number,
    montoCompra?: number
  ): number {
    if (!montoCompra) return 0;

    switch (tipo) {
      case 'porcentaje':
        return (montoCompra * descuento) / 100;
      case 'monto_fijo':
        return descuento;
      case 'producto_gratis':
        return 0; // No monetary discount for free product
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const qrValidationService = new QRValidationService();
export default qrValidationService;