import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getExitIntentState, 
  shouldShowExitIntent, 
  incrementExitIntentShowCount,
  recordMouseLeaveTrigger,
  recordTabSwitchTrigger,
  getExitIntentTimingConstants
} from '../utils/exitIntentState';

interface UseExitIntentOptions {
  onTrigger: (triggerType: 'mouse-leave' | 'tab-switch') => void;
  enabled?: boolean;
  minTimeOnPage?: number;
}

// Browser detection utilities for cross-browser compatibility
const getBrowserInfo = () => {
  // Guard against SSR where navigator is not available
  if (typeof navigator === 'undefined') {
    return {
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
      isMobile: false
    };
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  return {
    isChrome: userAgent.includes('chrome') && !userAgent.includes('edge'),
    isFirefox: userAgent.includes('firefox'),
    isSafari: userAgent.includes('safari') && !userAgent.includes('chrome'),
    isEdge: userAgent.includes('edge') || userAgent.includes('edg/'),
    isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  };
};

export const useExitIntent = (options: UseExitIntentOptions) => {
  const [hasTriggered, setHasTriggered] = useState(false);
  const [pageLoadTime] = useState(Date.now());
  const [isMobile, setIsMobile] = useState(false);
  const [browserInfo] = useState(getBrowserInfo());
  const mouseLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0, time: 0 });
  const { MIN_TIME_ON_PAGE_MS } = getExitIntentTimingConstants();
  
  const minTimeOnPage = options.minTimeOnPage || MIN_TIME_ON_PAGE_MS;
  const enabled = options.enabled !== false;

  // Universal mobile detection (more reliable across browsers and devices)
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
      const isMobileUA = browserInfo.isMobile;
      setIsMobile(width < 768 || isTouchDevice || isMobileUA);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [browserInfo.isMobile]);

  // Universal trigger function with cross-browser logging
  const triggerExitIntent = useCallback((triggerType: 'mouse-leave' | 'tab-switch', debugInfo?: any) => {
    if (hasTriggered) return;
    
    const timeOnPage = Date.now() - pageLoadTime;
    
    if (timeOnPage >= minTimeOnPage && shouldShowExitIntent()) {
      console.log('🎯 Exit intent triggered:', triggerType, {
        browser: Object.keys(browserInfo).find(key => browserInfo[key as keyof typeof browserInfo]),
        timeOnPage: Math.round(timeOnPage / 1000) + 's',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
        viewport: { width: window.innerWidth, height: window.innerHeight },
        pixelRatio: window.devicePixelRatio,
        ...debugInfo
      });
      
      if (triggerType === 'mouse-leave') {
        recordMouseLeaveTrigger();
      } else {
        recordTabSwitchTrigger();
      }
      
      incrementExitIntentShowCount();
      setHasTriggered(true);
      options.onTrigger(triggerType);
    }
  }, [hasTriggered, pageLoadTime, minTimeOnPage, browserInfo, options]);

  // Cross-browser mouse leave detection
  useEffect(() => {
    if (!enabled || hasTriggered || isMobile) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Get normalized coordinates (account for browser differences)
      const x = e.clientX;
      const y = e.clientY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Browser-specific adjustments for more consistent behavior
      let exitThreshold = 0;
      if (browserInfo.isSafari) {
        exitThreshold = -5; // Safari reports slightly different values
      } else if (browserInfo.isFirefox) {
        exitThreshold = -2; // Firefox has different edge behavior
      }
      
      // Universal exit detection (works across all browsers)
      const conditions = [
        // Top exit (universal)
        y <= exitThreshold,
        // Corner exits (adjusted for browser chrome differences)
        (y <= 100 && (x <= 100 || x >= viewportWidth - 100)),
        // Side exits near top (browser-agnostic)
        (y <= 150 && (x <= exitThreshold || x >= viewportWidth - exitThreshold))
      ];
      
      if (conditions.some(condition => condition)) {
        triggerExitIntent('mouse-leave', {
          coordinates: { x, y },
          viewport: { width: viewportWidth, height: viewportHeight },
          exitType: y <= exitThreshold ? 'top' : 'corner',
          threshold: exitThreshold
        });
      }
    };

    // Cross-browser event listener (with passive support detection)
    const addListener = () => {
      try {
        document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
      } catch (e) {
        // Fallback for older browsers
        document.addEventListener('mouseleave', handleMouseLeave);
      }
    };

    addListener();
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, hasTriggered, isMobile, browserInfo, triggerExitIntent]);

  // Universal tab switch detection (cross-browser)
  useEffect(() => {
    if (!enabled || hasTriggered || isMobile) return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerExitIntent('tab-switch', {
          visibilityState: document.visibilityState,
          documentHidden: document.hidden
        });
      }
    };

    // Cross-browser visibility detection (covers all browsers)
    const visibilityEvents = ['visibilitychange', 'webkitvisibilitychange', 'mozvisibilitychange'];
    
    visibilityEvents.forEach(event => {
      document.addEventListener(event, handleVisibilityChange);
    });
    
    return () => {
      visibilityEvents.forEach(event => {
        document.removeEventListener(event, handleVisibilityChange);
      });
    };
  }, [enabled, hasTriggered, isMobile, triggerExitIntent]);

  // Cross-browser mouse movement detection with velocity tracking
  useEffect(() => {
    if (!enabled || hasTriggered || isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Clear existing timeout
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }

      // Get current position and calculate movement
      const currentTime = Date.now();
      const currentPos = { x: e.clientX, y: e.clientY, time: currentTime };
      const lastPos = lastMousePositionRef.current;
      
      // Calculate movement velocity (cross-browser compatible)
      const timeDiff = currentTime - lastPos.time;
      const yMovement = timeDiff > 0 ? (currentPos.y - lastPos.y) / timeDiff : 0;
      
      lastMousePositionRef.current = currentPos;
      
      // Browser-specific thresholds for consistent behavior
      const topZone = browserInfo.isSafari ? 80 : browserInfo.isFirefox ? 70 : 60;
      const cornerZone = browserInfo.isSafari ? 120 : browserInfo.isFirefox ? 110 : 100;
      const headerZone = window.innerWidth < 768 ? 144 : 152;
      
      // Universal detection zones (adjusted per browser)
      const zones = {
        browserChrome: currentPos.y <= topZone,
        topCorners: currentPos.y <= cornerZone && 
                   (currentPos.x <= 150 || currentPos.x >= window.innerWidth - 150),
        rapidUpward: currentPos.y <= 150 && yMovement < -0.5, // velocity-based
        header: currentPos.y <= headerZone
      };
      
      // Determine trigger zone and delay
      let delay = 0;
      let zone = '';
      
      if (zones.browserChrome) {
        delay = 500; // Faster for obvious exit zones
        zone = 'browser-chrome';
      } else if (zones.topCorners) {
        delay = 600;
        zone = 'top-corners';
      } else if (zones.rapidUpward) {
        delay = 700;
        zone = 'rapid-upward';
      } else if (zones.header) {
        delay = 1000;
        zone = 'header';
      }
      
      if (delay > 0) {
        mouseLeaveTimeoutRef.current = setTimeout(() => {
          triggerExitIntent('mouse-leave', {
            zone,
            coordinates: currentPos,
            movement: { yVelocity: yMovement },
            browserThresholds: { topZone, cornerZone, headerZone }
          });
        }, delay);
      }
    };

    // Cross-browser mouse move listener
    try {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    } catch (e) {
      document.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
    };
  }, [enabled, hasTriggered, isMobile, browserInfo, triggerExitIntent]);

  // Reset function for testing
  const reset = () => {
    setHasTriggered(false);
  };

  return {
    hasTriggered,
    isMobile,
    browserInfo,
    timeOnPage: Date.now() - pageLoadTime,
    reset
  };
};
