/**
 * AI Chat Service
 *
 * Handles communication with the ai-chat Supabase Edge Function.
 * Provides session management, message sending, and convenience methods
 * for common AI interactions like explaining scores and comparing tools.
 */

import {
  AIChatContext,
  AIChatMessage,
  AIChatResponse,
  AIChatRequest,
  AIChatSession,
  Tool,
  Criterion,
} from '../types';
import { buildExplainScorePrompt, buildCompareToolsPrompt } from '../utils/aiContextBuilder';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const AI_CHAT_ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-chat`;

// Session storage key
const SESSION_STORAGE_KEY = 'ppm-ai-chat-session';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique message ID
 */
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Get current ISO timestamp
 */
const getTimestamp = (): string => new Date().toISOString();

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Get or create a session ID from sessionStorage.
 * This ensures conversation continuity within a browser session.
 */
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    // sessionStorage might be blocked
    console.warn('Could not access sessionStorage:', error);
    return generateSessionId();
  }
};

/**
 * Clear the current session (for "New Chat" functionality)
 */
export const clearSession = (): string => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Could not clear sessionStorage:', error);
    }
  }
  return getOrCreateSessionId();
};

// =============================================================================
// API COMMUNICATION
// =============================================================================

/**
 * Send a message to the ai-chat Edge Function
 *
 * @param sessionId - Session identifier for conversation continuity
 * @param message - User's message text
 * @param context - Optional context with current user state
 * @param decisionSpaceId - Optional Decision Space ID for scoping chat (Phase 2)
 * @returns AI response with message, sources, and suggestions
 * @throws Error if the API call fails
 */
export const sendChatMessage = async (
  sessionId: string,
  message: string,
  context?: AIChatContext,
  decisionSpaceId?: string
): Promise<AIChatResponse> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Check environment variables.');
  }

  const requestBody: AIChatRequest = {
    session_id: sessionId,
    message,
    context,
    decision_space_id: decisionSpaceId,
  };

  const response = await fetch(AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Chat API error:', response.status, errorText);
    throw new Error(`AI Chat failed: ${response.status} - ${errorText}`);
  }

  const data: AIChatResponse = await response.json();
  return data;
};

// =============================================================================
// MESSAGE CREATION HELPERS
// =============================================================================

/**
 * Create a user message object
 */
export const createUserMessage = (content: string): AIChatMessage => ({
  id: generateMessageId(),
  role: 'user',
  content,
  timestamp: getTimestamp(),
});

/**
 * Create a loading/pending assistant message
 */
export const createLoadingMessage = (): AIChatMessage => ({
  id: generateMessageId(),
  role: 'assistant',
  content: '',
  timestamp: getTimestamp(),
  isLoading: true,
});

/**
 * Create an assistant message from API response
 */
export const createAssistantMessage = (response: AIChatResponse): AIChatMessage => ({
  id: generateMessageId(),
  role: 'assistant',
  content: response.message,
  timestamp: getTimestamp(),
  sources: response.sources,
  suggested_prompts: response.suggested_prompts,
  tools_mentioned: response.tools_mentioned,
  usage: response.usage,
});

/**
 * Create an error message
 */
export const createErrorMessage = (error: string): AIChatMessage => ({
  id: generateMessageId(),
  role: 'assistant',
  content: 'I apologize, but I encountered an error processing your request. Please try again.',
  timestamp: getTimestamp(),
  error,
});

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Ask the AI to explain a tool's match score
 *
 * @param tool - The tool to explain
 * @param criteria - Current criteria with user ratings
 * @param sessionId - Session ID for conversation context
 * @param context - Full AI context
 * @returns AI response explaining the score
 */
export const explainToolScore = async (
  tool: Tool,
  criteria: Criterion[],
  sessionId: string,
  context?: AIChatContext
): Promise<AIChatResponse> => {
  const prompt = buildExplainScorePrompt(tool, criteria);
  return sendChatMessage(sessionId, prompt, context);
};

/**
 * Ask the AI to compare two tools
 *
 * @param toolA - First tool to compare
 * @param toolB - Second tool to compare
 * @param criteria - Current criteria with user ratings
 * @param sessionId - Session ID for conversation context
 * @param context - Full AI context
 * @returns AI response with comparison
 */
export const compareTools = async (
  toolA: Tool,
  toolB: Tool,
  criteria: Criterion[],
  sessionId: string,
  context?: AIChatContext
): Promise<AIChatResponse> => {
  const prompt = buildCompareToolsPrompt(toolA, toolB, criteria);
  return sendChatMessage(sessionId, prompt, context);
};

// =============================================================================
// SERVICE CLASS (Alternative OOP Pattern)
// =============================================================================

/**
 * AIChatService class for stateful chat management.
 * Use this if you prefer an OOP approach over the functional exports.
 */
export class AIChatService {
  private sessionId: string;
  private messages: AIChatMessage[] = [];
  private context: AIChatContext | null = null;
  private isLoading: boolean = false;
  private error: string | null = null;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || getOrCreateSessionId();
  }

  // Getters
  getSessionId(): string {
    return this.sessionId;
  }

  getMessages(): AIChatMessage[] {
    return [...this.messages];
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  getError(): string | null {
    return this.error;
  }

  // Setters
  setContext(context: AIChatContext): void {
    this.context = context;
  }

  // Actions
  async sendMessage(content: string): Promise<AIChatMessage> {
    this.isLoading = true;
    this.error = null;

    // Add user message
    const userMessage = createUserMessage(content);
    this.messages.push(userMessage);

    try {
      const response = await sendChatMessage(this.sessionId, content, this.context || undefined);
      const assistantMessage = createAssistantMessage(response);
      this.messages.push(assistantMessage);
      this.isLoading = false;
      return assistantMessage;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.error = errorMsg;
      const errorMessage = createErrorMessage(errorMsg);
      this.messages.push(errorMessage);
      this.isLoading = false;
      return errorMessage;
    }
  }

  async explainScore(tool: Tool, criteria: Criterion[]): Promise<AIChatMessage> {
    const prompt = buildExplainScorePrompt(tool, criteria);
    return this.sendMessage(prompt);
  }

  async compare(toolA: Tool, toolB: Tool, criteria: Criterion[]): Promise<AIChatMessage> {
    const prompt = buildCompareToolsPrompt(toolA, toolB, criteria);
    return this.sendMessage(prompt);
  }

  startNewChat(): void {
    this.sessionId = clearSession();
    this.messages = [];
    this.error = null;
  }

  clearError(): void {
    this.error = null;
  }
}

// =============================================================================
// FEEDBACK SUBMISSION
// =============================================================================

/**
 * Submit feedback (thumbs up/down) for a message
 *
 * @param sessionId - Session identifier
 * @param messageContent - The content of the message being rated
 * @param isPositive - true for thumbs up, false for thumbs down
 * @returns Result object with success status
 */
export const submitMessageFeedback = async (
  sessionId: string,
  messageContent: string,
  isPositive: boolean
): Promise<{ success: boolean; error?: string }> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Supabase configuration is missing' };
  }

  try {
    // Use the ai schema for the feedback function
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_message_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        'Accept-Profile': 'ai',
        'Content-Profile': 'ai',
      },
      body: JSON.stringify({
        p_session_id: sessionId,
        p_message_content: messageContent,
        p_rating: isPositive ? 5 : 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Feedback submission error:', response.status, errorText);
      return { success: false, error: `Failed to submit feedback: ${response.status}` };
    }

    const result = await response.json();
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Feedback submission error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// =============================================================================
// CHAT TITLE GENERATION
// =============================================================================

/**
 * Generate a chat title using AI based on conversation content
 *
 * @param messages - Array of chat messages to generate title from
 * @param sessionId - Session identifier
 * @returns Promise<string> - AI-generated title or fallback
 */
export const generateChatTitle = async (
  messages: AIChatMessage[],
  sessionId: string
): Promise<string> => {
  // Need at least one user message to generate a title
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) {
    return `Chat from ${formatChatTimestamp(new Date())}`;
  }

  // Try AI-generated title
  try {
    // Take first 2-3 messages for context
    const contextMessages = messages.slice(0, 4);
    const conversationSummary = contextMessages
      .map(m => `${m.role}: ${m.content.substring(0, 150)}`)
      .join('\n');

    const titlePrompt = `Generate a very short title (3-5 words max) for this PPM tool finder conversation. Just respond with the title, nothing else.\n\nConversation:\n${conversationSummary}`;

    const response = await sendChatMessage(sessionId, titlePrompt);

    // Clean up the response - remove quotes, trim, limit length
    let title = response.message
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Title:\s*/i, '') // Remove "Title:" prefix if present
      .trim();

    // Enforce max length
    if (title.length > 40) {
      title = title.substring(0, 37) + '...';
    }

    return title || generateSimpleChatTitle(messages);
  } catch (error) {
    console.warn('AI title generation failed, using fallback:', error);
    return generateSimpleChatTitle(messages);
  }
};

/**
 * Generate a simple title from the first user message (fallback)
 */
export const generateSimpleChatTitle = (messages: AIChatMessage[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) {
    return `Chat from ${formatChatTimestamp(new Date())}`;
  }

  const content = firstUserMessage.content.trim();
  if (content.length <= 35) {
    return content;
  }
  return content.substring(0, 32) + '...';
};

/**
 * Format a date for chat timestamp title
 */
const formatChatTimestamp = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

// Export a singleton instance for simple usage
let defaultService: AIChatService | null = null;

export const getAIChatService = (): AIChatService => {
  if (!defaultService) {
    defaultService = new AIChatService();
  }
  return defaultService;
};

// Export the class for custom instances
export default AIChatService;
