'use client';

import React from 'react';
import { X, User } from 'lucide-react';
import { cn } from '@/ppm-tool/shared/lib/utils';

interface HeaderProps {
  onToggleAIPanel?: () => void;
  isAIPanelExpanded?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleAIPanel,
  isAIPanelExpanded = false,
  className,
}) => {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[80] bg-white border-b border-gray-200",
        className
      )}
      style={{
        height: 'var(--header-height, 48px)',
      }}
    >
      <div className="h-full flex items-center justify-between px-4">
        {/* Left: Compass AI Section */}
        <div className="flex items-center gap-3">
          {/* Compass Icon */}
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
            <div className="w-4 h-4 relative">
              <div className="absolute inset-0 rounded-full border-2 border-white" />
              <div className="absolute top-0 left-0 w-1/2 h-full bg-white rounded-l-full" />
            </div>
          </div>

          {/* Compass AI Text */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">Compass AI</span>
            <button
              className="text-xs text-scout hover:text-scout/80 text-left transition-colors"
              onClick={() => {/* TODO: Handle human contact */}}
            >
              Prefer to talk to a human?
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onToggleAIPanel}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close AI panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Open Decision Branding */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="text-lg font-semibold text-gray-900">Open Decision</span>
        </div>

        {/* Right: Navigation Links */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center text-sm text-gray-600">
            <a
              href="#"
              className="px-3 py-1 hover:text-gray-900 transition-colors"
            >
              Spaces
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              className="px-3 py-1 hover:text-gray-900 transition-colors"
            >
              Resources
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              className="px-3 py-1 hover:text-gray-900 transition-colors"
            >
              Contact
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              className="px-3 py-1 hover:text-gray-900 transition-colors"
            >
              Trust
            </a>
          </nav>

          {/* Profile Button */}
          <button className="ml-4 flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};
