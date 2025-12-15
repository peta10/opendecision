'use client';

import { useState, useCallback, useRef } from 'react';

type AnimationPhase = 'idle' | 'animating' | 'complete';

interface UseGuidedSubmitAnimationReturn {
  /** Current animation phase */
  phase: AnimationPhase;
  /** Whether animation is currently active */
  isAnimating: boolean;
  /** Start the animation sequence */
  startAnimation: () => Promise<void>;
  /** Get message for current phase */
  getMessage: () => string;
  /** Reset animation to idle */
  reset: () => void;
}

const TIMINGS = {
  ANIMATION: 3000,  // Single combined phase: wave + text + animation all together (3 seconds)
} as const;

export const useGuidedSubmitAnimation = (): UseGuidedSubmitAnimationReturn => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback(async () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Single Phase: Wave + Text + Criteria/Tools animation all together
    setPhase('animating');
    await new Promise(resolve => setTimeout(resolve, TIMINGS.ANIMATION));

    // Complete
    setPhase('complete');
    isAnimatingRef.current = false;
  }, []);

  const getMessage = useCallback(() => {
    switch (phase) {
      case 'animating':
        return '🪄 Adjusting your priorities and re-ranking tools...';
      default:
        return '';
    }
  }, [phase]);

  const reset = useCallback(() => {
    setPhase('idle');
    isAnimatingRef.current = false;
  }, []);

  return {
    phase,
    isAnimating: phase === 'animating',
    startAnimation,
    getMessage,
    reset,
  };
};

