'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, X, Wand2 } from 'lucide-react';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { RatingButtons } from './RatingButtons';
import { Criterion } from '@/ppm-tool/shared/types';
import { checkAndTrackNewManualRanking, checkAndTrackNewActive } from '@/lib/posthog';
import { analytics } from '@/lib/analytics';

interface CriteriaRatingSectionProps {
  criteria: Criterion[];
  onCriteriaChange: (criteria: Criterion[]) => void;
  onAddCriteria?: () => void;
  className?: string;
}

export const CriteriaRatingSection: React.FC<CriteriaRatingSectionProps> = ({
  criteria,
  onCriteriaChange,
  onAddCriteria,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleRatingChange = (criterionId: string, newRating: number) => {
    const updatedCriteria = criteria.map((c) =>
      c.id === criterionId ? { ...c, userRating: newRating } : c
    );
    onCriteriaChange(updatedCriteria);

    // Find the criterion for analytics
    const criterion = criteria.find(c => c.id === criterionId);
    if (criterion) {
      // Track criteria ranking change in Supabase
      analytics.trackCriteriaRanking({
        criteriaId: criterionId,
        criteriaName: criterion.name,
        score: newRating,
        isManual: true
      });

      // Track New_Manual_Ranking in PostHog
      checkAndTrackNewManualRanking({
        criteria_id: criterionId,
        criteria_name: criterion.name,
        score: newRating,
        interaction_type: 'button_click'
      });

      // Track as active user
      checkAndTrackNewActive('rating_button_clicked', {
        criteria_id: criterionId,
        criteria_name: criterion.name,
        score: newRating
      });
    }
  };

  const handleRemoveCriterion = (criterionId: string) => {
    const updatedCriteria = criteria.filter((c) => c.id !== criterionId);
    onCriteriaChange(updatedCriteria);
  };

  return (
    <div className={cn('border-b border-gray-200', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between py-3 px-4">
        <h3 className="text-sm font-semibold text-gray-900">Rate Your Criteria</h3>
        <div className="flex items-center gap-2">
          {/* Add Criteria Button */}
          <button
            type="button"
            onClick={onAddCriteria}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Criteria
          </button>
          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700"
          >
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Criteria List */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Criterion Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {criterion.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(criterion.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={`Remove ${criterion.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rating Buttons */}
              <RatingButtons
                value={criterion.userRating}
                onChange={(value) => handleRatingChange(criterion.id, value)}
              />
            </div>
          ))}

          {criteria.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No criteria added yet. Click &quot;Add Criteria&quot; to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CriteriaRatingSection;
