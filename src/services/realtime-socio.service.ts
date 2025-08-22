'use client';

import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { SocioActivity } from '@/types/socio';

interface RealtimeValidacionEvent {
  id: string;
  socioId: string;
  comercioId: string;
  comercioNombre: string;
  beneficioId?: string;
  beneficioTitulo: string;
  montoDescuento: number;
  fechaValidacion: Timestamp;
  tipo: 'nueva_validacion' | 'validacion_actualizada';
}

interface RealtimeSocioProfile {
  id: string;
  // Add other fields as needed, for example:
  // nombre: string;
  // email: string;
  // telefono: string;
  // etc.
  [key: string]: unknown;
}

interface RealtimeSocioServiceConfig {
  enableNotifications?: boolean;
  enableToasts?: boolean;
  maxValidaciones?: number;
}

class RealtimeSocioService {
  private listeners: Map<string, () => void> = new Map();
  private config: RealtimeSocioServiceConfig;

  constructor(config: RealtimeSocioServiceConfig = {}) {
    this.config = {
      enableNotifications: true,
      enableToasts: true,
      maxValidaciones: 50,
      ...config
    };
  }

  /**
   * Subscribe to real-time validaciones for a socio
   */
  subscribeToValidaciones(
    socioId: string,
    onUpdate: (validaciones: RealtimeValidacionEvent[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `validaciones_${socioId}`;
    
    // Clean up existing listener
    this.unsubscribe(listenerId);

    const validacionesRef = collection(db, 'validaciones');
    const validacionesQuery = query(
      validacionesRef,
      where('socioId', '==', socioId),
      where('estado', '==', 'exitosa'),
      orderBy('fechaValidacion', 'desc'),
      limit(this.config.maxValidaciones || 50)
    );

    let isFirstLoad = true;
    let previousCount = 0;

    const unsubscribe = onSnapshot(
      validacionesQuery,
      {
        includeMetadataChanges: true
      },
      (snapshot: QuerySnapshot) => {
        try {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          const validaciones = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              socioId: data.socioId,
              comercioId: data.comercioId,
              comercioNombre: data.comercioNombre,
              beneficioId: data.beneficioId,
              beneficioTitulo: data.beneficioTitulo,
              montoDescuento: data.montoDescuento,
              fechaValidacion: data.fechaValidacion,
              tipo: data.tipo ?? 'nueva_validacion',
            } as RealtimeValidacionEvent;
          });

          // Check for new validaciones and show notifications
          if (source === 'server' && !isFirstLoad && this.config.enableNotifications) {
            const currentCount = validaciones.length;
            
            if (currentCount > previousCount) {
              const newValidaciones = validaciones.slice(0, currentCount - previousCount);
              this.handleNewValidaciones(newValidaciones);
            }
            
            previousCount = currentCount;
          }

          if (isFirstLoad) {
            previousCount = validaciones.length;
            isFirstLoad = false;
          }

          onUpdate(validaciones);
        } catch (error) {
          console.error('Error processing validaciones snapshot:', error);
          onError?.(new Error('Error al procesar datos de validaciones'));
        }
      },
      (error) => {
        console.error('Validaciones listener error:', error);
        onError?.(new Error('Error de conexión con validaciones'));
        
        if (this.config.enableToasts) {
          toast.error('Error de conexión con validaciones');
        }
      }
    );

    this.listeners.set(listenerId, unsubscribe);
    return () => this.unsubscribe(listenerId);
  }

  /**
   * Subscribe to real-time socio profile changes
   */
  subscribeToSocioProfile(
    socioId: string,
    onUpdate: (socio: RealtimeSocioProfile) => void,
    onError?: (error: Error) => void
  ): () => void {
    const listenerId = `socio_${socioId}`;
    
    // Clean up existing listener
    this.unsubscribe(listenerId);

    const socioRef = doc(db, 'socios', socioId);

    const unsubscribe = onSnapshot(
      socioRef,
      {
        includeMetadataChanges: true
      },
      (snapshot: DocumentSnapshot) => {
        try {
          if (snapshot.exists()) {
            const socioData = {
              id: snapshot.id,
              ...snapshot.data()
            };
            
            onUpdate(socioData);
          } else {
            onError?.(new Error('Perfil de socio no encontrado'));
          }
        } catch (error) {
          console.error('Error processing socio snapshot:', error);
          onError?.(new Error('Error al procesar datos del perfil'));
        }
      },
      (error) => {
        console.error('Socio profile listener error:', error);
        onError?.(new Error('Error de conexión con el perfil'));
        
        if (this.config.enableToasts) {
          toast.error('Error de conexión con el perfil');
        }
      }
    );

    this.listeners.set(listenerId, unsubscribe);
    return () => this.unsubscribe(listenerId);
  }

  /**
   * Subscribe to real-time activity feed
   */
  subscribeToActivityFeed(
    socioId: string,
    onUpdate: (activities: SocioActivity[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    // For now, we'll use validaciones as activity feed
    // In the future, this could be expanded to include other activities
    return this.subscribeToValidaciones(
      socioId,
      (validaciones) => {
        const activities: SocioActivity[] = validaciones.slice(0, 10).map(validacion => ({
          id: validacion.id,
          tipo: 'beneficio' as const,
          titulo: 'Beneficio utilizado',
          descripcion: `${validacion.beneficioTitulo} en ${validacion.comercioNombre}`,
          fecha: validacion.fechaValidacion,
          metadata: {
            comercioId: validacion.comercioId,
            comercioNombre: validacion.comercioNombre,
            beneficioId: validacion.beneficioId,
            beneficioNombre: validacion.beneficioTitulo,
            montoDescuento: validacion.montoDescuento
          }
        }));
        
        onUpdate(activities);
      },
      onError
    );
  }

  /**
   * Handle new validaciones notifications
   */
  private handleNewValidaciones(newValidaciones: RealtimeValidacionEvent[]): void {
    if (!this.config.enableToasts) return;

    newValidaciones.forEach(validacion => {
      const message = `¡Beneficio utilizado en ${validacion.comercioNombre}!`;
      const savings = validacion.montoDescuento > 0 
        ? ` Ahorraste $${validacion.montoDescuento.toLocaleString()}`
        : '';

      toast.success(message + savings, {
        icon: '🎉',
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      });
    });
  }

  /**
   * Calculate real-time statistics from validaciones
   */
  calculateRealtimeStats(validaciones: RealtimeValidacionEvent[]): {
    totalValidaciones: number;
    ahorroTotal: number;
    beneficiosEsteMes: number;
    ahorroEsteMes: number;
    comerciosVisitados: number;
    beneficiosMasUsados: Array<{ titulo: string; usos: number }>;
    comerciosFavoritos: Array<{ nombre: string; visitas: number }>;
    validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
  } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter validaciones for current month
    const validacionesEsteMes = validaciones.filter(v => {
      const fecha = (v.fechaValidacion instanceof Timestamp)
        ? v.fechaValidacion.toDate()
        : new Date(v.fechaValidacion as string | number | Date);
      return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
    });

    // Calculate basic stats
    const totalValidaciones = validaciones.length;
    const ahorroTotal = validaciones.reduce((total, v) => total + (v.montoDescuento || 0), 0);
    const beneficiosEsteMes = validacionesEsteMes.length;
    const ahorroEsteMes = validacionesEsteMes.reduce((total, v) => total + (v.montoDescuento || 0), 0);

    // Calculate unique comercios
    const comerciosUnicos = new Set(validaciones.map(v => v.comercioId));
    const comerciosVisitados = comerciosUnicos.size;

    // Calculate most used benefits
    const beneficiosCount: { [key: string]: { titulo: string; usos: number } } = {};
    validaciones.forEach(v => {
      const key = v.beneficioId || 'sin_beneficio';
      if (beneficiosCount[key]) {
        beneficiosCount[key].usos++;
      } else {
        beneficiosCount[key] = { titulo: v.beneficioTitulo, usos: 1 };
      }
    });

    const beneficiosMasUsados = Object.values(beneficiosCount)
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 5);

    // Calculate favorite comercios
    const comerciosCount: { [key: string]: { nombre: string; visitas: number } } = {};
    validaciones.forEach(v => {
      const key = v.comercioId;
      if (comerciosCount[key]) {
        comerciosCount[key].visitas++;
      } else {
        comerciosCount[key] = { nombre: v.comercioNombre, visitas: 1 };
      }
    });

    const comerciosFavoritos = Object.values(comerciosCount)
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);

    // Calculate validaciones por mes (last 6 months)
    const validacionesPorMes = this.calculateValidacionesPorMes(validaciones);

    return {
      totalValidaciones,
      ahorroTotal,
      beneficiosEsteMes,
      ahorroEsteMes,
      comerciosVisitados,
      beneficiosMasUsados,
      comerciosFavoritos,
      validacionesPorMes
    };
  }

  /**
   * Calculate validaciones por mes
   */
  private calculateValidacionesPorMes(validaciones: RealtimeValidacionEvent[]): Array<{ mes: string; validaciones: number; ahorro: number }> {
    const now = new Date();
    const meses: { [key: string]: { validaciones: number; ahorro: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fecha.toISOString().substr(0, 7); // YYYY-MM format
      meses[key] = { validaciones: 0, ahorro: 0 };
    }

    // Process validaciones
    validaciones.forEach(v => {
      const fecha = v.fechaValidacion instanceof Timestamp
        ? v.fechaValidacion.toDate()
        : new Date(v.fechaValidacion as string | number | Date);
      const key = fecha.toISOString().substr(0, 7);
      
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

  /**
   * Unsubscribe from a specific listener
   */
  private unsubscribe(listenerId: string): void {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RealtimeSocioServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const realtimeSocioService = new RealtimeSocioService();
export default realtimeSocioService;