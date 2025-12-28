'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';

interface SpeechBubbleProps {
  message: string;
  className?: string;
  position?: 'left' | 'right';
}

/**
 * SpeechBubble - A speech bubble component for Scout messages
 *
 * Features a pointer/tail and subtle shadow to appear like a speech bubble.
 */
export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  className,
  position = 'right',
}) => {
  return (
    <div
      className={cn(
        'relative bg-white px-4 py-3 rounded-xl text-sm text-[#0B1E2D] leading-relaxed',
        'shadow-lg border border-neutral-100',
        'max-w-[200px]',
        className
      )}
      style={{
        boxShadow: '0 4px 16px rgba(11, 30, 45, 0.12)',
      }}
    >
      {message}

      {/* Speech bubble pointer */}
      <div
        className={cn(
          'absolute bottom-3 w-3 h-3 bg-white border-neutral-100',
          position === 'right'
            ? '-right-1.5 border-r border-b rotate-[-45deg]'
            : '-left-1.5 border-l border-t rotate-[-45deg]'
        )}
      />
    </div>
  );
};

export default SpeechBubble;
