'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { X, Award, ArrowRight } from 'lucide-react';
import '@/ppm-tool/components/ui/GrayGearButton.css';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';
import { FilterSystem, FilterCondition } from '@/ppm-tool/components/filters/FilterSystem';
import { EnhancedCompactToolCard } from '@/ppm-tool/components/cards/EnhancedCompactToolCard';
import { RemovedToolsMenu } from './RemovedToolsMenu';
import { filterTools } from '@/ppm-tool/shared/utils/filterTools';
import { testGetToolRating, calculateScore } from '@/ppm-tool/shared/utils/toolRating';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
// REMOVED: FullscreenNavigation - no longer needed without FullscreenContext
import { ToolCompareAnimation } from '@/ppm-tool/components/animations/ToolCompareAnimation';
import { useShuffleAnimation, useToolOrderShuffle } from '@/ppm-tool/hooks/useShuffleAnimation';
import { ShuffleContainer } from '@/ppm-tool/components/animations/ShuffleContainer';
import { AnimatedToolCard } from '@/ppm-tool/components/animations/AnimatedToolCard';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { hasCriteriaBeenAdjusted } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { analytics } from '@/lib/analytics';
import '@/ppm-tool/components/ui/ModernPill.css';



interface ToolSectionProps {
  tools: Tool[];
  selectedTools: Tool[];
  removedTools: Tool[];
  selectedCriteria: Criterion[];
  filterConditions: FilterCondition[];
  filterMode: 'AND' | 'OR';
  onAddFilterCondition: () => void;
  onRemoveFilterCondition: (id: string) => void;
  onUpdateFilterCondition: (id: string, updates: Partial<FilterCondition>) => void;
  onToggleFilterMode: () => void;
  onToolSelect: (tool: Tool) => void;
  onToolRemove: (toolId: string) => void;
  onRestoreAll: () => void;
  onContinue?: () => void;
  isSubmitting?: boolean;
  onCompare?: (tool: Tool) => void;
  comparedTools?: Set<string>;
  chartButtonPosition?: { x: number; y: number };
  onOpenGuidedRanking?: () => void;
  onNavigateToCriteria?: () => void;
  disableAutoShuffle?: boolean;
  shuffleDurationMs?: number;
  onShuffleReady?: (shuffleFn: () => void) => void;
  onShuffleControlReady?: (disableFn: () => void, enableFn: () => void) => void;
  isAnimatingGuidedRankings?: boolean;
}

// Use the unified calculateScore function
const calculateMatchScore = (tool: Tool, criteria: Criterion[]): number => {
  return calculateScore(tool, criteria);
};

export const ToolSection: React.FC<ToolSectionProps> = ({
  selectedTools,
  removedTools,
  selectedCriteria,
  filterConditions,
  filterMode,
  onAddFilterCondition,
  onRemoveFilterCondition,
  onUpdateFilterCondition,
  onToggleFilterMode,
  onToolSelect,
  onRestoreAll,
  onContinue,
  isSubmitting,
  onCompare,
  comparedTools = new Set(),
  chartButtonPosition,
  onOpenGuidedRanking,
  onNavigateToCriteria,
  disableAutoShuffle = false,
  shuffleDurationMs = 1000,
  onShuffleReady,
  onShuffleControlReady,
  isAnimatingGuidedRankings = false
}) => {
  const isMobile = useMobileDetection();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [animatingTool, setAnimatingTool] = useState<{ id: string; position: { x: number; y: number } } | null>(null);
  
  // Local state for imperative shuffle control (separate from prop-based control)
  const [localDisableShuffle, setLocalDisableShuffle] = useState(false);

  const settingsRef = React.useRef<HTMLDivElement>(null);
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  
  // Initialize shuffle animation with dynamic duration
  const shuffleAnimation = useShuffleAnimation({
    delayMs: 0, // No delay - start immediately when triggered
    shuffleDurationMs: isMobile ? 800 : shuffleDurationMs, // Desktop: Use dynamic duration (3s for guided, 1s for normal)
    disabled: false
  });
  
  const filteredTools = filterTools(selectedTools, filterConditions, filterMode);

  // Debug logging for filtering
  React.useEffect(() => {
    console.debug('ToolSection - Filter conditions:', filterConditions);
    console.debug('ToolSection - Filter mode:', filterMode);
    console.debug('ToolSection - Selected tools count:', selectedTools.length);
    console.debug('ToolSection - Filtered tools count:', filteredTools.length);
    console.debug('ToolSection - Filtered tools:', filteredTools.map(t => t.name));
    
    // Test getToolRating function if we have tools and criteria
    if (selectedTools.length > 0 && selectedCriteria.length > 0) {
      const testTool = selectedTools[0];
      const testCriterion = selectedCriteria[0];
      console.debug('Testing getToolRating:', testGetToolRating(testTool, testCriterion.id));
    }
  }, [filterConditions, filterMode, selectedTools, filteredTools, selectedCriteria]);

  // Check if criteria have been adjusted from defaults (isolated from bumper logic)
  const criteriaAdjusted = hasCriteriaBeenAdjusted(selectedCriteria);

  // Memoize match scores for performance
  const toolMatchScores = React.useMemo(() => {
    const scores = new Map<string, number>();
    filteredTools.forEach(tool => {
      scores.set(tool.id, calculateMatchScore(tool, selectedCriteria));
    });
    return scores;
  }, [filteredTools, selectedCriteria]);

  // Add hydration tracking to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Stable, deterministic sorting with hydration awareness
  const sortedTools = React.useMemo(() => {
    // Keep alphabetical until hydrated OR criteria not adjusted
    // REMOVED isAnimatingGuidedRankings check - this allows tools to maintain their current
    // sort order during animations (preventing unwanted snap-back to alphabetical)
    // This ensures server and client render the same initial state
    if (!isHydrated || !criteriaAdjusted) {
      return [...filteredTools].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Score-based with alphabetical tie-breaker (after hydration, criteria adjusted, and not animating)
    return [...filteredTools].sort((a, b) => {
      const scoreA = toolMatchScores.get(a.id) || 0;
      const scoreB = toolMatchScores.get(b.id) || 0;
      const scoreDiff = scoreB - scoreA;
      
      // Tie-breaker for very close scores (ensures stable sorting)
      if (Math.abs(scoreDiff) < 0.01) {
        return a.name.localeCompare(b.name);
      }
      
      return scoreDiff;
    });
  }, [filteredTools, toolMatchScores, criteriaAdjusted, isHydrated]);

  // Combine both disable sources (prop-based and imperative)
  const isShuffleDisabled = disableAutoShuffle || localDisableShuffle;

  // Set up tool order shuffle animation - triggers when sortedTools order changes
  const toolOrderShuffle = useToolOrderShuffle(sortedTools, shuffleAnimation, {
    triggerOnChange: true,
    disabled: isShuffleDisabled
  });

  // Expose manual shuffle function to parent component
  React.useEffect(() => {
    if (onShuffleReady) {
      onShuffleReady(toolOrderShuffle.manualShuffle);
      console.log('🔗 Manual shuffle function exposed to parent');
    }
  }, [onShuffleReady, toolOrderShuffle]);

  // Expose imperative control functions to parent
  React.useEffect(() => {
    if (onShuffleControlReady) {
      const disableFn = () => {
        console.log('🚫 Imperative shuffle DISABLE called');
        setLocalDisableShuffle(true);
      };
      const enableFn = () => {
        console.log('✅ Imperative shuffle ENABLE called');
        setLocalDisableShuffle(false);
      };
      onShuffleControlReady(disableFn, enableFn);
      console.log('🔗 Imperative shuffle control functions exposed to parent');
    }
  }, [onShuffleControlReady]);

  const handleToggleExpand = (toolId: string) => {
    const newExpanded = new Set(expandedCards);
    const wasExpanded = newExpanded.has(toolId);
    const tool = selectedTools.find(t => t.id === toolId);
    
    if (wasExpanded) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
      
      // Track tool card expansion for New_Active metric (only when expanding, not collapsing)
      try {
        checkAndTrackNewActive('Active-details', {
          component: 'tool_section',
          tool_id: toolId,
          tool_name: tool?.name || 'unknown',
          interaction_type: 'tool_card_expanded'
        });
      } catch (error) {
        console.warn('Failed to track tool card expansion:', error);
      }
    }
    
    setExpandedCards(newExpanded);
  };
  
  const filteredOutTools = React.useMemo(() => {
    return selectedTools.filter(tool => 
      !filterTools([tool], filterConditions, filterMode, true).length
    ); 
  }, [selectedTools, filterConditions, filterMode]);

  useClickOutside(settingsRef, () => {
    handleSettingsClose();
  });

  const handleSettingsClose = () => {
    // Simplify the close logic - just close the modal
    setIsSettingsOpen(false);
    
    // Clean up empty filters after closing
    const cleanedFilters = filterConditions.filter(condition => 
      condition.type && condition.value
    );
    
    if (cleanedFilters.length !== filterConditions.length) {
      const emptyFilterIds = filterConditions
        .filter(condition => !condition.type || !condition.value)
        .map(condition => condition.id);
      
      emptyFilterIds.forEach(id => onRemoveFilterCondition(id));
    }
  };

  const showRemovedToolsMenu = removedTools.length > 0;

  const handleCompare = (tool: Tool, event: React.MouseEvent) => {
    // Check if tool is currently being compared
    const isCurrentlyCompared = comparedTools.has(tool.id);
    
    // Only trigger animation when ADDING a tool to compare (not when removing)
    if (!isCurrentlyCompared) {
      // Get the button's position for the animation
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      
      // Set the animating tool state
      setAnimatingTool({
        id: tool.id,
        position: { x: rect.left, y: rect.top }
      });
    }

    // Call the compare handler
    onCompare?.(tool);
  };

  const handleAnimationComplete = () => {
    setAnimatingTool(null);
  };

  const renderTool = (tool: Tool, index: number) => (
    <AnimatedToolCard
      key={tool.id}
      tool={tool}
      index={index}
      isExpanded={expandedCards.has(tool.id)}
    >
      <EnhancedCompactToolCard
        tool={tool}
        selectedCriteria={selectedCriteria}
        matchScore={toolMatchScores.get(tool.id) || 0}
        isExpanded={expandedCards.has(tool.id)}
        onToggleExpand={() => handleToggleExpand(tool.id)}
        onCompare={(e) => handleCompare(tool, e)}
        isCompared={comparedTools.has(tool.id)}
        criteriaAdjusted={criteriaAdjusted}
        onOpenGuidedRanking={onOpenGuidedRanking}
        onNavigateToCriteria={onNavigateToCriteria}
        position={index + 1} // Add position for analytics (1-based indexing)
      />
    </AnimatedToolCard>
  );

  return (
    <div id="tools-section" className="bg-white rounded-lg shadow-none flex flex-col h-full overflow-hidden min-h-0 border border-gray-200">
      {/* Fixed Header Section - uses responsive --section-padding from globals.css */}
      <div
        className="flex-shrink-0 flex items-center justify-between border-b bg-white rounded-t-lg"
        style={{ padding: 'var(--section-padding, 1rem)', paddingBottom: 'calc(var(--section-padding, 1rem) * 0.75)' }}
      >
        <div className="flex items-center">
          <Award className="w-5 h-5 md:w-6 md:h-6 mr-2 text-alpine-blue-400" />
          <div className="flex items-center">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Tools & Recommendations</h2>
            <span className="hidden md:block ml-2 text-xs md:text-sm text-gray-500">
              {sortedTools.length} {sortedTools.length === 1 ? 'tool' : 'tools'} analyzed
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="gray-gear-btn relative"
              aria-label="Filter settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <defs>
                  <linearGradient id="gear-gray-tools" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#gear-gray-tools)"
                  d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.04 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                />
              </svg>
              {(() => {
                const activeFilters = filterConditions.filter(c => {
                  if (!c.type || !c.value) return false;
                  if (c.type === 'Criteria') {
                    return c.operator && c.rating !== undefined && c.rating !== null;
                  }
                  return true;
                }).length;

                return activeFilters > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] md:text-xs font-medium text-white shadow-sm">
                    {activeFilters}
                  </span>
                ) : null;
              })()}
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-xs sm:max-w-md md:w-80 lg:w-[36rem] bg-white rounded-lg shadow-xl border border-gray-200 z-50 mx-2 md:mx-0 max-h-[80vh]">
                <div className="flex items-center justify-between p-3 md:p-4 border-b">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">Tool Settings</h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                      {sortedTools.length} {sortedTools.length === 1 ? 'tool' : 'tools'} visible
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        onRestoreAll();
                        handleSettingsClose();
                      }}
                      className="modern-pill modern-pill--blue modern-pill--sm"
                    >
                      <span className="modern-pill__lighting"></span>
                      <span className="modern-pill__content">
                        Reset Filters
                      </span>
                    </button>
                    <button
                      onClick={handleSettingsClose}
                      className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={modalContentRef}
                  className="p-3 md:p-4 space-y-3 md:space-y-4 border-t border-gray-100 filter-modal-content"
                  style={{
                    maxHeight: '50vh',
                    overflowY: 'scroll'
                  }}
                  data-lenis-prevent
                  onWheel={(e) => {
                    // Allow scroll wheel to work within the modal
                    e.stopPropagation();
                    // Let the default scroll behavior work
                  }}
                >
                  <FilterSystem
                    selectedCriteria={selectedCriteria}
                    conditions={filterConditions}
                    onAddCondition={onAddFilterCondition}
                    onRemoveCondition={onRemoveFilterCondition}
                    onUpdateCondition={onUpdateFilterCondition}
                    filterMode={filterMode}
                    onToggleFilterMode={onToggleFilterMode}
                  />
                  
                  {filterConditions.length > 0 && selectedTools.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {filteredOutTools.length} {filteredOutTools.length === 1 ? 'tool' : 'tools'} filtered out
                          <em> (adjust filters to add back)</em>
                        </span>
                      </div>
                      {filteredOutTools.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {filteredOutTools.map((tool) => (
                            <div
                              key={tool.id}
                              className="group flex items-center space-x-2 px-3 py-1.5 bg-gray-50/50 rounded-lg border border-gray-200 text-gray-500"
                            >
                              <Image
                                src={tool.logo}
                                alt={`${tool.name} logo`}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover opacity-75"
                              />
                              <span className="text-sm">{tool.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">All tools match the current filters</p>
                      )}
                    </div>
                  )}

                  {showRemovedToolsMenu && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {removedTools.length} {removedTools.length === 1 ? 'tool' : 'tools'} removed
                          <button
                            onClick={onRestoreAll}
                            className="ml-2 text-sm text-alpine-blue-400 hover:text-alpine-blue-500"
                          >
                            Add Back All
                          </button>
                        </span>
                      </div>
                      <RemovedToolsMenu
                        removedTools={removedTools}
                        onRestore={onToolSelect}
                        onRestoreAll={onRestoreAll}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* REMOVED: FullscreenNavigation - no longer needed */}

          {onContinue && (
            <button
              onClick={onContinue}
              disabled={isSubmitting}
              className={`
                flex items-center px-4 py-2 
                bg-alpine-blue-500 hover:bg-alpine-blue-600 text-white font-medium 
                rounded-lg transition-colors shadow-sm text-sm
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Processing</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  Continue to Chart Analysis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Sub-header - uses responsive --section-padding */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        <div
          className="h-[76px] flex items-center"
          style={{ padding: 'calc(var(--section-padding, 1rem) * 0.5) var(--section-padding, 1rem)' }}
        >
          <p className="text-sm text-gray-600">
            Explore the best‑fit PPM tools that align with your goals. Picking the right tool now sets the stage for smoother adoption and long‑term success.
          </p>
        </div>
      </div>

      {/* Animation Layer */}
      {animatingTool && (
        <ToolCompareAnimation
          isAnimating={true}
          startPosition={animatingTool.position}
          targetPosition={chartButtonPosition || { x: 0, y: 0 }}
          onComplete={handleAnimationComplete}
        />
      )}

      {/* Results Section - uses responsive --section-padding */}
      <div className="section-scroll flex-1 min-h-0" data-lenis-prevent>
        <div style={{ padding: 'var(--section-padding, 1rem)', paddingBottom: '2.5rem' }}>
          {sortedTools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Award className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tools match your current filters</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or criteria to see more results.</p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-alpine-blue-500 text-white rounded-lg hover:bg-alpine-blue-600 transition-colors"
              >
                Adjust Filters
              </button>
            </div>
          ) : (
            <ShuffleContainer
              tools={sortedTools}
              shuffleAnimation={shuffleAnimation}
              className="flex flex-col gap-4"
              isMobile={isMobile}
              enableParticles={true}
            >
              {sortedTools.map((tool, index) => renderTool(tool, index))}
            </ShuffleContainer>
          )}
        </div>
      </div>


    </div>
  );
};