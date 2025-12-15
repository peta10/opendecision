'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Tool } from '@/ppm-tool/shared/types';

interface ShuffleAnimationState {
  isShuffling: boolean;
  isDelaying: boolean;
  shouldShuffle: boolean;
  animationId: string | null;
}

interface UseShuffleAnimationOptions {
  delayMs?: number;
  shuffleDurationMs?: number;
  disabled?: boolean;
}

export interface UseShuffleAnimationReturn {
  // State
  isShuffling: boolean;
  isDelaying: boolean;
  shouldShuffle: boolean;
  animationId: string | null;
  
  // Methods
  triggerShuffle: () => void;
  cancelShuffle: () => void;
  onShuffleComplete: () => void;
  
  // For components
  getShuffleProps: () => {
    'data-shuffle-id': string | null;
    'data-is-shuffling': boolean;
    'data-is-delaying': boolean;
  };
}

/**
 * Hook for managing tool shuffle animations when criteria change.
 * 
 * Flow:
 * 1. User changes criteria -> triggerShuffle()
 * 2. Wait delayMs (0.5s default) with isDelaying=true
 * 3. Start shuffle animation with isShuffling=true
 * 4. Animation completes -> onShuffleComplete()
 * 
 * @param options Configuration options for the animation
 * @returns Animation state and control methods
 */
export const useShuffleAnimation = (
  options: UseShuffleAnimationOptions = {}
): UseShuffleAnimationReturn => {
  const {
    delayMs = 500,
    shuffleDurationMs = 1200,
    disabled = false
  } = options;

  const [state, setState] = useState<ShuffleAnimationState>({
    isShuffling: false,
    isDelaying: false,
    shouldShuffle: false,
    animationId: null
  });

  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
      if (shuffleTimeoutRef.current) {
        clearTimeout(shuffleTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Triggers the shuffle animation sequence
   */
  const triggerShuffle = useCallback(() => {
    if (disabled) return;

    // Generate unique animation ID for this shuffle
    const animationId = `shuffle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Cancel any existing timers
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
    }

    // Start delay phase
    setState({
      isShuffling: false,
      isDelaying: true,
      shouldShuffle: true,
      animationId
    });

    // After delay, start shuffle animation
    delayTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isShuffling: true,
        isDelaying: false
      }));

      // Auto-complete shuffle after duration
      shuffleTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isShuffling: false,
          shouldShuffle: false,
          animationId: null
        }));
      }, shuffleDurationMs);
    }, delayMs);
  }, [disabled, delayMs, shuffleDurationMs]);

  /**
   * Cancels any ongoing shuffle animation
   */
  const cancelShuffle = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
    }

    setState({
      isShuffling: false,
      isDelaying: false,
      shouldShuffle: false,
      animationId: null
    });
  }, []);

  /**
   * Called when shuffle animation completes
   */
  const onShuffleComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      isShuffling: false,
      shouldShuffle: false,
      animationId: null
    }));

    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
    }
  }, []);

  /**
   * Gets props to spread on shuffle container elements
   */
  const getShuffleProps = useCallback(() => ({
    'data-shuffle-id': state.animationId,
    'data-is-shuffling': state.isShuffling,
    'data-is-delaying': state.isDelaying
  }), [state.animationId, state.isShuffling, state.isDelaying]);

  return {
    // State
    isShuffling: state.isShuffling,
    isDelaying: state.isDelaying,
    shouldShuffle: state.shouldShuffle,
    animationId: state.animationId,
    
    // Methods
    triggerShuffle,
    cancelShuffle,
    onShuffleComplete,
    
    // Props
    getShuffleProps
  };
};

/**
 * Utility hook for components that need to respond to tool order changes
 * and trigger shuffle animations accordingly.
 */
export const useToolOrderShuffle = (
  tools: Tool[],
  shuffleHook: UseShuffleAnimationReturn,
  options: { triggerOnChange?: boolean; disabled?: boolean } = {}
) => {
  const { triggerOnChange = true, disabled = false } = options;
  const previousOrderRef = useRef<string[]>([]);

  useEffect(() => {
    if (!triggerOnChange || disabled) return;

    const currentOrder = tools.map(tool => tool.id);
    const previousOrder = previousOrderRef.current;

    // Check if order has actually changed
    const orderChanged = currentOrder.length !== previousOrder.length ||
      currentOrder.some((id, index) => id !== previousOrder[index]);

    if (orderChanged && previousOrder.length > 0) {
      // Update ref BEFORE triggering animation to prevent flash
      previousOrderRef.current = currentOrder;
      
      // Tools have been reordered, trigger shuffle
      shuffleHook.triggerShuffle();
    } else {
      // Update ref for first render or when no change
      previousOrderRef.current = currentOrder;
    }
  }, [tools, shuffleHook, triggerOnChange, disabled]);

  return {
    hasOrderChanged: () => {
      const currentOrder = tools.map(tool => tool.id);
      const previousOrder = previousOrderRef.current;
      return currentOrder.length !== previousOrder.length ||
        currentOrder.some((id, index) => id !== previousOrder[index]);
    },
    manualShuffle: () => {
      if (!disabled) {
        shuffleHook.triggerShuffle();
      }
    }
  };
};