'use client';

// Overlay types for tracking
export const OVERLAY_TYPES = {
  HOW_IT_WORKS: 'how_it_works',
  GUIDED_RANKINGS: 'guided_rankings',
  COMPARISON_REPORT: 'comparison_report',
} as const;

// Simple overlay state management for HowItWorks and other overlays
export const setOverlayOpen = (overlayType: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`overlay_${overlayType}_open`, 'true');
};

export const setOverlayClosed = (overlayType: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`overlay_${overlayType}_open`);
};

export const isOverlayOpen = (overlayType: string): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`overlay_${overlayType}_open`) === 'true';
};

// Development keyboard shortcuts (optional debugging)
export const addDevelopmentKeyboardShortcuts = () => {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  // Add any development shortcuts here if needed
};
