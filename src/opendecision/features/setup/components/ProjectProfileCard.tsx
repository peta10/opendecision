'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { CriteriaSliders } from '@/opendecision/shared/components/ui/criteria-sliders';
import { ChevronDown, Plus, Bold, Italic, Underline, List, ListOrdered, Link2, Maximize2, Upload, X, FileText } from 'lucide-react';
import { ObjectivesOverlay } from './ObjectivesOverlay';

interface ProjectProfileCardProps {
  onGuidedProfile?: () => void;
  className?: string;
}

/**
 * ProjectProfileCard - Premium glass panel form for project requirements
 *
 * Features:
 * - Glassmorphism styling
 * - Interactive criteria sliders
 * - Smooth animations
 * - Progress-aware design
 */
export const ProjectProfileCard: React.FC<ProjectProfileCardProps> = ({
  onGuidedProfile,
  className,
}) => {
  const [showCriteria, setShowCriteria] = useState(true);
  const [objectives, setObjectives] = useState('');
  const [showObjectivesOverlay, setShowObjectivesOverlay] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(ext || '') && file.size <= maxSize;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div
      className={cn(
        'glass-panel p-6 animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#0B1E2D]">Decision Profile</h2>
          <p className="text-sm text-[#7A8D9C]">Define your decision context and criteria.</p>
        </div>
        <button
          onClick={onGuidedProfile}
          className="btn-press flex items-center gap-2 px-4 py-2 bg-[#6EDCD1] text-[#0B1E2D] rounded-xl text-sm font-medium hover:bg-[#4BBEB3] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          Guided
        </button>
      </div>

      {/* Form Row 1: User Count, Methodology, Categories */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#7A8D9C] uppercase tracking-wide">
            Team Size
          </label>
          <select
            className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all appearance-none cursor-pointer hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5E6D'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
              paddingRight: '40px',
            }}
          >
            <option>1-50 users</option>
            <option>51-100 users</option>
            <option>101-500 users</option>
            <option>500+ users</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#7A8D9C] uppercase tracking-wide">
            Methodology
          </label>
          <select
            className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all appearance-none cursor-pointer hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5E6D'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
              paddingRight: '40px',
            }}
          >
            <option>Agile</option>
            <option>Waterfall</option>
            <option>Hybrid</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#7A8D9C] uppercase tracking-wide">
            Industry
          </label>
          <select
            className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all appearance-none cursor-pointer hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5E6D'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
              paddingRight: '40px',
            }}
          >
            <option>Technology</option>
            <option>Financial Services</option>
            <option>Healthcare</option>
            <option>Manufacturing</option>
            <option>Retail</option>
          </select>
        </div>
      </div>

      {/* Improvement Objectives */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#0B1E2D]">
            What must be better 6 months after this decision?
          </label>
          <button
            onClick={() => setShowObjectivesOverlay(true)}
            className="flex items-center gap-1.5 text-xs text-[#7A8D9C] hover:text-[#4BBEB3] transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand
          </button>
        </div>
        <div className="border border-[rgba(11,30,45,0.12)] rounded-xl overflow-hidden bg-white">
          {/* Rich Text Toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[rgba(11,30,45,0.08)] bg-[#fafafa]">
            <button type="button" className="p-1.5 rounded text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
              <Bold className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 rounded text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
              <Italic className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 rounded text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[rgba(11,30,45,0.12)] mx-1" />
            <button type="button" className="p-1.5 rounded text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
              <List className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 rounded text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[rgba(11,30,45,0.12)] mx-1" />
            <button type="button" className="p-1.5 rounded text-[#7A8D9C] hover:text-[#0B1E2D] hover:bg-neutral-100 transition-colors">
              <Link2 className="w-4 h-4" />
            </button>
          </div>
          {/* Text Area */}
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Describe your key improvement objectives and goals for this project..."
            rows={4}
            className="w-full px-4 py-3 text-sm text-[#0B1E2D] outline-none resize-none placeholder:text-[#7A8D9C] bg-transparent"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(11,30,45,0.08)] my-6" />

      {/* Attachments Section */}
      <div className="mb-6">
        <label className="text-sm font-medium text-[#0B1E2D] block mb-3">
          Attachments
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl py-8 px-4 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-[#6EDCD1] bg-[#6EDCD1]/5'
              : 'border-[rgba(11,30,45,0.15)] hover:border-[#6EDCD1] hover:bg-[#f5f7f7]'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto mb-3 text-[#7A8D9C]" />
          <p className="text-sm">
            <span className="text-[#4BBEB3] font-medium">Click to upload</span>
            <span className="text-[#7A8D9C]"> or drag and drop</span>
          </p>
          <p className="text-xs text-[#7A8D9C] mt-1">PDF, DOC, XLS up to 10MB</p>
        </div>

        {/* Attached Files List */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between px-3 py-2 bg-[#f5f7f7] rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#4BBEB3]" />
                  <span className="text-sm text-[#0B1E2D]">{file.name}</span>
                  <span className="text-xs text-[#7A8D9C]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(index);
                  }}
                  className="p-1 text-[#7A8D9C] hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(11,30,45,0.08)] my-6" />

      {/* Evaluation Criteria - Collapsible Section */}
      <div>
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#0B1E2D]">
              Evaluation Criteria
            </span>
            <span className="text-xs text-[#7A8D9C] bg-neutral-100 px-2 py-0.5 rounded">
              7 criteria
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-transparent text-[#4BBEB3] border border-[#6EDCD1] rounded-lg text-xs font-medium hover:bg-[#6EDCD1] hover:text-[#0B1E2D] transition-all flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Add
            </span>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-[#7A8D9C] transition-transform',
                showCriteria && 'rotate-180'
              )}
            />
          </div>
        </button>
        <p className="text-sm text-[#7A8D9C] mt-2 mb-4">
          You&apos;re defining tradeoffs—higher weight means more influence on match scores.
        </p>

        {/* Criteria Sliders */}
        {showCriteria && (
          <div className="animate-fade-in">
            <CriteriaSliders />
          </div>
        )}
      </div>

      {/* Objectives Overlay */}
      <ObjectivesOverlay
        isOpen={showObjectivesOverlay}
        onClose={() => setShowObjectivesOverlay(false)}
        value={objectives}
        onChange={setObjectives}
      />
    </div>
  );
};

export default ProjectProfileCard;
