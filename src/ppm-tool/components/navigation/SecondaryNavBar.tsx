'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpace } from '@/ppm-tool/shared/contexts/SpaceContext';
import { DecisionSpace } from '@/ppm-tool/shared/types';
import { Plus, ChevronDown, Trash2, Check, ArrowRight } from 'lucide-react';

interface SecondaryNavBarProps {
  onShowHowItWorks?: () => void;
  className?: string;
}

export function SecondaryNavBar({ onShowHowItWorks, className = '' }: SecondaryNavBarProps) {
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
  const [isCreating, setIsCreating] = useState(false);
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
    setIsCreating(true);
    try {
      const newSpace = await createSpace({ name: 'New Decision' });
      router.push(`/d/${newSpace.id}`);
    } catch (error) {
      console.error('Failed to create space:', error);
    } finally {
      setIsCreating(false);
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
      return;
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

  return (
    <div className={`flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 ${className}`}>
      {/* Left Section - New Space + My Spaces */}
      <div className="flex items-center gap-3">
        {/* + New Space Button */}
        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="flex items-center gap-1.5 h-9 px-4 bg-scout text-midnight rounded-sm hover:bg-scout/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>New Space</span>
        </button>

        {/* My Spaces Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 h-9 px-4 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <span>My Spaces</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-sm shadow-lg z-50">
              {/* Current Space Header */}
              {currentSpace && (
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Current Space
                  </div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {currentSpace.name}
                  </div>
                </div>
              )}

              {/* Space List */}
              <div className="max-h-64 overflow-y-auto">
                {isLoadingSpaces ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading spaces...
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No spaces yet. Create your first one!
                  </div>
                ) : (
                  spaces.map((space) => (
                    <div
                      key={space.id}
                      onClick={() => handleSwitchSpace(space)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                        space.id === currentSpace?.id ? 'bg-scout/5' : ''
                      }`}
                    >
                      {/* Check mark for current */}
                      <div className="w-5 flex-shrink-0">
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
                            className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium uppercase ${getStatusColor(
                              space.status
                            )}`}
                          >
                            {space.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Updated {formatDate(space.updated_at)}
                          {space.selected_tools.length > 0 && (
                            <span className="ml-2">
                              · {space.selected_tools.length} tool{space.selected_tools.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      {spaces.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSpace(e, space.id)}
                          disabled={isDeleting === space.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
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
            </div>
          )}
        </div>
      </div>

      {/* Right Section - How it Works */}
      <button
        onClick={onShowHowItWorks}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span>How it Works</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
