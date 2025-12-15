'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';

/**
 * Inner component that uses useSearchParams
 * Must be wrapped in Suspense for Next.js 15 static generation
 */
function AnalyticsTracker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view on route change
    const trackPageView = async () => {
      try {
        await analytics.trackPageView({
          path: pathname,
          referrer: document.referrer || undefined,
          utmSource: searchParams?.get('utm_source') || undefined,
          utmMedium: searchParams?.get('utm_medium') || undefined,
          utmCampaign: searchParams?.get('utm_campaign') || undefined,
        });
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    };

    trackPageView();
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/**
 * Global Analytics Provider
 * Tracks page views across all pages automatically
 * Captures UTM parameters and referrer information
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AnalyticsTracker>{children}</AnalyticsTracker>
    </Suspense>
  );
}
