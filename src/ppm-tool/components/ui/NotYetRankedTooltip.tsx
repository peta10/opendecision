'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getNotYetRankedTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import './ModernPill.css';

interface NotYetRankedTooltipProps {
  className?: string;
  onGuidedRankingClick?: () => void;
  onNavigateToCriteria?: () => void;
  inline?: boolean;
  wrapYourTool?: boolean; // When true, includes "Your Tool" text in the tooltip trigger area
  isVisible?: boolean; // Whether the tool is currently visible (for styling)
}

/**
 * Tooltip component for "Not Yet Ranked" state explanation
 * Uses existing tooltip infrastructure without modification
 * Completely separate from bumper and other tooltip systems
 * 
 * @param inline - When true, displays as compact inline text "(Not Yet Ranked)" for use after "Your Tool"
 */
export const NotYetRankedTooltip: React.FC<NotYetRankedTooltipProps> = ({
  className = '',
  onGuidedRankingClick,
  onNavigateToCriteria,
  inline = false,
  wrapYourTool = false,
  isVisible = false
}) => {
  const { isTouchDevice } = useUnifiedMobileDetection();
  
  const tooltipContent = (
    <div className="break-words">
      <p>{getNotYetRankedTooltipContent()}</p>
      {(onGuidedRankingClick || onNavigateToCriteria) && (
        <>
          <div className="mt-3 pt-3 border-t border-gray-200" />

          {/* Mobile: Show both Guided Rankings and Criteria Sliders buttons */}
          {isTouchDevice ? (
            <div className="mt-2 space-y-2">
              {onGuidedRankingClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuidedRankingClick();
                  }}
                  className="modern-pill modern-pill--blue modern-pill--sm modern-pill--full"
                >
                  <span className="modern-pill__lighting"></span>
                  <span className="modern-pill__content">
                    Open Guided Rankings
                  </span>
                </button>
              )}
              {onNavigateToCriteria && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onNavigateToCriteria) {
                      onNavigateToCriteria();
                    } else {
                      const criteriaSection = document.getElementById('criteria-section');
                      if (criteriaSection) {
                        criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="modern-pill modern-pill--gray modern-pill--sm modern-pill--full"
                >
                  <span className="modern-pill__lighting"></span>
                  <span className="modern-pill__content">
                    Adjust Criteria Sliders
                  </span>
                </button>
              )}
            </div>
          ) : (
            // Desktop: Only show Guided Rankings button if available
            onGuidedRankingClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGuidedRankingClick();
                }}
                className="mt-2 modern-pill modern-pill--blue modern-pill--sm modern-pill--full"
              >
                <span className="modern-pill__lighting"></span>
                <span className="modern-pill__content">
                  Open Guided Rankings
                </span>
              </button>
            )
          )}
        </>
      )}
    </div>
  );

  // Inline compact mode for display after "Your Tool"
  if (inline) {
    return (
      <MobileTooltip 
        content={tooltipContent}
        side="bottom"
        align="center"
        className="max-w-xs text-sm"
      >
        <span className={`inline-flex items-center gap-1 ${wrapYourTool ? 'text-sm font-semibold' : 'ml-2'} ${
          wrapYourTool ? (isVisible ? 'text-green-800' : 'text-gray-600') : ''
        } ${className}`}>
          {wrapYourTool && <span>Your Tool</span>}
          <span className="text-gray-500 text-xs">Not Yet Ranked</span>
          <span 
            className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
            aria-label="Not Yet Ranked Information"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              // Allow keyboard activation with Enter or Space
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                // Tooltip is triggered by the parent MobileTooltip component
              }
            }}
            onClick={(e) => {
              // Prevent triggering parent button when clicking the help icon
              e.stopPropagation();
            }}
          >
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </span>
        </span>
      </MobileTooltip>
    );
  }

  // Default standalone mode
  return (
    <MobileTooltip 
      content={tooltipContent}
      side="bottom"
      align="center"
      className="max-w-xs text-sm"
    >
      <button 
        type="button"
        className={`inline-flex items-center cursor-pointer px-2 py-1 -mx-2 -my-1 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-h-[44px] ${className}`}
        aria-label="Not Yet Ranked Information"
      >
        <span className="text-gray-500">Not Yet Ranked</span>
        <HelpCircle className="w-4 h-4 ml-1 text-gray-400" />
      </button>
    </MobileTooltip>
  );
};
