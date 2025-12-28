// =============================================================================
// DECISION HUB - State Machine Based Decision Making
// =============================================================================

// Types
export * from './types/decisionState';

// Hooks
export { useDecisionStateMachine } from './hooks/useDecisionStateMachine';

// Utils
export * from './utils/scoreCalculation';
export * from './utils/tradeoffDetection';

// Components
export { DecisionHub } from './components/DecisionHub';
export { DecisionHubLayout, ResponsiveDecisionHub } from './components/DecisionHubLayout';
export { ComparisonMatrix } from './components/ComparisonMatrix';
export { AnalysisPanel } from './components/AnalysisPanel';
export { DecisionStepper, CompactStepper } from './components/DecisionStepper';
export { CriteriaWeightSlider, WeightBar } from './components/CriteriaWeightSlider';
export { CandidateScoreCell, OverallScoreCell, ScoreBar } from './components/CandidateScoreCell';
