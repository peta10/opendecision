'use client';

import React, { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Mic } from 'lucide-react';
import { cn } from '@/opendecision/shared/lib/utils';
import { useAIChat, useInitialPrompts } from '@/opendecision/shared/hooks/useAIChat';
import { AIChatMessages } from './AIChatMessages';
import { AIChatContext, Tool, Criterion } from '@/opendecision/shared/types';
import { ScoutHead } from '@/opendecision/shared/components/scout';
import { AudioVisualizerBar } from './AudioVisualizerBar';
import { useVoiceRecording } from '@/opendecision/shared/hooks/useVoiceRecording';
import './ScoutSendButton.css';
import './AttachmentMenu.css';

interface ScoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  context?: AIChatContext;
  tools?: Tool[];
  criteria?: Criterion[];
  decisionSpaceId?: string;
}

/**
 * ScoutOverlay - Full-screen modal for Scout AI chat
 *
 * Matches the AI panel layout exactly with:
 * - Full height
 * - Sidebar with icons
 * - Same chat interface
 */
export const ScoutOverlay: React.FC<ScoutOverlayProps> = ({
  isOpen,
  onClose,
  context,
  decisionSpaceId,
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTranscriptRef = useRef('');
  const initialPrompts = useInitialPrompts();

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    suggestedPrompts,
    hasStarted,
    clearError,
  } = useAIChat({
    initialContext: context,
    decisionSpaceId,
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

  // Append NEW voice transcript segments when they arrive
  useEffect(() => {
    if (voiceTranscript && voiceTranscript !== lastTranscriptRef.current) {
      setInputValue(prev => {
        const newValue = prev + (prev ? ' ' : '') + voiceTranscript.trim();
        return newValue;
      });
      lastTranscriptRef.current = voiceTranscript;
      clearTranscript?.();
    }
  }, [voiceTranscript, clearTranscript]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus textarea when overlay opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const canSend = inputValue.trim().length > 0 && !isLoading;
  const promptsToShow = (hasStarted ? suggestedPrompts : initialPrompts).slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop - darker with more blur */}
          <motion.div
            className="absolute inset-0 bg-[#0B1E2D]/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content - Centered modal with strong shadow */}
          <motion.div
            className="relative flex overflow-hidden border border-white/30"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '750px',
              height: '95vh',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.97) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Icon Sidebar */}
            <div
              className="w-16 flex-shrink-0 border-r border-white/20 flex flex-col items-center rounded-l-2xl"
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
                  onClick={() => startNewChat()}
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

                {/* History */}
                <button
                  className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
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
              </div>
            </div>

            {/* Main Panel */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-r-2xl">
              {/* Header - Same style as AI Panel */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/30 flex-shrink-0">
                <span className="text-sm font-medium text-neutral-900">New chat</span>
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
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pb-4 w-full">
                  {messages.length === 0 ? (
                    /* Empty State */
                    <div className="pt-8 pb-4 flex flex-col items-center">
                      <h2 className="text-lg font-medium text-neutral-900 mb-1">
                        How can I help?
                      </h2>
                    </div>
                  ) : (
                    <div className="py-4">
                      <AIChatMessages messages={messages} />
                      <div ref={messagesEndRef} />

                      {/* Follow-up prompts */}
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
                  <div className="space-y-3">
                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                        {error}
                        <button onClick={clearError} className="ml-2 underline">
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Chat Input - Same style as AI Panel */}
                    <div className="w-full max-w-none">
                      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden w-full">
                        <div className="px-4 pt-4 pb-3">
                          <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isRecording && interimTranscript ? interimTranscript : 'Ask or build anything...'}
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
                          {voiceError && (
                            <p className="text-xs text-red-500 mt-1">{voiceError}</p>
                          )}
                        </div>

                        {/* Bottom toolbar */}
                        <div className="flex items-center justify-between px-3 pb-3">
                          {/* Left side - Attachment Menu */}
                          <div className="flex items-center">
                            <nav className="attachment-menu">
                              <input type="checkbox" className="menu-open" name="overlay-menu-open" id="overlay-menu-open" defaultChecked />
                              <label className="menu-open-button" htmlFor="overlay-menu-open">
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
                                onClick={startRecording}
                                disabled={isRecording}
                              >
                                <Mic />
                              </button>
                            </nav>
                          </div>

                          {/* Right side - Scout Send Button */}
                          <button
                            onClick={handleSubmit}
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
                                        id="overlay-mint-gradient"
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
                                      fill="url(#overlay-mint-gradient)"
                                      d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                              <span className="btn-text">Send</span>
                            </div>
                          </button>
                        </div>

                        {/* Audio Visualizer Bar */}
                        {isRecording && stopRecording && (
                          <AudioVisualizerBar
                            isRecording={isRecording}
                            onStopRecording={stopRecording}
                          />
                        )}
                      </div>
                    </div>

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
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoutOverlay;
