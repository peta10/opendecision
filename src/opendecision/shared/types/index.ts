// =============================================================================
// FILTER TYPES
// =============================================================================

export type FilterType = 'Methodology' | 'Criteria';

export interface FilterCondition {
  id: string;
  type: FilterType;
  value: string;
  operator?: '>' | '>=' | '=' | '<=' | '<';
  rating?: number;
}

// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

export interface Criterion {
  id: string;
  name: string;
  description: string;
  tooltipDescription?: string;
  userRating: number;
  ratingDescriptions: {
    low: string;
    high: string;
  };
}

export interface CriteriaRating {
  id: string;
  name: string;
  ranking: number;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  type: string;
}

export interface Tool {
  id: string;
  name: string;
  logo: string;
  useCases: string[];
  methodologies: string[];
  functions: string[];
  ratings: Record<string, number>;
  ratingExplanations: Record<string, string>;
  type: string;
  created_by: string | null;
  criteria: CriteriaRating[];
  tags: Tag[];
  created_on: string;
  updated_at?: string;
  submitted_at?: string;
  approved_at?: string;
  submission_status: string;
  removed?: boolean;
  // Analytics fields (from tools_complete view)
  unique_try_free_clicks?: number;
  unique_compare_clicks?: number;
  unique_view_details_clicks?: number;
  unique_impressions?: number;
  total_actions?: number;
  last_action_at?: string;
  // Intel summary fields
  intel_chunk_count?: number;
  avg_intel_quality?: number;
  total_intel_retrievals?: number;
}

export interface ComparisonState {
  selectedCriteria: Criterion[];
  selectedTools: Tool[];
}

// Analytics Schema Types - New Relational Structure
export interface AnalyticsUser {
  id: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  fingerprint_hash?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  first_seen_at: string;
  last_seen_at: string;
  total_page_views: number;
  total_time_on_tool: number;
  is_active: boolean;
  has_manual_ranking: boolean;
  has_partial_ranking: boolean;
  has_full_ranking: boolean;
  has_sent_report: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionResponse {
  id: string;
  user_id: string;
  question_id: string;
  question_choice_id?: string;
  response_text?: string;
  response_timestamp: string;
  created_at: string;
}

export interface CriteriaResponse {
  id: string;
  user_id: string;
  criteria_id: string;
  rating: number;
  response_timestamp: string;
  created_at: string;
}

export type ToolActionType = 'click' | 'view_details' | 'compare' | 'try_free';

export interface ToolAction {
  id: string;
  user_id: string;
  tool_id: string;
  action_type: ToolActionType;
  position?: number;
  match_score?: number;
  context?: Record<string, any>;
  created_at: string;
}

export interface RecommendationRecord {
  id: string;
  user_id: string;
  recommended_tools: any[];
  match_scores: Record<string, any>;
  criteria_weights: Record<string, any>;
  sent_at?: string;
  email_sent_to?: string;
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_order: number;
  question_type: 'multiple_choice' | 'scale' | 'text';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionChoice {
  id: string;
  question_id: string;
  choice_text: string;
  choice_value: string;
  choice_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAnalytics {
  user: AnalyticsUser;
  question_responses: QuestionResponse[];
  criteria_responses: CriteriaResponse[];
  tool_actions: ToolAction[];
  recommendations: RecommendationRecord[];
}

// Analytics Rollup Views Types
export interface ToolActionRollup {
  tool_id: string;
  tool_name: string;
  unique_clicks: number;
  total_clicks: number;
  unique_detail_views: number;
  total_detail_views: number;
  unique_comparisons: number;
  total_comparisons: number;
  unique_try_free: number;
  total_try_free: number;
  avg_match_score?: number;
  avg_position?: number;
}

export interface QuestionResponseRollup {
  question_id: string;
  question_text: string;
  question_order: number;
  total_responses: number;
  response_count: number;
}

export interface UserActivityRollup {
  user_id: string;
  session_id: string;
  email?: string;
  first_seen_at: string;
  last_seen_at: string;
  total_page_views: number;
  total_time_on_tool: number;
  questions_answered: number;
  criteria_rated: number;
  tools_interacted_with: number;
  total_tool_actions: number;
  action_types_taken: ToolActionType[];
  has_recommendations: boolean;
}

// =============================================================================
// AI CHAT TYPES
// =============================================================================

/**
 * Context object sent to the ai-chat Edge Function.
 * Contains user's current state for RAG-enhanced responses.
 */
export interface AIChatContext {
  /** Tool names currently being evaluated */
  selected_tools: string[];
  /** Criteria names the user has selected/rated */
  selected_criteria: string[];
  /** Criterion name → userRating (1-5) mapping */
  criteria_weights: Record<string, number>;
  /** Tool name → weighted match score (0-100) */
  match_scores: Record<string, number>;
  /** User's methodology preference (Agile, Waterfall, etc.) */
  methodology?: string;
  /** User's department (Engineering, Marketing, etc.) */
  department?: string;
  /** Company size (Small, Medium, Enterprise) */
  company_size?: string;
  /** Number of users/team members */
  user_count?: number;
}

/**
 * Source reference for a RAG-retrieved chunk
 */
export interface AIChatSource {
  /** Tool name the chunk came from */
  tool: string;
  /** Section title within the document */
  section: string | null;
  /** Relevance score from hybrid search */
  score: number;
}

/**
 * Token usage and performance metrics
 */
export interface AIChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
}

/**
 * A single message in the chat conversation
 */
export interface AIChatMessage {
  /** Unique message ID */
  id: string;
  /** Who sent the message */
  role: 'user' | 'assistant';
  /** Message content (markdown supported) */
  content: string;
  /** ISO timestamp */
  timestamp: string;
  /** RAG sources used for this response (assistant only) */
  sources?: AIChatSource[];
  /** Follow-up prompt suggestions (assistant only) */
  suggested_prompts?: string[];
  /** Tool names mentioned in the response (assistant only) */
  tools_mentioned?: string[];
  /** Token usage stats (assistant only) */
  usage?: AIChatUsage;
  /** Loading state for optimistic updates */
  isLoading?: boolean;
  /** Error message if request failed */
  error?: string;
}

/**
 * Response from the ai-chat Edge Function
 */
export interface AIChatResponse {
  /** AI-generated response content */
  message: string;
  /** Tools referenced in the response */
  tools_mentioned: string[];
  /** Suggested follow-up questions */
  suggested_prompts: string[];
  /** RAG sources used */
  sources: AIChatSource[];
  /** Performance metrics */
  usage: AIChatUsage;
  /**
   * Optional criteria weight updates when AI detects user intent to adjust priorities.
   * E.g., if user says "security is more important", AI returns { "security": 5 }
   * Format: { criterionId: newRating (1-5) }
   */
  criteria_updates?: Record<string, number>;
}

/**
 * Request payload to the ai-chat Edge Function
 */
export interface AIChatRequest {
  /** Session identifier for conversation continuity */
  session_id: string;
  /** User's message text */
  message: string;
  /** Current user context for RAG enhancement */
  context?: AIChatContext;
  /** Decision Space ID for scoping chat to a space (Phase 2) */
  decision_space_id?: string;
}

/**
 * Chat session state
 */
export interface AIChatSession {
  /** Unique session identifier */
  sessionId: string;
  /** All messages in the conversation */
  messages: AIChatMessage[];
  /** Current context being used */
  context: AIChatContext;
  /** When the session was created */
  createdAt: string;
  /** When the last message was sent */
  lastMessageAt: string;
}

/**
 * Guided ranking answer from form questions
 */
export interface GuidedRankingAnswer {
  /** Answer value (number for scale, array for multi-select, string for text) */
  value: number | number[] | string;
  /** When the answer was recorded */
  timestamp: string;
}

/**
 * Personalization data collected from guided ranking
 */
export interface PersonalizationData {
  /** Organization size (1-5 scale mapped from ranges) */
  userCount?: number;
  /** Selected departments */
  departments?: string[];
  /** Selected methodologies (Agile, Waterfall, CI) */
  methodologies?: string[];
  /** When this data was recorded */
  timestamp: string;
}

/**
 * Input for building AI context from frontend state
 */
export interface AIContextBuilderInput {
  /** Currently visible/evaluated tools */
  selectedTools: Tool[];
  /** Currently selected criteria with user ratings */
  selectedCriteria: Criterion[];
  /** Personalization data from guided ranking */
  personalizationData?: PersonalizationData;
  /** Raw guided ranking answers */
  guidedRankingAnswers?: Record<string, GuidedRankingAnswer>;
}

// =============================================================================
// DECISION SPACE TYPES (Phase 2)
// =============================================================================

/**
 * Decision Space lifecycle status
 * - draft: Initial setup, configuring criteria
 * - evaluating: Actively comparing tools
 * - decided: Final decision made
 * - archived: No longer active
 */
export type DecisionSpaceStatus = 'draft' | 'evaluating' | 'decided' | 'archived';

/**
 * Decision Profile stored as JSONB in decision_spaces table.
 * Contains all the context gathered during setup.
 */
export interface DecisionProfile {
  /** Top-level category (e.g., "Software") */
  category: string;
  /** Subcategory (e.g., "PPM Tools") */
  subcategory: string;
  /** Criteria with user ratings - stored as array of {id, rating} */
  criteria: Array<{
    id: string;
    name: string;
    rating: number;
  }>;
  /** Additional context from guided ranking */
  context: {
    methodology?: string;
    department?: string;
    companySize?: string;
    userCount?: number;
    projectVolume?: number;
    tasksPerProject?: number;
    expertiseLevel?: number;
  };
  /** Raw guided ranking answers for future reference */
  guidedRankingAnswers?: Record<string, GuidedRankingAnswer>;
}

/**
 * Decision state machine states
 * - framing: Setting up criteria and weights
 * - evaluating: Comparing candidates
 * - decided: Final decision made
 */
export type DecisionState = 'framing' | 'evaluating' | 'decided';

/**
 * Decision Space - the core entity for Phase 2.
 * Each space represents one decision being made.
 */
export interface DecisionSpace {
  /** UUID primary key */
  id: string;
  /** User-provided name for the decision */
  name: string;
  /** Lifecycle status */
  status: DecisionSpaceStatus;
  /** Decision state machine state */
  decision_state: DecisionState;
  /** Owner's auth.users ID (works for anonymous + permanent) */
  owner_id: string;
  /** Decision profile containing criteria, context, etc. */
  decision_profile: DecisionProfile;
  /** Array of tool UUIDs added to this space */
  selected_tools: string[];
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Input for creating a new Decision Space
 */
export interface CreateDecisionSpaceInput {
  name?: string;
  decision_profile?: Partial<DecisionProfile>;
  selected_tools?: string[];
}

/**
 * Input for updating an existing Decision Space
 */
export interface UpdateDecisionSpaceInput {
  name?: string;
  status?: DecisionSpaceStatus;
  decision_state?: DecisionState;
  decision_profile?: Partial<DecisionProfile>;
  selected_tools?: string[];
}

/**
 * User auth state for anonymous-first flow
 */
export interface UserAuthState {
  /** auth.users ID */
  userId: string;
  /** Whether this is an anonymous user */
  isAnonymous: boolean;
  /** User's email (null for anonymous) */
  email: string | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Loading state during auth check */
  isLoading: boolean;
}

// =============================================================================
// DECISION SPACE PRODUCTS TYPES (Junction Table)
// =============================================================================

/**
 * How a product was added to a decision space
 */
export type ProductSource = 'recommended' | 'added' | 'imported';

/**
 * Summary of tool data from the junction table join
 */
export interface ToolSummary {
  id: string;
  name: string;
  type: string;
  created_on: string;
  submission_status: string;
}

/**
 * A product entry in a decision space (from junction table)
 */
export interface DecisionSpaceProduct {
  id: string;
  decision_space_id: string;
  product_id: string;
  source: ProductSource;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  tool?: ToolSummary;
}