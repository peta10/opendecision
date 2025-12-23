'use client';

/**
 * AIChatPanel Component
 *
 * Modern AI chat panel with clean UI matching the target design.
 * Features: animated dots, centered empty state, pill suggestions.
 */

import React, { useEffect, useRef, useState, KeyboardEvent, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Paperclip,
  Camera,
} from 'lucide-react';
import { SparkleButton } from './SparkleButton';
import { AIChatMessages } from './AIChatMessages';
import { ChatHistoryDropdown } from './ChatHistoryDropdown';
import { useAIChat, useInitialPrompts } from '@/ppm-tool/shared/hooks/useAIChat';
import { submitMessageFeedback, getOrCreateSessionId } from '@/ppm-tool/shared/services/aiChatService';
import { AIChatContext, Tool, Criterion } from '@/ppm-tool/shared/types';
import { cn } from '@/ppm-tool/shared/lib/utils';
import './ScoutSendButton.css';
import './AttachmentMenu.css';
import './ScoutBackButton.css';
import './ChatHistoryDropdown.css';

// =============================================================================
// CONSTANTS
// =============================================================================

// Fallback values (used during SSR and before CSS vars load)
const DEFAULT_COLLAPSED_WIDTH = 64;
const DEFAULT_EXPANDED_WIDTH = 340;
const ANIMATION_DURATION = 0.15;

// =============================================================================
// HOOK: Responsive Layout Values (mirrors CSS clamp() logic)
// =============================================================================

/**
 * Calculate responsive widths that mirror the CSS clamp() values in globals.css
 * This ensures JavaScript animations match CSS-defined responsive breakpoints
 *
 * Breakpoint Reference (must match globals.css):
 * 1600px+ : Rail 44px, Panel 320px
 * 1400px  : Rail 40px, Panel 300px
 * 1200px  : Rail 36px, Panel 280px
 * 1024px  : Rail 32px, Panel 260px
 * 900px   : Rail 32px, Panel 240px
 * 768px   : Rail 32px, Panel 220px
 *
 * CSS vars:
 * --ai-rail-width: clamp(56px, 4vw, 64px)
 * --ai-panel-width: clamp(220px, 20vw, 320px)
 *
 * Tablet override (768-1024px):
 * --ai-rail-width: 48px
 * --ai-panel-width: clamp(200px, 26vw, 260px)
 */
function useResponsiveLayoutVars() {
  const [collapsedWidth, setCollapsedWidth] = useState(DEFAULT_COLLAPSED_WIDTH);
  const [expandedWidth, setExpandedWidth] = useState(DEFAULT_EXPANDED_WIDTH);

  const updateWidths = useCallback(() => {
    if (typeof window === 'undefined') return;

    const vw = window.innerWidth;

    // Tablet breakpoint (768-1024px)
    if (vw >= 768 && vw <= 1024) {
      setCollapsedWidth(48); // Fixed 48px on tablet
      // clamp(200px, 26vw, 260px)
      setExpandedWidth(Math.round(Math.min(Math.max(200, vw * 0.26), 260)));
    } else {
      // Desktop: clamp(56px, 4vw, 64px)
      setCollapsedWidth(Math.round(Math.min(Math.max(56, vw * 0.04), 64)));
      // Desktop: clamp(220px, 20vw, 320px)
      setExpandedWidth(Math.round(Math.min(Math.max(220, vw * 0.20), 320)));
    }
  }, []);

  useEffect(() => {
    // Initial calculation
    updateWidths();

    // Listen for viewport changes
    window.addEventListener('resize', updateWidths);
    window.addEventListener('orientationchange', updateWidths);

    return () => {
      window.removeEventListener('resize', updateWidths);
      window.removeEventListener('orientationchange', updateWidths);
    };
  }, [updateWidths]);

  return { collapsedWidth, expandedWidth };
}

// =============================================================================
// TYPES
// =============================================================================

export interface AIChatPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  context?: AIChatContext;
  tools?: Tool[];
  criteria?: Criterion[];
  isAnimationBlocked?: boolean;
  className?: string;
  /** Decision Space ID for scoping chat sessions */
  decisionSpaceId?: string | null;
}


// =============================================================================
// SCOUT AI MASCOT COMPONENT
// =============================================================================

const ScoutMascot: React.FC<{ size?: 'small' | 'large' }> = ({ size = 'large' }) => {
  const sizeClasses = size === 'large' ? 'w-16 h-16' : 'w-10 h-10';

  return (
    <motion.div
      className={cn(sizeClasses, 'relative')}
      animate={{
        y: [0, -4, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <img
        src="/scout.ai.png"
        alt="Scout AI"
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
};

// =============================================================================
// ACTION BUTTON COMPONENT
// =============================================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-colors text-left"
  >
    <span className="text-[#5BDFC2]">{icon}</span>
    <span className="text-sm text-neutral-700">{label}</span>
  </button>
);

// =============================================================================
// STYLED CHAT INPUT COMPONENT
// =============================================================================

interface StyledChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const StyledChatInput: React.FC<StyledChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = 'Ask or build anything...',
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="w-full">
      {/* Input container with clean border */}
      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
        {/* Textarea */}
        <div className="px-4 pt-4 pb-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={3}
            className={cn(
              'w-full bg-transparent border-none resize-none outline-none',
              'text-gray-900 text-sm',
              'placeholder:text-gray-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[60px]'
            )}
            style={{ maxHeight: '150px' }}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left side - Attachment Menu */}
          <div className="flex items-center">
            <nav className="attachment-menu">
              <input type="checkbox" className="menu-open" name="menu-open" id="menu-open" />
              <label className="menu-open-button" htmlFor="menu-open">
                <span className="lines line-1"></span>
                <span className="lines line-2"></span>
                <span className="lines line-3"></span>
              </label>
              <button type="button" className="menu-item item-orange" title="Add image">
                <Camera />
              </button>
              <button type="button" className="menu-item item-green" title="Attach file">
                <Paperclip />
              </button>
            </nav>
          </div>

          {/* Right side - Scout Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn('scout-send-btn', isLoading && 'is-loading')}
            type="button"
          >
            <div className="air-streaks">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="content-wrapper">
              <div className="svg-wrapper-1">
                <div className="svg-wrapper">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <defs>
                      <linearGradient
                        id="tricolor-horizontal"
                        x1="0%"
                        y1="50%"
                        x2="100%"
                        y2="50%"
                      >
                        <stop offset="0%" stopColor="#FFB300"></stop>
                        <stop offset="33%" stopColor="#FFB300"></stop>
                        <stop offset="33%" stopColor="#0072bc"></stop>
                        <stop offset="66%" stopColor="#0072bc"></stop>
                        <stop offset="66%" stopColor="#00C853"></stop>
                        <stop offset="100%" stopColor="#00C853"></stop>
                      </linearGradient>
                    </defs>
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path
                      fill="url(#tricolor-horizontal)"
                      d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                    ></path>
                  </svg>
                </div>
              </div>
              <span className="btn-text">Send</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isExpanded,
  onToggle,
  context,
  tools = [],
  criteria = [],
  isAnimationBlocked = false,
  className,
  decisionSpaceId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPrompts = useInitialPrompts();

  // Get responsive widths from CSS custom properties
  const { collapsedWidth, expandedWidth } = useResponsiveLayoutVars();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    updateContext,
    suggestedPrompts,
    hasStarted,
    clearError,
    // Chat history
    chatHistory,
    sessionId,
    loadChatFromHistory,
    deleteChatFromHistory,
  } = useAIChat({
    initialContext: context,
    decisionSpaceId: decisionSpaceId ?? undefined,
    onError: (err) => console.error('AI Chat error:', err),
  });

  useEffect(() => {
    if (context) {
      updateContext(context);
    }
  }, [context, updateContext]);

  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleToggle = () => {
    if (isAnimationBlocked) return;
    onToggle();
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handle feedback submission
  const handleFeedback = async (messageContent: string, isPositive: boolean) => {
    const sessionId = getOrCreateSessionId();
    await submitMessageFeedback(sessionId, messageContent, isPositive);
  };

  // Get prompts to show
  const promptsToShow = (hasStarted ? suggestedPrompts : initialPrompts).slice(0, 3);

  return (
    <motion.div
      className={cn(
        'fixed top-0 left-0 h-screen bg-[#F0FDFB] border-r border-[#5BDFC2]/30 flex flex-col z-40',
        // Add shadow when expanded (overlay effect)
        isExpanded && 'shadow-2xl shadow-[#5BDFC2]/20',
        className
      )}
      initial={false}
      animate={{
        width: isExpanded ? expandedWidth : collapsedWidth,
      }}
      transition={{
        duration: ANIMATION_DURATION,
        ease: 'easeOut',
      }}
    >
      {/* Collapsed State - Rail with header-aligned top */}
      {!isExpanded && (
        <div className="w-full h-full flex flex-col bg-[#F0FDFB]">
          {/* Header area - h-14 (56px) to match main header */}
          <div
            onClick={isAnimationBlocked ? undefined : handleToggle}
            role="button"
            tabIndex={isAnimationBlocked ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isAnimationBlocked) {
                e.preventDefault();
                handleToggle();
              }
            }}
            className={cn(
              'w-full h-14 flex items-center justify-center cursor-pointer border-b border-[#5BDFC2]/20',
              'hover:bg-[#5BDFC2]/10 transition-colors duration-150',
              'group',
              isAnimationBlocked && 'opacity-50 cursor-not-allowed'
            )}
            title="Open Scout AI"
          >
            <ScoutMascot size="small" />
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="flex flex-col h-full overflow-hidden bg-[#F0FDFB]">
          {/* Header - h-14 (56px) to match main header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-[#5BDFC2]/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ScoutMascot size="small" />
              <span className="text-sm font-semibold text-neutral-900">Scout AI</span>
            </div>
            <div className="flex items-center gap-2">
              <ChatHistoryDropdown
                chatHistory={chatHistory}
                currentChatId={sessionId}
                onNewChat={startNewChat}
                onLoadChat={loadChatFromHistory}
                onDeleteChat={deleteChatFromHistory}
                isLoading={isLoading}
              />
              <button
                onClick={handleToggle}
                disabled={isAnimationBlocked}
                className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-[#5BDFC2]/10 rounded transition-colors"
                aria-label="Collapse panel"
                title="Collapse"
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 min-h-0">
            {messages.length === 0 ? (
              /* Empty State - Scout AI branded */
              <div className="pt-6 pb-4">
                {/* Scout Mascot and Greeting */}
                <div className="flex flex-col items-center mb-6">
                  <ScoutMascot size="large" />
                  <h2 className="mt-3 text-lg font-medium text-neutral-900">
                    Hi! I&apos;m Scout
                  </h2>
                  <p className="text-sm text-neutral-500 text-center mt-1">
                    Your AI assistant for finding the perfect tools
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mb-4">
                  <ActionButton
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    }
                    label="Compare selected tools"
                    onClick={() => handleSuggestionClick('Compare my selected tools')}
                  />
                  <ActionButton
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    }
                    label="View my profile"
                    onClick={() => handleSuggestionClick('Show me my project profile summary')}
                  />
                  <ActionButton
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    }
                    label="Ask a question"
                    onClick={() => {/* Focus the input */}}
                  />
                </div>
              </div>
            ) : (
              <div className="py-4">
                <AIChatMessages messages={messages} onFeedback={handleFeedback} />
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input & Suggestions inside scroll area for better flow */}
            <div className="pb-4 space-y-3">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {error}
                  <button onClick={clearError} className="ml-2 underline">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Chat Input */}
              <StyledChatInput
                onSend={sendMessage}
                isLoading={isLoading}
              />

              {/* Suggestions as pills - only show after conversation started */}
              {messages.length > 0 && promptsToShow.length > 0 && !isLoading && (
                <div className="flex flex-col gap-2 mt-2">
                  {promptsToShow.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="text-left px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AIChatPanel;
