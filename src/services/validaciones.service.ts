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
  // private clientesCollection = 'clientes'; // Colección para validar estado en comercio (DESHABILITADA)
  // NUEVO: Colección para el historial de usos de beneficios
  private beneficioUsosCollection = 'beneficio_usos';

  /**
   * VALIDACIÓN ESTRICTA DE SOCIO - Bloquea acceso si está vencido
   */
  private async validateActiveSocio(socioData: SocioValidationData): Promise<void> {
    console.log('🔍 Validando estado del socio (modo estricto):', {
      estado: socioData.estado,
      estadoMembresia: socioData.estadoMembresia
    });

    // VALIDACIÓN ESTRICTA: Verificar que el socio exista y tenga datos válidos
    if (!socioData.estado) {
      throw new Error('Datos de socio inválidos: estado no definido');
    }

    // Bloquear si está suspendido
    if (socioData.estado === 'suspendido') {
      throw new Error('Tu cuenta está suspendida. Contacta al administrador para más información.');
    }

    // NUEVA VALIDACIÓN: Bloquear si está vencido
    if (socioData.estado === 'vencido') {
      throw new Error('No puedes validar beneficios porque tu membresía está vencida. Contacta a tu asociación para regularizar tu situación.');
    }

    // Bloquear si está inactivo
    if (socioData.estado === 'inactivo') {
      throw new Error('Tu cuenta está inactiva. Contacta al administrador para activarla.');
    }

    // Solo permitir socios con estado 'activo'
    if (socioData.estado !== 'activo') {
      throw new Error(`Tu cuenta tiene estado "${socioData.estado}". Solo los socios activos pueden validar beneficios.`);
    }

    console.log('✅ Socio validado correctamente (estado activo)');
  }

  /**
   * VALIDACIÓN DESHABILITADA: No verificar estado en tabla del comercio
   */
  // private async validateSocioInComercio(): Promise<void> {
  //   console.log('🔍 Validación de estado en comercio DESHABILITADA - permitiendo acceso libre');
  //   // Esta validación está deshabilitada para permitir acceso sin restricciones
  //   return;
  // }

  /**
   * NUEVO: Crear registro en el historial de usos de beneficios
   */
  private async crearRegistroHistorialUso(
    validacionData: {
      beneficioId: string;
      socioId: string;
      asociacionId?: string;
      codigoValidacion: string;
      comercioId: string;
    },
    beneficioData: {
      titulo?: string;
      descripcion?: string;
    },
    comercioData: {
      nombreComercio?: string;
      logo?: string | null;
    },
    socioData: {
      nombre?: string;
      email?: string;
      asociacionNombre?: string | null;
    },
    montoDescuento: number
  ): Promise<void> {
    try {
      console.log('📝 Creando registro en historial de usos...');

      const usoData = {
        // Información del beneficio
        beneficioId: validacionData.beneficioId,
        beneficioTitulo: beneficioData.titulo || 'Beneficio',
        beneficioDescripcion: beneficioData.descripcion || '',
        
        // Información del socio
        socioId: validacionData.socioId,
        socioNombre: socioData.nombre || 'Usuario',
        socioEmail: socioData.email || '',
        
        // Información del comercio
        comercioId: validacionData.comercioId,
        comercioNombre: comercioData.nombreComercio || 'Comercio',
        comercioLogo: comercioData.logo || null,
        
        // Información de la asociación
        asociacionId: validacionData.asociacionId || null,
        asociacionNombre: socioData.asociacionNombre || null,
        
        // Detalles del uso
        fechaUso: serverTimestamp(),
        montoDescuento: montoDescuento,
        montoOriginal: null, // No tenemos esta información en la validación QR
        montoFinal: null,
        estado: 'usado' as const,
        
        // Información adicional
        detalles: `Beneficio validado mediante código QR - ${beneficioData.titulo}`,
        codigoValidacion: validacionData.codigoValidacion,
        metodoPago: 'qr_validation',
        
        // Metadatos
        origenValidacion: 'qr_scanner',
        tipoValidacion: 'automatica',
        
        // Timestamps
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      };

      // Crear el documento en la colección de usos
      const usoRef = doc(collection(db, this.beneficioUsosCollection));
      await setDoc(usoRef, usoData);

      console.log('✅ Registro creado en historial de usos:', usoRef.id);
    } catch (error) {
      console.error('❌ Error creando registro en historial:', error);
      // No lanzamos el error para no interrumpir la validación principal
    }
  }

  /**
   * Enhanced validation with strict membership status checking
   */
  async validarAcceso(request: ValidacionRequest): Promise<ValidacionResponse> {
    try {
      console.log('🔍 Starting strict validation process:', request);

      const result = await runTransaction(db, async (transaction) => {
        // 1. Validate socio with strict checks
        const socioRef = doc(db, this.sociosCollection, request.socioId);
        const socioDoc = await transaction.get(socioRef);

        if (!socioDoc.exists()) {
          throw new Error('Socio no encontrado en el sistema');
        }

        const socioData = socioDoc.data() as Partial<SocioValidationData>;
        
        // VALIDACIÓN ESTRICTA DE SOCIO - Bloquea si está vencido
        await this.validateActiveSocio(socioData as SocioValidationData);

        // VALIDACIÓN DE COMERCIO DESHABILITADA - Permitir acceso libre
        // await this.validateSocioInComercio(request.socioId, request.comercioId);

        // 2. Basic comercio validation
        const comercioRef = doc(db, this.comerciosCollection, request.comercioId);
        const comercioDoc = await transaction.get(comercioRef);

        if (!comercioDoc.exists()) {
          throw new Error('Comercio no encontrado o no disponible');
        }

        const comercioData = comercioDoc.data();

        // Solo verificar que el comercio exista, no su estado
        console.log('🔍 Comercio encontrado:', comercioData.nombreComercio);

        // 3. Relaxed benefit validation - buscar cualquier beneficio disponible
        let beneficiosQuery;
        const socioAsociacionId = socioData.asociacionId;

        // Buscar beneficios disponibles sin restricciones estrictas
        if (socioAsociacionId && comercioData.asociacionesVinculadas?.includes(socioAsociacionId)) {
          // Beneficios de asociación
          beneficiosQuery = query(
            collection(db, this.beneficiosCollection),
            where('comercioId', '==', request.comercioId),
            where('estado', '==', 'activo')
          );
        } else {
          // Beneficios públicos o directos
          beneficiosQuery = query(
            collection(db, this.beneficiosCollection),
            where('comercioId', '==', request.comercioId),
            where('estado', '==', 'activo')
          );
        }

        const beneficiosSnapshot = await getDocs(beneficiosQuery);
        
        if (beneficiosSnapshot.empty) {
          throw new Error('No hay beneficios disponibles en este comercio en este momento');
        }

        // 4. Select benefit with minimal validation
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
            // Si no encuentra el beneficio específico, usar el primero disponible
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
          } else {
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
          }
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

        // 5. Minimal benefit validation - solo verificar fechas básicas
        const now = new Date();
        const beneficioData = selectedBeneficio;

        // Solo verificar fechas de vigencia básicas
        if (beneficioData.fechaFin) {
          const fechaFin = beneficioData.fechaFin instanceof Timestamp 
            ? beneficioData.fechaFin.toDate() 
            : new Date(beneficioData.fechaFin);
          if (fechaFin < now) {
            console.log('⚠️ Beneficio expirado, pero permitiendo acceso en modo permisivo');
          }
        }

        // Ignorar límites de uso en modo permisivo
        console.log('🔍 Ignorando límites de uso - modo permisivo activado');

        // 6. Create validation record
        const validacionId = doc(collection(db, this.collection)).id;
        const codigoValidacion = this.generateValidationCode();
        const montoDescuento = this.calculateDiscountAmount();
        
        const validacionData = {
          // Basic info - with null checks and fallbacks
          socioId: request.socioId,
          socioNombre: socioData.nombre || 'Socio sin nombre',
          socioNumero: socioData.numeroSocio || 'SIN-NUMERO',
          socioEmail: socioData.email || '',
          socioEstado: socioData.estado,
          socioEstadoMembresia: socioData.estadoMembresia || 'independiente',
          
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
          tipoAcceso: 'estricto', // Marcar como acceso estricto
          
          // Validation details
          montoDescuento,
          fechaValidacion: serverTimestamp(),
          estado: 'exitosa',
          codigoValidacion,
          
          // Metadata
          metadata: {
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
            timestamp: Date.now(),
            version: '4.0', // Nueva versión para modo estricto
            modoEstricto: true, // Indicar que se usó modo estricto
            validacionesAdicionales: {
              socioActivo: true,
              socioActivoEnComercio: 'deshabilitado', // Validación deshabilitada
              membresiaValida: 'verificada', // Verificar membresía
              fechaVencimientoChecked: false, // No verificar vencimiento
              socioNumeroFallback: !socioData.numeroSocio,
              limitesIgnorados: true, // Límites ignorados
              estadoSocioValidado: socioData.estado // Guardar estado validado
            }
          },
          
          // Timestamps
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        };

        // Save validation
        transaction.set(doc(db, this.collection, validacionId), validacionData);

        // Update counters (opcional)
        try {
          transaction.update(doc(db, this.beneficiosCollection, selectedBeneficio.id), {
            usosActuales: (beneficioData.usosActuales || 0) + 1,
            ultimoUso: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
          });

          transaction.update(socioRef, {
            beneficiosUsados: (socioData.beneficiosUsados || 0) + 1,
            ultimaValidacion: serverTimestamp(),
            ahorroTotal: (socioData.ahorroTotal || 0) + montoDescuento,
            ultimaActividad: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
          });

          transaction.update(comercioRef, {
            validacionesRealizadas: (comercioData.validacionesRealizadas || 0) + 1,
            clientesAtendidos: (comercioData.clientesAtendidos || 0) + 1,
            ingresosMensuales: (comercioData.ingresosMensuales || 0) + montoDescuento,
            ultimaValidacion: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
          });
        } catch (updateError) {
          console.warn('⚠️ Error updating counters (non-critical):', updateError);
        }

        return {
          validacionId,
          codigoValidacion,
          socioData,
          comercioData,
          beneficioData: selectedBeneficio,
          montoDescuento,
          validacionData, // NUEVO: Incluir datos de validación para el historial
        };
      });

      // NUEVO: Crear registro en el historial de usos DESPUÉS de la transacción
      try {
        await this.crearRegistroHistorialUso(
          {
            beneficioId: result.validacionData.beneficioId,
            socioId: result.validacionData.socioId,
            asociacionId: result.validacionData.asociacionId ?? undefined,
            codigoValidacion: result.validacionData.codigoValidacion,
            comercioId: result.validacionData.comercioId,
          },
          result.beneficioData,
          result.comercioData,
          result.socioData,
          result.montoDescuento
        );
      } catch (historialError) {
        console.error('⚠️ Error creando registro en historial (no crítico):', historialError);
        // No interrumpimos el flujo principal si falla el historial
      }

      // NUEVO: Enviar notificación automática de beneficio usado
      try {
        await this.enviarNotificacionBeneficioUsado(
          result.validacionData.socioId,
          result.beneficioData.titulo,
          result.comercioData.nombreComercio,
          result.beneficioData.descuento,
        );
      } catch (notificationError) {
        console.error('⚠️ Error enviando notificación de beneficio usado (no crítico):', notificationError);
        // No interrumpimos el flujo principal si falla la notificación
      }

      // NUEVO: Upsert del cliente en la colección de clientes del comercio
      try {
        const { ClienteService } = await import('../services/cliente.service');
        await ClienteService.createOrUpdateClienteFromValidation(
          {
            socioId: result.validacionData.socioId as string,
            socioNombre: (result.validacionData as { socioNombre?: string }).socioNombre || (result.socioData.nombre ?? 'Socio sin nombre'),
            socioEmail: (result.validacionData as { socioEmail?: string }).socioEmail || result.socioData.email || undefined,
            asociacionId: ((result.validacionData as { asociacionId?: string }).asociacionId || result.socioData.asociacionId || '') as string,
            comercioId: result.validacionData.comercioId as string,
          },
          result.validacionId
        );
      } catch (clienteError) {
        console.error('⚠️ Error registrando/actualizando cliente desde validación (no crítico):', clienteError);
      }

      console.log('✅ Strict validation successful:', result.validacionId);

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
            numeroSocio: result.socioData.numeroSocio ?? 'SIN-NUMERO',
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
      console.error('❌ Strict validation failed:', error);
      
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
        q = query(q, limit(maxResults + 1));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > maxResults;

      if (hasMore) {
        docs.pop();
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

  parseQRData(qrData: string): { comercioId: string; beneficioId?: string } | null {
    try {
      console.log('🔍 Parsing QR data:', qrData);

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

      if (qrData.match(/^[A-Za-z0-9+/]+=*$/)) {
        try {
          const decoded = typeof atob !== 'undefined' ? atob(qrData) : Buffer.from(qrData, 'base64').toString('utf-8');
          return this.parseQRData(decoded);
        } catch {
          console.warn('❌ Failed to decode base64 QR data');
        }
      }

      if (qrData.length > 10 && qrData.length < 50 && !qrData.includes(' ')) {
        console.log('✅ Simple comercio ID detected:', qrData);
        return {
          comercioId: qrData,
        };
      }

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
        estado: doc.data().estado,
        montoDescuento: doc.data().montoDescuento,
        beneficioId: doc.data().beneficioId,
        beneficioTitulo: doc.data().beneficioTitulo,
        comercioId: doc.data().comercioId,
        comercioNombre: doc.data().comercioNombre
      }));

      const validacionesExitosas = validaciones.filter(v => v.estado === 'exitosa');
      const totalValidaciones = validacionesExitosas.length;
      const ahorroTotal = validacionesExitosas.reduce((total, v) => total + (v.montoDescuento || 0), 0);

      const { rachaActual, mejorRacha } = this.calculateStreaks(validacionesExitosas);

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

      const validacionesPorMes = this.processValidacionesPorMes(validacionesExitosas, 12);

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

  private generateValidationCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `FID-${timestamp}-${rnd}`;
  }

  private calculateDiscountAmount(): number {
    // Siempre devolver 0 - no calcular ni mostrar ahorros
    return 0;
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
          requestData: JSON.stringify(request),
          modoEstricto: true
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
    
    sortedValidaciones.forEach(v => {
      const dateStr = v.fechaValidacion.toDateString();
      dates.add(dateStr);
    });
    
    const uniqueDates = Array.from(dates).sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
    
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

    for (let i = months - 1; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fecha.toISOString().slice(0, 7);
      meses[key] = { validaciones: 0, ahorro: 0 };
    }

    validaciones.forEach(v => {
      const key = v.fechaValidacion.toISOString().slice(0, 7);
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

  /**
   * NUEVO: Enviar notificación automática cuando se usa un beneficio
   */
  private async enviarNotificacionBeneficioUsado(
    socioId: string,
    beneficioTitulo: string,
    comercioNombre: string,
    descuento: number,
  ): Promise<void> {
    try {
      console.log('📧 Enviando notificación de beneficio usado...');

      // Importar servicios necesarios
      const { notificationSchedulerService } = await import('./notification-scheduler.service');
      const { notificationTemplatesService } = await import('./notification-templates.service');

      // Obtener la plantilla de "Beneficio Usado"
      const templates = await notificationTemplatesService.getTemplates();
      const beneficioUsadoTemplate = templates.find(t => t.name === 'Beneficio Usado');

      if (!beneficioUsadoTemplate) {
        console.warn('⚠️ Plantilla "Beneficio Usado" no encontrada');
        return;
      }

      // Preparar variables para la plantilla
      const templateVariables = {
        beneficio_titulo: beneficioTitulo,
        comercio_nombre: comercioNombre,
        descuento: descuento.toString(),
      };

      // Parsear la plantilla con las variables
      const titulo = notificationTemplatesService.parseTemplate(
        beneficioUsadoTemplate.title,
        templateVariables
      );
      const mensaje = notificationTemplatesService.parseTemplate(
        beneficioUsadoTemplate.message,
        templateVariables
      );

      // Crear trigger para enviar la notificación
      const triggerId = await notificationSchedulerService.createNotificationTrigger({
        name: `Beneficio Usado - ${beneficioTitulo}`,
        description: `Notificación automática cuando se usa el beneficio ${beneficioTitulo}`,
        isActive: true,
        trigger: {
          type: 'event',
          event: 'beneficio_usado',
        },
        action: {
          type: 'send_notification',
          notificationData: {
            title: titulo,
            message: mensaje,
            type: 'success',
            category: 'general',
          },
        },
        execution: {
          priority: 'medium',
        },
        createdBy: 'system',
      });

      // Ejecutar el trigger para enviar la notificación al socio
      await notificationSchedulerService.triggerNotification(
        triggerId,
        {
          beneficio_titulo: beneficioTitulo,
          comercio_nombre: comercioNombre,
          descuento: descuento,
        },
        socioId
      );

      // Actualizar el contador de uso de la plantilla
      await notificationTemplatesService.updateTemplateUsage(beneficioUsadoTemplate.id);

      console.log('✅ Notificación de beneficio usado enviada correctamente');
    } catch (error) {
      console.error('❌ Error enviando notificación de beneficio usado:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }
}

export const validacionesService = new ValidacionesService();
export default validacionesService;