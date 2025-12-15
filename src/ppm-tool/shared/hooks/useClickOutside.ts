'use client';

import { useEffect } from 'react';

export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) => {
  useEffect(() => {
    // Track if this is the opening click to prevent immediate close
    let isOpeningClick = true;
    
    const listener = (event: MouseEvent | TouchEvent) => {
      // Ignore the click that just opened the element
      if (isOpeningClick) {
        isOpeningClick = false;
        return;
      }
      
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    // Use double RAF to ensure the opening click has fully propagated
    // This prevents the opening click from immediately triggering the close
    let rafId1: number;
    let rafId2: number;
    
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        // Use 'click' instead of 'mousedown' to allow inputs to process focus first
        document.addEventListener('click', listener, { capture: true });
        document.addEventListener('touchstart', listener);
      });
    });

    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      document.removeEventListener('click', listener, { capture: true });
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};