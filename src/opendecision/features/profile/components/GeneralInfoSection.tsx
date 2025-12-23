'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Bold, Italic, Underline, List, ListOrdered, Link2, Expand } from 'lucide-react';
import { cn } from '@/opendecision/shared/lib/utils';
import { FileUpload } from './FileUpload';

// Dropdown options
const USER_COUNT_OPTIONS = [
  { value: '', label: 'Select user count' },
  { value: '1-10', label: '1-10 users' },
  { value: '11-50', label: '11-50 users' },
  { value: '51-100', label: '51-100 users' },
  { value: '101-500', label: '101-500 users' },
  { value: '501-1000', label: '501-1000 users' },
  { value: '1000+', label: '1000+ users' },
];

const METHODOLOGY_OPTIONS = [
  { value: 'agile', label: 'Agile' },
  { value: 'scrum', label: 'Scrum' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'waterfall', label: 'Waterfall' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'lean', label: 'Lean' },
  { value: 'six-sigma', label: 'Six Sigma' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'non-profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

export interface GeneralInfo {
  userCount: string;
  methodologies: string[];
  categories: string;
  productsToRemove: string[];
  improvementObjectives: string;
  deadline: string;
  budget: number;
  attachments: File[];
}

interface GeneralInfoSectionProps {
  data: GeneralInfo;
  onChange: (data: GeneralInfo) => void;
  className?: string;
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  data,
  onChange,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isObjectivesExpanded, setIsObjectivesExpanded] = useState(false);

  const updateField = <K extends keyof GeneralInfo>(field: K, value: GeneralInfo[K]) => {
    onChange({ ...data, [field]: value });
  };

  const toggleMethodology = (methodology: string) => {
    const current = data.methodologies;
    const updated = current.includes(methodology)
      ? current.filter(m => m !== methodology)
      : [...current, methodology];
    updateField('methodologies', updated);
  };

  return (
    <div className={cn('border-b border-gray-200', className)}>
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900">General Information</h3>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* User Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Count
            </label>
            <select
              value={data.userCount}
              onChange={(e) => updateField('userCount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-scout focus:border-transparent"
            >
              {USER_COUNT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Project Methodology - Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Methodology
            </label>
            <div className="flex flex-wrap gap-2">
              {METHODOLOGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleMethodology(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full border transition-colors',
                    data.methodologies.includes(opt.value)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <select
              value={data.categories}
              onChange={(e) => updateField('categories', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-scout focus:border-transparent"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Products to Remove */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What Products are no longer needed?
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !data.productsToRemove.includes(e.target.value)) {
                  updateField('productsToRemove', [...data.productsToRemove, e.target.value]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-scout focus:border-transparent"
            >
              <option value="">Search and select tools</option>
              <option value="jira">Jira</option>
              <option value="asana">Asana</option>
              <option value="monday">Monday.com</option>
              <option value="trello">Trello</option>
              <option value="basecamp">Basecamp</option>
              <option value="wrike">Wrike</option>
              <option value="smartsheet">Smartsheet</option>
            </select>
            {data.productsToRemove.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.productsToRemove.map(product => (
                  <span
                    key={product}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                  >
                    {product}
                    <button
                      type="button"
                      onClick={() => updateField('productsToRemove', data.productsToRemove.filter(p => p !== product))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Improvement Objectives */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Improvement Objectives
              </label>
              <button
                type="button"
                onClick={() => setIsObjectivesExpanded(!isObjectivesExpanded)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Expand className="w-3 h-3" />
                {isObjectivesExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {/* Simple toolbar */}
            <div className="flex items-center gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50 border-b-0">
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                <Bold className="w-4 h-4" />
              </button>
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                <Italic className="w-4 h-4" />
              </button>
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                <List className="w-4 h-4" />
              </button>
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
                <Link2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={data.improvementObjectives}
              onChange={(e) => updateField('improvementObjectives', e.target.value)}
              placeholder="Describe your key improvement objectives and goals for this project..."
              rows={isObjectivesExpanded ? 8 : 3}
              className="w-full px-3 py-2 border border-gray-300 rounded-b-md text-sm focus:outline-none focus:ring-2 focus:ring-scout focus:border-transparent resize-none"
            />
          </div>

          {/* Deadline and Budget Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={data.deadline}
                onChange={(e) => updateField('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-scout focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={data.budget || ''}
                  onChange={(e) => updateField('budget', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-scout focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <FileUpload
              files={data.attachments}
              onChange={(files) => updateField('attachments', files)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralInfoSection;
