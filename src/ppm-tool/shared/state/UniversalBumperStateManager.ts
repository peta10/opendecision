'use client';

/**
 * Universal Bumper State Manager
 * Ensures consistent state management across all browsers, devices, and environments
 * Optimized for panoramic-solutions.com production domain
 */

export interface BumperState {
  // Timing
  toolOpenedAt: string | null;
  initialTimerComplete: boolean;
  mouseStoppedAt: string | null;
  mouseMovementTimerComplete: boolean;
  
  // User Actions
  hasClickedIntoGuidedRankings: boolean;
  hasClickedIntoComparisonReport: boolean;
  guidedRankingsOpenedAt: string | null;
  guidedRankingsClosedAt: string | null;
  comparisonReportOpenedAt: string | null;
  comparisonReportClosedAt: string | null;
  
  // Bumper States
  productBumperShown: boolean;
  productBumperDismissed: boolean;
  productBumperDismissedAt: string | null;
  exitIntentShown: boolean;
  exitIntentDismissed: boolean;
  exitIntentDismissedAt: string | null;
  
  // Current State
  isAnyBumperCurrentlyOpen: boolean;
  isGuidedRankingsCurrentlyOpen: boolean;
  isComparisonReportCurrentlyOpen: boolean;
  
  // Metadata
  stateVersion: string;
  lastUpdated: string;
  sessionId: string;
}

const STATE_VERSION = '2.0.0';
const STATE_KEY = 'universalBumperState';

// Storage adapters with fallback chain
class StorageAdapter {
  private static testStorage(storage: Storage): boolean {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      const result = storage.getItem(testKey) === 'test';
      storage.removeItem(testKey);
      return result;
    } catch {
      return false;
    }
  }

  static getAvailableStorage(): Storage | null {
    // Try localStorage first
    if (typeof window !== 'undefined' && window.localStorage && this.testStorage(window.localStorage)) {
      return window.localStorage;
    }
    
    // Fallback to sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage && this.testStorage(window.sessionStorage)) {
      return window.sessionStorage;
    }
    
    return null;
  }
}

// In-memory fallback for when storage is blocked
class MemoryStorage {
  private static data: Map<string, string> = new Map();
  
  static setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  
  static getItem(key: string): string | null {
    return this.data.get(key) || null;
  }
  
  static removeItem(key: string): void {
    this.data.delete(key);
  }
  
  static clear(): void {
    this.data.clear();
  }
}

export class UniversalBumperStateManager {
  private static instance: UniversalBumperStateManager;
  private storage: Storage | null = null;
  private useMemoryFallback = false;
  
  private constructor() {
    this.initializeStorage();
  }
  
  static getInstance(): UniversalBumperStateManager {
    if (!this.instance) {
      this.instance = new UniversalBumperStateManager();
    }
    return this.instance;
  }
  
  private initializeStorage(): void {
    this.storage = StorageAdapter.getAvailableStorage();
    if (!this.storage) {
      this.useMemoryFallback = true;
      console.log('🔄 Using memory storage fallback (storage blocked)');
    }
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getDefaultState(): BumperState {
    return {
      // Timing
      toolOpenedAt: new Date().toISOString(),
      initialTimerComplete: false,
      mouseStoppedAt: null,
      mouseMovementTimerComplete: false,
      
      // User Actions
      hasClickedIntoGuidedRankings: false,
      hasClickedIntoComparisonReport: false,
      guidedRankingsOpenedAt: null,
      guidedRankingsClosedAt: null,
      comparisonReportOpenedAt: null,
      comparisonReportClosedAt: null,
      
      // Bumper States
      productBumperShown: false,
      productBumperDismissed: false,
      productBumperDismissedAt: null,
      exitIntentShown: false,
      exitIntentDismissed: false,
      exitIntentDismissedAt: null,
      
      // Current State
      isAnyBumperCurrentlyOpen: false,
      isGuidedRankingsCurrentlyOpen: false,
      isComparisonReportCurrentlyOpen: false,
      
      // Metadata
      stateVersion: STATE_VERSION,
      lastUpdated: new Date().toISOString(),
      sessionId: this.generateSessionId()
    };
  }
  
  getState(): BumperState {
    try {
      let stateStr: string | null = null;
      
      if (this.useMemoryFallback) {
        stateStr = MemoryStorage.getItem(STATE_KEY);
      } else if (this.storage) {
        stateStr = this.storage.getItem(STATE_KEY);
      }
      
      if (!stateStr) {
        return this.getDefaultState();
      }
      
      const state = JSON.parse(stateStr) as BumperState;
      
      // Version migration
      if (state.stateVersion !== STATE_VERSION) {
        console.log('🔄 Migrating bumper state to new version');
        return this.getDefaultState();
      }
      
      return state;
    } catch (error) {
      console.warn('Failed to parse bumper state, using default:', error);
      return this.getDefaultState();
    }
  }
  
  setState(updates: Partial<BumperState>): void {
    try {
      const currentState = this.getState();
      const newState: BumperState = {
        ...currentState,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      const stateStr = JSON.stringify(newState);
      
      if (this.useMemoryFallback) {
        MemoryStorage.setItem(STATE_KEY, stateStr);
      } else if (this.storage) {
        this.storage.setItem(STATE_KEY, stateStr);
      }
    } catch (error) {
      console.warn('Failed to save bumper state:', error);
    }
  }
  
  clearState(): void {
    try {
      if (this.useMemoryFallback) {
        MemoryStorage.removeItem(STATE_KEY);
      } else if (this.storage) {
        this.storage.removeItem(STATE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear bumper state:', error);
    }
  }
  
  // Timing methods
  recordInitialTimerComplete(): void {
    this.setState({ initialTimerComplete: true });
  }
  
  recordMouseStopped(): void {
    this.setState({ 
      mouseStoppedAt: new Date().toISOString(),
      mouseMovementTimerComplete: false 
    });
  }
  
  recordMouseMovementTimerComplete(): void {
    this.setState({ mouseMovementTimerComplete: true });
  }
  
  // User action methods
  recordGuidedRankingsClick(): void {
    this.setState({ hasClickedIntoGuidedRankings: true });
  }
  
  recordComparisonReportClick(): void {
    this.setState({ hasClickedIntoComparisonReport: true });
  }
  
  recordGuidedRankingsOpened(): void {
    this.setState({ 
      guidedRankingsOpenedAt: new Date().toISOString(),
      isGuidedRankingsCurrentlyOpen: true 
    });
  }
  
  recordGuidedRankingsClosed(): void {
    this.setState({ 
      guidedRankingsClosedAt: new Date().toISOString(),
      isGuidedRankingsCurrentlyOpen: false,
      // Reset mouse tracking to restart 3s timer for Exit Intent eligibility
      mouseStoppedAt: null,
      mouseMovementTimerComplete: false
    });
    
    console.log('🔍 Guided Rankings closed - mouse tracking reset for Exit Intent (need 3s stopped + 23s delay)');
  }
  
  recordComparisonReportOpened(): void {
    this.setState({ 
      comparisonReportOpenedAt: new Date().toISOString(),
      isComparisonReportCurrentlyOpen: true 
    });
  }
  
  recordComparisonReportClosed(submitted: boolean = false): void {
    const state = this.getState();
    this.setState({ 
      // Only set permanent block if form was submitted successfully
      // If user just closes without submitting, allow Exit Intent to show again
      comparisonReportClosedAt: submitted ? new Date().toISOString() : null,
      isComparisonReportCurrentlyOpen: false,
      // Reset Product Bumper eligibility if user never clicked GR
      productBumperShown: state.hasClickedIntoGuidedRankings ? state.productBumperShown : false,
      productBumperDismissed: state.hasClickedIntoGuidedRankings ? state.productBumperDismissed : false
    });
  }
  
  // Bumper methods
  recordProductBumperShown(): void {
    this.setState({ 
      productBumperShown: true,
      isAnyBumperCurrentlyOpen: true 
    });
  }
  
  recordProductBumperDismissed(): void {
    this.setState({ 
      productBumperDismissed: true,
      productBumperDismissedAt: new Date().toISOString(),
      isAnyBumperCurrentlyOpen: false 
    });
  }
  
  recordExitIntentShown(): void {
    this.setState({ 
      exitIntentShown: true,
      isAnyBumperCurrentlyOpen: true 
    });
  }
  
  recordExitIntentDismissed(): void {
    this.setState({ 
      exitIntentDismissed: true,
      exitIntentDismissedAt: new Date().toISOString(),
      isAnyBumperCurrentlyOpen: false 
    });
  }
}

// Singleton instance
export const stateManager = UniversalBumperStateManager.getInstance();
