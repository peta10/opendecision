'use client';

import React from 'react';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

/**
 * Debug component to show current touch/mobile detection state
 * Remove this after debugging
 */
export const TouchDetectionDebug: React.FC = () => {
  const { isMobile, isTouchDevice, hasTouch, isHydrated } = useUnifiedMobileDetection();

  if (!isHydrated) {
    return <div className="p-2 bg-yellow-100 text-xs">Loading detection...</div>;
  }

  return (
    <div className="fixed top-4 right-4 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-[10000] max-w-xs">
      <div className="font-bold mb-2">Touch Detection Debug</div>
      <div>isMobile: {isMobile ? '✅' : '❌'}</div>
      <div>isTouchDevice: {isTouchDevice ? '✅' : '❌'}</div>
      <div>hasTouch: {hasTouch ? '✅' : '❌'}</div>
      <div className="mt-2 text-gray-300">
        Expected tooltip mode: {
          isTouchDevice ? 'Mobile (click-only)' : 
          hasTouch ? 'Hybrid (hover+click)' : 
          'Desktop (hover-only)'
        }
      </div>
    </div>
  );
};
