'use client';

/**
 * Universal Bumper Engine
 * Production-safe bumper system that works across all browsers and environments
 * Optimized for panoramic-solutions.com production domain
 */

import { stateManager, BumperState } from '../state/UniversalBumperStateManager';
import { capabilityDetector, BrowserCapabilities } from '../state/BrowserCapabilityDetector';
import { shouldAllowBumpers } from '../utils/homeState';

// Timing constants (10 seconds for Product Bumper)
const TIMING_CONSTANTS = {
  INITIAL_TIMER_MS: 10000, // 10 seconds
  MOUSE_MOVEMENT_TIMER_MS: 3000, // 3 seconds
  EXIT_INTENT_TIMER_MS: 60000, // 1 minute (changed from 2 minutes)
  POST_BUMPER_DELAY_MS: 23000, // 23 seconds (cross-bumper cooldown)
};

export interface BumperTriggerCallbacks {
  onProductBumperTrigger?: () => void;
  onExitIntentBumperTrigger?: (triggerType: 'mouse-leave' | 'tab-switch') => void;
}

export class UniversalBumperEngine {
  private static instance: UniversalBumperEngine;
  private initialized = false;
  private hydrated = false;
  private capabilities: BrowserCapabilities | null = null;
  private callbacks: BumperTriggerCallbacks = {};
  
  // Timers
  private initialTimer: NodeJS.Timeout | null = null;
  private mouseStoppedTimer: NodeJS.Timeout | null = null;
  private exitIntentTimer: NodeJS.Timeout | null = null;
  
  // Event listeners
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseLeaveHandler: ((e: MouseEvent) => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  
  // Mouse tracking
  private lastMousePosition = { x: 0, y: 0 };
  private mouseMoveTimeout: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): UniversalBumperEngine {
    if (!this.instance) {
      this.instance = new UniversalBumperEngine();
    }
    return this.instance;
  }
  
  async initialize(callbacks: BumperTriggerCallbacks = {}): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Wait for hydration
      if (typeof window === 'undefined') {
        return;
      }
      
      // Detect browser capabilities with error handling
      try {
        this.capabilities = await capabilityDetector.detect();
      } catch (capabilityError) {
        console.warn('Browser capability detection failed, using defaults:', capabilityError);
        this.capabilities = {
          localStorage: true,
          sessionStorage: true,
          setTimeout: true,
          addEventListener: true,
          querySelector: true,
          createElement: true,
          intersectionObserver: false,
          requestAnimationFrame: true,
          userAgent: 'fallback',
          browserName: 'unknown',
          isMobile: false,
          isTablet: false,
          overallScore: 0.8 // Default to working state
        };
      }
      
      this.callbacks = callbacks;
      
      // Check if we can run at all (more lenient)
      if (this.capabilities.overallScore < 0.3) {
        return;
      }
      
      // Mark as hydrated and initialized
      this.hydrated = true;
      this.initialized = true;
      
      // Start the system with error handling
      try {
        this.startTimers();
        this.setupEventListeners();
      } catch (setupError) {
        console.warn('Bumper engine setup encountered non-critical error:', setupError);
        // Continue with partial initialization
      }
      
    } catch (error) {
      console.warn('Universal Bumper Engine initialization failed silently:', error);
      // Fail silently to prevent breaking the app
    }
  }
  
  private startTimers(): void {
    if (!this.capabilities) return;
    
    const state = stateManager.getState();
    
    // Start initial timer if not already complete
    if (!state.initialTimerComplete) {
      this.startInitialTimer();
    }
    
    // Start exit intent timer if enough time has passed
    if (state.toolOpenedAt) {
      const elapsed = Date.now() - new Date(state.toolOpenedAt).getTime();
      if (elapsed >= TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS) {
        // Already past 2 minutes, exit intent is ready
      } else {
        // Start timer for remaining time
        const remaining = TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS - elapsed;
        this.exitIntentTimer = setTimeout(() => {
          console.log('✅ Exit intent 2-minute timer completed');
        }, remaining);
      }
    }
  }
  
  private startInitialTimer(): void {
    if (!this.capabilities?.setTimeout) return;
    
    console.log('⏱️ Starting initial 10s timer for bumper system');
    this.initialTimer = setTimeout(() => {
      stateManager.recordInitialTimerComplete();
      console.log('✅ Initial 10s timer completed');
      
      // Check if we should trigger Product Bumper
      this.checkProductBumperTrigger();
    }, TIMING_CONSTANTS.INITIAL_TIMER_MS);
  }
  
  private setupEventListeners(): void {
    if (!this.capabilities?.addEventListener || typeof document === 'undefined') return;
    
    // Mouse movement tracking with error handling
    this.mouseMoveHandler = (e: MouseEvent) => {
      try {
        this.handleMouseMove(e);
      } catch (error) {
        // Silently handle mouse move errors to prevent console spam
      }
    };
    
    // DISABLED: Exit intent detection is handled by useUnifiedExitIntent hook
    // which includes proper criteria checking (3+ criteria adjusted requirement)
    // Commented out to prevent duplicate triggers without criteria check
    // this.mouseLeaveHandler = (e: MouseEvent) => {
    //   try {
    //     this.handleMouseLeave(e);
    //   } catch (error) {
    //     // Silently handle mouse leave errors
    //   }
    // };
    
    // DISABLED: Tab switch detection is handled by useUnifiedExitIntent hook
    // which includes proper criteria checking (3+ criteria adjusted requirement)
    // this.visibilityChangeHandler = () => {
    //   try {
    //     this.handleVisibilityChange();
    //   } catch (error) {
    //     // Silently handle visibility change errors
    //   }
    // };
    
    // Add event listeners with comprehensive error handling
    try {
      document.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
    } catch (error) {
      // Mousemove failed, continue without it
    }
    
    // DISABLED: Let useUnifiedExitIntent hook handle mouse leave with criteria check
    // try {
    //   document.addEventListener('mouseleave', this.mouseLeaveHandler);
    // } catch (error) {
    //   // Mouse leave failed, continue without it
    // }
    
    // DISABLED: Let useUnifiedExitIntent hook handle visibility change with criteria check
    // try {
    //   document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    // } catch (error) {
    //   // Visibility change failed, continue without it
    // }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    this.lastMousePosition = { x: e.clientX, y: e.clientY };
    
    // Clear existing timeout
    if (this.mouseMoveTimeout) {
      clearTimeout(this.mouseMoveTimeout);
    }
    
    // Set new timeout to detect when mouse stops
    this.mouseMoveTimeout = setTimeout(() => {
      this.handleMouseStopped();
    }, 500); // 500ms of no movement = stopped
  }
  
  private handleMouseStopped(): void {
    stateManager.recordMouseStopped();
    
    // Start 3-second timer
    this.mouseStoppedTimer = setTimeout(() => {
      stateManager.recordMouseMovementTimerComplete();
      console.log('✅ Mouse movement 3s timer completed');
      
      // Check if we should trigger Product Bumper
      this.checkProductBumperTrigger();
    }, TIMING_CONSTANTS.MOUSE_MOVEMENT_TIMER_MS);
  }
  
  private handleMouseLeave(e: MouseEvent): void {
    // DISABLED: Mouse leave detection is handled by useUnifiedExitIntent hook
    // which includes proper criteria checking (3+ criteria adjusted requirement)
    // This prevents duplicate triggers without criteria validation
    return;
  }
  
  private handleVisibilityChange(): void {
    // DISABLED: Tab switch detection is handled by useUnifiedExitIntent hook
    // which includes proper criteria checking (3+ criteria adjusted requirement)
    return;
  }
  
  private checkProductBumperTrigger(): void {
    if (!this.shouldShowProductBumper()) return;
    
    console.log('🎯 Triggering Product Bumper');
    this.callbacks.onProductBumperTrigger?.();
  }
  
  private checkExitIntentTrigger(triggerType: 'mouse-leave' | 'tab-switch'): void {
    if (!this.shouldShowExitIntentBumper()) return;
    
    console.log('🚪 Triggering Exit Intent Bumper:', triggerType);
    this.callbacks.onExitIntentBumperTrigger?.(triggerType);
  }
  
  shouldShowProductBumper(): boolean {
    // PRIORITY CHECK: Must be in home state (no overlays open)
    if (!shouldAllowBumpers()) {
      return false;
    }
    
    const state = stateManager.getState();
    const now = Date.now();
    
    // Never show if already dismissed
    if (state.productBumperDismissed) return false;
    
    // Never show if already shown
    if (state.productBumperShown) return false;
    
    // Never show if user clicked into Guided Rankings
    if (state.hasClickedIntoGuidedRankings) return false;
    
    // Never show if any bumper is currently open
    if (state.isAnyBumperCurrentlyOpen) return false;
    
    // Never show if Guided Rankings is open
    if (state.isGuidedRankingsCurrentlyOpen) return false;
    
    // Never show if Comparison Report is open
    if (state.isComparisonReportCurrentlyOpen) return false;
    
    // Cross-bumper cooldown: if Exit-Intent was recently dismissed, wait 23s
    if (state.exitIntentDismissedAt) {
      const sinceExitDismiss = now - new Date(state.exitIntentDismissedAt).getTime();
      if (sinceExitDismiss < TIMING_CONSTANTS.POST_BUMPER_DELAY_MS) {
        return false;
      }
    }
    
    // Must have initial timer complete
    if (!state.initialTimerComplete) return false;
    
    // Must have mouse movement timer complete
    if (!state.mouseMovementTimerComplete) return false;
    
    // If user opened and closed Comparison Report, check timing
    if (state.comparisonReportClosedAt) {
      const sinceReportClosed = now - new Date(state.comparisonReportClosedAt).getTime();
      if (sinceReportClosed < TIMING_CONSTANTS.INITIAL_TIMER_MS) {
        return false;
      }
    }
    
    return true;
  }
  
  shouldShowExitIntentBumper(): boolean {
    // PRIORITY CHECK: Must be in home state (no overlays open)
    if (!shouldAllowBumpers()) {
      console.log('🚫 Exit Intent blocked - not in home state (overlay open)');
      return false;
    }
    
    const state = stateManager.getState();
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
    
    // Never show if Guided Rankings is CURRENTLY open (but allow after it closes)
    if (state.isGuidedRankingsCurrentlyOpen) {
      console.log('🚫 Exit Intent blocked - Guided Rankings is currently open');
      return false;
    }
    
    // Never show if Comparison Report is CURRENTLY open
    if (state.isComparisonReportCurrentlyOpen) {
      console.log('🚫 Exit Intent blocked - Comparison Report is currently open');
      return false;
    }
    
    // Cross-bumper cooldown: if Product Bumper was recently dismissed, wait 23s
    if (state.productBumperDismissedAt) {
      const sinceProductDismiss = now - new Date(state.productBumperDismissedAt).getTime();
      if (sinceProductDismiss < TIMING_CONSTANTS.POST_BUMPER_DELAY_MS) {
        return false;
      }
    }
    
    // SCENARIO 1: After Guided Rankings closes (Table Row 3)
    // Show after 23s delay + 3s mouse stopped + respect 2min rule
    if (state.guidedRankingsClosedAt && !state.comparisonReportClosedAt) {
      const sinceGRClosed = now - new Date(state.guidedRankingsClosedAt).getTime();
      
      // Must wait 23s after GR closed
      if (sinceGRClosed < TIMING_CONSTANTS.POST_BUMPER_DELAY_MS) {
        return false;
      }
      
      // Must have mouse stopped for 3s (tracked by mouse tracking hook)
      if (!state.mouseMovementTimerComplete) {
        return false;
      }
      
      // Still respect 1min minimum since tool opened
      if (state.toolOpenedAt) {
        const timeSinceOpened = now - new Date(state.toolOpenedAt).getTime();
        if (timeSinceOpened < TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS) {
          return false;
        }
      }
      
      console.log('✅ Exit Intent eligible: Post-Guided-Rankings scenario (23s + 3s + 1min)');
      return true;
    }
    
    // SCENARIO 2: Normal usage - user stays on page without GR or CR interaction (Table Row 5)
    // Auto-trigger after 1min OR when user tries to leave
    if (!state.guidedRankingsClosedAt && !state.comparisonReportClosedAt) {
      // Must be at least 1 minute since tool opened
      if (state.toolOpenedAt) {
        const timeSinceOpened = now - new Date(state.toolOpenedAt).getTime();
        if (timeSinceOpened < TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS) {
          return false;
        }
      }
      
      console.log('✅ Exit Intent eligible: Normal usage (1min auto-trigger)');
      return true;
    }
    
    return false;
  }
  
  // Manual trigger methods (for testing)
  triggerProductBumper(bypassRules = false): void {
    if (bypassRules || this.shouldShowProductBumper()) {
      console.log('🎯 Manually triggering Product Bumper');
      this.callbacks.onProductBumperTrigger?.();
    }
  }
  
  triggerExitIntentBumper(triggerType: 'mouse-leave' | 'tab-switch' = 'mouse-leave', bypassRules = false): void {
    if (bypassRules || this.shouldShowExitIntentBumper()) {
      console.log('🚪 Manually triggering Exit Intent Bumper');
      this.callbacks.onExitIntentBumperTrigger?.(triggerType);
    }
  }
  
  // Cleanup
  destroy(): void {
    // Clear timers
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.mouseStoppedTimer) clearTimeout(this.mouseStoppedTimer);
    if (this.exitIntentTimer) clearTimeout(this.exitIntentTimer);
    if (this.mouseMoveTimeout) clearTimeout(this.mouseMoveTimeout);
    
    // Remove event listeners
    if (typeof document !== 'undefined') {
      if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler);
      if (this.mouseLeaveHandler) document.removeEventListener('mouseleave', this.mouseLeaveHandler);
      if (this.visibilityChangeHandler) document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    this.initialized = false;
    this.hydrated = false;
  }
  
  // Status for debugging
  getStatus() {
    return {
      initialized: this.initialized,
      hydrated: this.hydrated,
      capabilities: this.capabilities,
      state: stateManager.getState(),
      shouldShowProduct: this.shouldShowProductBumper(),
      shouldShowExitIntent: this.shouldShowExitIntentBumper()
    };
  }
}

export const universalBumperEngine = UniversalBumperEngine.getInstance();
