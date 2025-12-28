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
  Mic,
} from 'lucide-react';
import { AudioVisualizerBar } from './AudioVisualizerBar';
import { useVoiceRecording } from '@/opendecision/shared/hooks/useVoiceRecording';
import { SparkleButton } from './SparkleButton';
import { AIChatMessages } from './AIChatMessages';
import { ChatHistoryDropdown } from './ChatHistoryDropdown';
import { useAIChat, useInitialPrompts } from '@/opendecision/shared/hooks/useAIChat';
import { submitMessageFeedback, getOrCreateSessionId } from '@/opendecision/shared/services/aiChatService';
import { AIChatContext, Tool, Criterion } from '@/opendecision/shared/types';
import { cn } from '@/opendecision/shared/lib/utils';
import { ScoutHead } from '@/opendecision/shared/components/scout';
import './ScoutSendButton.css';
import './AttachmentMenu.css';
import './ScoutBackButton.css';
import './ChatHistoryDropdown.css';

// =============================================================================
// CONSTANTS
// =============================================================================

// Fallback values (used during SSR and before CSS vars load)
const DEFAULT_COLLAPSED_WIDTH = 64;
const DEFAULT_EXPANDED_WIDTH = 380;
const ANIMATION_DURATION = 0.08; // Fast, snappy animation

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
      // clamp(280px, 32vw, 340px) - wider for sidebar layout
      setExpandedWidth(Math.round(Math.min(Math.max(280, vw * 0.32), 340)));
    } else {
      // Desktop: clamp(56px, 4vw, 64px)
      setCollapsedWidth(Math.round(Math.min(Math.max(56, vw * 0.04), 64)));
      // Desktop: clamp(320px, 24vw, 400px) - wider for sidebar layout
      setExpandedWidth(Math.round(Math.min(Math.max(320, vw * 0.24), 400)));
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
  /** True if any product has a high match score (>85%) - triggers Scout eye pulse */
  hasHighMatchScore?: boolean;
  /**
   * Callback when AI response contains criteria weight updates.
   * Enables real-time slider/ranking updates when user says things like
   * "security is more important" in chat.
   */
  onCriteriaUpdate?: (updates: Record<string, number>) => void;
}


// =============================================================================
// SCOUT AI MASCOT COMPONENT (CSS-rendered, no image file)
// =============================================================================

const ScoutMascot: React.FC<{ size?: 'small' | 'large' | 'sidebar'; pulseEyes?: boolean }> = ({ size = 'large', pulseEyes = false }) => {
  // Map to ScoutHead sizes: small = sm (20px), large = lg (40px), sidebar = xl (56px)
  const sizeMap = {
    small: 'sm' as const,
    large: 'lg' as const,
    sidebar: 'xl' as const,
  };

  return (
    <ScoutHead size={sizeMap[size]} pulseEyes={pulseEyes} />
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
    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-xl hover:bg-neutral-50 hover:border-[#5BDFC2]/30 hover:shadow-sm transition-all text-left group"
  >
    <span className="text-[#5BDFC2] group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{label}</span>
  </button>
);

// =============================================================================
// STYLED CHAT INPUT COMPONENT
// =============================================================================

interface StyledChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  // Voice recording props
  isRecording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  /** New finalized transcript segment to append */
  voiceTranscript?: string;
  /** Real-time interim transcript (while speaking) */
  interimTranscript?: string;
  /** Clear the transcript after consuming */
  onClearTranscript?: () => void;
  /** Voice recording error */
  voiceError?: string | null;
}

const StyledChatInput: React.FC<StyledChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = 'Ask or build anything...',
  isRecording = false,
  onStartRecording,
  onStopRecording,
  voiceTranscript = '',
  interimTranscript = '',
  onClearTranscript,
  voiceError,
}) => {
  const [value, setValue] = useState('');
  const lastTranscriptRef = useRef('');

  // Append NEW voice transcript segments when they arrive
  useEffect(() => {
    if (voiceTranscript && voiceTranscript !== lastTranscriptRef.current) {
      console.log('[Input] Appending transcript:', voiceTranscript);
      setValue(prev => {
        const newValue = prev + (prev ? ' ' : '') + voiceTranscript.trim();
        return newValue;
      });
      lastTranscriptRef.current = voiceTranscript;
      // Clear the transcript so we don't re-append it
      onClearTranscript?.();
    }
  }, [voiceTranscript, onClearTranscript]);

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
            placeholder={isRecording && interimTranscript ? interimTranscript : placeholder}
            disabled={isLoading}
            rows={3}
            className={cn(
              'w-full bg-transparent border-none resize-none outline-none',
              'text-gray-900 text-sm',
              'placeholder:text-gray-400',
              isRecording && interimTranscript && 'placeholder:text-[#5BDFC2] placeholder:italic',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[60px]'
            )}
            style={{ maxHeight: '150px' }}
          />
          {/* Voice error display */}
          {voiceError && (
            <p className="text-xs text-red-500 mt-1">{voiceError}</p>
          )}
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
              <button type="button" className="menu-item item-green" title="Attach file">
                <Paperclip />
              </button>
              <button
                type="button"
                className={cn('menu-item item-orange', isRecording && 'recording-active')}
                title={isRecording ? 'Recording...' : 'Voice input'}
                onClick={onStartRecording}
                disabled={isRecording}
              >
                <Mic />
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
                        id="mint-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#5BDFC2"></stop>
                        <stop offset="100%" stopColor="#0D9488"></stop>
                      </linearGradient>
                    </defs>
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path
                      fill="url(#mint-gradient)"
                      d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                    ></path>
                  </svg>
                </div>
              </div>
              <span className="btn-text">Send</span>
            </div>
          </button>
        </div>

        {/* Audio Visualizer Bar - shown when recording */}
        {isRecording && onStopRecording && (
          <AudioVisualizerBar
            isRecording={isRecording}
            onStopRecording={onStopRecording}
          />
        )}
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
  hasHighMatchScore = false,
  onCriteriaUpdate,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPrompts = useInitialPrompts();

  // View state - toggle between chat and history
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

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
    onCriteriaUpdate: onCriteriaUpdate,
  });

  // Voice recording for dictation
  const {
    isRecording,
    transcript: voiceTranscript,
    interimTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
    error: voiceError,
  } = useVoiceRecording();

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
        'fixed top-0 left-0 h-screen flex flex-col z-40',
        'border-r border-white/20',
        // Add shadow when expanded (overlay effect)
        isExpanded && 'shadow-xl shadow-neutral-900/10',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      initial={false}
      animate={{
        width: isExpanded ? expandedWidth : collapsedWidth,
      }}
      transition={{
        duration: ANIMATION_DURATION,
        ease: [0.32, 0.72, 0, 1], // Snappy cubic-bezier
      }}
    >
      {/* Collapsed State - Rail with header-aligned top */}
      {!isExpanded && (
        <div className="w-full h-full flex flex-col">
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
              'w-full h-14 flex items-center justify-center cursor-pointer border-b border-white/30',
              'hover:bg-[#5BDFC2]/10 transition-colors duration-150',
              'group',
              isAnimationBlocked && 'opacity-50 cursor-not-allowed'
            )}
            title="Open Scout AI"
          >
            <ScoutMascot size="small" />
          </div>

          {/* Expand button with arrow - centered in rail */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={isAnimationBlocked ? undefined : handleToggle}
              disabled={isAnimationBlocked}
              className={cn(
                'p-3 rounded-full bg-[#5BDFC2]/20 hover:bg-[#5BDFC2]/30 transition-colors',
                'text-neutral-600 hover:text-neutral-900',
                isAnimationBlocked && 'opacity-50 cursor-not-allowed'
              )}
              title="Open Scout AI Chat"
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
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <span className="text-xs text-neutral-500 mt-2 writing-mode-vertical">Chat</span>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="flex h-full overflow-hidden">
          {/* Icon Sidebar - 64px wide with subtle glass effect */}
          <div
            className="w-16 flex-shrink-0 border-r border-white/20 flex flex-col items-center"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(248,250,250,0.8) 100%)',
            }}
          >
            {/* Scout Logo - Simple teal icon */}
            <div className="py-3 flex items-center justify-center border-b border-white/30 w-full">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6EDCD1 0%, #4BBEB3 100%)',
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>

            {/* Sidebar buttons */}
            <div className="flex flex-col items-center py-2 gap-1.5 flex-1">

            {/* New Chat Button */}
            <button
              onClick={() => {
                startNewChat();
                setShowHistory(false);
              }}
              disabled={isLoading}
              className={cn(
                'w-12 h-10 rounded-lg flex items-center justify-center transition-all',
                'bg-[#5BDFC2]/10 text-[#5BDFC2] hover:bg-[#5BDFC2]/20 border border-[#5BDFC2]/30',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              title="New chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            {/* Edit/Compose */}
            <button
              className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
              title="Compose"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                'w-12 h-10 rounded-lg flex items-center justify-center transition-all border',
                showHistory
                  ? 'bg-[#5BDFC2]/20 text-[#0D9488] border-[#5BDFC2]/40'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 border-transparent hover:border-neutral-200'
              )}
              title="Chat history"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Settings */}
            <button
              className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Help */}
            <button
              className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="w-12 h-10 rounded-lg bg-[#5BDFC2] flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header - h-14 (56px) to match main app header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/30 flex-shrink-0">
              <span className="text-sm font-medium text-neutral-900">
                {showHistory ? 'Chats' : 'New chat'}
              </span>
              <div className="flex items-center gap-1">
                {/* Expand button */}
                <button
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                  title="Expand"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                {/* Collapse Button */}
                <button
                  onClick={handleToggle}
                  disabled={isAnimationBlocked}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                    isAnimationBlocked && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label="Collapse panel"
                  title="Collapse"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
            {showHistory ? (
              /* History View */
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search chats"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] placeholder:text-neutral-400"
                  />
                </div>

                {/* Chat History List */}
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-neutral-400">No previous chats</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">Previous 30 days</p>
                    <div className="space-y-1">
                      {chatHistory
                        .filter(chat =>
                          !historySearch ||
                          chat.title.toLowerCase().includes(historySearch.toLowerCase())
                        )
                        .map((chat) => (
                          <div
                            key={chat.id}
                            className={cn(
                              'group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                              chat.id === sessionId
                                ? 'bg-[#5BDFC2]/10 text-[#0D9488]'
                                : 'hover:bg-neutral-100 text-neutral-700'
                            )}
                            onClick={() => {
                              loadChatFromHistory(chat.id);
                              setShowHistory(false);
                            }}
                          >
                            <span className="text-sm truncate flex-1 pr-2">{chat.title}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChatFromHistory(chat.id);
                                }}
                                className="p-1 rounded hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Chat View */
              <div className="px-4">
                {messages.length === 0 ? (
                  /* Empty State - Scout AI branded */
                  <div className="pt-8 pb-4 flex flex-col items-center">
                    <h2 className="text-lg font-medium text-neutral-900 mb-1">
                      How can I help?
                    </h2>
                  </div>
                ) : (
                  <div className="py-4">
                    <AIChatMessages messages={messages} onFeedback={handleFeedback} />
                    <div ref={messagesEndRef} />

                    {/* Follow-up prompts - shown below AI response */}
                    {promptsToShow.length > 0 && !isLoading && hasStarted && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pl-11">
                        {promptsToShow.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(prompt)}
                            className="text-left px-2.5 py-1.5 rounded-full bg-neutral-100 text-xs text-neutral-600 hover:bg-[#5BDFC2]/10 hover:text-neutral-800 transition-colors border border-neutral-200 hover:border-[#5BDFC2]/30"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Input & Error */}
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
                    isRecording={isRecording}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    voiceTranscript={voiceTranscript}
                    interimTranscript={interimTranscript}
                    onClearTranscript={clearTranscript}
                    voiceError={voiceError}
                  />

                  {/* Suggestion prompts - below input */}
                  {messages.length === 0 && promptsToShow.length > 0 && !isLoading && (
                    <div className="flex flex-col gap-2 mt-3">
                      {promptsToShow.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(prompt)}
                          className="text-left px-4 py-2.5 rounded-xl bg-white/80 border border-[#6EDCD1]/15 text-sm text-neutral-600 hover:bg-[#6EDCD1]/5 hover:border-[#6EDCD1]/30 hover:text-neutral-800 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
