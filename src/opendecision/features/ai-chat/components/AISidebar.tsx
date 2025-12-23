'use client';

/**
 * AISidebar Component
 *
 * Main container for the AI chat interface. Slides in from the LEFT side
 * and provides a chat experience with RAG-enhanced responses.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AIChatHeader } from './AIChatHeader';
import { AIChatMessages } from './AIChatMessages';
import { AIChatInput } from './AIChatInput';
import { AIChatSuggestions } from './AIChatSuggestions';
import { useAIChat, useInitialPrompts } from '@/opendecision/shared/hooks/useAIChat';
import { AIChatContext, Tool, Criterion } from '@/opendecision/shared/types';
import { cn } from '@/opendecision/shared/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface AISidebarProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** Current AI context with user state */
  context?: AIChatContext;
  /** Initial prompt to send when opening (optional) */
  initialPrompt?: string;
  /** Current tools for "explain score" functionality */
  tools?: Tool[];
  /** Current criteria for "explain score" functionality */
  criteria?: Criterion[];
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const sidebarVariants = {
  hidden: {
    x: '-100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onClose,
  context,
  initialPrompt,
  tools = [],
  criteria = [],
  className,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPromptSentRef = useRef(false);
  const initialPrompts = useInitialPrompts();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    explainToolScore,
    startNewChat,
    updateContext,
    suggestedPrompts,
    hasStarted,
    clearError,
  } = useAIChat({
    initialContext: context,
    onError: (err) => console.error('AI Chat error:', err),
  });

  // Update context when it changes
  useEffect(() => {
    if (context) {
      updateContext(context);
    }
  }, [context, updateContext]);

  // Send initial prompt when sidebar opens (if provided)
  useEffect(() => {
    if (isOpen && initialPrompt && !initialPromptSentRef.current && !hasStarted) {
      initialPromptSentRef.current = true;
      sendMessage(initialPrompt);
    }
  }, [isOpen, initialPrompt, hasStarted, sendMessage]);

  // Reset initial prompt flag when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      initialPromptSentRef.current = false;
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle suggestion click
  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handle new chat
  const handleNewChat = () => {
    startNewChat();
    initialPromptSentRef.current = false;
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determine which prompts to show
  const promptsToShow = hasStarted ? suggestedPrompts : initialPrompts;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />

          {/* Sidebar */}
          <motion.div
            className={cn(
              'fixed left-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50',
              'flex flex-col',
              className
            )}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <AIChatHeader
              onClose={onClose}
              onNewChat={handleNewChat}
              hasMessages={messages.length > 0}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 bg-alpine-blue/10 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-alpine-blue"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-midnight mb-2">
                    Ask AI About PPM Tools
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Get personalized insights about your tool recommendations, compare options, or
                    ask any PPM-related question.
                  </p>
                </div>
              ) : (
                <AIChatMessages messages={messages} />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {promptsToShow.length > 0 && !isLoading && (
              <div className="px-4 pb-2">
                <AIChatSuggestions
                  prompts={promptsToShow}
                  onSelect={handleSuggestionClick}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="px-4 pb-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <span className="text-red-500 text-sm flex-1">{error}</span>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <AIChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                placeholder="Ask about PPM tools..."
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AISidebar;
