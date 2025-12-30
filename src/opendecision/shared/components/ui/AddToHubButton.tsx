'use client';

import React from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/opendecision/shared/lib/utils';

interface AddToHubButtonProps {
  isAdded: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * AddToHubButton - Clean, minimal button for adding items to Decision Hub
 *
 * Inspired by Google/Airtable design:
 * - White background with gray border
 * - Green accent on hover
 * - Solid green when added with checkmark
 */
export const AddToHubButton: React.FC<AddToHubButtonProps> = ({
  isAdded,
  onClick,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-200',
        sizeClasses[size],
        // Conditional styles
        isAdded
          ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
          : 'bg-white border-[1.5px] border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-500 hover:shadow-sm',
        className
      )}
    >
      {isAdded ? (
        <>
          <Check className="w-4 h-4" />
          <span>Added</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span>Add to Hub</span>
        </>
      )}
    </button>
  );
};

export default AddToHubButton;
