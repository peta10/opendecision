import React from 'react';
import { Tool, Criterion } from '../../../shared/types';
import { getToolRating } from '../../../shared/utils/toolRating';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from '../../../components/ui/mobile-tooltip';

interface CriteriaRatingsProps {
  tool: Tool;
  selectedCriteria: Criterion[];
  compact?: boolean;
}

export const CriteriaRatings: React.FC<CriteriaRatingsProps> = ({
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
              <div className="flex items-center gap-1">
                <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {criterion.name}
                </span>
                {criterion.tooltipDescription && (
                  <MobileTooltip 
                    content={
                      <div className="break-words">
                        {criterion.tooltipDescription}
                      </div>
                    }
                    side="top"
                    align="center"
                    className="max-w-xs text-sm"
                  >
                    <button 
                      type="button"
                      className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                      aria-label={`More information about ${criterion.name}`}
                    >
                      <HelpCircle className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                    </button>
                  </MobileTooltip>
                )}
              </div>
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