'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';

interface ViewToggleProps {
  currentView: 'setup' | 'decision-hub';
  onViewChange: (view: 'setup' | 'decision-hub') => void;
  className?: string;
}

/**
 * ViewToggle - Floating toggle at bottom center
 *
 * Switches between Setup and Decision Hub views.
 * Matches the demo layout with white background and pill buttons.
 */
export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]',
        'bg-white border border-[rgba(11,30,45,0.1)] rounded-xl p-1',
        'flex gap-1',
        className
      )}
      style={{
        boxShadow: '0 4px 20px rgba(11, 30, 45, 0.1)',
      }}
    >
      <button
        onClick={() => onViewChange('setup')}
        className={cn(
          'px-6 py-2.5 rounded-lg text-sm font-medium transition-colors',
          currentView === 'setup'
            ? 'bg-[#6EDCD1] text-[#0B1E2D]'
            : 'text-[#4A5E6D] hover:bg-[#f5f7f7]'
        )}
      >
        Setup
      </button>
      <button
        onClick={() => onViewChange('decision-hub')}
        className={cn(
          'px-6 py-2.5 rounded-lg text-sm font-medium transition-colors',
          currentView === 'decision-hub'
            ? 'bg-[#6EDCD1] text-[#0B1E2D]'
            : 'text-[#4A5E6D] hover:bg-[#f5f7f7]'
        )}
      >
        Decision Hub
      </button>
    </div>
  );
};

export default ViewToggle;
