'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseScrollAwareHeaderOptions {
  /** Threshold in pixels before header starts hiding (default: 60) */
  threshold?: number;
  /** Animation duration in ms (default: 200) */
  animationDuration?: number;
  /** Debounce delay in ms (default: 10) */
  debounceDelay?: number;
}

interface UseScrollAwareHeaderReturn {
  /** Whether the header should be visible */
  isVisible: boolean;
  /** Current scroll position */
  scrollY: number;
  /** Whether user is scrolling down */
  isScrollingDown: boolean;
  /** Whether user has scrolled past threshold */
  isPastThreshold: boolean;
}

/**
 * useScrollAwareHeader - Amazon-style scroll behavior
 *
 * Hides header when scrolling down, shows when scrolling up.
 * Uses requestAnimationFrame for smooth 60fps performance.
 *
 * @example
 * ```tsx
 * const { isVisible } = useScrollAwareHeader();
 * return (
 *   <header className={cn('od-header', !isVisible && 'od-header--hidden')}>
 *     ...
 *   </header>
 * );
 * ```
 */
export function useScrollAwareHeader(
  options: UseScrollAwareHeaderOptions = {}
): UseScrollAwareHeaderReturn {
  const { threshold = 60, debounceDelay = 10 } = options;

  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollDelta = useRef(0);

  const updateHeader = useCallback(() => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY.current;

    // Accumulate scroll delta for smoother detection
    scrollDelta.current += delta;

    // Determine scroll direction
    const scrollingDown = delta > 0;

    // Update visibility based on scroll direction
    if (scrollingDown && currentScrollY > threshold) {
      // Scrolling DOWN and past threshold - hide header
      setIsVisible(false);
    } else if (!scrollingDown) {
      // Scrolling UP - show header immediately
      setIsVisible(true);
    }

    // Update state
    setScrollY(currentScrollY);
    setIsScrollingDown(scrollingDown);
    setIsPastThreshold(currentScrollY > threshold);

    // Store for next comparison
    lastScrollY.current = currentScrollY;
    scrollDelta.current = 0;
    ticking.current = false;
  }, [threshold]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateHeader);
      ticking.current = true;
    }
  }, [updateHeader]);

  useEffect(() => {
    // Set initial values
    lastScrollY.current = window.scrollY;
    setScrollY(window.scrollY);
    setIsPastThreshold(window.scrollY > threshold);

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, threshold]);

  return {
    isVisible,
    scrollY,
    isScrollingDown,
    isPastThreshold,
  };
}

export default useScrollAwareHeader;
