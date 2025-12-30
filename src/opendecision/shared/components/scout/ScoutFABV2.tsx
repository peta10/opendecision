'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { ScoutCompassIcon } from './ScoutCompass';

interface ScoutFABV2Props {
  /** Click handler to open AI chat */
  onClick?: () => void;
  /** Whether chat panel is currently open */
  isOpen?: boolean;
  /** Custom className */
  className?: string;
  /** Position (default: bottom-right) */
  position?: 'bottom-right' | 'bottom-left';
}

/**
 * ScoutFABV2 - Floating Action Button for Scout AI (V2)
 *
 * Clean, minimal floating button in bottom-right corner.
 * Uses compass icon instead of robot head.
 * No glow effects - just shadow depth.
 *
 * Features:
 * - Fixed position bottom-right
 * - Scout teal color
 * - Compass icon
 * - Hover scale effect
 * - Clean shadow (no glow)
 */
export const ScoutFABV2: React.FC<ScoutFABV2Props> = ({
  onClick,
  isOpen = false,
  className,
  position = 'bottom-right',
}) => {
  const positionStyles =
    position === 'bottom-right'
      ? { bottom: '24px', right: '24px' }
      : { bottom: '24px', left: '24px' };

  return (
    <button
      onClick={onClick}
      className={cn(
        'od-ai-fab',
        isOpen && 'od-ai-fab--open',
        className
      )}
      style={{
        position: 'fixed',
        ...positionStyles,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'var(--od-scout, #4BBEB3)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--od-shadow-lg, 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.04))',
        transition: 'all 200ms ease',
        zIndex: 90,
      }}
      aria-label={isOpen ? 'Close Scout AI' : 'Open Scout AI'}
    >
      {isOpen ? (
        // X icon when open
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // Compass icon when closed
        <ScoutCompassIcon size={24} color="white" />
      )}
    </button>
  );
};

/**
 * CSS classes for ScoutFABV2 hover states (add to design-system-v2.css)
 *
 * .od-ai-fab:hover {
 *   background: var(--od-scout-hover);
 *   transform: scale(1.05);
 *   box-shadow: var(--od-shadow-xl);
 * }
 *
 * .od-ai-fab:active {
 *   transform: scale(0.98);
 * }
 *
 * .od-ai-fab--open {
 *   background: var(--od-text-primary);
 * }
 */

export default ScoutFABV2;
