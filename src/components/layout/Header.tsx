'use client';

import React from 'react';
import Link from 'next/link';
import { X, User } from 'lucide-react';

interface HeaderProps {
  onToggleAI?: () => void;
  isAIVisible?: boolean;
  isAIPanelExpanded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleAI,
  isAIVisible = true,
  isAIPanelExpanded = false,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[80] w-full bg-white border-b border-gray-200">
      <div
        className="flex items-center justify-between h-12 px-4"
        style={{
          // Dynamic margin based on AI panel state
          marginLeft: isAIPanelExpanded
            ? 'var(--ai-panel-width, 320px)'
            : 'var(--ai-rail-width, 64px)',
          transition: 'margin-left 0.15s ease-out'
        }}
      >
        {/* Left Section - Compass AI */}
        <div className="flex items-center gap-3">
          {/* Compass Icon */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">Compass AI</span>
              <a
                href="#"
                className="text-xs text-scout hover:text-scout/80 underline"
              >
                Prefer to talk to a human?
              </a>
            </div>
          </div>

          {/* Close Button */}
          {isAIVisible && (
            <button
              onClick={onToggleAI}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center Section - Brand */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/" className="text-lg font-bold text-gray-900 hover:text-gray-700 transition-colors">
            Open Decision
          </Link>
        </div>

        {/* Right Section - Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/spaces"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Spaces
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/resources"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Resources
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/contact"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Contact
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/trust"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Trust
          </Link>

          {/* Profile with Avatar */}
          <Link
            href="/profile"
            className="ml-4 flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>Profile</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
