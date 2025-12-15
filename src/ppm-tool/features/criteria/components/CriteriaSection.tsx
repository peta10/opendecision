'use client';

import React, { useState, useRef } from 'react';
import { Criterion } from '@/ppm-tool/shared/types';
import { Sliders, Sparkles, HelpCircle, X, RotateCcw } from 'lucide-react';
import '@/ppm-tool/components/ui/GrayGearButton.css';
import { PanoramicPill } from '@/ppm-tool/components/ai/PanoramicPill';
import { DraggableList } from '@/ppm-tool/components/interactive/DraggableList';
import { defaultCriteria } from '@/ppm-tool/data/criteria';

import { CriteriaGuidance } from '@/ppm-tool/components/overlays/CriteriaGuidance';
import { Slider } from '@/ppm-tool/components/ui/slider';
import { MobileTooltip } from '@/ppm-tool/components/ui/MobileTooltip';
import { EnhancedDesktopTooltip } from '@/ppm-tool/components/ui/enhanced-desktop-tooltip';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';

import { useGuidance } from '@/ppm-tool/shared/contexts/GuidanceContext';
import { checkAndTrackNewActive, checkAndTrackNewManualRanking } from '@/lib/posthog';
import { analytics } from '@/lib/analytics';
import '@/ppm-tool/components/ui/ModernPill.css';

interface CriteriaSectionProps {
  criteria: Criterion[];
  onCriteriaChange: (criteria: Criterion[]) => void;
  onFullReset?: () => void; // Add this new prop for full reset including guided answers
  startWithGuidedQuestions?: boolean;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
  onOpenGuidedRanking?: (criterionId?: string) => void;
}

export const CriteriaSection: React.FC<CriteriaSectionProps> = ({
  criteria,
  onCriteriaChange,
  onFullReset,
  startWithGuidedQuestions = false,
  guidedButtonRef,
  onOpenGuidedRanking
}) => {
  const [dragTooltipCriterionId, setDragTooltipCriterionId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper function to get tooltip description
  const getTooltipDescription = (criterion: Criterion) => {
    if (criterion.tooltipDescription) {
      return criterion.tooltipDescription;
    }
    // Fallback to default criteria
    const defaultCriterion = defaultCriteria.find(dc => dc.name === criterion.name);
    return defaultCriterion?.tooltipDescription || `Detailed information about ${criterion.name} rating guidelines.`;
  };

  const sectionRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { isTouchDevice } = useUnifiedMobileDetection();
  const { 
    showManualGuidance, 
    closeManualGuidance,
    showProductBumper,
    onGuidedRankingClick
  } = useGuidance();

  const handleGuidedRankingsClick = () => {
    onGuidedRankingClick();
    onOpenGuidedRanking?.();
  };

  const handleUseGuided = () => {
    onGuidedRankingClick();
    closeManualGuidance();
    onOpenGuidedRanking?.();
  };

  const handleGuidanceClose = () => {
    closeManualGuidance();
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const handleResetCriteria = () => {
    // Use the full reset handler if provided (clears guided answers too)
    if (onFullReset) {
      onFullReset();
    } else {
      // Fallback: just reset criteria values (legacy behavior)
      const resetCriteria = defaultCriteria.map(dc => ({
        ...dc,
        userRating: 3 // Reset to default middle value
      }));
      onCriteriaChange(resetCriteria);
    }
    
    setIsSettingsOpen(false);
    
    // Track analytics
    try {
      checkAndTrackNewActive('Active-reset-criteria', {
        component: 'criteria_section',
        interaction_type: 'reset_criteria',
        full_reset: !!onFullReset
      });
    } catch (error) {
      console.warn('Failed to track criteria reset:', error);
    }
  };

  // Click outside handler for settings modal
  useClickOutside(settingsRef, () => {
    handleSettingsClose();
  });

  // Create a stable reference for onCriteriaChange to avoid infinite loops  
  const onCriteriaChangeRef = React.useRef(onCriteriaChange);
  onCriteriaChangeRef.current = onCriteriaChange;
  
  // Create individual callbacks for each criterion to prevent recreation
  const criteriaIds = React.useMemo(() => criteria.map(c => c.id).join(','), [criteria]);
  const sliderCallbacks = React.useMemo(() => {
    const callbacks: Record<string, (value: number[]) => void> = {};
    criteria.forEach((criterion) => {
      callbacks[criterion.id] = (value: number[]) => {
        const updatedCriteria = criteria.map((c) =>
          c.id === criterion.id
            ? { ...c, userRating: value[0] }
            : c
        );
        onCriteriaChangeRef.current(updatedCriteria);
        
        // Track criteria ranking change in Supabase (fire-and-forget)
        analytics.trackCriteriaRanking({
          criteriaId: criterion.id,
          criteriaName: criterion.name,
          score: value[0],
          isManual: true
        });
        
        // Track New_Manual_Ranking in PostHog (ONCE per user)
        checkAndTrackNewManualRanking({
          criteria_id: criterion.id,
          criteria_name: criterion.name,
          score: value[0],
          interaction_type: 'slider_movement'
        });
        
        // Track as active user (meaningful action)
        checkAndTrackNewActive('slider_moved', {
          criteria_id: criterion.id,
          criteria_name: criterion.name,
          score: value[0]
        });
      };
    });
    return callbacks;
  }, [criteria]);

  // Drag handler callbacks for each criterion
  const dragStartCallbacks = React.useMemo(() => {
    const callbacks: Record<string, () => void> = {};
    criteria.forEach((criterion) => {
      callbacks[criterion.id] = () => {
        setDragTooltipCriterionId(criterion.id);
      };
    });
    return callbacks;
  }, [criteria]);

  const dragEndCallbacks = React.useMemo(() => {
    const callbacks: Record<string, () => void> = {};
    criteria.forEach((criterion) => {
      callbacks[criterion.id] = () => {
        setDragTooltipCriterionId(null);
        
        // Track slider interaction for New_Active metric
        try {
          checkAndTrackNewActive('Active-slider', {
            component: 'criteria_section',
            criterion_name: criterion.name,
            interaction_type: 'manual_slider_drag'
          });
        } catch (error) {
          console.warn('Failed to track criteria slider interaction:', error);
        }
      };
    });
    return callbacks;
  }, [criteria]);

  return (
    <>
      {/* Guidance Popup - Moved OUTSIDE the overflow-hidden container */}
      <CriteriaGuidance
        isVisible={showManualGuidance}
        onClose={handleGuidanceClose}
        onUseGuided={handleUseGuided}
      />
      
      <div 
        ref={sectionRef}
        id="criteria-section" 
        className={`bg-white rounded-lg shadow-lg flex flex-col h-full relative border border-gray-200`}
        style={{ overflow: 'visible' }}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header - uses responsive --section-padding from globals.css */}
          <div
            className="flex-shrink-0 flex items-center justify-between border-b bg-white rounded-t-lg"
            style={{ padding: 'var(--section-padding, 1rem)', paddingBottom: 'calc(var(--section-padding, 1rem) * 0.75)' }}
          >
            <div className="flex items-center">
              <Sliders className="w-5 h-5 md:w-6 md:h-6 mr-2 text-alpine-blue-400" />
              <div className="flex items-center">
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Rank Your Criteria</h2>
                <span className="hidden md:block ml-2 text-xs md:text-sm text-gray-500">
                  {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <PanoramicPill
                ref={guidedButtonRef}
                onClick={handleGuidedRankingsClick}
                highlighted={showProductBumper}
                className={showProductBumper ? 'relative z-50' : 'relative z-10'}
              />

              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="gray-gear-btn"
                  aria-label="Criteria settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <defs>
                      <linearGradient id="gear-gray-criteria" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#475569" />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#gear-gray-criteria)"
                      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.04 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                    />
                  </svg>
                </button>
                {isSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-xs sm:max-w-md bg-white rounded-lg shadow-xl border border-gray-200 z-50 mx-2 md:mx-0">
                    <div className="flex items-center justify-between p-3 md:p-4 border-b">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">Criteria Settings</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                          {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                        <button
                          onClick={handleResetCriteria}
                          className="modern-pill modern-pill--blue modern-pill--sm"
                        >
                          <span className="modern-pill__lighting"></span>
                          <span className="modern-pill__content">
                            <RotateCcw className="w-3 h-3" />
                            Reset Criteria
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
                    <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Resetting will:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                          <li>Set all criteria ratings to 3 (default)</li>
                          <li>Restore original criteria order</li>
                          <li>Clear your custom preferences</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub-header - uses responsive --section-padding */}
          <div className="flex-shrink-0 border-b bg-gray-50">
            <div
              className="h-[76px] flex items-center"
              style={{ padding: 'calc(var(--section-padding, 1rem) * 0.5) var(--section-padding, 1rem)' }}
            >
              <p className="text-sm text-gray-600">
                The better we understand your priorities, the better we can recommend the PPM tools that will set you up for success.
              </p>
            </div>
          </div>

          {/* Criteria List - uses responsive --section-padding */}
          <div className="section-scroll flex-1 min-h-0 overflow-y-auto" data-lenis-prevent style={{ overflowX: 'visible' }}>
            <div style={{ padding: 'var(--section-padding, 1rem)', paddingBottom: '3rem' }}>
              <DraggableList
                items={criteria}
                onReorder={onCriteriaChange}
                getItemId={(criterion) => criterion.id}
                renderItem={(criterion) => (
                  <div key={criterion.id}>
                    <div
                      className="bg-white rounded-xl border border-gray-200 px-3 md:px-6 py-3.5 2xl:py-5 mb-4 compact-padding compact-card-height"
                      style={{ minHeight: 'var(--compact-card-height, 88px)' }}
                    >
                      <div className="flex items-start justify-between gap-2 md:gap-3 mb-0.5">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 compact-text-lg">
                            {criterion.name}
                          </h3>
                          {isTouchDevice ? (
                            <MobileTooltip 
                              content={
                                <div className="break-words">
                                  {getTooltipDescription(criterion)}
                                </div>
                              }
                              side="top"
                              align="center"
                              className="max-w-xs text-sm"
                              forceOpen={dragTooltipCriterionId === criterion.id}
                            >
                              <button 
                                type="button"
                                className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                                aria-label={`More information about ${criterion.name}`}
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </MobileTooltip>
                          ) : (
                            <EnhancedDesktopTooltip
                              content={
                                <div className="break-words">
                                  {getTooltipDescription(criterion)}
                                </div>
                              }
                              side="top"
                              align="center"
                              className="max-w-xs text-sm"
                              delay={300}
                              forceOpen={dragTooltipCriterionId === criterion.id}
                            >
                              <button 
                                type="button"
                                className="text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center -m-1 p-1 rounded-full hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-alpine-blue-400 focus:ring-opacity-50"
                                aria-label={`More information about ${criterion.name}`}
                                tabIndex={0}
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </EnhancedDesktopTooltip>
                          )}
                          {isTouchDevice ? (
                            <MobileTooltip 
                              content={
                                <div className="break-words">
                                  Select for guided ranking
                                </div>
                              }
                              side="bottom"
                              align="center"
                              className="max-w-xs text-sm"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenGuidedRanking?.(criterion.id);
                                }}
                                className="text-alpine-blue-400 hover:text-alpine-blue-500 active:text-alpine-blue-600 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label={`Open guided ranking for ${criterion.name}`}
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                            </MobileTooltip>
                          ) : (
                            <EnhancedDesktopTooltip
                              content={
                                <div className="break-words">
                                  Select for guided ranking
                                </div>
                              }
                              side="top"
                              align="center"
                              className="max-w-xs text-sm"
                              delay={300}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenGuidedRanking?.(criterion.id);
                                }}
                                className="text-alpine-blue-400 hover:text-alpine-blue-500 focus:text-alpine-blue-600 transition-colors flex items-center justify-center focus:outline-none"
                                aria-label={`Open guided ranking for ${criterion.name}`}
                                tabIndex={0}
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                            </EnhancedDesktopTooltip>
                          )}
                        </div>
                      </div>
                      <div data-lenis-prevent>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Slider
                              value={[criterion.userRating]}
                              min={1}
                              max={5}
                              step={1}
                              onValueChange={sliderCallbacks[criterion.id]}
                              onDragStart={dragStartCallbacks[criterion.id]}
                              onDragEnd={dragEndCallbacks[criterion.id]}
                            />
                          </div>
                          <div className="flex items-center justify-end min-w-[24px]">
                            <span className="text-alpine-blue-600 font-semibold text-base">{criterion.userRating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-0.5 text-[10px] text-gray-400">
                          <span>Importance level</span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};