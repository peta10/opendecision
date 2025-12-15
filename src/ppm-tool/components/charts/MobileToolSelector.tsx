'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Check, Eye, EyeOff } from 'lucide-react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { getToolColor } from '@/ppm-tool/shared/utils/chartColors';
import { hasCriteriaBeenAdjusted } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { NotYetRankedTooltip } from '@/ppm-tool/components/ui/NotYetRankedTooltip';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';

interface MobileToolSelectorProps {
  tools: Tool[];
  visibleTools: Set<string>;
  onToggleTool: (toolId: string) => void;
  criteria?: Criterion[];
  onGuidedRankingClick?: () => void;
  onNavigateToCriteria?: () => void;
}

export const MobileToolSelector: React.FC<MobileToolSelectorProps> = ({
  tools,
  visibleTools,
  onToggleTool,
  criteria,
  onGuidedRankingClick,
  onNavigateToCriteria
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Check if criteria have been adjusted from defaults
  const criteriaAdjusted = criteria ? hasCriteriaBeenAdjusted(criteria) : true;

  const totalVisibleCount = visibleTools.size;
  const toolsVisibleCount = tools.filter(tool => visibleTools.has(tool.id)).length;
  const yourToolVisible = visibleTools.has('requirements');

  // Use click outside detection instead of overlay
  useClickOutside(dropdownRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const getDisplayText = () => {
    if (totalVisibleCount === 0) return 'Select tools to compare';
    if (totalVisibleCount === 1) {
      if (yourToolVisible) return 'Your Tool only';
      const visibleTool = tools.find(tool => visibleTools.has(tool.id));
      return visibleTool ? visibleTool.name : '1 tool selected';
    }
    if (totalVisibleCount === 2 && yourToolVisible) {
      const visibleTool = tools.find(tool => visibleTools.has(tool.id));
      return visibleTool ? `Your Tool + ${visibleTool.name}` : '2 tools selected';
    }
    return `${totalVisibleCount} tools selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-10 flex items-center justify-between w-full px-3 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 transition-colors touch-manipulation"
      >
        <div className="flex items-center">
          <div className="flex -space-x-1 mr-2">
            {/* Show preview of visible tools with colored dots */}
            {yourToolVisible && (
              <div className="w-4 h-4 border-2 border-green-600 bg-green-200 border-dashed rounded-sm" />
            )}
            {tools.slice(0, 3).map((tool, index) => {
              if (!visibleTools.has(tool.id)) return null;
              const [backgroundColor, borderColor] = getToolColor(index);
              return (
                <div
                  key={tool.id}
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor,
                    borderColor,
                  }}
                />
              );
            })}
            {totalVisibleCount > 4 && (
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600 font-medium">+</span>
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900">{getDisplayText()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - NO OVERLAY BLOCKING IT */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Your Tool Option */}
          <button
            onClick={() => {
              onToggleTool('requirements');
            }}
            className="w-full px-3 py-3 text-left hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 focus:outline-none focus:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 border-3 border-dashed border-green-600 bg-green-200 rounded-sm mr-3" />
                {criteriaAdjusted ? (
                  <span className="text-sm font-medium text-gray-900">Your Tool</span>
                ) : (
                  <NotYetRankedTooltip 
                    inline={true}
                    wrapYourTool={true}
                    isVisible={visibleTools.has('requirements')}
                    className="text-gray-900"
                    onGuidedRankingClick={onGuidedRankingClick}
                    onNavigateToCriteria={onNavigateToCriteria}
                  />
                )}
              </div>
              <div className="flex items-center">
                {visibleTools.has('requirements') ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </button>

          {/* Tool Options */}
          {tools.map((tool, index) => {
            const [backgroundColor, borderColor] = getToolColor(index);
            const isVisible = visibleTools.has(tool.id);
            
            return (
              <button
                key={tool.id}
                onClick={() => {
                  onToggleTool(tool.id);
                }}
                className="w-full px-3 py-3 text-left hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:bg-gray-50 last:border-b-0 border-b border-gray-50 transition-colors touch-manipulation"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full border-2 mr-3"
                      style={{
                        backgroundColor: isVisible ? backgroundColor : 'transparent',
                        borderColor: isVisible ? borderColor : '#9CA3AF',
                      }}
                    />
                    <span className="text-sm text-gray-900">{tool.name}</span>
                  </div>
                  <div className="flex items-center">
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-alpine-blue-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
