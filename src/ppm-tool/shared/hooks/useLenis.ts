'use client';

import { useRef } from 'react';

// COMPLETELY DISABLED LENIS TO PREVENT RUNTIME ERRORS
// This hook now does nothing and is safe to call anywhere in the codebase
export const useLenis = (options: {
  disabled?: boolean;
  lerp?: number;
  duration?: number;
  isMobile?: boolean;
} = {}) => {
  const lenisRef = useRef<null>(null);

  // No useEffect, no Lenis initialization, no event listeners
  // This prevents all potential runtime errors while maintaining the API

  // Provide safe no-op methods to maintain compatibility
  const scrollTo = (target: string | number | HTMLElement, options?: { 
    offset?: number;
    lerp?: number;
    duration?: number;
    immediate?: boolean;
    lock?: boolean;
    force?: boolean;
  }) => {
    // No-op - use native scrolling
    if (typeof target === 'string') {
      const element = document.querySelector(target);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const start = () => {
    // No-op
  };

  const stop = () => {
    // No-op
  };

  const resize = () => {
    // No-op
  };

  return {
    lenis: null,
    scrollTo,
    start,
    stop,
    resize
  };
}; 