// src/lib/favoritesStorage.ts
'use client';

const FAVORITES_STORAGE_KEY = 'torinogo-favorite-stops';

/**
 * Retrieves the list of favorite stop IDs from localStorage.
 * @returns An array of favorite stop IDs.
 */
export function getFavoriteStopIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (storedFavorites) {
      return JSON.parse(storedFavorites);
    }
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
  }
  return [];
}

/**
 * Saves the list of favorite stop IDs to localStorage.
 * @param favoriteIds An array of favorite stop IDs.
 */
function saveFavoriteStopIds(favoriteIds: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
}

/**
 * Adds a stop ID to the list of favorites in localStorage.
 * @param stopId The ID of the stop to add.
 */
export function addFavoriteStopId(stopId: string): void {
  const currentFavorites = getFavoriteStopIds();
  if (!currentFavorites.includes(stopId)) {
    const updatedFavorites = [...currentFavorites, stopId];
    saveFavoriteStopIds(updatedFavorites);
  }
}

/**
 * Removes a stop ID from the list of favorites in localStorage.
 * @param stopId The ID of the stop to remove.
 */
export function removeFavoriteStopId(stopId: string): void {
  const currentFavorites = getFavoriteStopIds();
  const updatedFavorites = currentFavorites.filter(id => id !== stopId);
  saveFavoriteStopIds(updatedFavorites);
}

/**
 * Checks if a stop is marked as a favorite in localStorage.
 * @param stopId The ID of the stop to check.
 * @returns True if the stop is a favorite, false otherwise.
 */
export function isStopFavorite(stopId: string): boolean {
  const currentFavorites = getFavoriteStopIds();
  return currentFavorites.includes(stopId);
}
