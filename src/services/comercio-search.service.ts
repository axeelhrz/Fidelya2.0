import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface ComercioSearchResult {
  id: string;
  nombreComercio: string;
  nombre: string;
  email: string;
  categoria: string;
  direccion?: string;
  telefono?: string;
  logoUrl?: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  asociacionesVinculadas: string[];
  creadoEn: Timestamp;
  verificado: boolean;
  puntuacion: number;
  totalReviews: number;
  beneficiosActivos?: number;
  validacionesTotales?: number;
}

export interface SearchFilters {
  categoria?: string;
  estado?: string;
  minPuntuacion?: number;
  soloDisponibles?: boolean;
  asociacionId?: string;
}

export interface SearchOptions {
  limit?: number;
  sortBy?: 'nombre' | 'puntuacion' | 'reviews' | 'fecha';
  sortDirection?: 'asc' | 'desc';
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

class ComercioSearchService {
  private readonly collection = COLLECTIONS.COMERCIOS;
  private cache = new Map<string, { data: ComercioSearchResult[]; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Búsqueda optimizada de comercios con filtros y paginación
   */
  async searchComercios(
    searchTerm: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<{
    comercios: ComercioSearchResult[];
    hasMore: boolean;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
  }> {
    try {
      const {
        limit: searchLimit = 20,
        sortBy = 'nombre',
        sortDirection = 'asc',
        lastDoc
      } = options;

      // Crear cache key
      const cacheKey = this.createCacheKey(searchTerm, filters, options);
      
      // Verificar cache
      if (!lastDoc && this.isCacheValid(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        return {
          comercios: cached.data,
          hasMore: cached.data.length === searchLimit
        };
      }

      // Construir query base
      const baseQuery = collection(db, this.collection);
      const queryConstraints: import('firebase/firestore').QueryConstraint[] = [];

      // Filtros básicos
      if (filters.estado) {
        queryConstraints.push(where('estado', '==', filters.estado));
      } else {
        queryConstraints.push(where('estado', 'in', ['activo', 'pendiente']));
      }

      if (filters.categoria) {
        queryConstraints.push(where('categoria', '==', filters.categoria));
      }

      // Ordenamiento
      const orderField = this.getOrderField(sortBy);
      queryConstraints.push(orderBy(orderField, sortDirection));

      // Paginación
      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      queryConstraints.push(limit(searchLimit + 1)); // +1 para verificar hasMore

      // Ejecutar query
      const q = query(baseQuery, ...queryConstraints);
      const snapshot = await getDocs(q);

      let comercios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioSearchResult[];

      // Verificar si hay más resultados
      const hasMore = comercios.length > searchLimit;
      if (hasMore) {
        comercios = comercios.slice(0, searchLimit);
      }

      // Filtrar por término de búsqueda (client-side para mejor UX)
      if (searchTerm.trim()) {
        comercios = this.filterBySearchTerm(comercios, searchTerm);
      }

      // Aplicar filtros adicionales
      comercios = this.applyAdditionalFilters(comercios, filters);

      // Guardar en cache solo si no hay paginación
      if (!lastDoc) {
        this.cache.set(cacheKey, {
          data: comercios,
          timestamp: Date.now()
        });
      }

      return {
        comercios,
        hasMore,
        lastDoc: hasMore ? snapshot.docs[searchLimit - 1] : undefined
      };

    } catch (error) {
      handleError(error, 'Search Comercios');
      return { comercios: [], hasMore: false };
    }
  }

  /**
   * Búsqueda rápida para autocompletado
   */
  async quickSearch(searchTerm: string, resultLimit: number = 5): Promise<ComercioSearchResult[]> {
    if (!searchTerm.trim()) return [];

    try {
      const q = query(
        collection(db, this.collection),
        where('estado', '==', 'activo'),
        orderBy('nombreComercio'),
        limit(20) // Obtener más para filtrar client-side
      );

      const snapshot = await getDocs(q);
      let comercios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioSearchResult[];

      // Filtrar y limitar
      comercios = this.filterBySearchTerm(comercios, searchTerm).slice(0, resultLimit);

      return comercios;
    } catch (error) {
      handleError(error, 'Quick Search');
      return [];
    }
  }

  /**
   * Obtener comercios por categoría
   */
  async getComerciosByCategoria(categoria: string, resultLimit: number = 10): Promise<ComercioSearchResult[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('categoria', '==', categoria),
        where('estado', '==', 'activo'),
        orderBy('puntuacion', 'desc'),
        limit(resultLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioSearchResult[];
    } catch (error) {
      handleError(error, 'Get Comercios By Categoria');
      return [];
    }
  }

  /**
   * Obtener comercios destacados
   */
  async getFeaturedComercios(resultLimit: number = 6): Promise<ComercioSearchResult[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('estado', '==', 'activo'),
        where('verificado', '==', true),
        where('puntuacion', '>=', 4.0),
        orderBy('puntuacion', 'desc'),
        orderBy('totalReviews', 'desc'),
        limit(resultLimit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComercioSearchResult[];
    } catch (error) {
      handleError(error, 'Get Featured Comercios');
      return [];
    }
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Métodos privados
   */
  private createCacheKey(searchTerm: string, filters: SearchFilters, options: SearchOptions): string {
    return JSON.stringify({ searchTerm, filters, options: { ...options, lastDoc: undefined } });
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private getOrderField(sortBy: string): string {
    switch (sortBy) {
      case 'puntuacion':
        return 'puntuacion';
      case 'reviews':
        return 'totalReviews';
      case 'fecha':
        return 'creadoEn';
      default:
        return 'nombreComercio';
    }
  }

  private filterBySearchTerm(comercios: ComercioSearchResult[], searchTerm: string): ComercioSearchResult[] {
    const term = searchTerm.toLowerCase().trim();
    return comercios.filter(comercio => {
      return (
        comercio.nombreComercio.toLowerCase().includes(term) ||
        comercio.nombre.toLowerCase().includes(term) ||
        comercio.email.toLowerCase().includes(term) ||
        comercio.categoria.toLowerCase().includes(term) ||
        (comercio.direccion && comercio.direccion.toLowerCase().includes(term))
      );
    });
  }

  private applyAdditionalFilters(comercios: ComercioSearchResult[], filters: SearchFilters): ComercioSearchResult[] {
    let filtered = comercios;

    if (filters.minPuntuacion && filters.minPuntuacion > 0) {
      filtered = filtered.filter(c => c.puntuacion >= filters.minPuntuacion!);
    }

    if (filters.soloDisponibles && filters.asociacionId) {
      filtered = filtered.filter(c => !c.asociacionesVinculadas.includes(filters.asociacionId!));
    }

    return filtered;
  }
}

// Export singleton instance
export const comercioSearchService = new ComercioSearchService();
export default comercioSearchService;
