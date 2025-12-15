/**
 * Unified Mouse Tracking Hook
 * Integrates with the unified bumper state management system
 * Tracks mouse movement and stillness for timing-based bumper triggers
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { 
  recordMouseMovement, 
  recordMouseStopped, 
  recordInitialTimerComplete,
  recordMouseMovementTimerComplete,
  getUnifiedBumperTimingConstants 
} from '../utils/unifiedBumperState';

interface UseUnifiedMouseTrackingOptions {
  enabled?: boolean;
  onInitialTimerComplete?: () => void;
  onMouseMovementTimerComplete?: () => void;
}

export function useUnifiedMouseTracking(options: UseUnifiedMouseTrackingOptions = {}) {
  const { enabled = true, onInitialTimerComplete, onMouseMovementTimerComplete } = options;
  
  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseMovementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0, time: 0 });
  const initialTimerStartedRef = useRef(false);
  
  const { INITIAL_TIMER_MS, MOUSE_MOVEMENT_TIMER_MS } = getUnifiedBumperTimingConstants();
  
  // Start the initial 10-second timer on mount
  useEffect(() => {
    if (!enabled) return;
    
    // Check if timer was already completed in a previous session
    const { getUnifiedBumperState } = require('../utils/unifiedBumperState');
    const state = getUnifiedBumperState();
    
    if (state.initialTimerComplete) {
      console.log('⏱️ Initial timer already completed from previous session');
      onInitialTimerComplete?.();
      return;
    }
    
    if (initialTimerStartedRef.current) return;
    
    initialTimerStartedRef.current = true;
    
    console.log('⏱️ Starting initial 10s timer for bumper system');
    initialTimerRef.current = setTimeout(() => {
      recordInitialTimerComplete();
      onInitialTimerComplete?.();
      console.log('✅ Initial 10s timer completed');
    }, INITIAL_TIMER_MS);
    
    return () => {
      if (initialTimerRef.current) {
        clearTimeout(initialTimerRef.current);
        initialTimerRef.current = null;
      }
    };
  }, [enabled, INITIAL_TIMER_MS, onInitialTimerComplete]);
  
  // Mouse movement detection and stillness tracking
  useEffect(() => {
    if (!enabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Clear existing mouse movement timer
      if (mouseMovementTimerRef.current) {
        clearTimeout(mouseMovementTimerRef.current);
        mouseMovementTimerRef.current = null;
      }
      
      // Record mouse movement
      recordMouseMovement();
      
      // Update position tracking
      const currentTime = Date.now();
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY, time: currentTime };
      
      // Start a new timer for mouse stillness detection (longer delay to avoid interrupting active users)
      mouseMovementTimerRef.current = setTimeout(() => {
        // Double-check that mouse is still in the same position
        const currentPos = { x: e.clientX, y: e.clientY };
        const lastPos = lastMousePositionRef.current;
        const distance = Math.sqrt(
          Math.pow(currentPos.x - lastPos.x, 2) + Math.pow(currentPos.y - lastPos.y, 2)
        );
        
        // Only record as stopped if mouse hasn't moved significantly (< 5 pixels)
        if (distance < 5) {
          recordMouseStopped();
          
          // Start the 3-second timer for mouse movement completion
          setTimeout(() => {
            recordMouseMovementTimerComplete();
            onMouseMovementTimerComplete?.();
            console.log('✅ Mouse movement 3s timer completed');
          }, MOUSE_MOVEMENT_TIMER_MS);
        } else {
          console.log('🖱️ Mouse moved during stillness check, restarting timer');
        }
        
      }, 500); // Increased delay to 500ms to better detect true stillness
    };
    
    // Add event listener
    try {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    } catch (e) {
      // Fallback for older browsers
      document.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (mouseMovementTimerRef.current) {
        clearTimeout(mouseMovementTimerRef.current);
        mouseMovementTimerRef.current = null;
      }
    };
  }, [enabled, MOUSE_MOVEMENT_TIMER_MS, onMouseMovementTimerComplete]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initialTimerRef.current) {
        clearTimeout(initialTimerRef.current);
      }
      if (mouseMovementTimerRef.current) {
        clearTimeout(mouseMovementTimerRef.current);
      }
    };
  }, []);
  
  return {
    lastMousePosition: lastMousePositionRef.current
  };
}
