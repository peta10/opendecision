'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';

interface MatchScoreRingProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * MatchScoreRing - Circular progress ring showing match percentage
 *
 * Color coding:
 * - 90%+: Green (#22C55E)
 * - 70-89%: Teal (#6EDCD1)
 * - 50-69%: Yellow (#EAB308)
 * - <50%: Gray (#9CA3AF)
 */
export const MatchScoreRing: React.FC<MatchScoreRingProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className,
}) => {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Size configurations
  const sizeConfig = {
    sm: { width: 40, strokeWidth: 3, fontSize: 'text-[10px]' },
    md: { width: 52, strokeWidth: 4, fontSize: 'text-xs' },
    lg: { width: 72, strokeWidth: 5, fontSize: 'text-sm' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (clampedScore >= 90) return '#22C55E'; // Green
    if (clampedScore >= 70) return '#6EDCD1'; // Teal
    if (clampedScore >= 50) return '#EAB308'; // Yellow
    return '#9CA3AF'; // Gray
  };

  const color = getColor();

  return (
    <div
      className={cn('match-ring-container', className)}
      style={{ width: config.width, height: config.width }}
    >
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="rgba(11, 30, 45, 0.08)"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color}40)`,
          }}
        />
      </svg>
      {showLabel && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-semibold',
            config.fontSize
          )}
          style={{ color }}
        >
          {clampedScore}%
        </div>
      )}
    </div>
  );
};

export default MatchScoreRing;
