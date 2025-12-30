'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';

interface ScoutCompassProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Enable subtle pulse animation */
  animate?: boolean;
  /** Custom className */
  className?: string;
  /** Compass color (defaults to Scout teal) */
  color?: string;
}

/**
 * ScoutCompass - Simple compass symbol for Scout AI
 *
 * A minimal, professional compass icon that replaces the robot head.
 * No glow effects - just clean lines and subtle animation.
 *
 * Sizes: xs=14px, sm=18px, md=24px, lg=32px, xl=48px
 */
export const ScoutCompass: React.FC<ScoutCompassProps> = ({
  size = 'md',
  animate = false,
  className,
  color = '#4BBEB3',
}) => {
  const sizeMap = {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const s = sizeMap[size];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        animate && 'od-compass--animated',
        className
      )}
      style={{ width: s, height: s }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={s}
        height={s}
      >
        {/* Outer circle */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Inner circle (center point) */}
        <circle cx="12" cy="12" r="1.5" fill={color} />

        {/* Compass needle - pointing NE (toward discovery) */}
        {/* North tip (filled - Scout color) */}
        <path
          d="M12 3L14 12H10L12 3Z"
          fill={color}
          transform="rotate(45 12 12)"
        />

        {/* South tip (outline only - neutral) */}
        <path
          d="M12 21L14 12H10L12 21Z"
          fill="#9CA3AF"
          transform="rotate(45 12 12)"
        />

        {/* Cardinal direction markers */}
        <circle cx="12" cy="3.5" r="0.75" fill={color} />
        <circle cx="20.5" cy="12" r="0.75" fill="#9CA3AF" />
        <circle cx="12" cy="20.5" r="0.75" fill="#9CA3AF" />
        <circle cx="3.5" cy="12" r="0.75" fill="#9CA3AF" />
      </svg>
    </div>
  );
};

/**
 * ScoutCompassIcon - Simplified compass for inline use (buttons, etc.)
 *
 * Even simpler version without animation wrapper.
 */
export const ScoutCompassIcon: React.FC<{
  size?: number;
  color?: string;
  className?: string;
}> = ({ size = 16, color = '#4BBEB3', className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    className={className}
  >
    {/* Outer circle */}
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" />

    {/* Inner circle */}
    <circle cx="12" cy="12" r="1.5" fill={color} />

    {/* Compass needle - NE orientation */}
    <path
      d="M12 3L14 12H10L12 3Z"
      fill={color}
      transform="rotate(45 12 12)"
    />
    <path
      d="M12 21L14 12H10L12 21Z"
      fill="#9CA3AF"
      transform="rotate(45 12 12)"
    />
  </svg>
);

export default ScoutCompass;
