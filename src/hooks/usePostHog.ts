import { useCallback } from 'react';
import { usePostHog as usePostHogReact } from 'posthog-js/react';
import { 
  captureEvent, 
  trackButtonClick, 
  trackFormSubmission, 
  trackToolUsage,
  trackNewVisitor,
  trackNewActive,
  trackNewManualRanking,
  trackNewPartialRanking,
  trackNewFullRankingSubmittal,
  trackNewReportSent,
  trackToolTryFreeClick,
  trackToolAddToCompareClick,
  trackToolViewDetailsClick,
  checkAndTrackNewVisitor,
  checkAndTrackNewActive,
  checkAndTrackNewManualRanking,
  checkAndTrackNewPartialRanking,
  checkAndTrackNewFullRankingSubmittal,
  checkAndTrackNewReportSent,
  getSessionId,
  resetTrackingState
} from '@/lib/posthog';

export const usePostHog = () => {
  // Use official PostHog React hook
  const posthog = usePostHogReact();
  // Capture custom events
  const capture = useCallback((eventName: string, properties?: Record<string, any>) => {
    captureEvent(eventName, properties);
  }, []);

  // Track button clicks
  const trackClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    trackButtonClick(buttonName, properties);
  }, []);

  // Track form submissions
  const trackForm = useCallback((formName: string, properties?: Record<string, any>) => {
    trackFormSubmission(formName, properties);
  }, []);

  // Track tool usage (specific to PPM tool)
  const trackTool = useCallback((toolName: string, action: string, properties?: Record<string, any>) => {
    trackToolUsage(toolName, action, properties);
  }, []);

  // Identify user
  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties);
  }, []);

  // Set user properties
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    posthog.people.set(properties);
  }, []);

  // Get user ID
  const getUserId = useCallback(() => {
    return posthog.get_distinct_id();
  }, []);

  // Check if user is identified
  const isIdentified = useCallback(() => {
    return posthog.isFeatureEnabled('any_feature'); // This will return false if user is not identified
  }, []);

  // Core Metrics Tracking
  const trackVisitor = useCallback((properties?: Record<string, any>) => {
    trackNewVisitor(properties);
  }, []);

  const trackActive = useCallback((action: string, properties?: Record<string, any>) => {
    trackNewActive(action, properties);
  }, []);

  const trackManualRanking = useCallback((properties?: Record<string, any>) => {
    trackNewManualRanking(properties);
  }, []);

  const trackPartialRanking = useCallback((properties?: Record<string, any>) => {
    trackNewPartialRanking(properties);
  }, []);

  const trackFullRanking = useCallback((properties?: Record<string, any>) => {
    trackNewFullRankingSubmittal(properties);
  }, []);

  const trackReport = useCallback((properties?: Record<string, any>) => {
    trackNewReportSent(properties);
  }, []);

  // Tool click tracking (monetization)
  const trackTryFree = useCallback((properties: {
    tool_id: string;
    tool_name: string;
    position?: number;
    match_score?: number;
    criteria_rankings?: Record<string, number>;
    firmographics?: Record<string, any>;
  }) => {
    trackToolTryFreeClick(properties);
  }, []);

  const trackAddToCompare = useCallback((properties: {
    tool_id: string;
    tool_name: string;
    position?: number;
    match_score?: number;
    comparing_with?: string[];
  }) => {
    trackToolAddToCompareClick(properties);
  }, []);

  const trackViewDetails = useCallback((properties: {
    tool_id: string;
    tool_name: string;
    position?: number;
    match_score?: number;
    expanded?: boolean;
  }) => {
    trackToolViewDetailsClick(properties);
  }, []);

  // Automatic tracking utilities
  const checkAndTrackVisitor = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewVisitor(properties);
  }, []);

  const checkAndTrackActive = useCallback((action: string, properties?: Record<string, any>) => {
    return checkAndTrackNewActive(action, properties);
  }, []);

  const checkAndTrackManualRanking = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewManualRanking(properties);
  }, []);

  const checkAndTrackPartialRanking = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewPartialRanking(properties);
  }, []);

  const checkAndTrackFullRanking = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewFullRankingSubmittal(properties);
  }, []);

  const checkAndTrackReport = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewReportSent(properties);
  }, []);

  const getSession = useCallback(() => {
    return getSessionId();
  }, []);

  const resetState = useCallback(() => {
    resetTrackingState();
  }, []);

  return {
    posthog,
    capture,
    trackClick,
    trackForm,
    trackTool,
    identify,
    setUserProperties,
    getUserId,
    isIdentified,
    // Core metrics
    trackVisitor,
    trackActive,
    trackManualRanking,
    trackPartialRanking,
    trackFullRanking,
    trackReport,
    // Tool click tracking (monetization)
    trackTryFree,
    trackAddToCompare,
    trackViewDetails,
    // Session-aware tracking utilities (one-time events)
    checkAndTrackVisitor,
    checkAndTrackActive,
    checkAndTrackManualRanking,
    checkAndTrackPartialRanking,
    checkAndTrackFullRanking,
    checkAndTrackReport,
    // Utilities
    getSession,
    resetState,
  };
};
