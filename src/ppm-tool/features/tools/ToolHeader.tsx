import React from 'react';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { Tool } from '@/ppm-tool/shared/types';
import { MethodologyTags } from '@/ppm-tool/components/common/MethodologyTags';

interface ToolHeaderProps {
  tool: Tool;
  onRemove: (toolId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  tool,
  onRemove,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{tool.name}</h3>
        <MethodologyTags tool={tool} className="mt-1" />
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tool.id);
          }}
          className="text-red-500 hover:text-red-700"
          aria-label="Remove tool"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={onToggleExpand}
          className="text-gray-400 hover:text-gray-600"
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};