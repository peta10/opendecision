'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Tag } from 'lucide-react';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { ToolHeader } from '@/opendecision/features/tools/components/ToolHeader';
import { CriteriaDetails } from '@/opendecision/features/criteria/components/CriteriaDetails';

interface ToolCardProps {
  tool: Tool;
  selectedTools: Tool[];
  onRemove: (toolId: string) => void;
  selectedCriteria?: Criterion[];
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  selectedTools,
  onRemove,
  selectedCriteria = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking the remove button
    if ((e.target as HTMLElement).closest('button[aria-label="Remove tool"]')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const selectedTool = selectedTools.find((obj) => obj.id === tool.id);

  return (
    <div
      className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="space-y-3">
          <ToolHeader
            tool={tool}
            onRemove={onRemove}
            isExpanded={isExpanded}
            onToggleExpand={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />

          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3 text-gray-400" />
            <div className="flex flex-wrap gap-1.5">
              {(tool.tags || []).map((tag: any) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {selectedTool &&
              selectedTool.criteria &&
              selectedTool.criteria.map((criterion) => {
                return (
                  <div
                    key={criterion.id}
                    className="flex items-center space-x-2 text-xs"
                  >
                    <span className="text-gray-600">{criterion.name}:</span>
                    <span
                      className={`font-semibold text-xs ${
                        criterion.ranking >= 4
                          ? 'text-green-600'
                          : criterion.ranking >= 3
                          ? 'text-alpine-blue-500'
                          : 'text-gray-600'
                      }`}
                    >
                      {criterion.ranking}/5
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t rounded-b-lg">
          <CriteriaDetails tool={tool} selectedCriteria={selectedCriteria} />
        </div>
      )}
    </div>
  );
};