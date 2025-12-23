'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  setOverlayOpen,
  setOverlayClosed,
  OVERLAY_TYPES
} from '@/ppm-tool/shared/utils/overlayState';
import { analytics } from '@/lib/analytics';

interface GuidanceContextType {
  // Manual guidance state (for CriteriaGuidance popup)
  showManualGuidance: boolean;
  triggerManualGuidance: () => void;
  closeManualGuidance: () => void;
  hasShownManualGuidance: boolean;
  // Guided ranking callbacks
  onGuidedRankingStart: () => void;
  onGuidedRankingComplete: () => void;
  onGuidedRankingClick: () => void;
  // Comparison report callbacks
  onComparisonReportClick: () => void;
  onComparisonReportOpen: () => void;
  onComparisonReportClose: (submitted?: boolean) => void;
}

const GuidanceContext = createContext<GuidanceContextType | undefined>(undefined);

interface GuidanceProviderProps {
  children: ReactNode;
}

export const GuidanceProvider = ({ children }: GuidanceProviderProps) => {
  // Manual guidance state (for CriteriaGuidance popup)
  const [showManualGuidance, setShowManualGuidance] = useState(false);
  const [hasShownManualGuidance, setHasShownManualGuidance] = useState(false);

  const emitOverlayEvent = useCallback(
    (options: {
      overlay: 'guided_ranking' | 'comparison_report' | 'manual_guidance';
      eventType: 'shown' | 'cta_clicked' | 'dismissed' | 'timeout';
      trigger?: string;
      cta?: string;
      context?: Record<string, any>;
    }) => {
      void analytics.trackOverlayEvent({
        overlay: options.overlay,
        eventType: options.eventType,
        trigger: options.trigger,
        cta: options.cta,
        context: {
          source_component: 'guidance_context',
          ...options.context,
        },
      });
    },
    []
  );

  const triggerManualGuidance = () => {
    if (!hasShownManualGuidance) {
      setShowManualGuidance(true);
      setHasShownManualGuidance(true);
      emitOverlayEvent({
        overlay: 'manual_guidance',
        eventType: 'shown',
      });
    }
  };

  const closeManualGuidance = () => {
    setShowManualGuidance(false);
    emitOverlayEvent({
      overlay: 'manual_guidance',
      eventType: 'dismissed',
      context: { reason: 'manual_close' },
    });
  };

  const onGuidedRankingStart = () => {
    console.log('Guided ranking started');
    setOverlayOpen(OVERLAY_TYPES.GUIDED_RANKINGS);
    emitOverlayEvent({
      overlay: 'guided_ranking',
      eventType: 'shown',
    });
  };

  const onGuidedRankingComplete = () => {
    console.log('Guided ranking completed');
    setOverlayClosed(OVERLAY_TYPES.GUIDED_RANKINGS);
    emitOverlayEvent({
      overlay: 'guided_ranking',
      eventType: 'dismissed',
      context: { status: 'completed' },
    });
  };

  const onGuidedRankingClick = () => {
    console.log('User clicked into Guided Rankings');
    emitOverlayEvent({
      overlay: 'guided_ranking',
      eventType: 'cta_clicked',
    });
  };

  const onComparisonReportClick = () => {
    console.log('User clicked into Comparison Report');
    emitOverlayEvent({
      overlay: 'comparison_report',
      eventType: 'cta_clicked',
    });
  };

  const onComparisonReportOpen = () => {
    console.log('Comparison Report opened');
    setOverlayOpen(OVERLAY_TYPES.COMPARISON_REPORT);
    emitOverlayEvent({
      overlay: 'comparison_report',
      eventType: 'shown',
    });
  };

  const onComparisonReportClose = (submitted: boolean = false) => {
    console.log(`Comparison Report closed (submitted: ${submitted})`);
    setOverlayClosed(OVERLAY_TYPES.COMPARISON_REPORT);
    emitOverlayEvent({
      overlay: 'comparison_report',
      eventType: 'dismissed',
      context: { submitted },
    });
  };

  return (
    <GuidanceContext.Provider value={{
      showManualGuidance,
      triggerManualGuidance,
      closeManualGuidance,
      hasShownManualGuidance,
      onGuidedRankingStart,
      onGuidedRankingComplete,
      onGuidedRankingClick,
      onComparisonReportClick,
      onComparisonReportOpen,
      onComparisonReportClose
    }}>
      {children}
    </GuidanceContext.Provider>
  );
};

export function useGuidance() {
  const ctx = useContext(GuidanceContext);
  if (!ctx) throw new Error('useGuidance must be used within a GuidanceProvider');
  return ctx;
}
