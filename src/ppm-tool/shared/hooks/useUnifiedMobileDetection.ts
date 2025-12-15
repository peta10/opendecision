'use client';

import { useState, useEffect } from 'react';

interface MobileDetectionState {
  isMobile: boolean;
  isTouchDevice: boolean;
  hasTouch: boolean;
  isHydrated: boolean;
}

/**
 * Unified mobile detection hook that prevents hydration mismatches
 * Combines width-based and touch-based detection in a single hook
 *
 * Breakpoint rationale:
 * - 1099px threshold means mobile layout at ≤1099px, desktop at ≥1100px
 * - This avoids the "cramped tablet" state (1024-1100px) where desktop layout
 *   doesn't have enough room for AI panel + two-column content
 *
 * @param breakpoint - Width threshold for mobile detection (default: 1099px)
 * @returns unified mobile detection state
 */
export function useUnifiedMobileDetection(breakpoint: number = 1099): MobileDetectionState {
  // Initialize with SSR-safe defaults that prevent hydration mismatches
  const [state, setState] = useState<MobileDetectionState>(() => ({
    isMobile: false, // Always false during SSR
    isTouchDevice: false, // Always false during SSR
    hasTouch: false, // Always false during SSR
    isHydrated: false
  }));

  useEffect(() => {
    // Single function to detect all mobile/touch characteristics
    const detectMobileAndTouch = (): { isMobile: boolean; isTouchDevice: boolean; hasTouch: boolean } => {
      if (typeof window === 'undefined') {
        return { isMobile: false, isTouchDevice: false, hasTouch: false };
      }

      try {
        // Width-based mobile detection
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= breakpoint;

        // Enhanced touch device detection
        const userAgent = navigator.userAgent || '';
        const platform = navigator.platform || '';
        
        // Touch capability detection
        const hasTouchEvents = 'ontouchstart' in window || 'ontouchend' in window;
        const hasMaxTouchPoints = navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
        const hasTouch = hasTouchEvents || hasMaxTouchPoints;
        
        // Mobile user agent detection
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
        const isTabletUserAgent = /iPad|Tablet|PlayBook|Silk/i.test(userAgent) || 
                                 (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroidTablet = /Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
        
        // Media query detection for hover capability
        let hasHoverCapability = true;
        if (window.matchMedia) {
          try {
            const hasHoverNone = window.matchMedia('(hover: none)').matches;
            const hasPointerCoarse = window.matchMedia('(pointer: coarse)').matches;
            const hoverSupported = window.matchMedia('(hover: hover)').matches;
            const finePointer = window.matchMedia('(pointer: fine)').matches;
            
            hasHoverCapability = hoverSupported || finePointer;
            
            // Fallback for browsers that don't support these media queries
            if (!hasHoverNone && !hasPointerCoarse && !hoverSupported && !finePointer) {
              hasHoverCapability = !isMobileUserAgent;
            }
          } catch (e) {
            hasHoverCapability = !isMobileUserAgent;
          }
        } else {
          hasHoverCapability = !isMobileUserAgent;
        }
        
        // Conservative touch device detection
        const isClearlyMobile = isMobileUserAgent && isMobile;
        const isClearlyTablet = (isTabletUserAgent || isAndroidTablet) && !hasHoverCapability;
        const isTouchDevice = (isClearlyMobile || isClearlyTablet) && hasTouch;

        return { isMobile, isTouchDevice, hasTouch };
      } catch (error) {
        console.warn('Mobile detection failed, using safe defaults:', error);
        return { isMobile: false, isTouchDevice: false, hasTouch: false };
      }
    };

    // Update state immediately after mount
    const { isMobile, isTouchDevice, hasTouch } = detectMobileAndTouch();
    setState({
      isMobile,
      isTouchDevice,
      hasTouch,
      isHydrated: true
    });

    // Listen for resize events with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const { isMobile, isTouchDevice, hasTouch } = detectMobileAndTouch();
        setState(prev => ({
          ...prev,
          isMobile,
          isTouchDevice,
          hasTouch
        }));
      }, 150);
    };

    try {
      window.addEventListener('resize', handleResize, { passive: true });
    } catch (error) {
      console.warn('Failed to add resize listener:', error);
    }

    // Cleanup
    return () => {
      try {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
      } catch (error) {
        console.warn('Failed to remove resize listener:', error);
      }
    };
  }, [breakpoint]);

  return state;
}

/**
 * Legacy compatibility hook for useMobileDetection
 * @deprecated Use useUnifiedMobileDetection instead
 */
export function useMobileDetection(breakpoint: number = 1099): boolean {
  const { isMobile } = useUnifiedMobileDetection(breakpoint);
  return isMobile;
}

/**
 * Legacy compatibility hook for useTouchDevice
 * @deprecated Use useUnifiedMobileDetection instead
 */
export function useTouchDevice(): boolean {
  const { isTouchDevice } = useUnifiedMobileDetection();
  return isTouchDevice;
}
