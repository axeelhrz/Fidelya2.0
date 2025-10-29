'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseFavoritesReturn {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
}

export const useFavorites = (storageKey: string = 'favorites'): UseFavoritesReturn => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Generate user-specific storage key
  const getUserStorageKey = useCallback(() => {
    return user ? `${storageKey}_${user.uid}` : storageKey;
  }, [user, storageKey]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem(getUserStorageKey());
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }, [getUserStorageKey]);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(getUserStorageKey(), JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, [favorites, getUserStorageKey]);

  const isFavorite = useCallback((id: string): boolean => {
    return favorites.has(id);
  }, [favorites]);

  const toggleFavorite = useCallback((id: string): void => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  }, []);

  const addFavorite = useCallback((id: string): void => {
    setFavorites(prev => new Set(prev).add(id));
  }, []);

  const removeFavorite = useCallback((id: string): void => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      newFavorites.delete(id);
      return newFavorites;
    });
  }, []);

  const clearFavorites = useCallback((): void => {
    setFavorites(new Set());
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    favoritesCount: favorites.size
  };
};
