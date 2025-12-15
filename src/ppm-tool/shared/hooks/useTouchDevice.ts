import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a touch device
 * Enhanced for better cross-browser and geographic compatibility
 * @returns boolean indicating if the device supports touch
 */
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    // Initialize immediately on client-side to prevent hydration mismatch
    if (typeof window === 'undefined') return false;
    
    // Enhanced cross-browser touch detection with better compatibility
    try {
      const screenWidth = window.screen?.width || window.innerWidth;
      const screenHeight = window.screen?.height || window.innerHeight;
      const isMobileScreen = screenWidth < 768 || (screenWidth < 1024 && screenHeight < 768);
      
      // Enhanced user agent detection with better browser coverage - with SSR guard
      const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
      const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
      const vendor = typeof navigator !== 'undefined' ? (navigator.vendor || '') : '';
      
      // More comprehensive mobile/tablet detection
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
      const isTabletUserAgent = /iPad|Tablet|PlayBook|Silk/i.test(userAgent) || 
                               (platform === 'MacIntel' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1); // iPad Pro detection
      const isAndroidTablet = /Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
      
      // Touch capability detection with fallbacks
      const hasTouchEvents = 'ontouchstart' in window || 'ontouchend' in window || 'ontouchmove' in window;
      const hasMaxTouchPoints = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0);
      const hasTouch = hasTouchEvents || hasMaxTouchPoints;
      
      // CSS Media queries with better browser compatibility
      let hasHoverNone = false;
      let hasPointerCoarse = false;
      let hasHoverCapability = true;
      
      if (window.matchMedia) {
        try {
          // Test multiple media query combinations for better compatibility
          hasHoverNone = window.matchMedia('(hover: none)').matches;
          hasPointerCoarse = window.matchMedia('(pointer: coarse)').matches;
          
          // Alternative hover detection for browsers that don't support hover: hover
          const hoverSupported = window.matchMedia('(hover: hover)').matches;
          const finePointer = window.matchMedia('(pointer: fine)').matches;
          hasHoverCapability = hoverSupported || finePointer;
          
          // Additional fallback checks
          if (!hasHoverNone && !hasPointerCoarse && !hoverSupported && !finePointer) {
            // Browser doesn't support these media queries - use UA fallback
            hasHoverCapability = !isMobileUserAgent;
          }
        } catch (e) {
          // Some browsers may not support these media queries
          console.warn('Media query not supported, falling back to UA detection:', e);
          hasHoverCapability = !isMobileUserAgent;
        }
      } else {
        // No matchMedia support - very old browser, use UA detection
        hasHoverCapability = !isMobileUserAgent;
      }
      
      // More conservative approach: only disable hover tooltips for clearly touch-primary devices
      const isClearlyMobile = isMobileUserAgent && isMobileScreen;
      const isClearlyTablet = (isTabletUserAgent || isAndroidTablet) && (!hasHoverCapability || hasHoverNone);
      const isPrimaryTouchDevice = (isClearlyMobile || isClearlyTablet) && hasTouch;
      
      // For desktop computers with touch screens, prefer hover tooltips
      // Only use touch tooltips if it's clearly a mobile/tablet device
      return isPrimaryTouchDevice;
    } catch (e) {
      // Ultimate fallback to conservative detection if anything fails
      console.warn('Touch detection failed, defaulting to safe user agent detection:', e);
      const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      return isMobile && isSmallScreen;
    }
  });
  
  useEffect(() => {
    // Simple re-evaluation on resize to handle device orientation changes
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileScreen = screenWidth < 768;
      
      // Only update if it's clearly a mobile device
      const shouldBeTouchDevice = isMobileUserAgent && isMobileScreen;
      
      setIsTouchDevice(prev => {
        return prev !== shouldBeTouchDevice ? shouldBeTouchDevice : prev;
      });
    };
    
    // Debounce resize events
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 250);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return isTouchDevice;
};
