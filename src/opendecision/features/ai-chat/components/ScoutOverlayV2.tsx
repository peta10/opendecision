'use client';

import React, { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/opendecision/shared/lib/utils';
import { useInitialPrompts } from '@/opendecision/shared/hooks/useAIChat';
import { useSharedAIChat } from '@/opendecision/shared/contexts/AIChatContext';
import { AIChatContext, Tool, Criterion, AIChatMessage } from '@/opendecision/shared/types';
import { useVoiceRecording } from '@/opendecision/shared/hooks/useVoiceRecording';

// =============================================================================
// TYPES
// =============================================================================

interface ScoutOverlayV2Props {
  isOpen: boolean;
  onClose: () => void;
  context?: AIChatContext;
  tools?: Tool[];
  criteria?: Criterion[];
  decisionSpaceId?: string;
}

// =============================================================================
// SIMPLE MESSAGE COMPONENT (Google-style minimal - no avatars)
// =============================================================================

const MessageBubble: React.FC<{ message: AIChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;

  return (
    <div className={cn('mb-4', isUser ? 'flex justify-end' : 'flex justify-start')}>
      {/* Message - no avatars, clean and minimal */}
      <div
        className={cn(
          'max-w-[85%]',
          isUser
            ? 'bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2.5'
            : 'text-gray-700'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// VOICE RECORDING INDICATOR
// =============================================================================

const VoiceRecordingBar: React.FC<{
  isRecording: boolean;
  onStop: () => void;
  interimTranscript?: string;
}> = ({ isRecording, onStop, interimTranscript }) => {
  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-3"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Waveform visualization */}
          <div className="flex-1 flex items-center justify-center gap-1 h-8">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-emerald-500 rounded-full"
                animate={{
                  height: [8, 24, 8],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Stop button */}
          <button
            onClick={onStop}
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          >
            <div className="w-3 h-3 bg-white rounded-sm" />
          </button>
        </div>

        {/* Live transcript preview */}
        {interimTranscript && (
          <p className="mt-3 text-sm text-gray-500 italic text-center">
            {interimTranscript}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// =============================================================================
// MAIN OVERLAY COMPONENT
// =============================================================================

export const ScoutOverlayV2: React.FC<ScoutOverlayV2Props> = ({
  isOpen,
  onClose,
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
  } = useSharedAIChat();

  const {
    isRecording,
    transcript: voiceTranscript,
    interimTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
    error: voiceError,
  } = useVoiceRecording();

  // Append voice transcript
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

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom
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
    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = inputValue.trim().length > 0 && !isLoading;
  const promptsToShow = (hasStarted ? suggestedPrompts : initialPrompts).slice(0, 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header - Minimal Google-style */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="font-medium text-gray-900">Scout</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startNewChat()}
                  disabled={isLoading}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="New chat"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                {messages.length === 0 ? (
                  /* Empty State - Google style minimal */
                  <div className="h-full flex flex-col items-center justify-center py-12">
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">
                      How can I help?
                    </h2>
                    <p className="text-gray-500 text-center max-w-md text-sm">
                      Ask me anything about your decision, compare products, or get recommendations.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input Area - Clean, Google-style */}
            <div className="p-6 border-t border-gray-100">
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={clearError} className="text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Voice error */}
              {voiceError && (
                <p className="mb-2 text-xs text-red-500">{voiceError}</p>
              )}

              {/* Suggestion Pills - Only when no messages */}
              {messages.length === 0 && promptsToShow.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {promptsToShow.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(prompt)}
                      className="px-4 py-2 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Container */}
              <div className="relative">
                {/* Voice Recording Bar */}
                <AnimatePresence>
                  <VoiceRecordingBar
                    isRecording={isRecording}
                    onStop={stopRecording}
                    interimTranscript={interimTranscript}
                  />
                </AnimatePresence>

                <div className="flex items-end gap-3 bg-gray-100 rounded-2xl p-2">
                  {/* Mic Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isRecording
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm'
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? 'Listening...' : 'Ask Scout anything...'}
                    disabled={isLoading}
                    rows={1}
                    className={cn(
                      'flex-1 bg-transparent resize-none outline-none py-2.5 px-1',
                      'text-gray-900 text-sm placeholder:text-gray-400',
                      'disabled:opacity-50'
                    )}
                    style={{ maxHeight: '120px' }}
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      canSend
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Follow-up suggestions after conversation */}
              {hasStarted && !isLoading && promptsToShow.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {promptsToShow.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoutOverlayV2;
