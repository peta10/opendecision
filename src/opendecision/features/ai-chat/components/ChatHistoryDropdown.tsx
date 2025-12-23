'use client';

/**
 * ChatHistoryDropdown Component
 *
 * Dropdown menu for the New Chat button showing chat history.
 * Features:
 * - Start new chat option
 * - Recent chat items with titles and timestamps
 * - Delete individual chats
 * - Click outside to close
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, MessageSquare, Trash2 } from 'lucide-react';
import { ChatHistoryItem, formatRelativeTime } from '@/opendecision/shared/services/chatHistoryService';
import './ChatHistoryDropdown.css';
import './PanoramicNewChatButton.css';

// =============================================================================
// TYPES
// =============================================================================

interface ChatHistoryDropdownProps {
  /** List of chat history items */
  chatHistory: ChatHistoryItem[];
  /** Current chat ID (to highlight) */
  currentChatId?: string;
  /** Callback when user clicks "New Chat" */
  onNewChat: () => void;
  /** Callback when user clicks a chat to load */
  onLoadChat: (chatId: string) => void;
  /** Callback when user deletes a chat */
  onDeleteChat: (chatId: string) => void;
  /** Whether the chat is currently loading */
  isLoading?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ChatHistoryDropdown: React.FC<ChatHistoryDropdownProps> = ({
  chatHistory,
  currentChatId,
  onNewChat,
  onLoadChat,
  onDeleteChat,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleLoadChat = (chatId: string) => {
    onLoadChat(chatId);
    setIsOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering load
    onDeleteChat(chatId);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chat-history-dropdown-container">
      {/* Trigger Button - Panoramic Gradient */}
      <button
        ref={buttonRef}
        className={`panoramic-new-chat-btn ${isOpen ? 'dropdown-open' : ''}`}
        onClick={toggleDropdown}
        disabled={isLoading}
        aria-label="Chat history menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Plus color="white" strokeWidth={2.5} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="chat-history-dropdown"
          role="menu"
          aria-label="Chat history"
        >
          {/* New Chat Option */}
          <button
            className="chat-history-item new-chat-item"
            onClick={handleNewChat}
            role="menuitem"
          >
            <div className="chat-item-icon new-chat-icon">
              <Plus size={14} />
            </div>
            <span className="chat-item-title">Start New Chat</span>
          </button>

          {/* Divider */}
          {chatHistory.length > 0 && (
            <>
              <div className="chat-history-divider" />
              <div className="chat-history-label">Recent Chats</div>
            </>
          )}

          {/* Chat History List */}
          <div className="chat-history-list">
            {chatHistory.length === 0 ? (
              <div className="chat-history-empty">
                <MessageSquare size={20} className="empty-icon" />
                <span>No previous chats</span>
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-history-item ${chat.id === currentChatId ? 'active' : ''}`}
                  onClick={() => handleLoadChat(chat.id)}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleLoadChat(chat.id);
                    }
                  }}
                >
                  <div className="chat-item-icon">
                    <MessageSquare size={14} />
                  </div>
                  <div className="chat-item-content">
                    <span className="chat-item-title" title={chat.title}>
                      {chat.title}
                    </span>
                    <span className="chat-item-time">
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                  </div>
                  <button
                    className="chat-item-delete"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    aria-label={`Delete "${chat.title}"`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryDropdown;
