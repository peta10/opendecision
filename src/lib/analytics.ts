/**
 * PANORAMIC SOLUTIONS: Analytics Service
 * JSON-First, LLM-Optimized Tracking
 * 
 * All tracking is fire-and-forget with built-in error handling.
 * Tracking failures NEVER break the UI.
 */

import { supabase } from './supabase';

// Session ID management
let cachedSessionId: string | null = null;

// ============================================================================
// DEDUPLICATION HELPERS
// ============================================================================

// Action deduplication cache (prevents duplicate actions within time window)
const recentActions = new Map<string, number>();
const ACTION_DEBOUNCE_MS = 1000; // 1 second

/**
 * Check if action was recently tracked (within debounce window)
 */
function wasActionRecentlyTracked(key: string): boolean {
  const lastTracked = recentActions.get(key);
  if (!lastTracked) return false;
  
  const now = Date.now();
  return (now - lastTracked) < ACTION_DEBOUNCE_MS;
}

/**
 * Mark action as tracked
 */
function markActionTracked(key: string): void {
  recentActions.set(key, Date.now());
  
  // Clean up old entries (older than 5 seconds to prevent memory leaks)
  const now = Date.now();
  for (const [k, timestamp] of recentActions.entries()) {
    if (now - timestamp > 5000) {
      recentActions.delete(k);
    }
  }
}

/**
 * Get or create analytics session ID
 * Stored in localStorage for persistence across page reloads
 */
export function getAnalyticsSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  
  if (typeof window === 'undefined') {
    return 'ssr-session'; // Server-side rendering fallback
  }
  
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  
  cachedSessionId = sessionId;
  return sessionId;
}

/**
 * Generate idempotency token to prevent duplicate tracking events
 * Used for network retry protection
 */
function generateIdempotencyToken(): string {
  return crypto.randomUUID();
}

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | null> {
  try {
    // In production, you might have a server endpoint that returns the IP
    // For now, we'll let Supabase handle this server-side if needed
    return null;
  } catch {
    return null;
  }
}

/**
 * Analytics Service
 * All methods are async but fire-and-forget (don't await in UI code)
 */
export const analytics = {
  /**
   * Initialize or update user session
   * Call on initial app load and route changes
   * Creates/updates analytics.users record in new relational schema
   */
  async initializeUser(options?: {
    path?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      const ip = await getClientIP();
      
      const { data: userId, error } = await supabase
        .schema('analytics')
        .rpc('ensure_analytics_user', {
          p_session_id: sessionId,
          p_ip_address: ip,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          p_referrer_url: options?.referrer || (typeof document !== 'undefined' ? document.referrer : null) || null,
          p_utm_source: options?.utmSource || null,
          p_utm_medium: options?.utmMedium || null,
        p_utm_campaign: options?.utmCampaign || null,
        p_email: options?.email || null,
        p_first_name: options?.firstName || null,
        p_last_name: options?.lastName || null,
      });
      
      if (error) throw error;
      return userId;
    } catch (error) {
      console.warn('Analytics tracking failed (initializeUser):', error);
      // Never throw - tracking failures don't break the app
      return null;
    }
  },

  /**
   * Track page view (legacy compatibility)
   * Calls initializeUser for backward compatibility
   */
  async trackPageView(options?: {
    path?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    await this.initializeUser(options);
  },

  /**
   * Track criteria ranking change (slider movement)
   * Call whenever user adjusts a criteria slider
   * Stores in user_criteria_responses junction table in analytics schema
   */
  async trackCriteriaRanking(options: {
    criteriaId: string;
    criteriaName: string;
    score: number;
    isManual?: boolean;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      // Call analytics schema function (returns uuid)
      const { data: responseId, error } = await supabase
        .schema('analytics')
        .rpc('track_criteria_response', {
          p_session_id: sessionId,
          p_criteria_name: options.criteriaName,
          p_rating: Math.round(options.score), // Ensure integer rating
          p_is_manual: options.isManual ?? true,
        });
      
      if (error) throw error;
      return responseId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackCriteriaRanking):', error);
      return null;
    }
  },

  /**
   * Track guided ranking answer
   * Call for each question answered in the guided ranking flow
   * Stores in user_question_responses junction table in analytics schema
   */
  async trackGuidedRankingAnswer(options: {
    questionId: string;
    questionOrder: number;
    answer: any; // Can be number, string, array, object
    questionText?: string;
    affectsCriteria?: string;
    isComplete?: boolean;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      let lastResponseId: string | null = null;
      
      // For multiple choice questions, we may need to track multiple responses
      if (Array.isArray(options.answer)) {
        // Track each selected option separately
        for (const value of options.answer) {
          const { data: responseId, error } = await supabase
            .schema('analytics')
            .rpc('track_question_response', {
              p_session_id: sessionId,
              p_question_order: options.questionOrder,
              p_choice_value: String(value),
              p_response_text: null,
            });
          if (error) throw error;
          lastResponseId = responseId;
        }
      } else {
        // Single choice or text response - call analytics schema function
        const { data: responseId, error } = await supabase
          .schema('analytics')
          .rpc('track_question_response', {
            p_session_id: sessionId,
            p_question_order: options.questionOrder,
            p_choice_value: typeof options.answer === 'string' ? options.answer : String(options.answer),
            p_response_text: typeof options.answer === 'string' ? options.answer : null,
          });
        if (error) throw error;
        lastResponseId = responseId;
      }
      
      return lastResponseId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackGuidedRankingAnswer):', error);
      return null;
    }
  },

  /**
   * Track tool interaction (MONETIZATION KEY)
   * Call when user interacts with tools: Try Free, Add to Compare, View Details, Click
   * Stores in user_tool_actions junction table in analytics schema
   * Includes debouncing to prevent duplicate tracking
   */
  async trackToolClick(options: {
    toolId: string;
    toolName: string;
    actionType: 'try_free' | 'add_to_compare' | 'view_details' | 'click';
    position?: number;
    matchScore?: number;
    context?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      // ✅ DEBOUNCING: Generate unique key for this action
      const actionKey = `${sessionId}:${options.toolId}:${options.actionType}`;
      
      // ✅ Check if recently tracked (within 1 second)
      if (wasActionRecentlyTracked(actionKey)) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[Analytics] Action ${options.actionType} on ${options.toolName} was recently tracked, skipping`);
        }
        return null;
      }
      
      // Map action types to our schema
      const actionTypeMap: Record<string, string> = {
        'add_to_compare': 'add_to_compare',
        'try_free': 'try_free',
        'view_details': 'view_details',
        'click': 'click',
        'compare': 'compare'
      };
      
      // Call analytics schema function (returns uuid)
      // Backend automatically looks up UUID from public.tools by name
      const { data: actionId, error} = await supabase
        .schema('analytics')
        .rpc('track_tool_action', {
          p_session_id: sessionId,
          p_tool_name: options.toolName,
          p_action_type: actionTypeMap[options.actionType] || 'click',
          p_position: options.position || null,
          p_match_score: options.matchScore || null,
          p_context: {
            source_component: options.context?.source_component || 'unknown',
            ...options.context
          },
        });
      
      if (error) throw error;
      
      // ✅ Mark as tracked AFTER successful write
      if (actionId) {
        markActionTracked(actionKey);
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[Analytics] ✅ Tracked ${options.actionType} for ${options.toolName}`);
        }
      }
      
      return actionId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackToolClick):', error);
      return null;
    }
  },

  /**
   * Track filter builder actions (add/remove/update/toggle)
   */
  async trackFilterAction(options: {
    actionType: 'add' | 'update' | 'remove' | 'toggle_mode' | 'clear_all' | 'guided_sync';
    filterType?: string;
    filterValue?: string;
    operator?: string;
    rating?: number;
    filterMode?: string;
    context?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null;

      const sessionId = getAnalyticsSessionId();
      const { data: actionId, error } = await supabase
        .schema('analytics')
        .rpc('track_filter_action', {
          p_session_id: sessionId,
          p_action_type: options.actionType,
          p_filter_type: options.filterType || null,
          p_filter_value: options.filterValue || null,
          p_operator: options.operator || null,
          p_rating: options.rating ?? null,
          p_filter_mode: options.filterMode || null,
          p_context: {
            source_component: options.context?.source_component || 'unknown',
            ...options.context,
          },
        });

      if (error) throw error;
      return actionId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackFilterAction):', error);
      return null;
    }
  },

  /**
   * Track guided ranking funnel events
   */
  async trackGuidedFlowEvent(options: {
    eventType: 'flow_started' | 'question_answered' | 'mode_toggled' | 'flow_completed' | 'flow_abandoned' | 'manual_rank_update' | 'step_viewed';
    questionId?: string;
    questionOrder?: number;
    mode?: string;
    value?: string;
    numericValue?: number;
    timeSpentMs?: number;
    context?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null;

      const sessionId = getAnalyticsSessionId();
      const { data: eventId, error } = await supabase
        .schema('analytics')
        .rpc('track_guided_flow_event', {
          p_session_id: sessionId,
          p_event_type: options.eventType,
          p_question_id: options.questionId || null,
          p_question_order: options.questionOrder ?? null,
          p_mode: options.mode || null,
          p_value: options.value || null,
          p_numeric_value: options.numericValue ?? null,
          p_time_spent_ms: options.timeSpentMs ?? null,
          p_context: {
            source_component: options.context?.source_component || 'unknown',
            ...options.context,
          },
        });

      if (error) throw error;
      return eventId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackGuidedFlowEvent):', error);
      return null;
    }
  },

  /**
   * Track interactions within the comparison chart
   */
  async trackChartInteraction(options: {
    interactionType: 'toggle_tool' | 'toggle_criterion' | 'show_all_tools' | 'hide_all_tools' | 'show_all_criteria' | 'hide_all_criteria';
    toolId?: string;
    criterionId?: string;
    action?: string;
    criteriaAdjusted?: boolean;
    visibleToolCount?: number;
    visibleCriterionCount?: number;
    context?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null;

      const sessionId = getAnalyticsSessionId();
      const { data: interactionId, error } = await supabase
        .schema('analytics')
        .rpc('track_chart_interaction', {
          p_session_id: sessionId,
          p_interaction_type: options.interactionType,
          p_tool_id: options.toolId || null,
          p_criterion_id: options.criterionId || null,
          p_action: options.action || null,
          p_criteria_adjusted: options.criteriaAdjusted ?? null,
          p_visible_tool_count: options.visibleToolCount ?? null,
          p_visible_criterion_count: options.visibleCriterionCount ?? null,
          p_context: {
            source_component: options.context?.source_component || 'unknown',
            ...options.context,
          },
        });

      if (error) throw error;
      return interactionId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackChartInteraction):', error);
      return null;
    }
  },

  /**
   * Track overlay / bumper lifecycle events
   */
  async trackOverlayEvent(options: {
    overlay: 'product_bumper' | 'exit_intent' | 'guided_ranking' | 'manual_guidance' | 'comparison_report';
    eventType: 'shown' | 'cta_clicked' | 'dismissed' | 'timeout';
    trigger?: string;
    cta?: string;
    context?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null;

      const sessionId = getAnalyticsSessionId();
      const { data: eventId, error } = await supabase
        .schema('analytics')
        .rpc('track_overlay_event', {
          p_session_id: sessionId,
          p_overlay: options.overlay,
          p_event_type: options.eventType,
          p_trigger: options.trigger || null,
          p_cta: options.cta || null,
          p_context: {
            source_component: options.context?.source_component || 'unknown',
            ...options.context,
          },
        });

      if (error) throw error;
      return eventId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackOverlayEvent):', error);
      return null;
    }
  },


  /**
   * Track report sent (CONVERSION EVENT)
   * Call when user successfully sends email report
   * Stores in analytics.recommendations table
   */
  async trackReportSent(options: {
    email: string;
    firstName?: string;
    lastName?: string;
    tools: Array<{ id: string; name: string; score: number }>;
    criteria: Record<string, number>;
    matchScores?: Array<{ toolId: string; toolName: string; score: number; rank: number }>;
    firmographics?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      const { data: recommendationId, error } = await supabase
        .schema('analytics')
        .rpc('track_recommendation_sent', {
          p_session_id: sessionId,
          p_email: options.email,
          p_first_name: options.firstName || null,
          p_last_name: options.lastName || null,
          p_recommended_tools: options.tools,
          p_match_scores: options.matchScores || [],
          p_criteria_weights: options.criteria || {},
      });
      
      if (error) throw error;
      return recommendationId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackReportSent):', error);
      return null;
    }
  },

  /**
   * Get complete user analytics data (for debugging/export)
   * Returns entire user analytics as LLM-parsable JSON from relational schema
   */
  async getSessionData(sessionId?: string): Promise<any> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sid = sessionId || getAnalyticsSessionId();
      const { data, error } = await supabase
        .schema('analytics')
        .rpc('get_user_analytics', {
          p_session_id: sid,
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to fetch user analytics data:', error);
      return null;
    }
  },

  /**
   * Get user's question responses
   * Helper function for guided ranking form
   */
  async getUserQuestionResponses(sessionId?: string): Promise<any[]> {
    try {
      const data = await this.getSessionData(sessionId);
      return data?.question_responses || [];
    } catch (error) {
      console.warn('Failed to fetch question responses:', error);
      return [];
    }
  },

  /**
   * Get user's criteria responses  
   * Helper function for criteria sliders
   */
  async getUserCriteriaResponses(sessionId?: string): Promise<any[]> {
    try {
      const data = await this.getSessionData(sessionId);
      return data?.criteria_responses || [];
    } catch (error) {
      console.warn('Failed to fetch criteria responses:', error);
      return [];
    }
  },

  /**
   * Get user's tool actions
   * Helper function for analytics dashboards
   */
  async getUserToolActions(sessionId?: string): Promise<any[]> {
    try {
      const data = await this.getSessionData(sessionId);
      return data?.tool_actions || [];
    } catch (error) {
      console.warn('Failed to fetch tool actions:', error);
      return [];
    }
  },

  /**
   * Track department and firmographic data
   * Call when user provides company information
   */
  async trackDepartment(options: {
    department: string;
    companySize?: string;
    industry?: string;
  }): Promise<string | null> {
    try {
      if (!supabase) return null;
      const sessionId = getAnalyticsSessionId();
      
      const { data: userId, error } = await supabase.rpc('update_user_department', {
        p_session_id: sessionId,
        p_department: options.department,
        p_company_size: options.companySize || null,
        p_industry: options.industry || null,
      });
      
      if (error) throw error;
      return userId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackDepartment):', error);
      return null;
    }
  },

  /**
   * Get comprehensive session status
   * Returns all tracking flags and counts for a user session
   */
  async getSessionStatus(sessionId?: string): Promise<any> {
    try {
      if (!supabase) return null;
      
      const sid = sessionId || getAnalyticsSessionId();
      const { data, error } = await supabase.rpc('get_session_status', {
        p_session_id: sid,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to fetch session status:', error);
      return null;
    }
  },

  /**
   * Track email report send (CONVERSION EVENT)
   * Uses new dedicated function for email report tracking
   */
  async trackEmailReportSend(options: {
    email: string;
    firstName?: string;
    lastName?: string;
    reportType?: string;
    numRecommendations?: number;
    context?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null;
      
      const sessionId = getAnalyticsSessionId();
      
      // Merge firstName/lastName into context for database function
      const contextWithNames = {
        ...(options.context || {}),
        firstName: options.firstName || null,
        lastName: options.lastName || null,
        first_name: options.firstName || null, // Also include snake_case for compatibility
        last_name: options.lastName || null
      };
      
      const { data: reportId, error } = await supabase
        .schema('analytics')
        .rpc('track_email_report_send', {
          p_session_id: sessionId,
          p_email: options.email,
          p_report_type: options.reportType || 'full_report',
          p_num_recommendations: options.numRecommendations || null,
          p_context: contextWithNames,
        });
      
      if (error) throw error;
      return reportId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackEmailReportSend):', error);
      return null;
    }
  },
};

/**
 * Initialize analytics on app load
 * Call this once in your root component
 */
export async function initializeAnalytics() {
  // Ensure session ID is created
  const sessionId = getAnalyticsSessionId();
  
  // Initialize user record in new relational schema
  await analytics.initializeUser();
  
  // Log to console (remove in production)
  console.log('📊 Analytics initialized:', {
    sessionId,
    timestamp: new Date().toISOString(),
    schema: 'relational'
  });
}

