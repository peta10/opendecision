'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/opendecision/shared/lib/utils';
import { ScoutCompassIcon } from '@/opendecision/shared/components/scout/ScoutCompass';
import {
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  FileText,
  Plus,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Criterion {
  id: string;
  name: string;
  importance: number;
}

interface Attachment {
  file: File;
  context: string;
}

interface DecisionProfilePanelProps {
  onGuidedProfile?: () => void;
  className?: string;
}

const defaultCriteria: Criterion[] = [
  { id: '1', name: 'Flexibility & Customization', importance: 2 },
  { id: '2', name: 'Portfolio Management', importance: 4 },
  { id: '3', name: 'Reporting & Analytics', importance: 3 },
  { id: '4', name: 'Ease of Use', importance: 5 },
];

const availableMethodologies = ['Agile', 'Waterfall', 'Hybrid', 'Scrum', 'Kanban', 'Lean', 'Six Sigma'];
const availableIndustries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit', 'Media', 'Real Estate'];

/**
 * DecisionProfilePanel - Google-style minimalist design
 */
export const DecisionProfilePanel: React.FC<DecisionProfilePanelProps> = ({
  onGuidedProfile,
  className,
}) => {
  const [showCriteria, setShowCriteria] = useState(true);
  const [objectives, setObjectives] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUsers, setSelectedUsers] = useState('1-50');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Agile', 'Technology']);
  const [tagSearch, setTagSearch] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isObjectiveExpanded, setIsObjectiveExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // For portal rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
      const maxSize = 10 * 1024 * 1024;
      return validTypes.includes(ext || '') && file.size <= maxSize;
    });
    const newAttachments = validFiles.map(file => ({ file, context: '' }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAttachmentContext = useCallback((index: number, context: string) => {
    setAttachments((prev) => prev.map((att, i) => i === index ? { ...att, context } : att));
  }, []);

  const updateCriterionImportance = (id: string, importance: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, importance } : c));
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const addCriterion = () => {
    const newId = String(Date.now());
    setCriteria(prev => [...prev, { id: newId, name: 'New Criterion', importance: 3 }]);
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearch('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const allAvailableTags = [...availableMethodologies, ...availableIndustries];
  const filteredTags = allAvailableTags.filter(
    t => t.toLowerCase().includes(tagSearch.toLowerCase()) && !selectedTags.includes(t)
  );

  return (
    <aside
      className={cn(
        'flex flex-col w-full md:w-[320px] md:min-w-[320px] lg:w-[400px] lg:min-w-[400px] h-fit',
        className
      )}
      style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Decision Profile
        </h2>
        <button
          onClick={onGuidedProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
        >
          <ScoutCompassIcon size={12} color="white" />
          Guided profile creation
        </button>
      </div>

      {/* Objective - Rich Text Editor Style */}
      <div className="mb-5">
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-600">
              Improvement Objectives
            </span>
            <button
              onClick={() => setIsObjectiveExpanded(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Expand
            </button>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <List className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <Link className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Describe your key improvement objectives and goals for this project..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-transparent border-0 resize-none outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Expanded Objective Overlay - Rendered via Portal */}
      {isMounted && isObjectiveExpanded && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-[#0B1E2D]/70 backdrop-blur-md"
            onClick={() => setIsObjectiveExpanded(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Header Row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-sm font-medium text-gray-900">
                Improvement Objectives
              </span>
              <button
                onClick={() => setIsObjectiveExpanded(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                Collapse
              </button>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-white">
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <List className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <Link className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Describe your key improvement objectives and goals for this project..."
              rows={12}
              className="w-full px-4 py-3 text-sm text-gray-900 bg-white border-0 resize-none outline-none placeholder:text-gray-400"
              autoFocus
            />

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsObjectiveExpanded(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsObjectiveExpanded(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Users */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Team size
        </label>
        <select
          value={selectedUsers}
          onChange={(e) => setSelectedUsers(e.target.value)}
          className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border-0 rounded-lg outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer appearance-none transition-all"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
          }}
        >
          <option value="1-50">1-50</option>
          <option value="51-200">51-200</option>
          <option value="201-1000">201-1000</option>
          <option value="1000+">1000+</option>
        </select>
      </div>

      {/* Methodology & Industry Tags */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Methodology & Industry
        </label>
        <div className="relative">
          <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg min-h-[42px] items-center">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-gray-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              onFocus={() => setShowTagDropdown(true)}
              onBlur={() => setTimeout(() => setShowTagDropdown(false), 150)}
              placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
              className="flex-1 min-w-[60px] bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          {showTagDropdown && filteredTags.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-10 max-h-[180px] overflow-y-auto">
              {filteredTags.map((option) => (
                <button
                  key={option}
                  onMouseDown={() => addTag(option)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Attachments
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border border-dashed rounded-lg py-4 px-3 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-400">
            Drop files or click to upload
          </p>
        </div>

        {attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.file.name}-${index}`}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 font-medium truncate">
                      {attachment.file.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(index);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <input
                  type="text"
                  value={attachment.context}
                  onChange={(e) => updateAttachmentContext(index, e.target.value)}
                  placeholder="Add context..."
                  className="w-full px-2.5 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded outline-none focus:border-gray-300 transition-colors placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-1" />

      {/* Criteria Section */}
      <div>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              Criteria
            </span>
            <button
              onClick={addCriterion}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showCriteria ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show
              </>
            )}
          </button>
        </div>

        {showCriteria && (
          <div className="space-y-3 pb-2">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="py-2">
                {/* Criterion name row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-700">
                      {criterion.name}
                    </span>
                    <button
                      title="Ask AI"
                      className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <ScoutCompassIcon size={12} color="currentColor" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeCriterion(criterion.id)}
                    className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Rating dots */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateCriterionImportance(criterion.id, level)}
                      className={cn(
                        'w-8 h-8 rounded-md text-sm font-medium transition-all',
                        criterion.importance === level
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-gray-400">
                    Importance
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default DecisionProfilePanel;
