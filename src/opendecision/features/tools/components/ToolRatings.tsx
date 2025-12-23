import React from 'react';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { getToolRating } from '@/opendecision/shared/utils/toolRating';

interface ToolRatingsProps {
  tool: Tool;
  selectedCriteria: Criterion[];
  compact?: boolean;
}

export const ToolRatings: React.FC<ToolRatingsProps> = ({
  tool,
  selectedCriteria,
  compact = false
}) => {
  return (
    <div className={`grid ${compact ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-4'}`}>
      {selectedCriteria.map((criterion) => {
        const rating = getToolRating(tool, criterion);
        
        return (
          <div key={criterion.id} className="flex items-center justify-between">
            <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {criterion.name}
            </span>
            <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${
              rating >= 4 ? 'text-green-600' :
              rating >= 3 ? 'text-alpine-blue-500' :
              'text-gray-600'
            }`}>
              {rating}/5
            </span>
          </div>
        );
      })}
    </div>
  );
};