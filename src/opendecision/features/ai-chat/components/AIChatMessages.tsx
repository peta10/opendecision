'use client';

/**
 * AIChatMessages Component
 *
 * Displays the list of chat messages with proper styling for user/assistant.
 * Includes thumbs up/down feedback buttons for assistant messages.
 */

import React, { useState } from 'react';
import { User, Bot, Loader2, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
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
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Check className="w-3 h-3" />
        <span>Thanks for feedback</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleFeedback(true)}
        disabled={isSubmitting}
        className={cn(
          'p-1 rounded hover:bg-gray-200 transition-colors',
          'text-gray-400 hover:text-green-600',
          isSubmitting && 'opacity-50 cursor-not-allowed'
        )}
        title="Helpful"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleFeedback(false)}
        disabled={isSubmitting}
        className={cn(
          'p-1 rounded hover:bg-gray-200 transition-colors',
          'text-gray-400 hover:text-red-500',
          isSubmitting && 'opacity-50 cursor-not-allowed'
        )}
        title="Not helpful"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * Single message bubble component
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
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-alpine-blue' : 'bg-gray-100'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-alpine-blue text-white rounded-tr-md'
              : 'bg-gray-100 text-midnight rounded-tl-md',
            hasError && 'bg-red-50 border border-red-200'
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <>
              {/* Message text */}
              <div className={cn('text-sm leading-relaxed whitespace-pre-wrap', isUser && 'text-white')}>
                {renderMessageContent(message.content)}
              </div>

              {/* Sources (assistant only) */}
              {!isUser && message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.sources.slice(0, 3).map((source, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded text-xs text-gray-600"
                      >
                        {source.tool}
                        {source.section && ` - ${source.section}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools mentioned (assistant only) */}
              {!isUser && message.tools_mentioned && message.tools_mentioned.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.tools_mentioned.map((tool, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-alpine-blue/10 rounded-full text-xs text-alpine-blue font-medium"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Feedback buttons (assistant only, not loading, no error) */}
        {!isUser && !isLoading && !hasError && message.content && (
          <FeedbackButtons messageContent={message.content} onFeedback={onFeedback} />
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
