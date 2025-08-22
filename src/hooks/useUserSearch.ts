import { useState, useCallback } from 'react';
import { userSearchService, RegisteredUser, UserSearchFilters, UserSearchResult } from '@/services/user-search.service';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

interface UseUserSearchReturn {
  // Data
  searchResults: RegisteredUser[];
  selectedUser: RegisteredUser | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Actions
  searchUsers: (searchTerm: string) => Promise<void>;
  searchByEmail: (email: string) => Promise<RegisteredUser[]>;
  selectUser: (user: RegisteredUser) => void;
  clearSelection: () => void;
  clearResults: () => void;
  canAddUser: (userId: string) => Promise<{ canAdd: boolean; reason?: string }>;
  clearError: () => void;
}

export function useUserSearch(): UseUserSearchReturn {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<RegisteredUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const asociacionId = user?.uid || '';

  // Search users with filters
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!asociacionId) {
      setError('No hay asociación seleccionada');
      return;
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasMore(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filters: UserSearchFilters = {
        search: searchTerm.trim(),
        estado: 'activo',
        excludeAsociacionId: asociacionId,
      };

      const result: UserSearchResult = await userSearchService.searchRegisteredUsers(filters, 10);
      
      setSearchResults(result.users);
      setHasMore(result.hasMore);

      if (result.users.length === 0) {
        toast('No se encontraron usuarios con ese criterio de búsqueda', { icon: 'ℹ️' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar usuarios';
      setError(errorMessage);
      toast.error(errorMessage);
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [asociacionId]);

  // Search by email specifically
  const searchByEmail = useCallback(async (email: string): Promise<RegisteredUser[]> => {
    if (!asociacionId) {
      throw new Error('No hay asociación seleccionada');
    }

    try {
      setLoading(true);
      setError(null);

      const users = await userSearchService.searchByEmail(email, asociacionId);
      return users;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar por email';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [asociacionId]);

  // Select a user
  const selectUser = useCallback((user: RegisteredUser) => {
    setSelectedUser(user);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedUser(null);
  }, []);

  // Clear search results
  const clearResults = useCallback(() => {
    setSearchResults([]);
    setHasMore(false);
    setError(null);
  }, []);

  // Check if user can be added as socio
  const canAddUser = useCallback(async (userId: string): Promise<{ canAdd: boolean; reason?: string }> => {
    if (!asociacionId) {
      return { canAdd: false, reason: 'No hay asociación seleccionada' };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await userSearchService.canAddAsSocio(userId, asociacionId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar usuario';
      setError(errorMessage);
      return { canAdd: false, reason: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [asociacionId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    searchResults,
    selectedUser,
    loading,
    error,
    hasMore,
    
    // Actions
    searchUsers,
    searchByEmail,
    selectUser,
    clearSelection,
    clearResults,
    canAddUser,
    clearError,
  };
}