/**
 * Bumper Coordination System
 * Manages timing and coordination between ProductBumper and ExitIntentBumper
 * 
 * Requirements:
 * - No bumpers during guided rankings
 * - 1 minute timer starts after guided rankings complete + 10s delay
 * - 20s delay between bumpers
 * - Only one bumper can be shown at a time
 */

export interface BumperCoordinationState {
  isGuidedRankingActive: boolean;
  guidedRankingCompletedAt?: string;
  lastBumperShownAt?: string;
  lastBumperType?: 'product' | 'exit-intent';
  exitIntentTimerStartedAt?: string;
}

const STORAGE_KEY = 'bumperCoordinationState';
const GUIDED_RANKING_DELAY_MS = 10000; // 10 seconds after guided ranking completes
const BUMPER_DELAY_MS = 20000; // 20 seconds between bumpers
const EXIT_INTENT_TIMER_MS = 60000; // 1 minute for exit intent (changed from 2 minutes)

/**
 * Get the current bumper coordination state from localStorage
 */
export function getBumperCoordinationState(): BumperCoordinationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        isGuidedRankingActive: false
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading bumper coordination state:', error);
    return {
      isGuidedRankingActive: false
    };
  }
}

/**
 * Save the bumper coordination state to localStorage
 */
export function saveBumperCoordinationState(state: BumperCoordinationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving bumper coordination state:', error);
  }
}

/**
 * Mark guided ranking as active
 */
export function markGuidedRankingActive(): void {
  const currentState = getBumperCoordinationState();
  const newState: BumperCoordinationState = {
    ...currentState,
    isGuidedRankingActive: true
  };
  saveBumperCoordinationState(newState);
}

/**
 * Mark guided ranking as completed and start the delay timer
 */
export function markGuidedRankingCompleted(): void {
  const currentState = getBumperCoordinationState();
  const now = new Date().toISOString();
  const newState: BumperCoordinationState = {
    ...currentState,
    isGuidedRankingActive: false,
    guidedRankingCompletedAt: now,
    // Start the exit intent timer after the 10s delay
    exitIntentTimerStartedAt: new Date(Date.now() + GUIDED_RANKING_DELAY_MS).toISOString()
  };
  saveBumperCoordinationState(newState);
}

/**
 * Record when a bumper was shown
 */
export function recordBumperShown(type: 'product' | 'exit-intent'): void {
  const currentState = getBumperCoordinationState();
  const newState: BumperCoordinationState = {
    ...currentState,
    lastBumperShownAt: new Date().toISOString(),
    lastBumperType: type
  };
  saveBumperCoordinationState(newState);
}

/**
 * Check if any bumper can be shown (respects 20s delay between bumpers)
 */
export function canShowAnyBumper(): boolean {
  const state = getBumperCoordinationState();
  
  // Don't show if guided ranking is active
  if (state.isGuidedRankingActive) {
    return false;
  }
  
  // Check if enough time has passed since last bumper
  if (state.lastBumperShownAt) {
    const lastShown = new Date(state.lastBumperShownAt);
    const timeSinceLastBumper = Date.now() - lastShown.getTime();
    
    if (timeSinceLastBumper < BUMPER_DELAY_MS) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if exit intent bumper can be shown
 */
export function canShowExitIntentBumper(): boolean {
  // First check general bumper rules
  if (!canShowAnyBumper()) {
    return false;
  }
  
  const state = getBumperCoordinationState();
  
  // If guided ranking was completed, check if enough time has passed
  if (state.guidedRankingCompletedAt && state.exitIntentTimerStartedAt) {
    const timerStart = new Date(state.exitIntentTimerStartedAt);
    const timeSinceTimer = Date.now() - timerStart.getTime();
    
    // Must wait for the full exit intent timer (1 minute) after guided ranking + 10s delay
    return timeSinceTimer >= EXIT_INTENT_TIMER_MS;
  }
  
  // If no guided ranking was completed, use normal timing rules
  // This will be handled by the normal exit intent logic
  return true;
}

/**
 * Check if product bumper can be shown
 */
export function canShowProductBumper(): boolean {
  // First check general bumper rules
  if (!canShowAnyBumper()) {
    return false;
  }
  
  // Product bumper has its own timing logic in productBumperState.ts
  // This just ensures coordination with other bumpers
  return true;
}

/**
 * Get timing constants for external use
 */
export function getBumperCoordinationConstants() {
  return {
    GUIDED_RANKING_DELAY_MS,
    BUMPER_DELAY_MS,
    EXIT_INTENT_TIMER_MS
  };
}

/**
 * Reset the bumper coordination state (for testing/debugging)
 */
export function resetBumperCoordinationState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Bumper coordination state reset');
  } catch (error) {
    console.error('Error resetting bumper coordination state:', error);
  }
}

// Make reset function available globally for testing
if (typeof window !== 'undefined') {
  (window as any).resetBumperCoordinationState = resetBumperCoordinationState;
  (window as any).getBumperCoordinationState = getBumperCoordinationState;
  console.log('🔧 BumperCoordination debugging functions available globally');
}
