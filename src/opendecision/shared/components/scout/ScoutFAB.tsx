'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { MessageCircle, X } from 'lucide-react';

interface ScoutFABProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

/**
 * ScoutFAB - Floating Action Button for Scout AI
 *
 * A teal circular button fixed to the bottom-right of the screen.
 * Toggles between chat icon and X icon based on overlay state.
 */
export const ScoutFAB: React.FC<ScoutFABProps> = ({
  onClick,
  isOpen = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-[200]',
        'w-14 h-14 rounded-full',
        'flex items-center justify-center',
        'bg-[#6EDCD1] hover:bg-[#4BBEB3]',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-[#6EDCD1]/50 focus:ring-offset-2',
        className
      )}
      style={{
        boxShadow: '0 4px 20px rgba(110, 220, 209, 0.4)',
      }}
      aria-label={isOpen ? 'Close Scout AI' : 'Open Scout AI'}
      title={isOpen ? 'Close Scout AI' : 'Chat with Scout AI'}
    >
      <div
        className={cn(
          'transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#0B1E2D]" />
        ) : (
          <MessageCircle className="w-6 h-6 text-[#0B1E2D]" />
        )}
      </div>
    </button>
  );
};

export default ScoutFAB;
