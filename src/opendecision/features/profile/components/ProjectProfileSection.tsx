'use client';

import React, { useState } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Criterion } from '@/opendecision/shared/types';

interface ProjectProfileSectionProps {
  criteria: Criterion[];
  onCriteriaChange: (criteria: Criterion[]) => void;
  onOpenGuidedRanking?: () => void;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
}

export interface ProjectProfileData {
  userCount: string;
  methodology: string;
  categories: string;
  excludedProducts: string;
  objectives: string;
  deadline: string;
  budget: string;
}

export const ProjectProfileSection: React.FC<ProjectProfileSectionProps> = ({
  criteria,
  onCriteriaChange,
  onOpenGuidedRanking,
  guidedButtonRef,
}) => {
  const [isGeneralInfoCollapsed, setIsGeneralInfoCollapsed] = useState(false);
  const [isObjectivesExpanded, setIsObjectivesExpanded] = useState(false);

  const [formData, setFormData] = useState<ProjectProfileData>({
    userCount: '51-100',
    methodology: '',
    categories: 'financial-services',
    excludedProducts: '',
    objectives: '',
    deadline: '',
    budget: '',
  });

  const updateField = <K extends keyof ProjectProfileData>(field: K, value: ProjectProfileData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Project Profile</h2>
          <button
            ref={guidedButtonRef}
            onClick={onOpenGuidedRanking}
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            Guided profile creation
          </button>
        </div>
      </div>

      {/* General Information Section */}
      <div className="border-b border-neutral-100">
        <button
          onClick={() => setIsGeneralInfoCollapsed(!isGeneralInfoCollapsed)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm font-semibold text-neutral-900">General Information</span>
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <svg className={cn("w-4 h-4 transition-transform", isGeneralInfoCollapsed && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
            Collapse
          </span>
        </button>

        {!isGeneralInfoCollapsed && (
          <div className="px-5 pb-5 space-y-4">
            {/* User Count */}
            <div>
              <label className="block text-sm text-neutral-700 mb-2">User Count</label>
              <select
                value={formData.userCount}
                onChange={(e) => updateField('userCount', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="1-10">1-10 users</option>
                <option value="11-50">11-50 users</option>
                <option value="51-100">51-100 users</option>
                <option value="101-500">101-500 users</option>
                <option value="500+">500+ users</option>
              </select>
            </div>

            {/* Project Methodology */}
            <div>
              <label className="block text-sm text-neutral-700 mb-2">Project Methodology</label>
              <select
                value={formData.methodology}
                onChange={(e) => updateField('methodology', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] bg-white appearance-none cursor-pointer text-neutral-500"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="">Select methodologies</option>
                <option value="agile">Agile</option>
                <option value="waterfall">Waterfall</option>
                <option value="hybrid">Hybrid</option>
                <option value="scrum">Scrum</option>
                <option value="kanban">Kanban</option>
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm text-neutral-700 mb-2">Categories</label>
              <select
                value={formData.categories}
                onChange={(e) => updateField('categories', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] bg-white appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="financial-services">Financial Services</option>
                <option value="healthcare">Healthcare</option>
                <option value="technology">Technology</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="retail">Retail</option>
              </select>
            </div>

            {/* What Products are no longer needed? */}
            <div>
              <label className="block text-sm text-neutral-700 mb-2">What Products are no longer needed?</label>
              <select
                value={formData.excludedProducts}
                onChange={(e) => updateField('excludedProducts', e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] bg-white appearance-none cursor-pointer text-neutral-500"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="">Search and select tools</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Improvement Objectives Section */}
      <div className="border-b border-neutral-100">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-700">Improvement Objectives</span>
            <button
              onClick={() => setIsObjectivesExpanded(!isObjectivesExpanded)}
              className="text-xs text-neutral-500 flex items-center gap-1 hover:text-neutral-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              Expand
            </button>
          </div>

          {/* Rich Text Toolbar */}
          <div className="flex items-center gap-1 p-2 border border-neutral-200 rounded-t-xl border-b-0 bg-neutral-50/50">
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors"><span className="font-bold text-sm">B</span></button>
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors"><span className="italic text-sm">I</span></button>
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors"><span className="underline text-sm">U</span></button>
            <span className="w-px h-5 bg-neutral-200 mx-1" />
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 11.036 2.25 1.125 1.125 0 01-.036-2.25zm0 6a1.125 1.125 0 11.036 2.25 1.125 1.125 0 01-.036-2.25z" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </button>
          </div>

          <textarea
            value={formData.objectives}
            onChange={(e) => updateField('objectives', e.target.value)}
            placeholder="Describe your key improvement objectives and goals for this project..."
            rows={isObjectivesExpanded ? 8 : 4}
            className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] resize-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Deadline and Budget Row */}
      <div className="p-5 border-b border-neutral-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-700 mb-2">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              placeholder="mm/dd/yyyy"
              className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2]"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700 mb-2">Budget</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] placeholder:text-neutral-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="p-5 border-b border-neutral-100">
        <label className="block text-sm text-neutral-600 mb-3">Attachments</label>
        <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center hover:border-[#5BDFC2]/50 hover:bg-[#5BDFC2]/5 transition-all cursor-pointer group">
          <svg className="w-8 h-8 text-neutral-300 group-hover:text-[#5BDFC2] mx-auto mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-neutral-400 mt-1">PDF, DOC, XLS up to 10MB</p>
        </div>
      </div>

      {/* Rate Your Criteria Section */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900">Rate Your Criteria</span>
          <button className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Criteria
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectProfileSection;
