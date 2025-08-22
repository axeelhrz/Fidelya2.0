import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface ValidacionRequest {
  socioId: string;
  comercioId: string;
  beneficioId?: string;
  asociacionId?: string;
}

export interface ValidacionResponse {
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

export interface HistorialValidacion {
  id: string;
  comercioId: string;
  comercioNombre: string;
  comercioLogo?: string;
  beneficioId: string;
  beneficioTitulo: string;
  beneficioDescripcion: string;
  descuento: number;
  tipoDescuento: string;
  fechaValidacion: Date;
  montoDescuento: number;
  estado: 'exitosa' | 'fallida' | 'pendiente' | 'cancelada';
  codigoValidacion: string;
  metodoPago?: string;
  notas?: string;
}

// Datos mínimos requeridos para validar el estado del socio
interface SocioValidationData {
  estado: string;
  estadoMembresia?: string;
  asociacionId?: string;
  fechaVencimiento?: Timestamp | Date | string;
  nombre?: string;
  numeroSocio?: string;
  email?: string;
  asociacionNombre?: string;
  beneficiosUsados?: number;
  ahorroTotal?: number;
}

class ValidacionesService {
  // Colecciones utilizadas en Firestore
  private collection = COLLECTIONS.VALIDACIONES;
  private sociosCollection = COLLECTIONS.SOCIOS;
  private comerciosCollection = COLLECTIONS.COMERCIOS;
  private beneficiosCollection = COLLECTIONS.BENEFICIOS;

  /**
   * VALIDACIÓN ESTRICTA DE SOCIO ACTIVO - Reforzada para garantizar que solo socios activos puedan usar beneficios
   */
  private async validateActiveSocio(socioData: SocioValidationData): Promise<void> {
    console.log('🔍 Validando estado del socio:', {
      estado: socioData.estado,
      estadoMembresia: socioData.estadoMembresia,
      asociacionId: socioData.asociacionId,
      fechaVencimiento: socioData.fechaVencimiento
    });

    // 1. VALIDACIÓN CRÍTICA: Estado del socio debe ser 'activo'
    if (socioData.estado !== 'activo') {
      const estadoMessages: Record<string, string> = {
        'inactivo': 'Tu cuenta está inactiva. Contacta al administrador para reactivarla.',
        'pendiente': 'Tu cuenta está pendiente de activación. Contacta al administrador.',
        'suspendido': 'Tu cuenta está suspendida. Contacta al administrador para más información.',
        'vencido': 'Tu cuenta está vencida. Renueva tu membresía para continuar.'
      };
      
      const message = estadoMessages[socioData.estado] || 
                     `Tu cuenta está ${socioData.estado}. Contacta al administrador.`;
      
      throw new Error(message);
    }

    // 2. VALIDACIÓN DE MEMBRESÍA: Para socios con asociación
    if (socioData.asociacionId) {
      console.log('🔍 Validando membresía de socio asociado...');
      
      // Estados de membresía que NO permiten usar beneficios
      const estadosInvalidos = ['vencido', 'pendiente', 'suspendido', 'inactivo'];
      
      if (socioData.estadoMembresia && estadosInvalidos.includes(socioData.estadoMembresia)) {
        const membershipMessages: Record<string, string> = {
          'vencido': 'Tu membresía está vencida. Renueva tu cuota para acceder a beneficios.',
          'pendiente': 'Tu membresía está pendiente de activación. Contacta a tu asociación.',
          'suspendido': 'Tu membresía está suspendida. Contacta a tu asociación.',
          'inactivo': 'Tu membresía está inactiva. Contacta a tu asociación.'
        };
        
        const message = membershipMessages[socioData.estadoMembresia] || 
                       `Tu membresía está ${socioData.estadoMembresia}. Contacta a tu asociación.`;
        
        throw new Error(message);
      }

      // 3. VALIDACIÓN DE FECHA DE VENCIMIENTO
      if (socioData.fechaVencimiento) {
        const fechaVencimiento = socioData.fechaVencimiento instanceof Timestamp 
          ? socioData.fechaVencimiento.toDate() 
          : new Date(socioData.fechaVencimiento);
        
        const ahora = new Date();
        
        if (fechaVencimiento < ahora) {
          throw new Error('Tu membresía ha vencido. Renueva tu cuota para acceder a beneficios.');
        }

        // Advertencia si vence pronto (dentro de 7 días)
        const diasParaVencer = Math.ceil((fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
        if (diasParaVencer <= 7 && diasParaVencer > 0) {
          console.warn(`⚠️ Membresía vence en ${diasParaVencer} días`);
        }
      }
    } else {
      // 4. VALIDACIÓN PARA SOCIOS INDEPENDIENTES
      console.log('🔍 Validando socio independiente...');
      
      if (socioData.estadoMembresia && socioData.estadoMembresia !== 'al_dia' && socioData.estadoMembresia !== 'activo') {
        throw new Error('Tu estado de membresía no permite acceder a beneficios en este momento.');
      }
    }

    console.log('✅ Socio validado correctamente como activo');
  }

  /**
   * Enhanced validation with better error handling and data consistency
   */
  async validarAcceso(request: ValidacionRequest): Promise<ValidacionResponse> {
    try {
      console.log('🔍 Starting enhanced validation process:', request);

      const result = await runTransaction(db, async (transaction) => {
        // 1. Validate socio with enhanced checks
        const socioRef = doc(db, this.sociosCollection, request.socioId);
        const socioDoc = await transaction.get(socioRef);

        if (!socioDoc.exists()) {
          throw new Error('Socio no encontrado en el sistema');
        }

        const socioData = socioDoc.data() as Partial<SocioValidationData>;
        
        if (!socioData.estado) {
          throw new Error('Datos de socio inválidos: estado no definido');
        }
        // VALIDACIÓN ESTRICTA DE SOCIO ACTIVO - NUEVA FUNCIÓN
        await this.validateActiveSocio(socioData as SocioValidationData);

        // 2. Enhanced comercio validation
        const comercioRef = doc(db, this.comerciosCollection, request.comercioId);
        const comercioDoc = await transaction.get(comercioRef);

        if (!comercioDoc.exists()) {
          throw new Error('Comercio no encontrado o no disponible');
        }

        const comercioData = comercioDoc.data();

        if (comercioData.estado !== 'activo') {
          throw new Error(`Este comercio está ${comercioData.estado} y no puede procesar validaciones`);
        }

        // Check business hours if available
        if (comercioData.horarios) {
          const now = new Date();
          const currentDay = now.getDay();
          
          // Simple business hours check (can be enhanced)
          if (comercioData.horarios.cerrado && comercioData.horarios.cerrado.includes(currentDay)) {
            throw new Error('El comercio está cerrado en este momento');
          }
        }

        // 3. Enhanced benefit validation
        let beneficiosQuery;
        const socioAsociacionId = socioData.asociacionId;

        if (socioAsociacionId) {
          // Check association link
          if (!comercioData.asociacionesVinculadas?.includes(socioAsociacionId)) {
            // Check for direct benefits
            beneficiosQuery = query(
              collection(db, this.beneficiosCollection),
              where('comercioId', '==', request.comercioId),
              where('estado', '==', 'activo'),
              where('tipoAcceso', 'in', ['publico', 'directo'])
            );
          } else {
            // Association benefits
            beneficiosQuery = query(
              collection(db, this.beneficiosCollection),
              where('comercioId', '==', request.comercioId),
              where('estado', '==', 'activo'),
              where('asociacionesDisponibles', 'array-contains', socioAsociacionId)
            );
          }
        } else {
          // Independent socio - only public/direct benefits
          beneficiosQuery = query(
            collection(db, this.beneficiosCollection),
            where('comercioId', '==', request.comercioId),
            where('estado', '==', 'activo'),
            where('tipoAcceso', 'in', ['publico', 'directo'])
          );
        }

        const beneficiosSnapshot = await getDocs(beneficiosQuery);
        
        if (beneficiosSnapshot.empty) {
          const errorMsg = socioAsociacionId 
            ? 'No hay beneficios disponibles para tu asociación en este comercio'
            : 'No hay beneficios públicos disponibles en este comercio';
          throw new Error(errorMsg);
        }

        // 4. Select and validate specific benefit
        let selectedBeneficio: {
          id: string;
          titulo: string;
          descripcion: string;
          descuento: number;
          tipo: string;
          condiciones?: string;
          fechaInicio?: Timestamp | Date | string;
          fechaFin?: Timestamp | Date | string;
          limiteTotal?: number;
          usosActuales?: number;
          limitePorSocio?: number;
          limiteDiario?: number;
          tipoAcceso?: string;
          asociacionesDisponibles?: string[];
          montoBase?: number;
        };
        
        if (request.beneficioId) {
          const beneficioDoc = beneficiosSnapshot.docs.find(doc => doc.id === request.beneficioId);
          if (!beneficioDoc) {
            throw new Error('El beneficio solicitado no está disponible para ti');
          }
          const beneficioData = beneficioDoc.data();
          selectedBeneficio = {
            id: beneficioDoc.id,
            titulo: beneficioData.titulo ?? '',
            descripcion: beneficioData.descripcion ?? '',
            descuento: beneficioData.descuento ?? 0,
            tipo: beneficioData.tipo ?? '',
            condiciones: beneficioData.condiciones,
            fechaInicio: beneficioData.fechaInicio,
            fechaFin: beneficioData.fechaFin,
            limiteTotal: beneficioData.limiteTotal,
            usosActuales: beneficioData.usosActuales,
            limitePorSocio: beneficioData.limitePorSocio,
            limiteDiario: beneficioData.limiteDiario,
            tipoAcceso: beneficioData.tipoAcceso,
            asociacionesDisponibles: beneficioData.asociacionesDisponibles,
            montoBase: beneficioData.montoBase,
          };
        } else {
          // Use first available benefit
          const firstBeneficio = beneficiosSnapshot.docs[0];
          const beneficioData = firstBeneficio.data();
          selectedBeneficio = {
            id: firstBeneficio.id,
            titulo: beneficioData.titulo ?? '',
            descripcion: beneficioData.descripcion ?? '',
            descuento: beneficioData.descuento ?? 0,
            tipo: beneficioData.tipo ?? '',
            condiciones: beneficioData.condiciones,
            fechaInicio: beneficioData.fechaInicio,
            fechaFin: beneficioData.fechaFin,
            limiteTotal: beneficioData.limiteTotal,
            usosActuales: beneficioData.usosActuales,
            limitePorSocio: beneficioData.limitePorSocio,
            limiteDiario: beneficioData.limiteDiario,
            tipoAcceso: beneficioData.tipoAcceso,
            asociacionesDisponibles: beneficioData.asociacionesDisponibles,
            montoBase: beneficioData.montoBase,
          };
        }

        // 5. Enhanced benefit validation
        const now = new Date();
        const beneficioData = selectedBeneficio;

        // Date validation with proper handling
        if (beneficioData.fechaInicio) {
          const fechaInicio = beneficioData.fechaInicio instanceof Timestamp 
            ? beneficioData.fechaInicio.toDate() 
            : new Date(beneficioData.fechaInicio);
          if (fechaInicio > now) {
            throw new Error(`Este beneficio estará disponible desde el ${fechaInicio.toLocaleDateString('es-AR')}`);
          }
        }

        if (beneficioData.fechaFin) {
          const fechaFin = beneficioData.fechaFin instanceof Timestamp 
            ? beneficioData.fechaFin.toDate() 
            : new Date(beneficioData.fechaFin);
          if (fechaFin < now) {
            throw new Error(`Este beneficio expiró el ${fechaFin.toLocaleDateString('es-AR')}`);
          }
        }

        // Usage limits validation
        if (beneficioData.limiteTotal && (beneficioData.usosActuales || 0) >= beneficioData.limiteTotal) {
          throw new Error('Este beneficio ha alcanzado su límite máximo de usos');
        }

        // Per-socio usage validation
        if (beneficioData.limitePorSocio) {
          const socioUsageQuery = query(
            collection(db, this.collection),
            where('socioId', '==', request.socioId),
            where('beneficioId', '==', selectedBeneficio.id),
            where('estado', '==', 'exitosa')
          );

          const socioUsageSnapshot = await getDocs(socioUsageQuery);
          
          if (socioUsageSnapshot.size >= beneficioData.limitePorSocio) {
            throw new Error(`Ya has usado este beneficio ${beneficioData.limitePorSocio} ${beneficioData.limitePorSocio === 1 ? 'vez' : 'veces'} (límite alcanzado)`);
          }
        }

        // Daily usage limit check
        if (beneficioData.limiteDiario) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const dailyUsageQuery = query(
            collection(db, this.collection),
            where('socioId', '==', request.socioId),
            where('beneficioId', '==', selectedBeneficio.id),
            where('fechaValidacion', '>=', today),
            where('fechaValidacion', '<', tomorrow),
            where('estado', '==', 'exitosa')
          );

          const dailyUsageSnapshot = await getDocs(dailyUsageQuery);
          
          if (dailyUsageSnapshot.size >= beneficioData.limiteDiario) {
            throw new Error(`Ya has usado este beneficio ${beneficioData.limiteDiario} ${beneficioData.limiteDiario === 1 ? 'vez' : 'veces'} hoy (límite diario alcanzado)`);
          }
        }

        // 6. Create enhanced validation record
        const validacionId = doc(collection(db, this.collection)).id;
        const codigoValidacion = this.generateValidationCode();
        const montoDescuento = this.calculateDiscountAmount(beneficioData);
        
        // FIXED: Add null checks and fallback values for socio data
        const validacionData = {
          // Basic info - with null checks and fallbacks
          socioId: request.socioId,
          socioNombre: socioData.nombre || 'Socio sin nombre',
          socioNumero: socioData.numeroSocio || 'SIN-NUMERO', // FIXED: Fallback value
          socioEmail: socioData.email || '',
          socioEstado: socioData.estado, // NUEVO: Guardar estado del socio en la validación
          socioEstadoMembresia: socioData.estadoMembresia || 'independiente', // NUEVO: Guardar estado de membresía
          
          // Association info
          asociacionId: socioAsociacionId || null,
          asociacionNombre: socioData.asociacionNombre || null,
          
          // Commerce info
          comercioId: request.comercioId,
          comercioNombre: comercioData.nombreComercio || 'Comercio sin nombre',
          comercioCategoria: comercioData.categoria || '',
          comercioDireccion: comercioData.direccion || '',
          
          // Benefit info
          beneficioId: selectedBeneficio.id,
          beneficioTitulo: beneficioData.titulo,
          beneficioDescripcion: beneficioData.descripcion,
          descuento: beneficioData.descuento,
          tipoDescuento: beneficioData.tipo,
          tipoAcceso: beneficioData.tipoAcceso || (socioAsociacionId ? 'asociacion' : 'directo'),
          
          // Validation details
          montoDescuento,
          fechaValidacion: serverTimestamp(),
          estado: 'exitosa',
          codigoValidacion,
          
          // Metadata
          metadata: {
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
            timestamp: Date.now(),
            version: '2.2', // Incrementar versión por el fix de socioNumero
            validacionesAdicionales: {
              socioActivo: true,
              membresiaValida: socioAsociacionId ? true : 'no_aplica',
              fechaVencimientoChecked: socioData.fechaVencimiento ? true : false,
              socioNumeroFallback: !socioData.numeroSocio // Track if we used fallback
            }
          },
          
          // Timestamps
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        };

        // Save validation
        transaction.set(doc(db, this.collection, validacionId), validacionData);

        // Update counters
        transaction.update(doc(db, this.beneficiosCollection, selectedBeneficio.id), {
          usosActuales: (beneficioData.usosActuales || 0) + 1,
          ultimoUso: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });

        transaction.update(socioRef, {
          beneficiosUsados: (socioData.beneficiosUsados || 0) + 1,
          ultimaValidacion: serverTimestamp(),
          ahorroTotal: (socioData.ahorroTotal || 0) + montoDescuento,
          ultimaActividad: serverTimestamp(), // NUEVO: Registrar última actividad
          actualizadoEn: serverTimestamp(),
        });

        // CORREGIDO: Actualizar métricas del comercio correctamente
        transaction.update(comercioRef, {
          validacionesRealizadas: (comercioData.validacionesRealizadas || 0) + 1,
          clientesAtendidos: (comercioData.clientesAtendidos || 0) + 1,
          // CORREGIDO: Usar ingresosMensuales en lugar de ingresosPorBeneficios para consistencia
          ingresosMensuales: (comercioData.ingresosMensuales || 0) + montoDescuento,
          ultimaValidacion: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });

        return {
          validacionId,
          codigoValidacion,
          socioData,
          comercioData,
          beneficioData: selectedBeneficio,
          montoDescuento,
        };
      });

      console.log('✅ Enhanced validation successful:', result.validacionId);

      return {
        success: true,
        message: '¡Beneficio validado exitosamente!',
        data: {
          comercio: {
            id: request.comercioId,
            nombre: result.comercioData.nombreComercio,
            categoria: result.comercioData.categoria,
            direccion: result.comercioData.direccion,
            logo: result.comercioData.logo,
          },
          beneficio: {
            id: result.beneficioData.id,
            titulo: result.beneficioData.titulo,
            descripcion: result.beneficioData.descripcion,
            descuento: result.beneficioData.descuento,
            tipo: result.beneficioData.tipo,
            condiciones: result.beneficioData.condiciones,
          },
          socio: {
            id: request.socioId,
            nombre: result.socioData.nombre ?? 'Socio sin nombre',
            numeroSocio: result.socioData.numeroSocio ?? 'SIN-NUMERO', // FIXED: Fallback value
            estadoMembresia: result.socioData.estadoMembresia || 'independiente',
          },
          validacion: {
            id: result.validacionId,
            fechaValidacion: new Date(),
            montoDescuento: result.montoDescuento,
            codigoValidacion: result.codigoValidacion,
          },
        },
      };

    } catch (error) {
      console.error('❌ Enhanced validation failed:', error);
      
      // Record failed validation attempt with more details
      try {
        await this.recordFailedValidation(request, error);
      } catch (recordError) {
        console.error('Failed to record validation attempt:', recordError);
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante la validación';
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Enhanced history retrieval with better data transformation
   */
  async getHistorialValidaciones(
    socioId: string,
    maxResults: number = 50,
    lastDoc?: import('firebase/firestore').DocumentSnapshot
  ): Promise<{ validaciones: HistorialValidacion[]; hasMore: boolean; lastDoc: import('firebase/firestore').DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, this.collection),
        where('socioId', '==', socioId),
        orderBy('fechaValidacion', 'desc'),
        limit(maxResults + 1)
      );

      if (lastDoc) {
        // Add startAfter for pagination
        q = query(q, limit(maxResults + 1));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > maxResults;

      if (hasMore) {
        docs.pop(); // Remove extra document
      }

      const validaciones = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          comercioId: data.comercioId,
          comercioNombre: data.comercioNombre,
          comercioLogo: data.comercioLogo,
          beneficioId: data.beneficioId,
          beneficioTitulo: data.beneficioTitulo,
          beneficioDescripcion: data.beneficioDescripcion,
          descuento: data.descuento,
          tipoDescuento: data.tipoDescuento,
          fechaValidacion: data.fechaValidacion?.toDate() || new Date(),
          montoDescuento: data.montoDescuento || 0,
          estado: data.estado || 'exitosa',
          codigoValidacion: data.codigoValidacion,
          metodoPago: data.metodoPago,
          notas: data.notas,
        } as HistorialValidacion;
      });

      return {
        validaciones,
        hasMore,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      };
    } catch (error) {
      console.error('Error getting validation history:', error);
      handleError(error, 'Get Historial Validaciones');
      return { validaciones: [], hasMore: false, lastDoc: null };
    }
  }

  /**
   * Enhanced QR parsing with better format support
   */
  parseQRData(qrData: string): { comercioId: string; beneficioId?: string } | null {
    try {
      console.log('🔍 Parsing QR data:', qrData);

      // Handle URL format with better parsing
      if (qrData.includes('validar-beneficio') || qrData.includes('/validar')) {
        const url = new URL(qrData.startsWith('http') ? qrData : `https://fidelya.com${qrData}`);
        const comercioId = url.searchParams.get('comercio') || url.searchParams.get('c');
        const beneficioId = url.searchParams.get('beneficio') || url.searchParams.get('b');

        if (!comercioId) {
          console.warn('❌ No comercio ID found in URL');
          return null;
        }

        console.log('✅ URL parsed successfully:', { comercioId, beneficioId });
        return {
          comercioId,
          beneficioId: beneficioId || undefined,
        };
      }

      // Handle JSON format with validation
      if (qrData.startsWith('{') && qrData.endsWith('}')) {
        const data = JSON.parse(qrData);
        
        if (!data.comercioId && !data.c) {
          console.warn('❌ No comercio ID found in JSON');
          return null;
        }

        const result = {
          comercioId: data.comercioId || data.c,
          beneficioId: data.beneficioId || data.b,
        };

        console.log('✅ JSON parsed successfully:', result);
        return result;
      }

      // Handle base64 encoded data
      if (qrData.match(/^[A-Za-z0-9+/]+=*$/)) {
        try {
          const decoded = atob(qrData);
          return this.parseQRData(decoded);
        } catch {
          console.warn('❌ Failed to decode base64 QR data');
        }
      }

      // Handle simple comercio ID (legacy format)
      if (qrData.length > 10 && qrData.length < 50 && !qrData.includes(' ')) {
        console.log('✅ Simple comercio ID detected:', qrData);
        return {
          comercioId: qrData,
        };
      }

      // Handle custom Fidelya format: FIDELYA:comercio:beneficio
      if (qrData.startsWith('FIDELYA:')) {
        const parts = qrData.split(':');
        if (parts.length >= 2) {
          const result = {
            comercioId: parts[1],
            beneficioId: parts.length > 2 ? parts[2] : undefined,
          };
          console.log('✅ Fidelya format parsed successfully:', result);
          return result;
        }
      }

      console.warn('❌ QR format not recognized:', qrData.substring(0, 50));
      return null;
    } catch (error) {
      console.error('❌ Error parsing QR data:', error);
      return null;
    }
  }

  /**
   * Enhanced statistics calculation
   */
  async getEstadisticasSocio(socioId: string): Promise<{
    totalValidaciones: number;
    ahorroTotal: number;
    beneficiosMasUsados: Array<{ titulo: string; usos: number; ahorro: number }>;
    comerciosFavoritos: Array<{ nombre: string; visitas: number; ultimaVisita: Date }>;
    validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
    rachaActual: number;
    mejorRacha: number;
    promedioAhorro: number;
    tendenciaAhorro: 'up' | 'down' | 'stable';
  }> {
    try {
      const q = query(
        collection(db, this.collection),
        where('socioId', '==', socioId),
        orderBy('fechaValidacion', 'desc')
      );

      const snapshot = await getDocs(q);
      const validaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaValidacion: doc.data().fechaValidacion?.toDate() || new Date(),
        estado: doc.data().estado, // Ensure 'estado' is present
        montoDescuento: doc.data().montoDescuento, // Ensure 'montoDescuento' is present
        beneficioId: doc.data().beneficioId, // Ensure 'beneficioId' is present
        beneficioTitulo: doc.data().beneficioTitulo, // Add beneficioTitulo if present
        comercioId: doc.data().comercioId, // Ensure 'comercioId' is present
        comercioNombre: doc.data().comercioNombre // Optionally add comercioNombre if used later
      }));

      const validacionesExitosas = validaciones.filter(v => v.estado === 'exitosa');
      const totalValidaciones = validacionesExitosas.length;
      const ahorroTotal = validacionesExitosas.reduce((total, v) => total + (v.montoDescuento || 0), 0);

      // Calculate streaks
      const { rachaActual, mejorRacha } = this.calculateStreaks(validacionesExitosas);

      // Beneficios más usados
      const beneficiosCount: { [key: string]: { titulo: string; usos: number; ahorro: number } } = {};
      validacionesExitosas.forEach(v => {
        const key = v.beneficioId;
        if (beneficiosCount[key]) {
          beneficiosCount[key].usos++;
          beneficiosCount[key].ahorro += v.montoDescuento || 0;
        } else {
          beneficiosCount[key] = {
            titulo: v.beneficioTitulo || 'Beneficio',
            usos: 1,
            ahorro: v.montoDescuento || 0
          };
        }
      });

      const beneficiosMasUsados = Object.values(beneficiosCount)
        .sort((a, b) => b.usos - a.usos)
        .slice(0, 5);

      // Comercios favoritos
      const comerciosCount: { [key: string]: { nombre: string; visitas: number; ultimaVisita: Date } } = {};
      validacionesExitosas.forEach(v => {
        const key = v.comercioId;
        if (comerciosCount[key]) {
          comerciosCount[key].visitas++;
          if (v.fechaValidacion > comerciosCount[key].ultimaVisita) {
            comerciosCount[key].ultimaVisita = v.fechaValidacion;
          }
        } else {
          comerciosCount[key] = { 
            nombre: v.comercioNombre || 'Comercio', 
            visitas: 1,
            ultimaVisita: v.fechaValidacion
          };
        }
      });

      const comerciosFavoritos = Object.values(comerciosCount)
        .sort((a, b) => b.visitas - a.visitas)
        .slice(0, 5);

      // Validaciones por mes (últimos 12 meses)
      const validacionesPorMes = this.processValidacionesPorMes(validacionesExitosas, 12);

      // Calculate trends
      const promedioAhorro = totalValidaciones > 0 ? ahorroTotal / totalValidaciones : 0;
      const tendenciaAhorro = this.calculateSavingsTrend(validacionesPorMes);

      return {
        totalValidaciones,
        ahorroTotal,
        beneficiosMasUsados,
        comerciosFavoritos,
        validacionesPorMes,
        rachaActual,
        mejorRacha,
        promedioAhorro,
        tendenciaAhorro,
      };
    } catch (error) {
      console.error('Error getting socio statistics:', error);
      handleError(error, 'Get Estadisticas Socio');
      return {
        totalValidaciones: 0,
        ahorroTotal: 0,
        beneficiosMasUsados: [],
        comerciosFavoritos: [],
        validacionesPorMes: [],
        rachaActual: 0,
        mejorRacha: 0,
        promedioAhorro: 0,
        tendenciaAhorro: 'stable',
      };
    }
  }

  /**
   * Private helper methods
   */
  private generateValidationCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `FID-${timestamp}-${random}`;
  }

  private calculateDiscountAmount(beneficio: {
    tipo: string;
    descuento: number;
    montoBase?: number;
  }): number {
    switch (beneficio.tipo) {
      case 'porcentaje':
        // For percentage discounts, return the percentage value
        // The actual amount would be calculated at point of sale
        return beneficio.montoBase ? (beneficio.montoBase * beneficio.descuento / 100) : beneficio.descuento;
      case 'monto_fijo':
        return beneficio.descuento;
      case 'producto_gratis':
        return beneficio.montoBase || 0;
      case '2x1':
        return beneficio.montoBase ? beneficio.montoBase / 2 : 0;
      default:
        return beneficio.descuento || 0;
    }
  }

  private async recordFailedValidation(request: ValidacionRequest, error: unknown): Promise<void> {
    try {
      const validacionId = doc(collection(db, this.collection)).id;
      
      const failedValidationData = {
        socioId: request.socioId,
        comercioId: request.comercioId,
        beneficioId: request.beneficioId || null,
        asociacionId: request.asociacionId || null,
        fechaValidacion: serverTimestamp(),
        estado: 'fallida',
        error: error instanceof Error ? error.message : 'Error desconocido',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        metadata: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          timestamp: Date.now(),
          requestData: JSON.stringify(request)
        },
        creadoEn: serverTimestamp(),
      };

      await setDoc(doc(db, this.collection, validacionId), failedValidationData);
      console.log('📝 Failed validation recorded:', validacionId);
    } catch (recordError) {
      console.error('Failed to record failed validation:', recordError);
    }
  }

  private calculateStreaks(validaciones: Array<{ fechaValidacion: Date }>): { rachaActual: number; mejorRacha: number } {
    if (validaciones.length === 0) return { rachaActual: 0, mejorRacha: 0 };

    const sortedValidaciones = validaciones.sort((a, b) => b.fechaValidacion.getTime() - a.fechaValidacion.getTime());
    
    let rachaActual = 0;
    let mejorRacha = 0;
    
    const today = new Date();
    const dates = new Set<string>();
    
    // Get unique dates
    sortedValidaciones.forEach(v => {
      const dateStr = v.fechaValidacion.toDateString();
      dates.add(dateStr);
    });
    
    const uniqueDates = Array.from(dates).sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
    
    // Calculate current streak (consecutive days up to today)
    let currentDateRef = new Date(today);
    for (const dateStr of uniqueDates) {
      const validationDate = new Date(dateStr);
      const diffDays = Math.floor((currentDateRef.getTime() - validationDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        rachaActual++;
        currentDateRef = validationDate;
      } else {
        break;
      }
    }
    
    // Calculate best streak
    let tempStreak = 1;
    if (uniqueDates.length === 1) {
      mejorRacha = 1;
    } else {
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const nextDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          mejorRacha = Math.max(mejorRacha, tempStreak);
          tempStreak = 1;
        }
      }
      mejorRacha = Math.max(mejorRacha, tempStreak);
    }

    return { rachaActual, mejorRacha };
  }

  private processValidacionesPorMes(
    validaciones: Array<{
      fechaValidacion: Date;
      montoDescuento?: number;
    }>,
    months: number = 6
  ): Array<{ mes: string; validaciones: number; ahorro: number }> {
    const now = new Date();
    const meses: { [key: string]: { validaciones: number; ahorro: number } } = {};

    // Initialize months
    for (let i = months - 1; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fecha.toISOString().substr(0, 7); // YYYY-MM format
      meses[key] = { validaciones: 0, ahorro: 0 };
    }

    // Process validaciones
    validaciones.forEach(v => {
      const key = v.fechaValidacion.toISOString().substr(0, 7);
      if (meses[key]) {
        meses[key].validaciones++;
        meses[key].ahorro += v.montoDescuento || 0;
      }
    });

    return Object.entries(meses).map(([mes, data]) => ({
      mes: new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      ...data,
    }));
  }

  private calculateSavingsTrend(validacionesPorMes: Array<{ mes: string; ahorro: number }>): 'up' | 'down' | 'stable' {
    if (validacionesPorMes.length < 2) return 'stable';

    const recent = validacionesPorMes.slice(-3);
    const older = validacionesPorMes.slice(-6, -3);

    const recentAvg = recent.reduce((sum, m) => sum + m.ahorro, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, m) => sum + m.ahorro, 0) / older.length : recentAvg;

    if (olderAvg === 0) return 'stable';
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  }
}

// Export singleton instance
export const validacionesService = new ValidacionesService();
export default validacionesService;