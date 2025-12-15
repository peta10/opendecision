import React from 'react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { ComparisonChart } from '@/ppm-tool/components/charts/ComparisonChart';
import { checkAndTrackNewActive } from '@/lib/posthog';
// REMOVED: FullscreenContext dependency

interface ComparisonSectionProps {
  tools: Tool[];
  criteria: Criterion[];
  comparedTools?: Set<string>;
  onOpenGuidedRanking?: () => void;
  onNavigateToCriteria?: () => void;
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  tools: selectedTools,
  criteria: selectedCriteria,
  comparedTools = new Set(),
  onOpenGuidedRanking,
  onNavigateToCriteria,
}) => {
  // Track when user views the comparison chart for New_Active metric
  React.useEffect(() => {
    try {
      checkAndTrackNewActive('Active-comparison', {
        component: 'comparison_section',
        interaction_type: 'chart_section_viewed',
        tools_count: selectedTools.length,
        criteria_count: selectedCriteria.length,
        compared_tools_count: comparedTools.size
      });
    } catch (error) {
      console.warn('Failed to track comparison section view:', error);
    }
  }, [selectedTools.length, selectedCriteria.length, comparedTools.size]); // Track when counts change
  
  // SIMPLIFIED: Always use standard layout (removed fullscreen complexity)

  return (
    <ComparisonChart
      tools={selectedTools}
      criteria={selectedCriteria}
      comparedTools={comparedTools}
      onOpenGuidedRanking={onOpenGuidedRanking}
      onNavigateToCriteria={onNavigateToCriteria}
    />
  );
};