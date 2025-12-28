'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { useSpace } from '@/opendecision/shared/contexts/SpaceContext';
import { ChevronDown, Plus, Folder, Pencil, Check, X } from 'lucide-react';

interface AppHeaderProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  isAIPanelExpanded: boolean;
  onShowHowItWorks?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentStep,
  onStepChange,
  isAIPanelExpanded,
  onShowHowItWorks,
}) => {
  const {
    currentSpace,
    spaces,
    updateSpace,
    createSpace,
    switchSpace,
    isLoadingSpaces,
  } = useSpace();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showSpacesDropdown, setShowSpacesDropdown] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize edited name when space loads
  useEffect(() => {
    if (currentSpace?.name) {
      setEditedName(currentSpace.name);
    }
  }, [currentSpace?.name]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSpacesDropdown(false);
      }
    };

    if (showSpacesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpacesDropdown]);

  const handleNameEdit = () => {
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!currentSpace || editedName.trim() === currentSpace.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateSpace({
        name: editedName.trim(),
      });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update space name:', error);
      setEditedName(currentSpace.name); // Revert on error
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setEditedName(currentSpace?.name || '');
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleCreateSpace = async () => {
    try {
      const newSpace = await createSpace({
        name: 'Untitled Space',
      });
      await switchSpace(newSpace.id);
      setShowSpacesDropdown(false);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  const handleSwitchSpace = async (spaceId: string) => {
    try {
      await switchSpace(spaceId);
      setShowSpacesDropdown(false);
    } catch (error) {
      console.error('Failed to switch space:', error);
    }
  };

  const spaceName = currentSpace?.name || 'Untitled Space';

  return (
    <header
      className="fixed top-0 right-0 z-[80]"
      style={{
        left: isAIPanelExpanded
          ? 'var(--ai-panel-width, 380px)'
          : 'var(--ai-rail-width, 64px)',
        transition: 'left 0.15s ease-out',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(11, 30, 45, 0.08)',
        boxShadow: '0 1px 3px rgba(11, 30, 45, 0.04)',
      }}
    >
      <div className="h-11 px-5 font-sans flex items-center justify-between">
        {/* Left Section - Logo and Space Selector */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6EDCD1 0%, #4BBEB3 100%)',
              }}
            >
              <svg
                className="w-5 h-5 text-[#0B1E2D]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-neutral-900 tracking-tight">
              OpenDecision
            </span>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-neutral-200" />

          {/* Space Selector */}
          <div className="flex items-center gap-2">
            {/* Editable Space Name */}
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleNameSave}
                  className="px-2 py-1 text-xs font-medium text-neutral-900 bg-white border border-[#6EDCD1] rounded focus:outline-none focus:ring-2 focus:ring-[#6EDCD1]/30"
                  style={{ minWidth: '140px' }}
                />
                <button
                  onClick={handleNameSave}
                  className="p-0.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNameCancel}
                  className="p-0.5 text-neutral-400 hover:bg-neutral-100 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleNameEdit}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#f5f7f7] border border-neutral-200 rounded hover:border-[#6EDCD1] transition-colors group"
              >
                <span className="text-xs font-medium text-neutral-900">
                  {spaceName}
                </span>
                <Pencil className="w-3 h-3 text-neutral-400 group-hover:text-[#4BBEB3] transition-colors" />
              </button>
            )}

            {/* Space Actions */}
            <div className="flex items-center gap-1.5">
              {/* My Spaces Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowSpacesDropdown(!showSpacesDropdown)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded hover:border-[#6EDCD1] hover:text-[#4BBEB3] transition-colors"
                >
                  <Folder className="w-3 h-3" />
                  <span>My Spaces</span>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform',
                      showSpacesDropdown && 'rotate-180'
                    )}
                  />
                </button>

                {/* Dropdown Menu */}
                {showSpacesDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Your Spaces
                    </div>
                    {isLoadingSpaces ? (
                      <div className="px-3 py-4 text-sm text-neutral-500 text-center">
                        Loading...
                      </div>
                    ) : spaces.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-neutral-500 text-center">
                        No spaces yet
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {spaces.map((space) => (
                          <button
                            key={space.id}
                            onClick={() => handleSwitchSpace(space.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors',
                              currentSpace?.id === space.id && 'bg-[#6EDCD1]/10'
                            )}
                          >
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                currentSpace?.id === space.id
                                  ? 'bg-[#6EDCD1]'
                                  : 'bg-neutral-300'
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-neutral-900 truncate">
                                {space.name}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {new Date(space.updated_at).toLocaleDateString()}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-neutral-100 mt-2 pt-2">
                      <button
                        onClick={handleCreateSpace}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#4BBEB3] hover:bg-[#6EDCD1]/10 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Space</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* New Space Button */}
              <button
                onClick={handleCreateSpace}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#0B1E2D] bg-[#6EDCD1] rounded hover:bg-[#4BBEB3] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New Space</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Section - View Tabs */}
        <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded">
          <button
            onClick={() => onStepChange('criteria-tools')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              currentStep !== 'decision-hub'
                ? 'bg-[#6EDCD1] text-[#0B1E2D]'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            Setup
          </button>
          <button
            onClick={() => onStepChange('decision-hub')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              currentStep === 'decision-hub'
                ? 'bg-[#6EDCD1] text-[#0B1E2D]'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            Decision Hub
          </button>
        </div>

      </div>
    </header>
  );
};

export default AppHeader;
