'use client';

import { useState } from 'react';
import { useSpace } from '@/opendecision/shared/contexts/SpaceContext';
import { SaveDecisionModal } from './SaveDecisionModal';
import { Save, Check } from 'lucide-react';

interface SaveButtonProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function SaveButton({ className = '', variant = 'default' }: SaveButtonProps) {
  const { authState } = useSpace();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If user is already logged in (not anonymous), show a saved indicator
  if (!authState.isAnonymous && authState.isAuthenticated) {
    return (
      <div
        className={`flex items-center gap-1.5 text-sm text-green-600 ${className}`}
      >
        <Check className="w-4 h-4" />
        <span className="hidden sm:inline">Saved</span>
      </div>
    );
  }

  // Loading state
  if (authState.isLoading) {
    return null;
  }

  // Not authenticated at all - shouldn't happen with anonymous auth, but handle gracefully
  if (!authState.isAuthenticated) {
    return null;
  }

  // Anonymous user - show save button
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-scout text-midnight rounded-sm hover:bg-scout/90 transition-colors text-sm font-medium ${className}`}
      >
        <Save className="w-4 h-4" />
        {variant === 'default' && <span>Save</span>}
      </button>

      <SaveDecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
