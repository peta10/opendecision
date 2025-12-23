'use client';

/**
 * AIChatHeader Component
 *
 * Header for the AI sidebar with title, New Chat button, and close button.
 */

import React from 'react';
import { X, MessageSquarePlus, Sparkles } from 'lucide-react';
import { cn } from '@/opendecision/shared/lib/utils';

export interface AIChatHeaderProps {
  /** Callback to close the sidebar */
  onClose: () => void;
  /** Callback to start a new chat */
  onNewChat: () => void;
  /** Whether there are messages (to show New Chat button) */
  hasMessages: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const AIChatHeader: React.FC<AIChatHeaderProps> = ({
  onClose,
  onNewChat,
  hasMessages,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white',
        className
      )}
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-alpine-blue/10 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-alpine-blue" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-midnight">AI Assistant</h2>
          <p className="text-xs text-gray-500">Powered by PPM intelligence</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {hasMessages && (
          <button
            onClick={onNewChat}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-sm font-medium text-alpine-blue',
              'bg-alpine-blue/5 hover:bg-alpine-blue/10',
              'transition-colors duration-150'
            )}
            title="Start new conversation"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        )}

        <button
          onClick={onClose}
          className={cn(
            'p-2 rounded-lg',
            'text-gray-400 hover:text-gray-600',
            'hover:bg-gray-100',
            'transition-colors duration-150'
          )}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AIChatHeader;
