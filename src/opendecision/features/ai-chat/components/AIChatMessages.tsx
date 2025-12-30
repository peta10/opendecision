'use client';

/**
 * AIChatMessages Component
 *
 * Google-style minimal chat messages with clean typography.
 * No avatars, simple bubbles, subtle feedback.
 */

import React, { useState } from 'react';
import { Loader2, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { AIChatMessage } from '@/opendecision/shared/types';
import { cn } from '@/opendecision/shared/lib/utils';

export interface AIChatMessagesProps {
  /** Array of chat messages to display */
  messages: AIChatMessage[];
  /** Callback when feedback is submitted */
  onFeedback?: (messageContent: string, isPositive: boolean) => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Simple markdown-like renderer for bold text
 */
const renderMessageContent = (content: string): React.ReactNode => {
  // Split by bold markers **text**
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      return (
        <strong key={index} className="font-semibold text-midnight">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

/**
 * Feedback buttons component for assistant messages
 */
interface FeedbackButtonsProps {
  messageContent: string;
  onFeedback?: (messageContent: string, isPositive: boolean) => Promise<void>;
}

const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({ messageContent, onFeedback }) => {
  const [feedbackState, setFeedbackState] = useState<'none' | 'positive' | 'negative'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (isPositive: boolean) => {
    if (feedbackState !== 'none' || isSubmitting || !onFeedback) return;

    setIsSubmitting(true);
    try {
      await onFeedback(messageContent, isPositive);
      setFeedbackState(isPositive ? 'positive' : 'negative');
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedbackState !== 'none') {
    return (
      <span className="text-xs text-gray-400">Thanks</span>
    );
  }

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => handleFeedback(true)}
        disabled={isSubmitting}
        className={cn(
          'p-1 rounded-full transition-colors',
          'text-gray-300 hover:text-gray-600 hover:bg-gray-100',
          isSubmitting && 'opacity-50 cursor-not-allowed'
        )}
        title="Helpful"
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        onClick={() => handleFeedback(false)}
        disabled={isSubmitting}
        className={cn(
          'p-1 rounded-full transition-colors',
          'text-gray-300 hover:text-gray-600 hover:bg-gray-100',
          isSubmitting && 'opacity-50 cursor-not-allowed'
        )}
        title="Not helpful"
      >
        <ThumbsDown className="w-3 h-3" />
      </button>
    </div>
  );
};

/**
 * Single message bubble component - Google-style minimal
 */
interface MessageBubbleProps {
  message: AIChatMessage;
  onFeedback?: (messageContent: string, isPositive: boolean) => Promise<void>;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;
  const hasError = !!message.error;

  return (
    <div
      className={cn(
        'group mb-4',
        isUser ? 'flex justify-end' : 'flex justify-start'
      )}
    >
      <div className={cn('max-w-[85%]', isUser && 'text-right')}>
        {/* Message Content */}
        <div
          className={cn(
            'inline-block text-left',
            isUser
              ? 'bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2.5'
              : 'text-gray-700',
            hasError && 'bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5'
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400 py-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <>
              {/* Message text */}
              <div className={cn(
                'text-sm leading-relaxed whitespace-pre-wrap',
                isUser ? 'text-white' : 'text-gray-700'
              )}>
                {renderMessageContent(message.content)}
              </div>

              {/* Tools mentioned - minimal pills */}
              {!isUser && message.tools_mentioned && message.tools_mentioned.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.tools_mentioned.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Feedback buttons - minimal, appears on hover */}
        {!isUser && !isLoading && !hasError && message.content && (
          <div className="mt-1 ml-1">
            <FeedbackButtons messageContent={message.content} onFeedback={onFeedback} />
          </div>
        )}
      </div>
    </div>
  );
};

export const AIChatMessages: React.FC<AIChatMessagesProps> = ({
  messages,
  onFeedback,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onFeedback={onFeedback} />
      ))}
    </div>
  );
};

export default AIChatMessages;
