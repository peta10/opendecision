/**
 * Chat History Service
 *
 * Manages chat history persistence in localStorage.
 * Stores up to MAX_CHATS conversations with auto-cleanup of oldest.
 */

import { AIChatMessage } from '@/opendecision/shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatHistoryItem {
  id: string;              // Session ID (UUID)
  title: string;           // AI-generated or default title
  messages: AIChatMessage[];
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // Last message timestamp
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CHAT_HISTORY_KEY = 'ppm-ai-chat-history';
const MAX_CHATS = 10;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely get localStorage (handles SSR and blocked storage)
 */
const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    // Test if localStorage is accessible
    window.localStorage.getItem('test');
    return window.localStorage;
  } catch {
    console.warn('localStorage not available');
    return null;
  }
};

/**
 * Generate a simple title from the first user message
 */
export const generateSimpleTitle = (messages: AIChatMessage[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) {
    return formatTimestampTitle(new Date().toISOString());
  }

  const content = firstUserMessage.content.trim();
  if (content.length <= 35) {
    return content;
  }
  return content.substring(0, 32) + '...';
};

/**
 * Format timestamp as a title fallback
 */
const formatTimestampTitle = (isoString: string): string => {
  const date = new Date(isoString);
  return `Chat from ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })}`;
};

/**
 * Format relative time (e.g., "2 min ago", "Yesterday")
 */
export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Get all chat history items, sorted by most recent first
 */
export const getChatHistory = (): ChatHistoryItem[] => {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const data = storage.getItem(CHAT_HISTORY_KEY);
    if (!data) return [];

    const history: ChatHistoryItem[] = JSON.parse(data);
    // Sort by updatedAt descending (most recent first)
    return history.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.warn('Failed to parse chat history:', error);
    return [];
  }
};

/**
 * Save or update a chat in history
 * Auto-removes oldest chats if exceeding MAX_CHATS
 */
export const saveChatToHistory = (chat: ChatHistoryItem): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    let history = getChatHistory();

    // Check if chat already exists (update it)
    const existingIndex = history.findIndex(h => h.id === chat.id);
    if (existingIndex !== -1) {
      history[existingIndex] = chat;
    } else {
      // Add new chat at the beginning
      history.unshift(chat);
    }

    // Enforce max chats limit (remove oldest)
    if (history.length > MAX_CHATS) {
      history = history.slice(0, MAX_CHATS);
    }

    storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save chat history:', error);
    // If storage is full, try clearing oldest chats
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldestChats(3);
      // Retry save
      try {
        const storage = getStorage();
        if (storage) {
          let history = getChatHistory();
          history.unshift(chat);
          history = history.slice(0, MAX_CHATS);
          storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
        }
      } catch {
        console.error('Failed to save chat even after clearing old chats');
      }
    }
  }
};

/**
 * Load a specific chat by ID
 */
export const loadChat = (id: string): ChatHistoryItem | null => {
  const history = getChatHistory();
  return history.find(h => h.id === id) || null;
};

/**
 * Delete a specific chat by ID
 */
export const deleteChat = (id: string): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const history = getChatHistory().filter(h => h.id !== id);
    storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to delete chat:', error);
  }
};

/**
 * Update just the title of a chat
 */
export const updateChatTitle = (id: string, title: string): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const history = getChatHistory();
    const chatIndex = history.findIndex(h => h.id === id);
    if (chatIndex !== -1) {
      history[chatIndex].title = title;
      storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.warn('Failed to update chat title:', error);
  }
};

/**
 * Clear all chat history
 */
export const clearAllHistory = (): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear chat history:', error);
  }
};

/**
 * Clear oldest N chats (used for storage quota management)
 */
const clearOldestChats = (count: number): void => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const history = getChatHistory();
    if (history.length > count) {
      const trimmed = history.slice(0, history.length - count);
      storage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
    }
  } catch (error) {
    console.warn('Failed to clear oldest chats:', error);
  }
};

/**
 * Create a new chat history item
 */
export const createChatHistoryItem = (
  id: string,
  messages: AIChatMessage[],
  title?: string
): ChatHistoryItem => {
  const now = new Date().toISOString();
  return {
    id,
    title: title || generateSimpleTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
  };
};
