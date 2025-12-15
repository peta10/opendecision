'use client';

import { useState, useEffect } from 'react';

/**
 * Simple, reliable mobile detection hook
 * Uses only window.innerWidth for maximum browser compatibility
 *
 * Breakpoint rationale:
 * - 1099px threshold means mobile layout at ≤1099px, desktop at ≥1100px
 * - This avoids the "cramped tablet" state (1024-1100px) where desktop layout
 *   doesn't have enough room for AI panel + two-column content
 *
 * @param breakpoint - Width threshold for mobile detection (default: 1099px)
 * @returns boolean indicating if the device is mobile/tablet
 */
export function useMobileDetection(breakpoint: number = 1099): boolean {
  // Initialize with a safe default that matches SSR
  // This prevents hydration mismatches between server and client
  const [isMobile, setIsMobile] = useState(() => {
    // During SSR, return false (desktop) as default
    // This will be corrected immediately after mount
    if (typeof window === 'undefined') {
      return false;
    }
    // On client, check immediately
    try {
      return window.innerWidth <= breakpoint;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const updateMobileState = () => {
      try {
        if (typeof window !== 'undefined') {
          setIsMobile(window.innerWidth <= breakpoint);
        }
      } catch (error) {
        console.warn('Mobile detection failed:', error);
        setIsMobile(false); // Safe fallback
      }
    };

    // Update state after mount to ensure accuracy
    updateMobileState();
    
    // Listen for resize events
    const handleResize = () => updateMobileState();
    
    try {
      window.addEventListener('resize', handleResize);
    } catch (error) {
      console.warn('Failed to add resize listener:', error);
    }
    
    return () => {
      try {
        window.removeEventListener('resize', handleResize);
      } catch (error) {
        console.warn('Failed to remove resize listener:', error);
      }
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Legacy hook name for backward compatibility
 * @deprecated Use useMobileDetection instead
 */
export const useIsMobile = useMobileDetection;
