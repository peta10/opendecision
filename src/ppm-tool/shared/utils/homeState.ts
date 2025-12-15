/**
 * Home State Management
 * Tracks when the PPM tool is in its "home state" - no overlays or modals open
 * 
 * Home State Definition:
 * - No Guided Rankings open
 * - No Comparison Report (Email Modal) open
 * - No How It Works overlay open
 * - No other overlays/modals open
 * 
 * Bumpers can ONLY trigger when the tool is in home state
 */

export interface HomeState {
  isInHomeState: boolean;
  openOverlays: string[];
  lastStateChangeAt: string;
}

const STORAGE_KEY = 'ppmToolHomeState';

// Overlay identifiers
export const OVERLAY_TYPES = {
  GUIDED_RANKINGS: 'guided-rankings',
  COMPARISON_REPORT: 'comparison-report', 
  HOW_IT_WORKS: 'how-it-works',
  PRODUCT_BUMPER: 'product-bumper',
  EXIT_INTENT_BUMPER: 'exit-intent-bumper'
} as const;

export type OverlayType = typeof OVERLAY_TYPES[keyof typeof OVERLAY_TYPES];

/**
 * Get current home state from localStorage
 */
export function getHomeState(): HomeState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        isInHomeState: parsed.isInHomeState ?? true,
        openOverlays: parsed.openOverlays ?? [],
        lastStateChangeAt: parsed.lastStateChangeAt ?? new Date().toISOString()
      };
    }
  } catch (error) {
    console.warn('Error reading home state from localStorage:', error);
  }
  
  // Default state - tool starts in home state
  return {
    isInHomeState: true,
    openOverlays: [],
    lastStateChangeAt: new Date().toISOString()
  };
}

/**
 * Save home state to localStorage
 */
function saveHomeState(state: HomeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Error saving home state to localStorage:', error);
  }
}

/**
 * Update home state when overlay opens
 */
export function setOverlayOpen(overlayType: OverlayType): void {
  const currentState = getHomeState();
  
  // Add overlay to open list if not already there
  if (!currentState.openOverlays.includes(overlayType)) {
    const newState: HomeState = {
      isInHomeState: false, // Any overlay open = not in home state
      openOverlays: [...currentState.openOverlays, overlayType],
      lastStateChangeAt: new Date().toISOString()
    };
    
    saveHomeState(newState);
    console.log(`🏠 Home State: ${overlayType} opened. No longer in home state.`, newState);
  }
}

/**
 * Update home state when overlay closes
 */
export function setOverlayClosed(overlayType: OverlayType): void {
  const currentState = getHomeState();
  
  // Remove overlay from open list
  const updatedOverlays = currentState.openOverlays.filter(overlay => overlay !== overlayType);
  
  const newState: HomeState = {
    isInHomeState: updatedOverlays.length === 0, // Home state when no overlays open
    openOverlays: updatedOverlays,
    lastStateChangeAt: new Date().toISOString()
  };
  
  saveHomeState(newState);
  console.log(`🏠 Home State: ${overlayType} closed. Home state: ${newState.isInHomeState}`, newState);
}

/**
 * Check if tool is currently in home state
 */
export function isInHomeState(): boolean {
  const state = getHomeState();
  return state.isInHomeState;
}

/**
 * Check if specific overlay is open
 */
export function isOverlayOpen(overlayType: OverlayType): boolean {
  const state = getHomeState();
  return state.openOverlays.includes(overlayType);
}

/**
 * Get list of currently open overlays
 */
export function getOpenOverlays(): string[] {
  const state = getHomeState();
  return [...state.openOverlays];
}

/**
 * Force reset to home state (useful for development/testing)
 */
export function resetToHomeState(): void {
  const newState: HomeState = {
    isInHomeState: true,
    openOverlays: [],
    lastStateChangeAt: new Date().toISOString()
  };
  
  saveHomeState(newState);
  console.log('🏠 Home State: Force reset to home state', newState);
}

/**
 * Check if bumpers should be allowed to trigger
 * Bumpers can only trigger when in home state
 */
export function shouldAllowBumpers(): boolean {
  const inHomeState = isInHomeState();
  const openOverlays = getOpenOverlays();
  
  if (!inHomeState) {
    return false;
  }
  
  return true;
}

/**
 * Development utility: Add keyboard shortcuts for testing home state
 */
export function addDevelopmentKeyboardShortcuts(): void {
  if (typeof window === 'undefined') return;
  
  const handleKeyPress = (event: KeyboardEvent) => {
    // Only trigger if Ctrl+Shift is held (to avoid conflicts)
    if (!event.ctrlKey || !event.shiftKey) return;
    
    switch (event.key) {
      case 'H': // Ctrl+Shift+H - Show home state info
        event.preventDefault();
        const state = getHomeState();
        console.log('🏠 Home State Debug Info:', {
          isInHomeState: state.isInHomeState,
          openOverlays: state.openOverlays,
          lastStateChangeAt: state.lastStateChangeAt,
          shouldAllowBumpers: shouldAllowBumpers()
        });
        break;
        
      case 'T': // Ctrl+Shift+T - Reset to home state (T for "Tool reset")
        event.preventDefault();
        resetToHomeState();
        console.log('🏠 Home State Reset - Tool is now in home state');
        break;
        
      case 'O': // Ctrl+Shift+O - List open overlays
        event.preventDefault();
        const overlays = getOpenOverlays();
        console.log('🏠 Currently Open Overlays:', overlays.length ? overlays : 'None - in home state');
        break;
    }
  };
  
  // Only add listener once
  if (!(window as any).__homeStateKeyboardListenerAdded) {
    window.addEventListener('keydown', handleKeyPress);
    (window as any).__homeStateKeyboardListenerAdded = true;
    console.log('🏠 Home State Development Shortcuts Added:');
    console.log('   Ctrl+Shift+H - Show home state info');
    console.log('   Ctrl+Shift+T - Reset to home state');  
    console.log('   Ctrl+Shift+O - List open overlays');
  }
}
