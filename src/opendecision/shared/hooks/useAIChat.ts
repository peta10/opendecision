'use client';

/**
 * useAIChat Hook
 *
 * React hook for managing AI chat state and interactions.
 * Provides a clean interface for components to send messages,
 * track loading states, and handle errors.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AIChatContext,
  AIChatMessage,
  Tool,
  Criterion,
} from '../types';
import {
  getOrCreateSessionId,
  clearSession,
  sendChatMessage,
  createUserMessage,
  createLoadingMessage,
  createAssistantMessage,
  createErrorMessage,
  generateChatTitle,
  generateSimpleChatTitle,
} from '../services/aiChatService';
import {
  ChatHistoryItem,
  getChatHistory,
  saveChatToHistory,
  loadChat,
  deleteChat,
  createChatHistoryItem,
} from '../services/chatHistoryService';
import { buildExplainScorePrompt, buildCompareToolsPrompt } from '../utils/aiContextBuilder';

// =============================================================================
// TYPES
// =============================================================================

export interface UseAIChatOptions {
  /** Initial context to use for all messages */
  initialContext?: AIChatContext;
  /** Decision Space ID for scoping chat (Phase 2) */
  decisionSpaceId?: string;
  /** Callback when a new message is received */
  onMessageReceived?: (message: AIChatMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Auto-scroll behavior (default: true) */
  autoScroll?: boolean;
  /**
   * Callback when AI response contains criteria weight updates.
   * Called with { criterionId: newRating } when user expresses preference changes.
   * E.g., "security is more important" -> { "security": 5 }
   */
  onCriteriaUpdate?: (updates: Record<string, number>) => void;
}

export interface UseAIChatReturn {
  // State
  /** All messages in the conversation */
  messages: AIChatMessage[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Current error message if any */
  error: string | null;
  /** Current session ID */
  sessionId: string;
  /** Whether the chat has been opened/used */
  hasStarted: boolean;

  // Chat History State
  /** List of saved chat history items */
  chatHistory: ChatHistoryItem[];
  /** Current chat title */
  currentChatTitle: string;

  // Actions
  /** Send a new message */
  sendMessage: (content: string) => Promise<void>;
  /** Explain a tool's match score */
  explainToolScore: (tool: Tool, criteria: Criterion[]) => Promise<void>;
  /** Compare two tools */
  compareTools: (toolA: Tool, toolB: Tool, criteria: Criterion[]) => Promise<void>;
  /** Start a new chat (clears messages and creates new session) */
  startNewChat: () => void;
  /** Update the context for future messages */
  updateContext: (context: AIChatContext) => void;
  /** Clear current error */
  clearError: () => void;

  // Chat History Actions
  /** Load a chat from history by ID */
  loadChatFromHistory: (chatId: string) => void;
  /** Delete a chat from history */
  deleteChatFromHistory: (chatId: string) => void;
  /** Refresh the chat history list */
  refreshChatHistory: () => void;

  // UI Helpers
  /** Suggested follow-up prompts from the last response */
  suggestedPrompts: string[];
  /** The last assistant message (for showing sources, etc.) */
  lastAssistantMessage: AIChatMessage | null;
  /** Tools mentioned in the last response */
  lastMentionedTools: string[];
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export const useAIChat = (options: UseAIChatOptions = {}): UseAIChatReturn => {
  const {
    initialContext,
    decisionSpaceId,
    onMessageReceived,
    onError,
    onCriteriaUpdate,
  } = options;

  // State
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [context, setContext] = useState<AIChatContext | undefined>(initialContext);
  const [hasStarted, setHasStarted] = useState(false);

  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('New Chat');
  const [currentChatCreatedAt, setCurrentChatCreatedAt] = useState<string>('');

  // Refs for callbacks (to avoid stale closures)
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onErrorRef = useRef(onError);
  const onCriteriaUpdateRef = useRef(onCriteriaUpdate);
  const isGeneratingTitle = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onErrorRef.current = onError;
    onCriteriaUpdateRef.current = onCriteriaUpdate;
  }, [onMessageReceived, onError, onCriteriaUpdate]);

  // Initialize session ID and load chat history on mount
  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);
    setChatHistory(getChatHistory());
    setCurrentChatCreatedAt(new Date().toISOString());
  }, []);

  // Auto-save current chat when messages change
  useEffect(() => {
    if (messages.length > 0 && sessionId && hasStarted) {
      const chatItem = createChatHistoryItem(
        sessionId,
        messages,
        currentChatTitle !== 'New Chat' ? currentChatTitle : undefined
      );
      chatItem.createdAt = currentChatCreatedAt || new Date().toISOString();
      saveChatToHistory(chatItem);
      // Refresh the history list
      setChatHistory(getChatHistory());
    }
  }, [messages, sessionId, currentChatTitle, hasStarted, currentChatCreatedAt]);

  // Generate AI title after first assistant response
  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.isLoading && !m.error);
    const userMessages = messages.filter(m => m.role === 'user');

    // Generate title after first complete exchange (user + assistant)
    if (
      userMessages.length >= 1 &&
      assistantMessages.length >= 1 &&
      currentChatTitle === 'New Chat' &&
      !isGeneratingTitle.current &&
      sessionId
    ) {
      isGeneratingTitle.current = true;

      // Use simple title immediately (fast), then try AI title in background
      const simpleTitle = generateSimpleChatTitle(messages);
      setCurrentChatTitle(simpleTitle);

      // Generate AI title in background (optional enhancement)
      generateChatTitle(messages, sessionId)
        .then(aiTitle => {
          if (aiTitle && aiTitle !== simpleTitle) {
            setCurrentChatTitle(aiTitle);
          }
        })
        .catch(() => {
          // Keep simple title on failure
        })
        .finally(() => {
          isGeneratingTitle.current = false;
        });
    }
  }, [messages, sessionId, currentChatTitle]);

  // Update context when initialContext changes
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  // Computed values
  const suggestedPrompts = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isLoading);
    return lastAssistant?.suggested_prompts || [];
  }, [messages]);

  const lastAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === 'assistant' && !m.isLoading) || null;
  }, [messages]);

  const lastMentionedTools = useMemo(() => {
    return lastAssistantMessage?.tools_mentioned || [];
  }, [lastAssistantMessage]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setHasStarted(true);
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage = createUserMessage(content);
    setMessages((prev) => [...prev, userMessage]);

    // Add loading placeholder
    const loadingMessage = createLoadingMessage();
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await sendChatMessage(sessionId, content, context, decisionSpaceId);
      const assistantMessage = createAssistantMessage(response);

      // Replace loading message with actual response
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== loadingMessage.id);
        return [...withoutLoading, assistantMessage];
      });

      // Notify callback
      onMessageReceivedRef.current?.(assistantMessage);

      // If AI response contains criteria updates, apply them in real-time
      // This enables "security is more important" -> instant slider/ranking updates
      if (response.criteria_updates && Object.keys(response.criteria_updates).length > 0) {
        console.log('🔄 AI detected criteria preference change:', response.criteria_updates);
        onCriteriaUpdateRef.current?.(response.criteria_updates);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);

      // Replace loading message with error message
      const errorMessage = createErrorMessage(errorMsg);
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== loadingMessage.id);
        return [...withoutLoading, errorMessage];
      });

      // Notify callback
      onErrorRef.current?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, context, decisionSpaceId, isLoading]);

  // Explain tool score
  const explainToolScore = useCallback(async (tool: Tool, criteria: Criterion[]) => {
    const prompt = buildExplainScorePrompt(tool, criteria);
    await sendMessage(prompt);
  }, [sendMessage]);

  // Compare tools
  const compareTools = useCallback(async (toolA: Tool, toolB: Tool, criteria: Criterion[]) => {
    const prompt = buildCompareToolsPrompt(toolA, toolB, criteria);
    await sendMessage(prompt);
  }, [sendMessage]);

  // Start new chat
  const startNewChat = useCallback(() => {
    const newSessionId = clearSession();
    setSessionId(newSessionId);
    setMessages([]);
    setError(null);
    setHasStarted(false);
    setCurrentChatTitle('New Chat');
    setCurrentChatCreatedAt(new Date().toISOString());
    isGeneratingTitle.current = false;
  }, []);

  // Load a chat from history
  const loadChatFromHistory = useCallback((chatId: string) => {
    const chat = loadChat(chatId);
    if (chat) {
      setSessionId(chat.id);
      setMessages(chat.messages);
      setCurrentChatTitle(chat.title);
      setCurrentChatCreatedAt(chat.createdAt);
      setHasStarted(true);
      setError(null);
      isGeneratingTitle.current = false;
    }
  }, []);

  // Delete a chat from history
  const deleteChatFromHistory = useCallback((chatId: string) => {
    deleteChat(chatId);
    setChatHistory(getChatHistory());

    // If we deleted the current chat, start a new one
    if (chatId === sessionId) {
      startNewChat();
    }
  }, [sessionId, startNewChat]);

  // Refresh chat history list
  const refreshChatHistory = useCallback(() => {
    setChatHistory(getChatHistory());
  }, []);

  // Update context
  const updateContext = useCallback((newContext: AIChatContext) => {
    setContext(newContext);
  }, []);

  // Clear error
  const clearErrorFn = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    messages,
    isLoading,
    error,
    sessionId,
    hasStarted,

    // Chat History State
    chatHistory,
    currentChatTitle,

    // Actions
    sendMessage,
    explainToolScore,
    compareTools,
    startNewChat,
    updateContext,
    clearError: clearErrorFn,

    // Chat History Actions
    loadChatFromHistory,
    deleteChatFromHistory,
    refreshChatHistory,

    // UI Helpers
    suggestedPrompts,
    lastAssistantMessage,
    lastMentionedTools,
  };
};

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to track if user has an active chat session
 */
export const useHasActiveChat = (): boolean => {
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionId = sessionStorage.getItem('ppm-ai-chat-session');
      setHasActive(!!sessionId);
    }
  }, []);

  return hasActive;
};

/**
 * Hook for the initial suggested prompts (before any conversation)
 */
export const useInitialPrompts = (): string[] => {
  return useMemo(() => [
    'Best tool for Agile?',
    'Compare top 3 tools',
    'Explain my scores',
  ], []);
};

export default useAIChat;
