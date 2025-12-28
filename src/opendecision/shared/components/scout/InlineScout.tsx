'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { SpeechBubble } from './SpeechBubble';
import { X } from 'lucide-react';

interface InlineScoutProps {
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * InlineScout - Mini Scout robot with speech bubble
 *
 * Used for contextual hints and guidance throughout the app.
 * Can include an action button and dismiss functionality.
 */
export const InlineScout: React.FC<InlineScoutProps> = ({
  message,
  onAction,
  actionLabel,
  onDismiss,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-start gap-2',
        className
      )}
    >
      {/* Speech Bubble */}
      <div className="relative">
        <SpeechBubble message={message} position="right" />

        {/* Action Button */}
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="mt-2 px-3 py-1.5 bg-[#6EDCD1] text-[#0B1E2D] text-xs font-medium rounded-lg hover:bg-[#4BBEB3] transition-colors"
          >
            {actionLabel}
          </button>
        )}

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Mini Scout Robot */}
      <div className="flex-shrink-0 animate-scout-float">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6EDCD1 0%, #4BBEB3 100%)',
            boxShadow: '0 4px 12px rgba(110, 220, 209, 0.3)',
          }}
        >
          {/* Scout Face */}
          <div className="relative w-8 h-6 bg-[#0B1E2D] rounded-lg overflow-hidden">
            {/* Eyes */}
            <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full" />
            {/* Smile */}
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 border-b-2 border-[#6EDCD1] rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineScout;
