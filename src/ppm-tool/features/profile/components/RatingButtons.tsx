'use client';

import React from 'react';
import { cn } from '@/ppm-tool/shared/lib/utils';

interface RatingButtonsProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export const RatingButtons: React.FC<RatingButtonsProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const ratings = [1, 2, 3, 4, 5];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            disabled={disabled}
            className={cn(
              'w-8 h-8 text-sm font-medium rounded border transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-scout focus:ring-offset-1',
              value === rating
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={`Rate ${rating} out of 5`}
            aria-pressed={value === rating}
          >
            {rating}
          </button>
        ))}
      </div>
      <span className="ml-3 text-sm text-gray-500">Importance Level</span>
    </div>
  );
};

export default RatingButtons;
