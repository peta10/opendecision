'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DecisionState,
  DECISION_STATES,
  TransitionTrigger,
  TransitionResult,
  StateTransition,
  getDecisionSteps,
  DecisionStep,
} from '../types/decisionState';

// =============================================================================
// TYPES
// =============================================================================

interface DecisionContext {
  /** Number of criteria that have non-default ratings */
  criteriaRatedCount: number;
  /** Number of candidates added to comparison */
  candidatesCount: number;
}

interface UseDecisionStateMachineOptions {
  /** Initial state (defaults to 'framing') */
  initialState?: DecisionState;
  /** Callback when state changes */
  onStateChange?: (transition: StateTransition) => void;
  /** Current context for validation */
  context: DecisionContext;
}

interface UseDecisionStateMachineReturn {
  /** Current decision state */
  currentState: DecisionState;
  /** Current state config */
  stateConfig: typeof DECISION_STATES[DecisionState];
  /** Attempt to transition to a new state */
  transitionTo: (targetState: DecisionState, trigger?: TransitionTrigger) => TransitionResult;
  /** Check if a transition is valid without executing it */
  canTransitionTo: (targetState: DecisionState) => TransitionResult;
  /** Go to the next logical state */
  goToNext: (trigger?: TransitionTrigger) => TransitionResult;
  /** Go back to the previous state */
  goToPrevious: (trigger?: TransitionTrigger) => TransitionResult;
  /** Steps for the decision stepper UI */
  steps: DecisionStep[];
  /** Transition history for debugging/analytics */
  transitionHistory: StateTransition[];
  /** Force set state (for hydration from DB) */
  forceSetState: (state: DecisionState) => void;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if the context meets the requirements to enter a state
 */
function meetsEntryRequirements(
  targetState: DecisionState,
  context: DecisionContext
): { valid: boolean; missing?: { criteriaRated?: number; candidatesNeeded?: number } } {
  const config = DECISION_STATES[targetState];
  const requirements = config.entryRequirements;

  if (!requirements) {
    return { valid: true };
  }

  const missing: { criteriaRated?: number; candidatesNeeded?: number } = {};
  let valid = true;

  if (requirements.minCriteriaRated !== undefined) {
    if (context.criteriaRatedCount < requirements.minCriteriaRated) {
      valid = false;
      missing.criteriaRated = requirements.minCriteriaRated - context.criteriaRatedCount;
    }
  }

  if (requirements.minCandidates !== undefined) {
    if (context.candidatesCount < requirements.minCandidates) {
      valid = false;
      missing.candidatesNeeded = requirements.minCandidates - context.candidatesCount;
    }
  }

  return { valid, missing: valid ? undefined : missing };
}

/**
 * Check if a transition between states is allowed
 */
function isTransitionAllowed(
  currentState: DecisionState,
  targetState: DecisionState
): boolean {
  // Same state is always "allowed" (no-op)
  if (currentState === targetState) {
    return true;
  }

  const currentConfig = DECISION_STATES[currentState];
  return currentConfig.allowedTransitions.includes(targetState);
}

// =============================================================================
// HOOK
// =============================================================================

export function useDecisionStateMachine(
  options: UseDecisionStateMachineOptions
): UseDecisionStateMachineReturn {
  const {
    initialState = 'framing',
    onStateChange,
    context,
  } = options;

  const [currentState, setCurrentState] = useState<DecisionState>(initialState);
  const [transitionHistory, setTransitionHistory] = useState<StateTransition[]>([]);

  // Get current state config
  const stateConfig = DECISION_STATES[currentState];

  // Check if a transition is valid
  const canTransitionTo = useCallback((targetState: DecisionState): TransitionResult => {
    // Same state is a no-op success
    if (currentState === targetState) {
      return { success: true, newState: currentState };
    }

    // Check if transition path is allowed
    if (!isTransitionAllowed(currentState, targetState)) {
      return {
        success: false,
        error: `Cannot transition from ${currentState} to ${targetState}. Allowed: ${DECISION_STATES[currentState].allowedTransitions.join(', ')}`,
      };
    }

    // Check entry requirements
    const { valid, missing } = meetsEntryRequirements(targetState, context);
    if (!valid) {
      return {
        success: false,
        error: `Requirements not met for ${targetState}`,
        missingRequirements: missing,
      };
    }

    return { success: true, newState: targetState };
  }, [currentState, context]);

  // Execute a transition
  const transitionTo = useCallback((
    targetState: DecisionState,
    trigger: TransitionTrigger = 'user_action'
  ): TransitionResult => {
    const result = canTransitionTo(targetState);

    if (!result.success) {
      return result;
    }

    // If same state, no-op
    if (currentState === targetState) {
      return { success: true, newState: currentState };
    }

    // Create transition record
    const transition: StateTransition = {
      from: currentState,
      to: targetState,
      trigger,
      timestamp: new Date().toISOString(),
    };

    // Update state
    setCurrentState(targetState);
    setTransitionHistory(prev => [...prev, transition]);

    // Notify callback
    onStateChange?.(transition);

    return { success: true, newState: targetState };
  }, [currentState, canTransitionTo, onStateChange]);

  // Go to next logical state
  const goToNext = useCallback((trigger: TransitionTrigger = 'user_action'): TransitionResult => {
    const order: DecisionState[] = ['framing', 'evaluating', 'decided'];
    const currentIndex = order.indexOf(currentState);

    if (currentIndex >= order.length - 1) {
      return {
        success: false,
        error: 'Already at final state',
      };
    }

    const nextState = order[currentIndex + 1];
    return transitionTo(nextState, trigger);
  }, [currentState, transitionTo]);

  // Go to previous state
  const goToPrevious = useCallback((trigger: TransitionTrigger = 'user_action'): TransitionResult => {
    const order: DecisionState[] = ['framing', 'evaluating', 'decided'];
    const currentIndex = order.indexOf(currentState);

    if (currentIndex <= 0) {
      return {
        success: false,
        error: 'Already at first state',
      };
    }

    const prevState = order[currentIndex - 1];
    return transitionTo(prevState, trigger);
  }, [currentState, transitionTo]);

  // Generate stepper steps
  const steps = useMemo((): DecisionStep[] => {
    return getDecisionSteps(currentState, context.criteriaRatedCount, context.candidatesCount);
  }, [currentState, context.criteriaRatedCount, context.candidatesCount]);

  // Force set state (for hydration)
  const forceSetState = useCallback((state: DecisionState) => {
    setCurrentState(state);
  }, []);

  return {
    currentState,
    stateConfig,
    transitionTo,
    canTransitionTo,
    goToNext,
    goToPrevious,
    steps,
    transitionHistory,
    forceSetState,
  };
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Simple hook to just track if we're in a specific state
 */
export function useIsDecisionState(
  currentState: DecisionState,
  targetState: DecisionState
): boolean {
  return currentState === targetState;
}

/**
 * Get the label for a decision state
 */
export function getStateLabel(state: DecisionState): string {
  return DECISION_STATES[state].label;
}

/**
 * Get the description for a decision state
 */
export function getStateDescription(state: DecisionState): string {
  return DECISION_STATES[state].description;
}
