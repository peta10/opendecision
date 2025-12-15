/**
 * Exit Intent State Management
 * Handles localStorage persistence and state utilities for exit-intent detection
 * 
 * Behavior:
 * - Shows after 30 seconds on page when user shows exit intent
 * - Dismissed state persists forever (until cache is cleared)
 * - Shows only once per session
 * - Triggers on mouse leave or tab switch
 */

export interface ExitIntentState {
  dismissed: boolean;
  dismissedAt: string;
  showCount: number;
  lastTriggeredAt?: string;
  mouseLeaveTriggered?: boolean;
  tabSwitchTriggered?: boolean;
}

const STORAGE_KEY = 'exitIntentState';
const MIN_TIME_ON_PAGE_MS = 60000; // Minimum 1 minute before showing (changed from 2 minutes)
const MAX_SHOWS_PER_SESSION = 1; // Only show once per session

/**
 * Get the current exit intent state from localStorage
 */
export function getExitIntentState(): ExitIntentState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        dismissed: false,
        dismissedAt: '',
        showCount: 0,
        lastTriggeredAt: '',
        mouseLeaveTriggered: false,
        tabSwitchTriggered: false
      };
    }

    const state: ExitIntentState = JSON.parse(stored);
    
    // If dismissed, it stays dismissed forever (until cache is cleared)
    if (state.dismissed) {
      return state; // Return dismissed state as-is
    }
    
    return state;
  } catch (error) {
    console.error('Error reading exit intent state:', error);
    return {
      dismissed: false,
      dismissedAt: '',
      showCount: 0,
      lastTriggeredAt: '',
      mouseLeaveTriggered: false,
      tabSwitchTriggered: false
    };
  }
}

/**
 * Save the exit intent state to localStorage
 */
export function saveExitIntentState(state: ExitIntentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving exit intent state:', error);
  }
}

/**
 * Mark the exit intent as dismissed
 */
export function dismissExitIntent(): void {
  const currentState = getExitIntentState();
  const newState: ExitIntentState = {
    ...currentState,
    dismissed: true,
    dismissedAt: new Date().toISOString()
  };
  saveExitIntentState(newState);
}

/**
 * Increment the show count for analytics
 */
export function incrementExitIntentShowCount(): void {
  const currentState = getExitIntentState();
  const newState: ExitIntentState = {
    ...currentState,
    showCount: currentState.showCount + 1,
    lastTriggeredAt: new Date().toISOString()
  };
  saveExitIntentState(newState);
}

/**
 * Record mouse leave trigger
 */
export function recordMouseLeaveTrigger(): void {
  const currentState = getExitIntentState();
  const newState: ExitIntentState = {
    ...currentState,
    mouseLeaveTriggered: true,
    lastTriggeredAt: new Date().toISOString()
  };
  saveExitIntentState(newState);
}

/**
 * Record tab switch trigger
 */
export function recordTabSwitchTrigger(): void {
  const currentState = getExitIntentState();
  const newState: ExitIntentState = {
    ...currentState,
    tabSwitchTriggered: true,
    lastTriggeredAt: new Date().toISOString()
  };
  saveExitIntentState(newState);
}



/**
 * Check if the exit intent should be shown
 */
export function shouldShowExitIntent(): boolean {
  const state = getExitIntentState();
  
  // Don't show if user has dismissed it (and not enough time has passed)
  if (state.dismissed) {
    return false;
  }
  
  // Don't show if already shown this session
  if (state.showCount >= MAX_SHOWS_PER_SESSION) {
    return false;
  }
  
  return true;
}

/**
 * Get timing constants for external use
 */
export function getExitIntentTimingConstants() {
  return {
    MIN_TIME_ON_PAGE_MS,
    MAX_SHOWS_PER_SESSION
  };
}

/**
 * Reset the exit intent state (for testing/debugging)
 */
export function resetExitIntentState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Exit intent state reset - should show again now');
  } catch (error) {
    console.error('Error resetting exit intent state:', error);
  }
}

// Make debugging functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).resetExitIntentState = resetExitIntentState;
  (window as any).getExitIntentState = getExitIntentState;
  (window as any).checkExitIntentStatus = () => {
    const state = getExitIntentState();
    const canShow = shouldShowExitIntent();
    console.log('🔍 Exit Intent Status:', {
      state,
      canShow,
      timeOnPage: 'Check in browser console by moving mouse to trigger'
    });
    return { state, canShow };
  };
  
  // Cross-browser testing function
  (window as any).testExitIntent = () => {
    console.log('🔍 Cross-Browser Exit Intent Test:');
    console.log('Browser Info:', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      viewport: { width: window.innerWidth, height: window.innerHeight },
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0
    });
    
    // Reset for testing
    resetExitIntentState();
    
    console.log('✅ Ready to test - try moving mouse to top-right corner');
    console.log('📋 Test Instructions:');
    console.log('1. Move mouse to browser tabs area');
    console.log('2. Move mouse to X button (top-right corner)');
    console.log('3. Switch tabs (Ctrl+Tab)');
    console.log('4. Check console for trigger logs');
  };
  
  console.log('🔧 ExitIntent debugging functions available globally:');
  console.log('- resetExitIntentState() - Reset exit intent state');
  console.log('- getExitIntentState() - Get current state');
  console.log('- checkExitIntentStatus() - Check if can show');
  console.log('- testExitIntent() - Cross-browser compatibility test');
}
