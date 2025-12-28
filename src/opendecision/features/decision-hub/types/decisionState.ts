/**
 * Decision State Machine Types
 *
 * Defines the state machine that controls the decision lifecycle:
 * Framing -> Evaluating -> Decided
 */

import { AIChatContext } from '@/opendecision/shared/types';

// =============================================================================
// CORE STATE TYPES
// =============================================================================

/**
 * The three states of a decision lifecycle
 */
export type DecisionState = 'framing' | 'evaluating' | 'decided';

/**
 * How Scout AI should behave in each state
 */
export type ScoutBehavior = 'exploratory' | 'analytical' | 'confirmatory';

/**
 * Configuration for each decision state
 */
export interface DecisionStateConfig {
  state: DecisionState;
  label: string;
  description: string;
  allowedTransitions: DecisionState[];
  scoutBehavior: ScoutBehavior;
  /** Minimum requirements to enter this state */
  entryRequirements?: {
    minCriteriaRated?: number;
    minCandidates?: number;
  };
}

/**
 * All decision states with their configurations
 */
export const DECISION_STATES: Record<DecisionState, DecisionStateConfig> = {
  framing: {
    state: 'framing',
    label: 'Frame',
    description: 'Define what matters most',
    allowedTransitions: ['evaluating'],
    scoutBehavior: 'exploratory',
    entryRequirements: undefined, // Always allowed
  },
  evaluating: {
    state: 'evaluating',
    label: 'Compare',
    description: 'Evaluate candidates against criteria',
    allowedTransitions: ['framing', 'decided'],
    scoutBehavior: 'analytical',
    entryRequirements: {
      minCriteriaRated: 1,
    },
  },
  decided: {
    state: 'decided',
    label: 'Decide',
    description: 'Finalize your choice',
    allowedTransitions: ['evaluating'],
    scoutBehavior: 'confirmatory',
    entryRequirements: {
      minCandidates: 2,
    },
  },
};

// =============================================================================
// TRANSITION TYPES
// =============================================================================

/**
 * What triggered a state transition
 */
export type TransitionTrigger =
  | 'user_action'        // User clicked a button
  | 'auto'               // System auto-transitioned (e.g., added 2nd product)
  | 'scout_suggestion'   // Scout AI suggested the transition
  | 'criteria_complete'; // All criteria have been rated

/**
 * A state transition event
 */
export interface StateTransition {
  from: DecisionState | null;
  to: DecisionState;
  trigger: TransitionTrigger;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of attempting a state transition
 */
export interface TransitionResult {
  success: boolean;
  newState?: DecisionState;
  error?: string;
  /** What requirements were not met */
  missingRequirements?: {
    criteriaRated?: number;
    candidatesNeeded?: number;
  };
}

// =============================================================================
// SCORE & ANALYSIS TYPES
// =============================================================================

/**
 * Breakdown of how a weighted score was calculated
 */
export interface ScoreBreakdown {
  criterionId: string;
  criterionName: string;
  /** Tool's raw rating for this criterion (1-5) */
  rawScore: number;
  /** User's importance weight for this criterion (1-5) */
  weight: number;
  /** rawScore * (weight / totalWeight) */
  weightedScore: number;
  /** Percentage this criterion contributes to total */
  contribution: number;
}

/**
 * Complete weighted score result with explainability
 */
export interface WeightedScoreResult {
  /** Final match score (0-100) */
  total: number;
  /** Per-criterion breakdown for explainability */
  breakdown: ScoreBreakdown[];
  /** Tool ID this score belongs to */
  toolId: string;
  /** Tool name for display */
  toolName: string;
}

/**
 * A detected tradeoff between candidates
 */
export interface Tradeoff {
  /** Criterion where the tradeoff occurs */
  criterion: string;
  criterionId: string;
  /** Candidate that wins on this criterion */
  winner: string;
  winnerId: string;
  /** Candidate that loses on this criterion */
  loser: string;
  loserId: string;
  /** Score difference (1-5 scale) */
  gap: number;
  /** How important this tradeoff is */
  significance: 'minor' | 'notable' | 'major';
}

// =============================================================================
// CONTEXT TYPES FOR SCOUT
// =============================================================================

/**
 * Extended context for Scout AI that includes decision state
 * Extends AIChatContext with decision-specific fields
 */
export interface DecisionAwareContext extends AIChatContext {
  /** Current decision state */
  decision_state: DecisionState;
  /** Number of candidates added */
  candidates_count: number;
  /** Name of the top-scoring candidate */
  top_candidate: string | null;
  /** Score difference between #1 and #2 */
  score_gap: number;
  /** Criteria where rankings flip between top candidates */
  close_tradeoffs: string[];
  /** Number of criteria that have been rated (not default) */
  criteria_rated_count: number;
  /** Total number of criteria */
  total_criteria: number;
}

/**
 * Scout behavior configuration per state
 */
export interface ScoutBehaviorConfig {
  state: DecisionState;
  behavior: ScoutBehavior;
  personality: string;
  suggestedPrompts: string[];
  allowedActions: ('suggest_criteria' | 'explain_tradeoffs' | 'validate_decision' | 'add_candidate')[];
}

/**
 * Scout behavior configurations for each state
 */
export const SCOUT_BEHAVIORS: Record<DecisionState, ScoutBehaviorConfig> = {
  framing: {
    state: 'framing',
    behavior: 'exploratory',
    personality: 'Curious and helpful, asking questions to understand needs',
    suggestedPrompts: [
      "What's most important for your team?",
      "Tell me about your workflow",
      "How many people will use this tool?",
      "What tools do you currently use?",
    ],
    allowedActions: ['suggest_criteria'],
  },
  evaluating: {
    state: 'evaluating',
    behavior: 'analytical',
    personality: 'Analytical and balanced, explaining tradeoffs objectively',
    suggestedPrompts: [
      "Compare these two tools",
      "Why does this score higher?",
      "What are the key differences?",
      "Explain this tradeoff",
    ],
    allowedActions: ['explain_tradeoffs', 'add_candidate'],
  },
  decided: {
    state: 'decided',
    behavior: 'confirmatory',
    personality: 'Supportive and validating, while surfacing any concerns',
    suggestedPrompts: [
      "Is this the right choice?",
      "What should I watch out for?",
      "How do I get started?",
      "What about implementation?",
    ],
    allowedActions: ['validate_decision'],
  },
};

// =============================================================================
// STEPPER TYPES
// =============================================================================

/**
 * Step in the decision stepper UI
 */
export interface DecisionStep {
  state: DecisionState;
  label: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}

/**
 * Get stepper steps based on current state and data
 */
export function getDecisionSteps(
  currentState: DecisionState,
  criteriaRatedCount: number,
  candidatesCount: number
): DecisionStep[] {
  const states: DecisionState[] = ['framing', 'evaluating', 'decided'];
  const currentIndex = states.indexOf(currentState);

  return states.map((state, index) => {
    const config = DECISION_STATES[state];
    const requirements = config.entryRequirements;

    // Determine if this step is accessible
    let isAccessible = true;
    if (requirements) {
      if (requirements.minCriteriaRated && criteriaRatedCount < requirements.minCriteriaRated) {
        isAccessible = false;
      }
      if (requirements.minCandidates && candidatesCount < requirements.minCandidates) {
        isAccessible = false;
      }
    }

    // Steps before current are complete, current is accessible
    const isComplete = index < currentIndex;
    const isCurrent = state === currentState;

    return {
      state,
      label: config.label,
      description: config.description,
      isComplete,
      isCurrent,
      isAccessible: isAccessible || isCurrent || isComplete,
    };
  });
}
