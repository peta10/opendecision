'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bold, Italic, Underline, List, ListOrdered, Link2, Maximize2, Plus, Pencil, Clock, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/opendecision/shared/lib/utils';

interface ObjectivesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
}

/**
 * ObjectivesOverlay - Full-screen modal for editing improvement objectives
 * Styled like ScoutOverlay with sidebar
 */
export const ObjectivesOverlay: React.FC<ObjectivesOverlayProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, localValue]);

  // Focus textarea when overlay opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length || 0;
        textareaRef.current?.setSelectionRange(len, len);
      }, 100);
    }
  }, [isOpen]);

  const handleSave = () => {
    onChange(localValue);
    onClose();
  };

  // Use portal to render at document body level (same as ScoutOverlay)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[#0B1E2D]/70 backdrop-blur-md"
            onClick={handleSave}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content - Same style as ScoutOverlay */}
          <motion.div
            className="relative flex overflow-hidden border border-white/30"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '750px',
              height: '85vh',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.97) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Icon Sidebar - Same as ScoutOverlay */}
            <div
              className="w-16 flex-shrink-0 border-r border-white/20 flex flex-col items-center rounded-l-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(248,250,250,0.8) 100%)',
              }}
            >
              {/* Logo */}
              <div className="py-3 flex items-center justify-center border-b border-white/30 w-full">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #6EDCD1 0%, #4BBEB3 100%)',
                  }}
                >
                  <Pencil className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Sidebar buttons */}
              <div className="flex flex-col items-center py-2 gap-1.5 flex-1">
                <button
                  className="w-12 h-10 rounded-lg flex items-center justify-center bg-[#5BDFC2]/10 text-[#5BDFC2] border border-[#5BDFC2]/30"
                  title="New"
                >
                  <Plus className="w-5 h-5" />
                </button>

                <button
                  className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
                  title="Edit"
                >
                  <Pencil className="w-5 h-5" />
                </button>

                <button
                  className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
                  title="History"
                >
                  <Clock className="w-5 h-5" />
                </button>

                <button
                  className="w-12 h-10 rounded-lg flex items-center justify-center text-[#6EDCD1]/70 hover:text-[#6EDCD1] hover:bg-[#6EDCD1]/10 border border-transparent hover:border-[#6EDCD1]/20 transition-all"
                  title="Settings"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Panel */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-r-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/30 flex-shrink-0">
                <span className="text-sm font-medium text-neutral-900">Improvement Objectives</span>
                <div className="flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    title="Expand"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                    aria-label="Close"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-5 py-6">
                {/* Title */}
                <h2 className="text-lg font-medium text-neutral-900 mb-1">
                  What must be better 6 months after this decision?
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Be specific about outcomes you want to achieve.
                </p>

                {/* Rich Text Editor Box */}
                <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
                  {/* Rich Text Toolbar */}
                  <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100">
                    <button type="button" className="p-2 rounded-lg text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-2 rounded-lg text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-2 rounded-lg text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
                      <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-2" />
                    <button type="button" className="p-2 rounded-lg text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
                      <List className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-2 rounded-lg text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-2" />
                    <button type="button" className="p-2 rounded-lg text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Text Area */}
                  <div className="px-4 py-4">
                    <textarea
                      ref={textareaRef}
                      value={localValue}
                      onChange={(e) => setLocalValue(e.target.value)}
                      placeholder="Describe your key improvement objectives and goals for this project...

Examples:
- Faster planning cycles with real-time collaboration
- Fewer manual reports through automated dashboards
- Better cross-team visibility on project status
- Reduced context-switching between tools"
                      className={cn(
                        'w-full bg-transparent border-none resize-none outline-none',
                        'text-gray-900 text-sm leading-relaxed',
                        'placeholder:text-gray-400',
                        'min-h-[300px]'
                      )}
                    />
                  </div>
                </div>

                {/* Suggestion prompts */}
                <div className="flex flex-col gap-2 mt-6">
                  <button
                    onClick={() => setLocalValue(prev => prev + (prev ? '\n' : '') + '- Faster planning cycles with real-time collaboration')}
                    className="text-left px-4 py-2.5 rounded-xl bg-white/80 border border-[#6EDCD1]/15 text-sm text-neutral-600 hover:bg-[#6EDCD1]/5 hover:border-[#6EDCD1]/30 hover:text-neutral-800 transition-colors"
                  >
                    Faster planning cycles
                  </button>
                  <button
                    onClick={() => setLocalValue(prev => prev + (prev ? '\n' : '') + '- Better cross-team visibility on project status')}
                    className="text-left px-4 py-2.5 rounded-xl bg-white/80 border border-[#6EDCD1]/15 text-sm text-neutral-600 hover:bg-[#6EDCD1]/5 hover:border-[#6EDCD1]/30 hover:text-neutral-800 transition-colors"
                  >
                    Better cross-team visibility
                  </button>
                  <button
                    onClick={() => setLocalValue(prev => prev + (prev ? '\n' : '') + '- Reduced manual reporting overhead')}
                    className="text-left px-4 py-2.5 rounded-xl bg-white/80 border border-[#6EDCD1]/15 text-sm text-neutral-600 hover:bg-[#6EDCD1]/5 hover:border-[#6EDCD1]/30 hover:text-neutral-800 transition-colors"
                  >
                    Reduced manual reporting
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f7f7] rounded-lg">
                  <span className="text-amber-400 text-base">💡</span>
                  <span className="text-xs text-[#7A8D9C]">
                    <strong className="text-[#4A5E6D]">Scout Tip:</strong> Be specific about outcomes, not features.
                  </span>
                </div>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-[#6EDCD1] text-[#0B1E2D] rounded-xl text-sm font-medium hover:bg-[#4BBEB3] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ObjectivesOverlay;
