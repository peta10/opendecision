/**
 * Unified Exit Intent Hook
 * Integrates with the unified bumper state management system
 * Handles both ProductBumper and ExitIntentBumper triggering based on complex timing rules
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  shouldShowProductBumper,
  shouldShowExitIntentBumper,
  getUnifiedBumperState,
  getUnifiedBumperTimingConstants
} from '../utils/unifiedBumperState';
import { shouldAllowBumpers } from '../utils/homeState';

interface UseUnifiedExitIntentOptions {
  enabled?: boolean;
  isTouchDevice?: boolean;
  hasMinimumCriteriaAdjusted?: boolean; // NEW: Check if 3+ criteria adjusted
  onTriggerProductBumper?: () => void;
  onTriggerExitIntentBumper?: (triggerType: 'mouse-leave' | 'tab-switch') => void;
}

interface BrowserInfo {
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isTouchDevice: boolean;
}

const getBrowserInfo = (): BrowserInfo => {
  if (typeof window === 'undefined') {
    return { isChrome: false, isFirefox: false, isSafari: false, isEdge: false, isTouchDevice: false };
  }
  
  const userAgent = navigator.userAgent;
  const isEdgeDetected = /Edg/.test(userAgent);
  
  // Enhanced Edge detection for better Utah/Edge compatibility
  console.log(`🌐 Exit Intent Browser Detection: ${isEdgeDetected ? 'Microsoft Edge' : 'Other'} | UA: ${userAgent.substring(0, 50)}...`);
  
  return {
    isChrome: /Chrome/.test(userAgent) && !/Edg/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isEdge: isEdgeDetected,
    isTouchDevice: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent)
  };
};

export function useUnifiedExitIntent(options: UseUnifiedExitIntentOptions = {}) {
  const { enabled = true, isTouchDevice = false, hasMinimumCriteriaAdjusted = false, onTriggerProductBumper, onTriggerExitIntentBumper } = options;
  
  const [hasTriggeredProductBumper, setHasTriggeredProductBumper] = useState(false);
  const [hasTriggeredExitIntent, setHasTriggeredExitIntent] = useState(false);
  // REMOVED: const [isTouchDevice, setIsMobile] = useState(false);
  const [browserInfo] = useState(getBrowserInfo());
  
  const mouseLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0, time: 0 });
  const checkTimersRef = useRef<NodeJS.Timeout | null>(null);
  
  const { EXIT_INTENT_TIMER_MS } = getUnifiedBumperTimingConstants();
  
  // REMOVED: Mobile detection useEffect - now using passed isTouchDevice parameter
  
  // Periodic check for timing-based triggers
  useEffect(() => {
    if (!enabled || isTouchDevice) return;
    
    const checkTimingBasedTriggers = () => {
      // Check if Product Bumper should be shown
      if (!hasTriggeredProductBumper && shouldShowProductBumper()) {
        console.log('🎯 Triggering Product Bumper via timing check');
        setHasTriggeredProductBumper(true);
        onTriggerProductBumper?.();
        return; // Don't check for exit intent if we're showing product bumper
      }
      
      // SIMPLIFIED: Simple 1-minute auto-show for Exit Intent
      // Shows automatically after 1 minute if in home state and button wasn't clicked before 1min
      if (!hasTriggeredExitIntent) {
        const state = getUnifiedBumperState();
        const now = Date.now();
        const toolOpenedAt = state.toolOpenedAt ? new Date(state.toolOpenedAt).getTime() : Date.now();
        const timeOnPage = now - toolOpenedAt;
        
        // Must be at least 1 minute
        if (timeOnPage < EXIT_INTENT_TIMER_MS) {
          return;
        }
        
        // Must be in home state (main state)
        if (!shouldAllowBumpers()) {
          return;
        }
        
        // Check if user clicked "Get My Free Comparison Report" button before 1 minute
        if (state.comparisonReportOpenedAt) {
          const reportOpenedAt = new Date(state.comparisonReportOpenedAt).getTime();
          const timeWhenReportOpened = reportOpenedAt - toolOpenedAt;
          
          // If they clicked the button before 1 minute passed, don't show Exit Intent
          if (timeWhenReportOpened < EXIT_INTENT_TIMER_MS) {
            console.log('🚫 Exit Intent blocked - user clicked button before 1 minute');
            return;
          }
        }
        
        // Check other basic blocks (already dismissed/shown)
        if (state.exitIntentDismissed || state.exitIntentShown) {
          return;
        }
        
        // Check if already showing
        if (state.isAnyBumperCurrentlyOpen) {
          return;
        }
        
        // Also check shouldShowExitIntentBumper for any other blocks
        if (!shouldShowExitIntentBumper()) {
          return;
        }
        
        // Show Exit Intent automatically after 1 minute
        console.log('✅ Auto-showing Exit Intent Bumper after 1 minute');
        setHasTriggeredExitIntent(true);
        onTriggerExitIntentBumper?.('tab-switch');
      }
    };
    
    // Check every 1 second
    checkTimersRef.current = setInterval(checkTimingBasedTriggers, 1000);
    
    return () => {
      if (checkTimersRef.current) {
        clearInterval(checkTimersRef.current);
      }
    };
  }, [enabled, isTouchDevice, hasTriggeredProductBumper, hasTriggeredExitIntent, EXIT_INTENT_TIMER_MS, onTriggerProductBumper, onTriggerExitIntentBumper]);
  
  // Mouse leave detection for exit intent
  useEffect(() => {
    if (!enabled || hasTriggeredExitIntent || isTouchDevice) return;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // KEY FIX: Get last known position BEFORE mouse left document
      // This is critical because e.clientY might be unreliable when mouse is in browser chrome
      const lastPos = lastMousePositionRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Use last known position (more reliable than e.clientY when mouse is in browser chrome)
      const y = lastPos.y !== undefined ? lastPos.y : (e.clientY ?? 0);
      const x = lastPos.x !== undefined ? lastPos.x : (e.clientX ?? 0);
      
      // Browser-specific adjustments
      let exitThreshold = 0;
      if (browserInfo.isSafari) {
        exitThreshold = -5;
      } else if (browserInfo.isFirefox) {
        exitThreshold = -2;
      }
      
      // Exit detection conditions - CHECK LAST KNOWN POSITION
      const conditions = [
        y <= exitThreshold || lastPos.y <= 100, // Top exit - check last position!
        (y <= 100 && (x <= 100 || x >= viewportWidth - 100)), // Corner exits
        (lastPos.y <= 100 && (lastPos.x <= 100 || lastPos.x >= viewportWidth - 100)), // Corner exits using last position
        (y <= 150 && (x <= exitThreshold || x >= viewportWidth - exitThreshold)) // Side exits near top
      ];
      
      // Debug logging - MOVED BEFORE shouldShow check to always see what's happening
      console.log('🖱️ [EXIT_INTENT_DEBUG] Mouse Leave Event:', {
        eventClientY: e.clientY,
        eventClientX: e.clientX,
        lastKnownY: lastPos.y,
        lastKnownX: lastPos.x,
        usingLastPosition: lastPos.y !== undefined,
        conditionsMet: conditions.some(c => c),
        viewportHeight,
        shouldShow: shouldShowExitIntentBumper() // Check but log it
      });
      
      // Only trigger exit intent if it should be shown (after 1 minute)
      if (!shouldShowExitIntentBumper()) {
        console.log('⏸️ [EXIT_INTENT_DEBUG] Mouse leave blocked - shouldShowExitIntentBumper() returned false');
        return;
      }
      
      if (conditions.some(condition => condition)) {
        console.log('🚪 Triggering Exit Intent Bumper via mouse leave (top edge detected)');
        setHasTriggeredExitIntent(true);
        onTriggerExitIntentBumper?.('mouse-leave');
      } else {
        console.log('⚠️ [EXIT_INTENT_DEBUG] Mouse leave conditions not met - not triggering');
      }
    };
    
    // Add event listener
    try {
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    } catch (e) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, hasTriggeredExitIntent, isTouchDevice, browserInfo, onTriggerExitIntentBumper]);
  
  // Tab switch detection for exit intent
  useEffect(() => {
    if (!enabled || hasTriggeredExitIntent || isTouchDevice) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && shouldShowExitIntentBumper()) {
        console.log('🚪 Triggering Exit Intent Bumper via tab switch');
        setHasTriggeredExitIntent(true);
        onTriggerExitIntentBumper?.('tab-switch');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, hasTriggeredExitIntent, isTouchDevice, onTriggerExitIntentBumper]);
  
  // Mouse movement tracking for enhanced exit detection - IMPROVED TOP BAR DETECTION
  useEffect(() => {
    if (!enabled || hasTriggeredExitIntent || isTouchDevice) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const currentPos = { x: e.clientX, y: e.clientY, time: currentTime };
      const lastPos = lastMousePositionRef.current;
      
      // Calculate movement velocity
      const timeDiff = currentTime - lastPos.time;
      const yMovement = timeDiff > 0 ? (currentPos.y - lastPos.y) / timeDiff : 0;
      const xMovement = timeDiff > 0 ? (currentPos.x - lastPos.x) / timeDiff : 0;
      
      // Debug: Log mouse position every 500ms for testing
      if (timeDiff > 500 || lastPos.time === 0) {
        console.log('🖱️ [EXIT_INTENT_DEBUG] Mouse Position:', {
          x: currentPos.x,
          y: currentPos.y,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          yMovement: yMovement.toFixed(2),
          xMovement: xMovement.toFixed(2),
          timeSinceLastUpdate: timeDiff
        });
      }
      
      lastMousePositionRef.current = currentPos;
      
      // Enhanced top bar detection zones
      // Top bar zone: Entire top area (not just corners) - for tabs, bookmarks, address bar, etc.
      const topBarHeight = browserInfo.isSafari ? 120 : 
                           browserInfo.isFirefox ? 110 : 
                           browserInfo.isEdge ? 105 : 100; // Increased detection zone
      
      const topRightCorner = browserInfo.isSafari ? 120 : 
                             browserInfo.isFirefox ? 110 : 
                             browserInfo.isEdge ? 105 : 100; // Top-right corner detection
      
      const topLeftCorner = browserInfo.isSafari ? 120 : 
                            browserInfo.isFirefox ? 110 : 
                            browserInfo.isEdge ? 105 : 100; // Top-left corner detection
      
      const headerZone = window.innerWidth < 768 ? 144 : 152; // Header within page
      
      // Detection zones - ENHANCED for entire top bar
      const zones = {
        // Top bar zone: Entire top area (for tabs, bookmarks, address bar, etc.)
        topBar: currentPos.y <= topBarHeight,
        
        // Top-right corner zone (X button, close button)
        topRightCorner: currentPos.y <= topRightCorner && 
                       currentPos.x >= window.innerWidth - 100, // 100px from right edge
        
        // Top-left corner zone (menu, new tab, etc.)
        topLeftCorner: currentPos.y <= topLeftCorner && 
                      currentPos.x <= 100, // 100px from left edge
        
        // Rapid upward movement (moving toward top bar)
        rapidUpward: yMovement < -0.3 && currentPos.y <= 200, // Less aggressive threshold
        
        // Header zone (within page content)
        header: currentPos.y <= headerZone && currentPos.y > topBarHeight
      };
      
      // Debug: Log which zones are active
      const activeZones = Object.entries(zones)
        .filter(([_, active]) => active)
        .map(([name, _]) => name);
      
      if (activeZones.length > 0) {
        console.log('📍 [EXIT_INTENT_DEBUG] Active Zones:', {
          zones: activeZones,
          position: { x: currentPos.x, y: currentPos.y },
          velocity: { y: yMovement.toFixed(2), x: xMovement.toFixed(2) }
        });
      }
      
      // Check timer requirement first
      const state = getUnifiedBumperState();
      const toolOpenedAt = state.toolOpenedAt ? new Date(state.toolOpenedAt).getTime() : Date.now();
      const timeOnPage = Date.now() - toolOpenedAt;
      const timeOnPageSeconds = Math.floor(timeOnPage / 1000);
      const timerRequirementMet = timeOnPage >= EXIT_INTENT_TIMER_MS;
      
      // Debug: Log timer status
      if (activeZones.length > 0 && timeDiff > 1000) {
        console.log('⏱️ [EXIT_INTENT_DEBUG] Timer Check:', {
          timeOnPageSeconds: `${timeOnPageSeconds}s`,
          requiredSeconds: `${Math.floor(EXIT_INTENT_TIMER_MS / 1000)}s`,
          timerMet: timerRequirementMet,
          toolOpenedAt: state.toolOpenedAt || 'not set'
        });
      }
      
      // Check if should show (includes criteria check)
      const shouldShow = shouldShowExitIntentBumper();
      
      // Debug: Log shouldShow result with reasons
      if (activeZones.length > 0 && timeDiff > 1000) {
        console.log('✅ [EXIT_INTENT_DEBUG] Should Show Check:', {
          shouldShow,
          timerMet: timerRequirementMet,
          hasTriggeredExitIntent,
          // Log why it might be blocked
          blockedReasons: !shouldShow ? 'Check console logs above for blocking reasons' : 'None - should trigger'
        });
      }
      
      // Determine trigger zone and delay based on priority
      let delay = 0;
      let zone = '';
      
      // Priority 1: Top bar (entire top area) - fastest trigger
      if (zones.topBar) {
        delay = 300; // Reduced delay for top bar
        zone = 'top-bar';
      }
      // Priority 2: Top-right corner (X button)
      else if (zones.topRightCorner) {
        delay = 400;
        zone = 'top-right-corner';
      }
      // Priority 3: Top-left corner
      else if (zones.topLeftCorner) {
        delay = 500;
        zone = 'top-left-corner';
      }
      // Priority 4: Rapid upward movement
      else if (zones.rapidUpward) {
        delay = 600;
        zone = 'rapid-upward';
      }
      // Priority 5: Header zone
      else if (zones.header) {
        delay = 1000;
        zone = 'header';
      }
      
      // Clear existing timeout if mouse moves out of zones
      if (delay === 0 && mouseLeaveTimeoutRef.current) {
        console.log('🔄 [EXIT_INTENT_DEBUG] Clearing timeout - mouse moved out of trigger zones');
        clearTimeout(mouseLeaveTimeoutRef.current);
        mouseLeaveTimeoutRef.current = null;
        return;
      }
      
      // Only set timeout if in a trigger zone AND all conditions met (timer + shouldShow)
      if (delay > 0 && timerRequirementMet && shouldShow && !hasTriggeredExitIntent) {
        // Clear existing timeout before setting new one
        if (mouseLeaveTimeoutRef.current) {
          clearTimeout(mouseLeaveTimeoutRef.current);
        }
        
        console.log(`⏳ [EXIT_INTENT_DEBUG] Setting trigger timeout:`, {
          zone,
          delayMs: delay,
          willTriggerIn: `${delay}ms`,
          conditionsMet: {
            timerMet: true,
            shouldShow: true,
            notTriggered: !hasTriggeredExitIntent
          }
        });
        
        mouseLeaveTimeoutRef.current = setTimeout(() => {
          // Double-check conditions before triggering
          const finalCheck = shouldShowExitIntentBumper();
          const finalState = getUnifiedBumperState();
          const finalTimeOnPage = Date.now() - (finalState.toolOpenedAt ? new Date(finalState.toolOpenedAt).getTime() : Date.now());
          
          console.log(`🚪 [EXIT_INTENT_DEBUG] Trigger timeout fired:`, {
            zone,
            finalCheck,
            finalTimeOnPageSeconds: Math.floor(finalTimeOnPage / 1000),
            triggering: finalCheck && finalTimeOnPage >= EXIT_INTENT_TIMER_MS && !hasTriggeredExitIntent
          });
          
          if (finalCheck && finalTimeOnPage >= EXIT_INTENT_TIMER_MS && !hasTriggeredExitIntent) {
            console.log(`✅ [EXIT_INTENT_DEBUG] TRIGGERING Exit Intent Bumper via mouse movement (${zone})`);
            setHasTriggeredExitIntent(true);
            onTriggerExitIntentBumper?.('mouse-leave');
          } else {
            console.log(`❌ [EXIT_INTENT_DEBUG] Trigger blocked - conditions changed:`, {
              finalCheck,
              timerMet: finalTimeOnPage >= EXIT_INTENT_TIMER_MS,
              notTriggered: !hasTriggeredExitIntent
            });
          }
          
          mouseLeaveTimeoutRef.current = null;
        }, delay);
      } else if (delay > 0 && timeDiff > 1000) {
        // Log why timeout wasn't set
        console.log(`⚠️ [EXIT_INTENT_DEBUG] Not setting timeout - conditions not met:`, {
          zone,
          timerMet: timerRequirementMet,
          shouldShow,
          hasTriggeredExitIntent,
          reason: !timerRequirementMet ? 'Timer not met (1 minute)' :
                  !shouldShow ? 'shouldShowExitIntentBumper() returned false' :
                  hasTriggeredExitIntent ? 'Already triggered' : 'Unknown'
        });
      }
    };
    
    // Add event listener
    try {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      console.log('🎯 [EXIT_INTENT_DEBUG] Mouse movement listener attached');
    } catch (e) {
      document.addEventListener('mousemove', handleMouseMove);
      console.log('🎯 [EXIT_INTENT_DEBUG] Mouse movement listener attached (fallback)');
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
        mouseLeaveTimeoutRef.current = null;
      }
      console.log('🧹 [EXIT_INTENT_DEBUG] Mouse movement listener removed');
    };
  }, [enabled, hasTriggeredExitIntent, isTouchDevice, browserInfo, onTriggerExitIntentBumper, EXIT_INTENT_TIMER_MS]);
  
  // Reset function for testing
  const reset = useCallback(() => {
    setHasTriggeredProductBumper(false);
    setHasTriggeredExitIntent(false);
  }, []);
  
  return {
    hasTriggeredProductBumper,
    hasTriggeredExitIntent,
    browserInfo,
    reset
  };
}
