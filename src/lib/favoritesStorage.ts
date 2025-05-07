
// src/lib/favoritesStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_STORAGE_KEY = 'torinogo-favorite-stops-native';

/**
 * Retrieves the list of favorite stop IDs from AsyncStorage.
 * @returns A promise that resolves to an array of favorite stop IDs.
 */
export async function getFavoriteStopIds(): Promise<string[]> {
  try {
    const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    if (storedFavorites) {
      return JSON.parse(storedFavorites);
    }
  } catch (error) {
    console.error('Error reading favorites from AsyncStorage:', error);
  }
  return [];
}

/**
 * Saves the list of favorite stop IDs to AsyncStorage.
 * @param favoriteIds An array of favorite stop IDs.
 */
async function saveFavoriteStopIds(favoriteIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  } catch (error) {
    console.error('Error saving favorites to AsyncStorage:', error);
  }
}

/**
 * Adds a stop ID to the list of favorites in AsyncStorage.
 * @param stopId The ID of the stop to add.
 */
export async function addFavoriteStopId(stopId: string): Promise<void> {
  const currentFavorites = await getFavoriteStopIds();
  if (!currentFavorites.includes(stopId)) {
    const updatedFavorites = [...currentFavorites, stopId];
    await saveFavoriteStopIds(updatedFavorites);
  }
}

/**
 * Removes a stop ID from the list of favorites in AsyncStorage.
 * @param stopId The ID of the stop to remove.
 */
export async function removeFavoriteStopId(stopId: string): Promise<void> {
  const currentFavorites = await getFavoriteStopIds();
  const updatedFavorites = currentFavorites.filter(id => id !== stopId);
  await saveFavoriteStopIds(updatedFavorites);
}

/**
 * Checks if a stop is marked as a favorite in AsyncStorage.
 * @param stopId The ID of the stop to check.
 * @returns A promise that resolves to true if the stop is a favorite, false otherwise.
 */
export async function isStopFavorite(stopId: string): Promise<boolean> {
  const currentFavorites = await getFavoriteStopIds();
  return currentFavorites.includes(stopId);
}
