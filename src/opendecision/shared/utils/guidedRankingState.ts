'use client';

/**
 * Utility to track if user has completed any guided ranking
 * This is separate from criteria adjustment checks
 */

const GUIDED_RANKING_COMPLETED_KEY = 'hasCompletedGuidedRanking';
const GUIDED_RANKING_CRITERIA_IDS_KEY = 'guidedRankingCriteriaIds'; // Track which criteria were ranked

/**
 * Check if user has completed any guided ranking (full or criteria-specific)
 * @returns true if user has completed at least one guided ranking session
 */
export function hasCompletedAnyGuidedRanking(): boolean {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return false;
    }
    return localStorage.getItem(GUIDED_RANKING_COMPLETED_KEY) === 'true';
  } catch (error) {
    console.warn('Error checking guided ranking completion status:', error);
    return false;
  }
}

/**
 * Get the list of criterion IDs that were completed via guided ranking
 * @returns Array of criterion IDs that were ranked via guided ranking
 */
export function getGuidedRankingCriteriaIds(): string[] {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return [];
    }
    const stored = localStorage.getItem(GUIDED_RANKING_CRITERIA_IDS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Error reading guided ranking criteria IDs:', error);
    return [];
  }
}

/**
 * Mark that user has completed a guided ranking session
 * This should be called when user finishes any guided ranking (full or criteria-specific)
 * @param criterionId - Optional: if provided, tracks this specific criterion as completed
 */
export function markGuidedRankingAsCompleted(criterionId?: string): void {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return;
    }
    localStorage.setItem(GUIDED_RANKING_COMPLETED_KEY, 'true');
    
    // If a specific criterion ID is provided, track it
    if (criterionId) {
      const completedIds = getGuidedRankingCriteriaIds();
      if (!completedIds.includes(criterionId)) {
        completedIds.push(criterionId);
        localStorage.setItem(GUIDED_RANKING_CRITERIA_IDS_KEY, JSON.stringify(completedIds));
        console.log(`✅ Marked criterion ${criterionId} as completed via guided ranking`);
      }
    }
    
    console.log('✅ Marked guided ranking as completed - match scores will now display');
  } catch (error) {
    console.error('Error marking guided ranking as completed:', error);
  }
}

/**
 * Reset the guided ranking completion status (for testing/debugging)
 */
export function resetGuidedRankingCompletion(): void {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return;
    }
    localStorage.removeItem(GUIDED_RANKING_COMPLETED_KEY);
    localStorage.removeItem(GUIDED_RANKING_CRITERIA_IDS_KEY);
    console.log('🔄 Reset guided ranking completion status');
  } catch (error) {
    console.error('Error resetting guided ranking completion:', error);
  }
}

