'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Criterion } from '@/opendecision/shared/types';

// =============================================================================
// TYPES
// =============================================================================

interface CriteriaWeightSliderProps {
  /** The criterion being weighted */
  criterion: Criterion;
  /** Called when weight changes */
  onWeightChange: (criterionId: string, newWeight: number) => void;
  /** Whether to show labels */
  showLabels?: boolean;
  /** Compact mode for table cells */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * CriteriaWeightSlider - Inline weight adjustment for criteria
 *
 * Features:
 * - Visual bar indicator (like ████░░)
 * - Hover to reveal slider
 * - Immediate feedback on weight change
 * - Compact mode for table cells
 */
export const CriteriaWeightSlider: React.FC<CriteriaWeightSliderProps> = ({
  criterion,
  onWeightChange,
  showLabels = false,
  compact = false,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const weight = criterion.userRating;
  const percentage = (weight / 5) * 100;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = parseInt(e.target.value, 10);
    onWeightChange(criterion.id, newWeight);
  }, [criterion.id, onWeightChange]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    if (!isDragging) {
      setIsHovered(false);
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsHovered(false);
  };

  // Weight labels
  const getWeightLabel = (w: number) => {
    switch (w) {
      case 1: return 'Not Important';
      case 2: return 'Low';
      case 3: return 'Medium';
      case 4: return 'High';
      case 5: return 'Critical';
      default: return 'Medium';
    }
  };

  if (compact) {
    return (
      <div
        className={cn('relative group', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Bar visualization */}
        <div className="flex items-center gap-0.5 h-4">
          {[1, 2, 3, 4, 5].map(level => (
            <div
              key={level}
              className={cn(
                'w-2 h-3 rounded-sm transition-all',
                level <= weight ? 'bg-teal-500' : 'bg-neutral-200',
                isHovered && level <= weight && 'bg-teal-400'
              )}
            />
          ))}
        </div>

        {/* Hover slider overlay */}
        {(isHovered || isDragging) && (
          <div className="absolute inset-0 flex items-center">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={weight}
              onChange={handleChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="w-full h-4 opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Label */}
      {showLabels && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-neutral-700">
            {criterion.name}
          </span>
          <span className="text-xs text-neutral-500">
            {getWeightLabel(weight)}
          </span>
        </div>
      )}

      {/* Bar + Slider container */}
      <div className="relative h-6">
        {/* Bar visualization */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-150',
                'bg-gradient-to-r from-teal-400 to-teal-500'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Slider (always functional, visible on hover) */}
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={weight}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className={cn(
            'absolute inset-0 w-full h-6 cursor-pointer',
            'appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-teal-500',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all',
            (isHovered || isDragging)
              ? '[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:scale-100'
              : '[&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:scale-75'
          )}
        />

        {/* Tick marks */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-0.5 pointer-events-none">
          {[1, 2, 3, 4, 5].map(tick => (
            <div
              key={tick}
              className={cn(
                'w-px h-1',
                tick <= weight ? 'bg-teal-300' : 'bg-neutral-300'
              )}
            />
          ))}
        </div>
      </div>

      {/* Current value tooltip */}
      {(isHovered || isDragging) && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-neutral-800 text-white text-xs rounded whitespace-nowrap">
          {getWeightLabel(weight)}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// STATIC BAR (no interaction)
// =============================================================================

interface WeightBarProps {
  weight: number;
  maxWeight?: number;
  className?: string;
}

/**
 * Static weight bar for display only
 */
export const WeightBar: React.FC<WeightBarProps> = ({
  weight,
  maxWeight = 5,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxWeight }, (_, i) => i + 1).map(level => (
        <div
          key={level}
          className={cn(
            'w-2 h-3 rounded-sm',
            level <= weight ? 'bg-teal-500' : 'bg-neutral-200'
          )}
        />
      ))}
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default CriteriaWeightSlider;
