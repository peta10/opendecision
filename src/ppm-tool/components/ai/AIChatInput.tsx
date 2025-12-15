'use client';

/**
 * AIChatInput Component
 *
 * Text input field with send button for the AI chat.
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/ppm-tool/shared/lib/utils';

export interface AIChatInputProps {
  /** Callback when user sends a message */
  onSend: (message: string) => void;
  /** Whether a message is being processed */
  isLoading: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

export const AIChatInput: React.FC<AIChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = 'Type your message...',
  className,
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setValue('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className={cn('flex items-end gap-2', className)}>
      {/* Text Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            'w-full resize-none rounded-xl border border-gray-200 px-4 py-3',
            'text-sm text-midnight placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-alpine-blue/20 focus:border-alpine-blue',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            'transition-all duration-150'
          )}
          style={{ maxHeight: '150px' }}
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={cn(
          'flex-shrink-0 p-3 rounded-xl',
          'transition-all duration-150',
          canSend
            ? 'bg-alpine-blue text-white hover:bg-alpine-blue/90 shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        )}
        title={isLoading ? 'Sending...' : 'Send message'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default AIChatInput;
