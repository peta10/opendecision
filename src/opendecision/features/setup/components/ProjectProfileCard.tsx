'use client';

import React, { useState } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { CriteriaSliders } from '@/opendecision/shared/components/ui/criteria-sliders';
import { ChevronDown, Plus } from 'lucide-react';

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

  return (
    <div
      className={cn(
        'glass-panel p-6 animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[#0B1E2D]">Project Profile</h2>
        <button
          onClick={onGuidedProfile}
          className="btn-press flex items-center gap-2 px-5 py-2.5 bg-[#6EDCD1] text-[#0B1E2D] rounded-xl text-sm font-medium hover:bg-[#4BBEB3] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          Guided profile creation
        </button>
      </div>

      {/* Form Row 1: User Count, Methodology, Categories */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
            User Count
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

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
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

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
            Categories
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

      {/* Products to Replace */}
      <div className="flex flex-col gap-2 mb-5">
        <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
          What Products Are No Longer Needed?
        </label>
        <input
          type="text"
          placeholder="Search and select tools to replace..."
          className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all placeholder:text-[#7A8D9C] hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
        />
      </div>

      {/* Improvement Objectives */}
      <div className="flex flex-col gap-2 mb-5">
        <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
          Improvement Objectives
        </label>
        <textarea
          placeholder="Describe your key improvement objectives and goals..."
          rows={4}
          className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all resize-none placeholder:text-[#7A8D9C] hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
        />
      </div>

      {/* Deadline and Budget Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
            Deadline
          </label>
          <input
            type="text"
            placeholder="mm/dd/yyyy"
            className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all placeholder:text-[#7A8D9C] hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
            Budget
          </label>
          <input
            type="text"
            placeholder="$"
            className="w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl px-4 py-3.5 text-sm text-[#0B1E2D] outline-none transition-all placeholder:text-[#7A8D9C] hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(11,30,45,0.08)] my-6" />

      {/* Rate Your Criteria - Collapsible Section */}
      <div>
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          className="flex items-center justify-between w-full text-left mb-4 group"
        >
          <span className="text-base font-semibold text-[#0B1E2D]">
            Rate Your Criteria
          </span>
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

        {/* Criteria Sliders */}
        {showCriteria && (
          <div className="animate-fade-in">
            <CriteriaSliders />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectProfileCard;
