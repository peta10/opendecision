/**
 * Criteria Storage Utility
 * 
 * Handles persisting and loading user's criteria adjustments to/from localStorage
 * with proper validation, versioning, and error handling.
 */

import { Criterion } from '@/ppm-tool/shared/types';

// Storage configuration
const STORAGE_KEY = 'savedCriteriaValues';
const STORAGE_VERSION = 1; // Increment when storage format changes

interface SavedCriteriaData {
  version: number;
  timestamp: string;
  values: Record<string, number>; // criterionId -> userRating
}

/**
 * Load saved criteria values from localStorage
 * @returns Object mapping criterion IDs to their saved userRating values, or null if none found
 */
export function loadSavedCriteriaValues(): Record<string, number> | null {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      console.warn('📦 localStorage not available');
      return null;
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      console.log('📦 No saved criteria values found');
      return null;
    }

    const parsed: SavedCriteriaData = JSON.parse(savedData);

    // Validate version
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`📦 Storage version mismatch (found: ${parsed.version}, expected: ${STORAGE_VERSION}). Clearing old data.`);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Validate data structure
    if (!parsed.values || typeof parsed.values !== 'object') {
      console.warn('📦 Invalid saved criteria data structure. Clearing.');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    console.log('📂 Loaded saved criteria values:', Object.keys(parsed.values).length, 'criteria');
    return parsed.values;
  } catch (error) {
    console.error('❌ Error loading saved criteria:', error);
    // Clear potentially corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.error('❌ Error clearing corrupted criteria data:', clearError);
    }
    return null;
  }
}

/**
 * Save criteria values to localStorage
 * @param criteria - Array of criteria to save
 * @param force - If true, save even if all values are 3 (default: false)
 */
export function saveCriteriaValues(criteria: Criterion[], force: boolean = false): void {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return;
    }

    // Create values map
    const values: Record<string, number> = {};
    criteria.forEach(criterion => {
      values[criterion.id] = criterion.userRating;
    });

    // Check if any criteria have been adjusted
    const hasAdjustments = criteria.some(c => c.userRating !== 3);
    
    if (!hasAdjustments && !force) {
      console.log('📦 No criteria adjustments to save (all values are 3)');
      return;
    }

    const dataToSave: SavedCriteriaData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      values
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('💾 Saved criteria values to localStorage:', Object.keys(values).length, 'criteria');
  } catch (error) {
    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('❌ localStorage quota exceeded. Cannot save criteria values.');
    } else {
      console.error('❌ Error saving criteria values:', error);
    }
  }
}

/**
 * Merge fetched criteria with saved values
 * @param fetchedCriteria - Fresh criteria from database/defaults
 * @param savedValues - Saved userRating values from localStorage
 * @returns Merged criteria with saved values applied where valid
 */
export function mergeCriteriaWithSaved(
  fetchedCriteria: Criterion[],
  savedValues: Record<string, number> | null
): Criterion[] {
  if (!savedValues || Object.keys(savedValues).length === 0) {
    console.log('📦 No saved values to merge');
    return fetchedCriteria;
  }

  let mergedCount = 0;
  const mergedCriteria = fetchedCriteria.map(criterion => {
    const savedValue = savedValues[criterion.id];
    
    // Validate saved value (must be between 1-5)
    if (savedValue !== undefined && savedValue >= 1 && savedValue <= 5) {
      mergedCount++;
      return {
        ...criterion,
        userRating: savedValue
      };
    }
    
    return criterion;
  });

  console.log(`✅ Merged ${mergedCount}/${fetchedCriteria.length} saved criteria values`);
  return mergedCriteria;
}

/**
 * Clear all saved criteria values
 */
export function clearSavedCriteriaValues(): void {
  try {
    if (typeof window !== 'undefined' && typeof Storage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ Cleared saved criteria values');
    }
  } catch (error) {
    console.error('❌ Error clearing saved criteria values:', error);
  }
}

