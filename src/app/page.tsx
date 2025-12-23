'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/ppm-tool/components/common/ErrorBoundary';
import { EmbeddedPPMToolFlow } from '@/ppm-tool/components/common/EmbeddedPPMToolFlow';
import { GuidanceProvider } from '@/ppm-tool/shared/contexts/GuidanceContext';
import { SpaceProvider } from '@/ppm-tool/shared/contexts/SpaceContext';
import { HowItWorksOverlay } from '@/ppm-tool/components/overlays/HowItWorksOverlay';
import { usePostHog } from '@/hooks/usePostHog';
import { setOverlayOpen, setOverlayClosed, OVERLAY_TYPES, addDevelopmentKeyboardShortcuts } from '@/ppm-tool/shared/utils/overlayState';
import { analytics } from '@/lib/analytics';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showGuidedRanking, setShowGuidedRanking] = useState(false);
  const [guidedRankingCriterionId, setGuidedRankingCriterionId] = useState<string | undefined>(undefined);
  const [initialView, setInitialView] = useState<string | undefined>(undefined);
  const guidedButtonRef = useRef<HTMLButtonElement>(null);
  const { trackClick, trackTool, checkAndTrackVisitor, checkAndTrackActive } = usePostHog();

  // Initialize analytics tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const landingPath = window.location.pathname + window.location.search;
      localStorage.setItem('posthog_landing_path', landingPath);
    }

    analytics.trackPageView({
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      utmSource: searchParams?.get('utm_source') || undefined,
      utmMedium: searchParams?.get('utm_medium') || undefined,
      utmCampaign: searchParams?.get('utm_campaign') || undefined,
    });
  }, [searchParams]);

  // Check URL parameters on mount and when they change
  useEffect(() => {
    const overlay = searchParams?.get('overlay');
    if (overlay === 'how-it-works') {
      setShowHowItWorks(true);
      setOverlayOpen(OVERLAY_TYPES.HOW_IT_WORKS);
    } else if (showHowItWorks) {
      setShowHowItWorks(false);
      setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
    }

    const view = searchParams?.get('view');
    if (view === 'chart') {
      setInitialView('chart');
    } else if (initialView) {
      setInitialView(undefined);
    }
  }, [searchParams, showHowItWorks, initialView]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const overlay = url.searchParams.get('overlay');
      const view = url.searchParams.get('view');

      if (overlay === 'how-it-works') {
        setShowHowItWorks(true);
        setOverlayOpen(OVERLAY_TYPES.HOW_IT_WORKS);
      } else {
        setShowHowItWorks(false);
        setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
      }

      if (view === 'chart') {
        setInitialView('chart');
      } else {
        setInitialView(undefined);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Track new visitor and active user on page load
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        const posthog = (await import('posthog-js')).default;

        if (posthog && posthog.__loaded) {
          posthog.register({
            app_version: '1.0.0',
            environment: process.env.NODE_ENV || 'production',
            page_type: 'ppm_tool',
            tool_category: 'portfolio_management'
          });

          checkAndTrackVisitor({
            page: 'ppm_tool',
            tool_type: 'portfolio_management'
          });
        } else {
          setTimeout(initializeTracking, 500);
        }
      } catch (error) {
        console.warn('Failed to initialize tracking:', error);
      }
    };

    initializeTracking();

    const handleFirstInteraction = () => {
      checkAndTrackActive('page_interaction', {
        page: 'ppm_tool',
        interaction_type: 'page_load'
      });

      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('scroll', handleFirstInteraction);

    addDevelopmentKeyboardShortcuts();

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };
  }, [checkAndTrackVisitor, checkAndTrackActive]);

  const handleGetStarted = () => {
    trackClick('get_started_button', { location: 'how_it_works_overlay' });
    trackTool('ppm_tool', 'started_guided_flow', { source: 'how_it_works' });

    checkAndTrackActive('guided_ranking_clicked', {
      page: 'ppm_tool',
      interaction_type: 'button_click',
      source: 'how_it_works_overlay'
    });

    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);

    const url = new URL(window.location.href);
    url.searchParams.delete('overlay');
    router.push(url.pathname + url.search);

    setShowGuidedRanking(true);
  };

  const handleManualRanking = () => {
    trackClick('manual_ranking_button', { location: 'how_it_works_overlay' });
    trackTool('ppm_tool', 'started_manual_flow', { source: 'how_it_works' });

    checkAndTrackActive('manual_ranking_clicked', {
      page: 'ppm_tool',
      interaction_type: 'button_click',
      source: 'how_it_works_overlay'
    });

    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);

    const url = new URL(window.location.href);
    url.searchParams.delete('overlay');
    router.push(url.pathname + url.search);
  };

  const handleGuidedRankingComplete = () => {
    trackTool('ppm_tool', 'guided_ranking_completed', {
      source: 'guided_flow',
      completion_time: Date.now(),
      criterion_id: guidedRankingCriterionId
    });
    setShowGuidedRanking(false);
    setGuidedRankingCriterionId(undefined);
  };

  const handleOpenGuidedRanking = (criterionId?: string) => {
    trackClick('open_guided_ranking', {
      location: 'main_page',
      criterion_id: criterionId,
      is_single_criterion: !!criterionId
    });
    trackTool('ppm_tool', 'opened_guided_ranking', {
      source: 'main_page',
      criterion_id: criterionId,
      is_single_criterion: !!criterionId
    });
    setGuidedRankingCriterionId(criterionId);
    setShowGuidedRanking(true);
  };

  const handleShowHowItWorks = () => {
    trackClick('show_how_it_works', { location: 'main_page' });
    trackTool('ppm_tool', 'viewed_how_it_works', { source: 'main_page' });
    setShowHowItWorks(true);
    setOverlayOpen(OVERLAY_TYPES.HOW_IT_WORKS);

    const url = new URL(window.location.href);
    url.searchParams.set('overlay', 'how-it-works');
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseHowItWorks = () => {
    checkAndTrackActive('how_it_works_close', {
      page: 'ppm_tool',
      interaction_type: 'close_modal'
    });

    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);

    const url = new URL(window.location.href);
    url.searchParams.delete('overlay');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <ErrorBoundary>
      <SpaceProvider>
        <GuidanceProvider>
          <div className="min-h-screen bg-background ppm-tool-container" role="main">
            <EmbeddedPPMToolFlow
              showGuidedRanking={showGuidedRanking}
              guidedRankingCriterionId={guidedRankingCriterionId}
              onGuidedRankingComplete={handleGuidedRankingComplete}
              onOpenGuidedRanking={handleOpenGuidedRanking}
              onShowHowItWorks={handleShowHowItWorks}
              guidedButtonRef={guidedButtonRef}
              initialView={initialView}
            />

            <HowItWorksOverlay
              isVisible={showHowItWorks}
              onClose={handleCloseHowItWorks}
              onGetStarted={handleGetStarted}
              onManualRanking={handleManualRanking}
            />
          </div>
        </GuidanceProvider>
      </SpaceProvider>
    </ErrorBoundary>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
