'use client';

/**
 * Unified Bumper State - Compatibility Layer
 * This file now delegates to UniversalBumperStateManager for all state operations
 * Kept for backwards compatibility with existing code
 * 
 * ⚠️ MIGRATION NOTE: This is now a thin wrapper around UniversalBumperStateManager
 * All new code should use UniversalBumperStateManager directly
 */

import { stateManager, BumperState } from '../state/UniversalBumperStateManager';

// Re-export the main interface with extended fields for backwards compatibility
export interface UnifiedBumperState extends BumperState {
  // Additional fields that were in the old unified state but not in BumperState
  hasClickedIntoFullGuidedRankings?: boolean;
  hasClickedIntoCriteriaSpecificGuidedRankings?: boolean;
  lastMouseMovementAt?: string;
}

// Constants (kept for backwards compatibility)
export const INITIAL_TIMER_MS = 10000; // 10 seconds
export const MOUSE_MOVEMENT_TIMER_MS = 3000; // 3 seconds after mouse stops
export const EXIT_INTENT_TIMER_MS = 60000; // 1 minute for exit intent
export const POST_BUMPER_DELAY_MS = 23000; // 23 seconds after bumper closed

/**
 * Get the current unified bumper state
 * Delegates to UniversalBumperStateManager
 */
export function getUnifiedBumperState(): UnifiedBumperState {
  const baseState = stateManager.getState();
  
  // Try to get extended fields from localStorage (for backwards compat)
  try {
    const stored = localStorage.getItem('unifiedBumperState');
    if (stored) {
      const legacyState = JSON.parse(stored);
      return {
        ...baseState,
        hasClickedIntoFullGuidedRankings: legacyState.hasClickedIntoFullGuidedRankings,
        hasClickedIntoCriteriaSpecificGuidedRankings: legacyState.hasClickedIntoCriteriaSpecificGuidedRankings,
        lastMouseMovementAt: legacyState.lastMouseMovementAt
      };
    }
  } catch (error) {
    // Fall back to base state if legacy state can't be read
  }
  
  return baseState as UnifiedBumperState;
}

/**
 * Save the unified bumper state
 * Delegates to UniversalBumperStateManager
 */
export function saveUnifiedBumperState(state: Partial<UnifiedBumperState>): void {
  // Save extended fields to legacy storage
  if (state.hasClickedIntoFullGuidedRankings !== undefined || 
      state.hasClickedIntoCriteriaSpecificGuidedRankings !== undefined ||
      state.lastMouseMovementAt !== undefined) {
    try {
      const current = getUnifiedBumperState();
      const legacyState = {
        hasClickedIntoFullGuidedRankings: state.hasClickedIntoFullGuidedRankings ?? current.hasClickedIntoFullGuidedRankings,
        hasClickedIntoCriteriaSpecificGuidedRankings: state.hasClickedIntoCriteriaSpecificGuidedRankings ?? current.hasClickedIntoCriteriaSpecificGuidedRankings,
        lastMouseMovementAt: state.lastMouseMovementAt ?? current.lastMouseMovementAt
      };
      localStorage.setItem('unifiedBumperState', JSON.stringify(legacyState));
    } catch (error) {
      console.warn('Failed to save legacy bumper state fields:', error);
    }
  }
  
  // Delegate core state to UniversalBumperStateManager
  stateManager.setState(state);
}

// ============================================================================
// RECORDING FUNCTIONS - Delegate to UniversalBumperStateManager
// ============================================================================

export function recordFullGuidedRankingsClick(): void {
  stateManager.recordGuidedRankingsClick();
  saveUnifiedBumperState({ hasClickedIntoFullGuidedRankings: true });
  console.log('🎯 Recorded Full Guided Rankings click - Product Bumper disabled');
}

export function recordCriteriaSpecificGuidedRankingsClick(): void {
  saveUnifiedBumperState({ hasClickedIntoCriteriaSpecificGuidedRankings: true });
  console.log('📝 Recorded Criteria-Specific Guided Rankings click');
}

export function recordGuidedRankingsClick(): void {
  stateManager.recordGuidedRankingsClick();
}

export function recordComparisonReportClick(): void {
  stateManager.recordComparisonReportClick();
}

export function recordGuidedRankingsOpened(): void {
  stateManager.recordGuidedRankingsOpened();
}

export function recordGuidedRankingsClosed(): void {
  stateManager.recordGuidedRankingsClosed();
}

export function recordComparisonReportOpened(): void {
  stateManager.recordComparisonReportOpened();
}

export function recordComparisonReportClosed(submitted: boolean = false): void {
  stateManager.recordComparisonReportClosed(submitted);
}

export function recordMouseMovement(): void {
  saveUnifiedBumperState({ lastMouseMovementAt: new Date().toISOString() });
}

export function recordMouseStopped(): void {
  stateManager.recordMouseStopped();
}

export function recordInitialTimerComplete(): void {
  stateManager.recordInitialTimerComplete();
}

export function recordMouseMovementTimerComplete(): void {
  stateManager.recordMouseMovementTimerComplete();
}

export function recordProductBumperShown(): void {
  stateManager.recordProductBumperShown();
}

export function recordProductBumperDismissed(): void {
  stateManager.recordProductBumperDismissed();
}

export function recordExitIntentBumperShown(): void {
  stateManager.recordExitIntentShown();
}

export function recordExitIntentBumperDismissed(): void {
  stateManager.recordExitIntentDismissed();
}

export function setBumperCurrentlyOpen(isOpen: boolean): void {
  stateManager.setState({ isAnyBumperCurrentlyOpen: isOpen });
}

// ============================================================================
// VALIDATION FUNCTIONS - Use UniversalBumperEngine's logic
// ============================================================================

/**
 * Check if Product Bumper should be shown
 * Delegates to UniversalBumperEngine for the actual logic
 */
export function shouldShowProductBumper(): boolean {
  const state = getUnifiedBumperState();
  const now = Date.now();
  
  // Never show if already dismissed
  if (state.productBumperDismissed) return false;
  
  // Never show if already shown
  if (state.productBumperShown) return false;
  
  // Never show if user clicked into Full Guided Rankings
  if (state.hasClickedIntoFullGuidedRankings || state.hasClickedIntoGuidedRankings) return false;
  
  // Never show if any bumper is currently open
  if (state.isAnyBumperCurrentlyOpen) return false;
  
  // Never show if Guided Rankings is open
  if (state.isGuidedRankingsCurrentlyOpen) return false;
  
  // Never show if Comparison Report is open
  if (state.isComparisonReportCurrentlyOpen) return false;
  
  // Cross-bumper cooldown
  if (state.exitIntentDismissedAt) {
    const sinceExitDismiss = now - new Date(state.exitIntentDismissedAt).getTime();
    if (sinceExitDismiss < POST_BUMPER_DELAY_MS) return false;
  }
  
  // Must have initial timer complete
  if (!state.initialTimerComplete) return false;
  
  // Must have mouse movement timer complete
  if (!state.mouseMovementTimerComplete) return false;
  
  // If user opened and closed Comparison Report, check timing
  if (state.comparisonReportClosedAt) {
    const sinceReportClosed = now - new Date(state.comparisonReportClosedAt).getTime();
    if (sinceReportClosed < INITIAL_TIMER_MS) return false;
  }
  
  return true;
}

/**
 * Check if Exit Intent Bumper should be shown
 * Delegates to UniversalBumperEngine for the actual logic
 * NOTE: This function checks timing/state. The criteria adjustment check (3+ criteria)
 * is done separately in the component that calls this, because criteria state is not
 * stored in bumper state - it lives in the component's criteria array.
 */
export function shouldShowExitIntentBumper(): boolean {
  const state = getUnifiedBumperState();
  const now = Date.now();
  
  // REMOVED: Permanent block based on comparisonReportClosedAt
  // Exit Intent blocking is now based ONLY on WHEN the button was clicked (comparisonReportOpenedAt timing)
  // Closing the modal does NOT block Exit Intent - only clicking the button before 1 minute blocks it
  
  // PERMANENT BLOCK: If user clicked into Guided Rankings, never show Exit-Intent
  if (state.hasClickedIntoGuidedRankings) {
    console.log('🚫 Exit Intent PERMANENTLY DISABLED - user clicked into Guided Rankings');
    return false;
  }
  
  // Never show if already dismissed
  if (state.exitIntentDismissed) {
    console.log('🚫 Exit Intent blocked - already dismissed');
    return false;
  }
  
  // Never show if already shown
  if (state.exitIntentShown) {
    console.log('🚫 Exit Intent blocked - already shown');
    return false;
  }
  
  // Never show if any bumper is currently open
  if (state.isAnyBumperCurrentlyOpen) {
    console.log('🚫 Exit Intent blocked - another bumper is currently open');
    return false;
  }
  
  // Never show if Guided Rankings is open
  if (state.isGuidedRankingsCurrentlyOpen) {
    console.log('🚫 Exit Intent blocked - Guided Rankings is currently open');
    return false;
  }
  
  // Never show if Comparison Report is open
  if (state.isComparisonReportCurrentlyOpen) {
    console.log('🚫 Exit Intent blocked - Comparison Report is currently open');
    return false;
  }
  
  // Cross-bumper cooldown
  if (state.productBumperDismissedAt) {
    const sinceProductDismiss = now - new Date(state.productBumperDismissedAt).getTime();
    if (sinceProductDismiss < POST_BUMPER_DELAY_MS) return false;
  }
  
  // Must be at least 1 minute since tool opened (changed from 2 minutes)
  if (state.toolOpenedAt) {
    const timeSinceOpened = now - new Date(state.toolOpenedAt).getTime();
    if (timeSinceOpened < EXIT_INTENT_TIMER_MS) {
      console.log(`⏱️ [EXIT_INTENT_DEBUG] Timer not met: ${Math.floor(timeSinceOpened / 1000)}s < ${Math.floor(EXIT_INTENT_TIMER_MS / 1000)}s`);
      return false;
    }
  }
  
  return true;
}

/**
 * Get timing constants for bumpers
 */
export function getUnifiedBumperTimingConstants() {
  return {
    INITIAL_TIMER_MS,
    MOUSE_MOVEMENT_TIMER_MS,
    EXIT_INTENT_TIMER_MS,
    POST_BUMPER_DELAY_MS
  };
}

/**
 * Reset all bumper state
 */
export function resetUnifiedBumperState(): void {
  stateManager.clearState();
  try {
    localStorage.removeItem('unifiedBumperState');
  } catch (error) {
    console.warn('Failed to clear legacy bumper state:', error);
  }
}

// ============================================================================
// LEGACY EXPORTS - For backwards compatibility
// ============================================================================

// Export state manager directly for advanced use cases
export { stateManager };
