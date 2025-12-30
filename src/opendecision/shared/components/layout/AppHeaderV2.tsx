'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { useSpace } from '@/opendecision/shared/contexts/SpaceContext';
import {
  ChevronDown,
  Plus,
  Check,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
  Settings,
  LogOut,
  Pencil,
} from 'lucide-react';

interface AppHeaderV2Props {
  currentStep: string;
  onStepChange: (step: string) => void;
  onShowHowItWorks?: () => void;
  isAIPanelExpanded?: boolean;
}

/**
 * AppHeaderV2 - Single-row Google-style minimal header
 *
 * Layout: [☰] Space Name ▾    Framing  Hub    [?] [+] [👤]
 * Collapses right side when AI panel is expanded
 */
export const AppHeaderV2: React.FC<AppHeaderV2Props> = ({
  currentStep,
  onStepChange,
  onShowHowItWorks,
  isAIPanelExpanded = false,
}) => {
  const {
    currentSpace,
    spaces,
    createSpace,
    switchSpace,
    updateSpace,
    isLoadingSpaces,
  } = useSpace();

  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const spaceDropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(event.target as Node)) {
        setShowSpaceDropdown(false);
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSpace = async () => {
    try {
      const newSpace = await createSpace({ name: 'Untitled Space' });
      await switchSpace(newSpace.id);
      setShowSpaceDropdown(false);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  const handleSwitchSpace = async (spaceId: string) => {
    try {
      await switchSpace(spaceId);
      setShowSpaceDropdown(false);
    } catch (error) {
      console.error('Failed to switch space:', error);
    }
  };

  const handleStartEditing = () => {
    setEditedName(currentSpace?.name || 'Untitled Space');
    setIsEditingName(true);
    setShowSpaceDropdown(false);
    // Focus input after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const handleSaveName = async () => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== currentSpace?.name) {
      try {
        await updateSpace({ name: trimmedName });
      } catch (error) {
        console.error('Failed to rename space:', error);
      }
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const spaceName = currentSpace?.name || 'Untitled Space';
  const isFraming = currentStep !== 'decision-hub';

  // Calculate left offset based on AI panel state
  // When expanded: var(--ai-panel-width, 380px)
  // When collapsed: var(--ai-rail-width, 64px) or use content-margin
  const headerLeftOffset = isAIPanelExpanded
    ? 'var(--ai-panel-width, 380px)'
    : 'var(--ai-rail-width, 64px)';

  return (
    <header
      className="fixed top-0 right-0 z-[100] bg-white border-b border-gray-100 transition-all duration-150"
      style={{ left: headerLeftOffset }}
    >
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left Section - Menu + Space Selector */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu */}
          <div className="relative" ref={menuDropdownRef}>
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showMenuDropdown ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {showMenuDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">OpenDecision</p>
                </div>
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Spaces
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Resources
                  <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Contact
                </a>
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Trust & Security
                </a>
                <div className="h-px bg-gray-100 my-2" />
                <button
                  onClick={onShowHowItWorks}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  How it Works
                </button>
              </div>
            )}
          </div>

          {/* Space Selector */}
          <div className="relative" ref={spaceDropdownRef}>
            {isEditingName ? (
              // Inline edit mode
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  className="text-sm font-medium text-gray-900 bg-gray-100 border-0 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-gray-300 max-w-[200px]"
                  autoFocus
                />
              </div>
            ) : (
              // Display mode with dropdown trigger
              <button
                onClick={() => setShowSpaceDropdown(!showSpaceDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <span className="max-w-[200px] truncate">{spaceName}</span>
                <Pencil
                  className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditing();
                  }}
                />
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showSpaceDropdown && 'rotate-180')} />
              </button>
            )}

            {showSpaceDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Your Spaces</p>
                </div>
                {isLoadingSpaces ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">Loading...</div>
                ) : spaces.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">No spaces yet</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {spaces.map((space) => (
                      <button
                        key={space.id}
                        onClick={() => handleSwitchSpace(space.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors',
                          currentSpace?.id === space.id && 'bg-gray-50'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{space.name}</div>
                          <div className="text-xs text-gray-500">
                            Updated {new Date(space.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        {currentSpace?.id === space.id && (
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="h-px bg-gray-100 my-2" />
                <button
                  onClick={handleCreateSpace}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Space
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - View Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStepChange('criteria-tools')}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              isFraming ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Framing
            {isFraming && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
          <button
            onClick={() => onStepChange('decision-hub')}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              !isFraming ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Hub
            {!isFraming && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1">
          {/* Help */}
          <button
            onClick={onShowHowItWorks}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="How it Works"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* New Space */}
          <button
            onClick={handleCreateSpace}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="New Space"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Profile */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors ml-1"
            >
              U
            </button>

            {showProfileDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
                <div className="h-px bg-gray-100 my-2" />
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeaderV2;
