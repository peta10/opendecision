'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, ReactNode } from 'react';

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        ui_host: 'https://us.posthog.com',
        
        // Core capture settings
        capture_pageview: true,
        capture_pageleave: false,
        
        // Autocapture configuration
        autocapture: {
          dom_event_allowlist: ['click'],
          url_allowlist: ['/ppm-tool'],
          element_allowlist: ['button', 'a'],
          css_selector_allowlist: ['.track-click', '[data-track]']
        },
        
        // Session recording disabled by default
        disable_session_recording: true,
        
        // Person profiles
        person_profiles: 'always',
        
        // Privacy and performance
        respect_dnt: true,
        opt_out_capturing_by_default: false,
        cross_subdomain_cookie: true,
        secure_cookie: true,
        
        // Development settings
        debug: process.env.NODE_ENV === 'development',
        
        // Error handling
        on_request_error: (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('PostHog request failed:', error);
          }
        },
        
        // Loaded callback
        loaded: (posthog) => {
          const currentDomain = window.location.hostname;
          const isProduction = process.env.NODE_ENV === 'production';
          const isProductionDomain = currentDomain === 'panoramic-solutions.com' || 
                                   currentDomain.endsWith('.panoramic-solutions.com');
          
          if (isProduction && !isProductionDomain) {
            console.warn('⚠️ PostHog: Production environment but not on production domain:', currentDomain);
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 PostHog initialized successfully');
            console.log('📍 Domain:', currentDomain);
            console.log('🌍 Environment:', process.env.NODE_ENV);
          } else if (isProductionDomain) {
            console.log('🎯 PostHog tracking active on production domain');
          }
          
          // Set default properties
          posthog.register({
            'app_version': '1.0.0',
            'environment': process.env.NODE_ENV || 'production',
            'app_name': 'PPM Tool Finder',
            'domain': window.location.hostname,
            'site_url': window.location.origin
          });
          
          // Make PostHog available globally
          (window as any).posthog = posthog;
        }
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

