'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';

interface ScoutHeadProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  pulseEyes?: boolean; // Pulse eyes for high match scores
  className?: string;
}

/**
 * ScoutHead - Compact Scout AI head icon
 *
 * Simplified Scout head for use in UI elements.
 * Sizes: xs=16px, sm=20px, md=28px, lg=40px, xl=56px
 */
export const ScoutHead: React.FC<ScoutHeadProps> = ({
  size = 'sm',
  animate = false,
  pulseEyes = false,
  className,
}) => {
  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 28,
    lg: 40,
    xl: 56,
  };

  const s = sizeMap[size];

  return (
    <div
      className={cn('relative', animate && 'animate-scout-float', className)}
      style={{ width: s, height: s }}
    >
      {/* Antenna Ball */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: s * 0.15,
          height: s * 0.15,
          borderRadius: '50%',
          background: '#6EDCD1',
        }}
      />

      {/* Head */}
      <div
        style={{
          position: 'absolute',
          top: s * 0.12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: s * 0.8,
          height: s * 0.65,
          borderRadius: s * 0.25,
          background: '#F8FAFA',
          boxShadow: 'inset 1px 1px 2px white, inset -1px -1px 3px #D8E4E2',
        }}
      >
        {/* Face Screen */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '75%',
            height: '70%',
            background: '#0B1E2D',
            borderRadius: s * 0.12,
          }}
        >
          {/* Left Eye */}
          <div
            className={cn(pulseEyes && 'animate-eye-pulse')}
            style={{
              position: 'absolute',
              top: '30%',
              left: '22%',
              width: '20%',
              height: '28%',
              background: '#FFFFFF',
              borderRadius: '50%',
              boxShadow: pulseEyes ? '0 0 8px #6EDCD1, 0 0 16px #6EDCD1' : '0 0 2px #6EDCD1',
            }}
          />
          {/* Right Eye */}
          <div
            className={cn(pulseEyes && 'animate-eye-pulse')}
            style={{
              position: 'absolute',
              top: '30%',
              right: '22%',
              width: '20%',
              height: '28%',
              background: '#FFFFFF',
              borderRadius: '50%',
              boxShadow: pulseEyes ? '0 0 8px #6EDCD1, 0 0 16px #6EDCD1' : '0 0 2px #6EDCD1',
            }}
          />
          {/* Smile */}
          <div
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '35%',
              height: '15%',
              borderBottom: '1px solid #FFFFFF',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>

      {/* Left Ear */}
      <div
        style={{
          position: 'absolute',
          top: s * 0.35,
          left: 0,
          width: s * 0.12,
          height: s * 0.22,
          borderRadius: s * 0.05,
          background: '#6EDCD1',
        }}
      />

      {/* Right Ear */}
      <div
        style={{
          position: 'absolute',
          top: s * 0.35,
          right: 0,
          width: s * 0.12,
          height: s * 0.22,
          borderRadius: s * 0.05,
          background: '#6EDCD1',
        }}
      />

      {/* Neck hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: s * 0.35,
          height: s * 0.15,
          background: '#F0F4F4',
          borderRadius: `0 0 ${s * 0.08}px ${s * 0.08}px`,
        }}
      />
    </div>
  );
};

export default ScoutHead;
