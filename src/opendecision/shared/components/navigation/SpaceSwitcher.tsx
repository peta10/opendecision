'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpace } from '@/opendecision/shared/contexts/SpaceContext';
import { DecisionSpace } from '@/opendecision/shared/types';
import { ChevronDown, Plus, Trash2, Copy, Check } from 'lucide-react';

interface SpaceSwitcherProps {
  className?: string;
}

export function SpaceSwitcher({ className = '' }: SpaceSwitcherProps) {
  const router = useRouter();
  const {
    currentSpace,
    spaces,
    isLoadingSpaces,
    createSpace,
    deleteSpace,
    switchSpace,
    refreshSpaces,
  } = useSpace();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load spaces when dropdown opens
  useEffect(() => {
    if (isOpen && spaces.length === 0) {
      refreshSpaces();
    }
  }, [isOpen, spaces.length, refreshSpaces]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleCreateNew = async () => {
    try {
      const newSpace = await createSpace({ name: 'New Decision' });
      setIsOpen(false);
      router.push(`/d/${newSpace.id}`);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  const handleSwitchSpace = async (space: DecisionSpace) => {
    if (space.id === currentSpace?.id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchSpace(space.id);
      setIsOpen(false);
      router.push(`/d/${space.id}`);
    } catch (error) {
      console.error('Failed to switch space:', error);
    }
  };

  const handleDeleteSpace = async (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();

    if (spaces.length <= 1) {
      return; // Don't delete the last space
    }

    setIsDeleting(spaceId);
    try {
      await deleteSpace(spaceId);
      await refreshSpaces();
    } catch (error) {
      console.error('Failed to delete space:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-600';
      case 'evaluating':
        return 'bg-blue-100 text-blue-700';
      case 'decided':
        return 'bg-green-100 text-green-700';
      case 'archived':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  if (!currentSpace) {
    return (
      <div className={`h-9 w-36 bg-gray-100 rounded-sm animate-pulse ${className}`} />
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button - Boxy, minimal, Airtable-style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 min-w-[140px] max-w-[200px]"
      >
        <span className="truncate flex-1 text-left">{currentSpace.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-sm shadow-lg z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              My Spaces
            </span>
          </div>

          {/* Space List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoadingSpaces ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                Loading...
              </div>
            ) : spaces.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                No spaces yet
              </div>
            ) : (
              spaces.map((space) => (
                <div
                  key={space.id}
                  onClick={() => handleSwitchSpace(space)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    space.id === currentSpace?.id ? 'bg-gray-50' : ''
                  }`}
                >
                  {/* Check mark for current */}
                  <div className="w-4 flex-shrink-0">
                    {space.id === currentSpace?.id && (
                      <Check className="w-4 h-4 text-scout" />
                    )}
                  </div>

                  {/* Space info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {space.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${getStatusColor(
                          space.status
                        )}`}
                      >
                        {space.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(space.updated_at)}
                      {space.selected_tools.length > 0 && (
                        <span className="ml-2">
                          {space.selected_tools.length} tool
                          {space.selected_tools.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button (only if more than 1 space) */}
                  {spaces.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteSpace(e, space.id)}
                      disabled={isDeleting === space.id}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                      title="Delete space"
                    >
                      {isDeleting === space.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer - New Space Button */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Decision Space</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
