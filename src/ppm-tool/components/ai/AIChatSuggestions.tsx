'use client';

/**
 * AIChatSuggestions Component
 *
 * Displays clickable suggested prompts as full-width card rows.
 * Modern design with subtle borders between items.
 */

import React from 'react';
import { cn } from '@/ppm-tool/shared/lib/utils';

export interface AIChatSuggestionsProps {
  /** Array of suggested prompts */
  prompts: string[];
  /** Callback when a suggestion is clicked */
  onSelect: (prompt: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export const AIChatSuggestions: React.FC<AIChatSuggestionsProps> = ({
  prompts,
  onSelect,
  className,
}) => {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelect(prompt)}
          className={cn(
            'w-full py-3 text-left text-sm text-gray-700',
            'hover:text-gray-900 transition-colors',
            'cursor-pointer',
            // Border between items (not on last)
            index < prompts.length - 1 && 'border-b border-gray-100'
          )}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default AIChatSuggestions;
