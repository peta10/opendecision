'use client';

import React from 'react';
import { ProjectProfileSection } from '@/opendecision/features/profile';
import { RecommendedToolsSection } from '@/opendecision/features/tools/components/RecommendedToolsSection';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { FilterCondition } from '@/opendecision/features/tools/components/FilterSystem';
import { useMobileDetection } from '@/opendecision/shared/hooks/useMobileDetection';

interface SplitViewProps {
  criteria: Criterion[];
  selectedTools: Tool[];
  removedTools: Tool[];
  filterConditions: FilterCondition[];
  filterMode: 'AND' | 'OR';
  onCriteriaChange: (criteria: Criterion[]) => void;
  onFullCriteriaReset?: () => void;
  onToolSelect: (tool: Tool) => void;
  onToolRemove: (toolId: string) => void;
  onRestoreAllTools: () => void;
  onAddFilterCondition: () => void;
  onRemoveFilterCondition: (id: string) => void;
  onUpdateFilterCondition: (id: string, updates: Partial<FilterCondition>) => void;
  onToggleFilterMode: () => void;
  tools: Tool[];
  onCompare?: (tool: Tool) => void;
  comparedTools?: Set<string>;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
  onOpenGuidedRanking?: () => void;
  chartButtonPosition?: { x: number; y: number };
  onNavigateToCriteria?: () => void;
  disableAutoShuffle?: boolean;
  shuffleDurationMs?: number;
  onShuffleReady?: (shuffleFn: () => void) => void;
  onShuffleControlReady?: (disableFn: () => void, enableFn: () => void) => void;
  isAnimatingGuidedRankings?: boolean;
  /** Callback to add a product to the Decision Hub */
  onAddToDecisionHub?: (toolId: string) => void;
  /** Set of product IDs currently in the Decision Hub */
  decisionHubProductIds?: Set<string>;
}

export const SplitView: React.FC<SplitViewProps> = ({
  criteria,
  selectedTools,
  onCriteriaChange,
  onToolSelect,
  tools,
  onCompare,
  comparedTools = new Set(),
  guidedButtonRef,
  onOpenGuidedRanking,
  onAddToDecisionHub,
  decisionHubProductIds = new Set(),
}) => {
  const isMobile = useMobileDetection();

  // State for bookmarked tools
  const [bookmarkedTools, setBookmarkedTools] = React.useState<Set<string>>(new Set());

  const handleToolBookmark = (tool: Tool) => {
    setBookmarkedTools(prev => {
      const next = new Set(prev);
      if (next.has(tool.id)) {
        next.delete(tool.id);
      } else {
        next.add(tool.id);
      }
      return next;
    });
  };

  const handleToolViewDetails = (tool: Tool) => {
    // Handle viewing tool details - could open a modal or panel
    console.log('View details for:', tool.name);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className={`grid gap-6 px-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}
        style={{
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Left Column: Project Profile */}
        <ProjectProfileSection
          criteria={criteria}
          onCriteriaChange={onCriteriaChange}
          guidedButtonRef={guidedButtonRef}
          onOpenGuidedRanking={onOpenGuidedRanking}
        />

        {/* Right Column: Recommended Tools */}
        <RecommendedToolsSection
          tools={tools}
          selectedCriteria={criteria}
          selectedToolIds={comparedTools}
          bookmarkedToolIds={bookmarkedTools}
          onToolSelect={onToolSelect}
          onToolBookmark={handleToolBookmark}
          onToolViewDetails={handleToolViewDetails}
          onAddToDecisionHub={onAddToDecisionHub}
          decisionHubProductIds={decisionHubProductIds}
        />
      </div>
    </div>
  );
};

export default SplitView;
