'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { ActionButtons } from './ActionButtons';
import type { Tool, Criterion } from '@/ppm-tool/shared/types';
import Image from 'next/image';

type NavigationStep = {
  id: string;
  label: string;
  description: string;
};

interface NavigationToggleProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  compareCount?: number;
  selectedTools?: Tool[];
  selectedCriteria?: Criterion[];
  filteredTools?: Tool[];
  onAnimationTrigger?: () => void;
  onShowHowItWorks?: () => void;
  isProductBumperVisible?: boolean;
  getReportButtonRef?: React.RefObject<HTMLButtonElement>;
  onChartButtonPosition?: (position: { x: number; y: number }) => void;
  onCloseExitIntentBumper?: () => void;
  // Email modal control (for animation integration)
  showEmailModal?: boolean;
  onOpenEmailModal?: () => void;
  onCloseEmailModal?: () => void;
  onOpenGuidedRanking?: (criterionId?: string) => void;
  // AI Panel state for layout coordination
  isAIPanelExpanded?: boolean;
}

export const NavigationToggle: React.FC<NavigationToggleProps> = ({
  currentStep,
  onStepChange,
  compareCount = 0,
  showEmailModal,
  onOpenEmailModal,
  onCloseEmailModal,
  selectedTools = [],
  selectedCriteria = [],
  filteredTools = [],
  onAnimationTrigger,
  onShowHowItWorks,
  isProductBumperVisible = false,
  getReportButtonRef,
  onChartButtonPosition,
  onCloseExitIntentBumper,
  onOpenGuidedRanking,
  isAIPanelExpanded = false,
}) => {
  const isMobile = useMobileDetection();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChartGlowing, setIsChartGlowing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const chartButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update chart button position when component mounts or layout changes
  const updateChartButtonPosition = useCallback(() => {
    if (chartButtonRef.current && onChartButtonPosition) {
      const rect = chartButtonRef.current.getBoundingClientRect();
      onChartButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
  }, [onChartButtonPosition]);

  // Calculate header height (fixed - no scroll changes)
  const getHeaderHeight = useCallback(() => {
    // Header.tsx uses:
    // - py-0.5 = 2px top + 2px bottom
    // - paddingTop style overrides: max(4px, env(safe-area-inset-top)) on mobile, max(8px, env) on desktop
    // - Logo: h-8 (32px) on mobile, h-10 (40px) on desktop
    
    // Use mobile values as default during SSR to prevent hydration mismatch
    const effectiveIsMobile = !isHydrated || isMobile;
    
    const topPadding = effectiveIsMobile ? 4 : 8; // From paddingTop style override
    const bottomPadding = 2; // py-0.5 = 2px bottom (consistent)
    const logoHeight = effectiveIsMobile ? 32 : 40; // h-8 = 32px mobile, h-10 = 40px desktop
    
    // Total header height: top padding + bottom padding + logo height
    return topPadding + bottomPadding + logoHeight;
  }, [isMobile, isHydrated]);

  // Calculate navigation height (fixed - no scroll changes)
  const getNavigationHeight = useCallback(() => {
    // Use mobile values as default during SSR to prevent hydration mismatch
    const effectiveIsMobile = !isHydrated || isMobile;
    
    // Navigation uses different top padding for mobile vs desktop
    const topPadding = effectiveIsMobile ? 8 : 8; // 8px on mobile to match bottom padding, keep 16px on desktop
    const bottomPadding = 8; // pb-2 = 8px (fixed)
    const contentHeight = 40; // Approximate content height
    
    // Add extra spacing below toggles on mobile for logo (original desktop logic)
    const mobileLogoSpacing = effectiveIsMobile ? 4 : 0; // Reduced from 8px to 4px for tighter mobile spacing
    
    // Larger spacing between navigation and main content
    const extraSpacing = effectiveIsMobile ? 24 : 16; // Mobile: 24px, Desktop: 16px (increased from 8px to match header gap increase)
    
    return topPadding + bottomPadding + contentHeight + mobileLogoSpacing + extraSpacing;
  }, [isMobile, isHydrated]);

  // Total combined height for content offset
  const getTotalFixedHeight = useCallback(() => {
    return getHeaderHeight() + getNavigationHeight();
  }, [getHeaderHeight, getNavigationHeight]);

  // Update position on mount and when compare count changes (affects button size) 
  useEffect(() => {
    updateChartButtonPosition();
  }, [updateChartButtonPosition, compareCount]);

  // Listen for animation triggers
  useEffect(() => {
    const handleAnimationTrigger = () => {
      // Only trigger if not already glowing to prevent double animations
      if (!isChartGlowing) {
        setIsChartGlowing(true);
        // Remove glow after 1.2 seconds to match CSS animation duration
        setTimeout(() => {
          setIsChartGlowing(false);
        }, 1200);
      }
    };

    // Listen for custom events from the animation
    if (typeof window !== 'undefined') {
      window.addEventListener('chartToggleGlow', handleAnimationTrigger);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chartToggleGlow', handleAnimationTrigger);
      }
    };
  }, [isChartGlowing]);

  // Set chart button position for animation
  useEffect(() => {
    if (chartButtonRef.current) {
      const rect = chartButtonRef.current.getBoundingClientRect();
      onChartButtonPosition?.({ x: rect.left, y: rect.top });
    }
  }, [onChartButtonPosition]);

  // Update CSS custom property when height changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const totalHeight = getTotalFixedHeight();
      document.documentElement.style.setProperty('--total-fixed-height', `${totalHeight}px`);
    }
  }, [isMobile, getTotalFixedHeight]); // Recalculate when mobile state changes

  // Handle resize and orientation changes
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const totalHeight = getTotalFixedHeight();
        document.documentElement.style.setProperty('--total-fixed-height', `${totalHeight}px`);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, getTotalFixedHeight]);

  // Handle scroll to show/hide shadow
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // Show shadow when scrolled more than 10px to avoid flickering
      setIsScrolled(scrollTop > 10);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Use mobile layout as default for SSR, then update after hydration
  const steps: NavigationStep[] = !isHydrated || isMobile 
    ? [
        { id: 'criteria', label: 'Rank Your Criteria', description: 'Set importance levels' },
        { id: 'tools', label: 'Tools & Recommendations', description: 'Choose PPM solutions' },
        { id: 'chart', label: 'Tool - Criteria Comparisons', description: 'Visual comparison' },
      ]
    : [
        { id: 'criteria-tools', label: 'Criteria + Tools', description: 'Set criteria & select tools' },
        { id: 'chart', label: 'Chart Comparison', description: 'Compare solutions' },
      ];

  return (
    <nav 
      className={cn(
        "fixed w-full transition-all duration-300",
        // Default to mobile z-index for SSR, update after hydration
        !isHydrated ? "z-[55]" : (isMobile ? "z-[55]" : "z-50"), // z-55 on mobile (below header's z-60), z-50 on desktop
        isProductBumperVisible && "blur-sm opacity-75",
        isScrolled && "shadow-md shadow-gray-300/70"
      )}
        style={{ 
          backgroundColor: '#F0F4FE',
          // Mobile: Position directly below header (flush)
          // Desktop: Add 16px gap below header (increased from 8px)
          // Default to mobile for SSR
          top: `${getHeaderHeight() + (!isHydrated || isMobile ? 0 : 16)}px`,
          '--total-fixed-height': `${getTotalFixedHeight() + (!isHydrated || isMobile ? 0 : 16)}px` // Expose total height for content padding
        } as React.CSSProperties}
      aria-label="PPM Tool Navigation"
      role="navigation"
    >
      <div
        className={cn(
          "pb-2 pt-4",
          // Mobile: standard padding, Desktop: account for responsive AI rail
          "px-4"
        )}
        style={{
          // On desktop, offset and center relative to available space (excluding AI panel)
          marginLeft: isHydrated && !isMobile
            ? isAIPanelExpanded
              ? 'var(--ai-panel-width, 320px)'
              : 'var(--ai-rail-width, 64px)'
            : undefined,
          marginRight: isHydrated && !isMobile ? '0' : undefined,
          // Smooth transition when panel expands/collapses
          transition: 'margin-left 0.15s ease-out',
        }}
      >
        <div className={cn(
          "flex items-center",
          !isHydrated ? "justify-center" : (isMobile ? "justify-center" : "justify-between")
        )}>
          {/* Navigation Steps - Left Side */}
          <div className={cn(
            "flex items-center",
            !isHydrated ? "w-full justify-center" : (isMobile ? "w-full justify-center" : "")
          )}>
            {/* Simple Tab Navigation */}
            <div className={cn(
              "flex items-center relative",
              !isHydrated ? "space-x-0.5" : (isMobile ? "space-x-0.5" : "space-x-6") // Reduced from space-x-2 to space-x-1 for mobile
            )}>
              {/* Continuous base line - mobile only */}
              {(!isHydrated || isMobile) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"></div>
              )}
              
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isChartStep = step.id === 'chart';
                const shouldGlow = isChartStep && isChartGlowing;
                return (
                    <button
                    key={step.id}
                    ref={isChartStep ? chartButtonRef : undefined}
                    onClick={() => {
                      // Update URL when changing views
                      const url = new URL(window.location.href);
                      if (step.id === 'chart') {
                        url.searchParams.set('view', 'chart');
                      } else {
                        url.searchParams.delete('view');
                      }
                      window.history.pushState({}, '', url.toString());
                      
                      // Trigger step change
                      onStepChange(step.id);
                    }}
                    className={cn(
                      'relative py-2 font-bold transition-all duration-300 flex flex-col items-center justify-end',
                      !isHydrated ? 'px-1 text-center h-14 flex-1' : (isMobile ? 'px-1 text-center h-14 flex-1' : 'px-1'),
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-700',
                      shouldGlow && 'chart-toggle-glow'
                    )}
                  >
                    <span className={cn(
                      "text-center leading-tight",
                      !isHydrated ? "text-xs pb-1" : (isMobile ? "text-xs pb-1" : "text-sm md:text-base")
                    )}>
                      {step.id === 'criteria' ? (
                        <>
                          Rank Your<br />Criteria
                        </>
                      ) : (
                        step.label
                      )}
                    </span>
                    {isChartStep && compareCount > 0 && (
                      <div className={cn(
                        'absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full text-xs font-medium',
                        isActive ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'
                      )}>
                        {compareCount}
                      </div>
                    )}
                    {/* Active underline indicator */}
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300",
                      isActive 
                        ? "bg-blue-600" 
                        : (!isHydrated || isMobile)
                          ? "bg-transparent" 
                          : "bg-gray-300"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* PPM Tool Logo - Center relative to content area (accounts for AI panel state) */}
          {isHydrated && !isMobile && (
            <div
              className="absolute transform -translate-x-1/2 text-center max-w-lg lg:max-w-xl"
              style={{
                // When AI panel expanded: center relative to remaining viewport
                // When collapsed: center relative to viewport minus rail
                left: isAIPanelExpanded
                  ? 'calc(50% + (var(--ai-panel-width, 320px) / 2))'
                  : 'calc(50% + (var(--ai-rail-width, 64px) / 2))',
                transition: 'left 0.15s ease-out'
              }}
            >
              <div className="flex justify-center">
                <Image
                  src="/images/PPM_Tool_Finder.png"
                  alt="PPM Tool Finder"
                  width={250}
                  height={75}
                  className="h-10 md:h-14 lg:h-18 w-auto object-contain"
                  priority
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons - Desktop: inline on right, Mobile: fixed bottom bar */}
          {isHydrated && (
            <ActionButtons
              selectedTools={selectedTools}
              selectedCriteria={selectedCriteria}
              filteredTools={filteredTools}
              onShowHowItWorks={onShowHowItWorks}
              getReportButtonRef={getReportButtonRef}
              onCloseExitIntentBumper={onCloseExitIntentBumper}
              showEmailModal={showEmailModal}
              onOpenEmailModal={onOpenEmailModal}
              onCloseEmailModal={onCloseEmailModal}
              onOpenGuidedRanking={onOpenGuidedRanking}
            />
          )}
                 </div>
       </div>
     </nav>
  );
}; 
