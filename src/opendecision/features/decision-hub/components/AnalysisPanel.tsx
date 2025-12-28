'use client';

import React, { useMemo } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { DecisionStepper, CompactStepper } from './DecisionStepper';
import { ScoreBar } from './CandidateScoreCell';
import {
  DecisionState,
  DecisionStep,
  Tradeoff,
  DECISION_STATES,
} from '../types/decisionState';
import {
  getTopTradeoffs,
  calculateDecisionConfidence,
  formatTradeoff,
  getTradeoffColor,
} from '../utils/tradeoffDetection';
import { sortToolsByScore, calculateScoreGap } from '../utils/scoreCalculation';
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Scale,
  Lightbulb,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AnalysisPanelProps {
  /** Current decision state */
  decisionState: DecisionState;
  /** Steps for the stepper */
  steps: DecisionStep[];
  /** Candidate tools */
  candidates: Tool[];
  /** User criteria with weights */
  criteria: Criterion[];
  /** Called to navigate to a state */
  onNavigate?: (state: DecisionState) => void;
  /** Called when user clicks "Make Decision" */
  onDecide?: () => void;
  /** Called when user clicks "Reconsider" */
  onReconsider?: () => void;
  /** Called to go back a step */
  onGoBack?: () => void;
  /** Called to go forward */
  onGoForward?: () => void;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * AnalysisPanel - Right sidebar with insights and navigation
 *
 * Features:
 * - Decision stepper (Frame → Compare → Decide)
 * - Key tradeoffs
 * - Decision confidence
 * - Action buttons
 */
export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  decisionState,
  steps,
  candidates,
  criteria,
  onNavigate,
  onDecide,
  onReconsider,
  onGoBack,
  onGoForward,
  className,
}) => {
  // Calculate insights
  const tradeoffs = useMemo(
    () => getTopTradeoffs(candidates, criteria, 5),
    [candidates, criteria]
  );

  const confidence = useMemo(
    () => calculateDecisionConfidence(candidates, criteria),
    [candidates, criteria]
  );

  const topCandidates = useMemo(
    () => sortToolsByScore(candidates, criteria).slice(0, 3),
    [candidates, criteria]
  );

  const scoreGap = useMemo(
    () => calculateScoreGap(candidates, criteria),
    [candidates, criteria]
  );

  const stateConfig = DECISION_STATES[decisionState];

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-2xl border', className)}>
      {/* Header with Stepper */}
      <div className="px-4 py-4 border-b bg-neutral-50/50">
        <DecisionStepper
          steps={steps}
          onStepClick={onNavigate}
          size="sm"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current State Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              {decisionState === 'framing' && <Lightbulb className="w-4 h-4 text-teal-600" />}
              {decisionState === 'evaluating' && <Scale className="w-4 h-4 text-teal-600" />}
              {decisionState === 'decided' && <CheckCircle className="w-4 h-4 text-teal-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {stateConfig.label}
              </h3>
              <p className="text-xs text-neutral-500">
                {stateConfig.description}
              </p>
            </div>
          </div>
        </div>

        {/* Top Candidates (when evaluating) */}
        {decisionState === 'evaluating' && topCandidates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <h4 className="text-sm font-semibold text-neutral-700">
                Top Matches
              </h4>
            </div>
            <div className="space-y-2">
              {topCandidates.map(({ tool, score }, index) => (
                <div
                  key={tool.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    index === 0
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-neutral-50 border-neutral-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-900 text-sm">
                      {index + 1}. {tool.name}
                    </span>
                    <span className={cn(
                      'text-sm font-bold',
                      index === 0 ? 'text-teal-600' : 'text-neutral-600'
                    )}>
                      {score.total}%
                    </span>
                  </div>
                  <ScoreBar score={score.total} showLabel={false} />
                </div>
              ))}
            </div>

            {/* Score Gap Indicator */}
            {candidates.length >= 2 && (
              <div className="mt-3 p-2 bg-neutral-100 rounded text-xs text-neutral-600 text-center">
                {scoreGap >= 10
                  ? `Clear leader by ${scoreGap}%`
                  : scoreGap >= 5
                    ? `Close race - ${scoreGap}% difference`
                    : `Very close - only ${scoreGap}% apart`
                }
              </div>
            )}
          </div>
        )}

        {/* Key Tradeoffs */}
        {decisionState !== 'framing' && tradeoffs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-neutral-700">
                Key Tradeoffs
              </h4>
            </div>
            <div className="space-y-2">
              {tradeoffs.slice(0, 3).map((tradeoff, index) => (
                <TradeoffCard key={index} tradeoff={tradeoff} />
              ))}
            </div>
          </div>
        )}

        {/* Decision Confidence (when evaluating or decided) */}
        {decisionState !== 'framing' && candidates.length >= 2 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              <h4 className="text-sm font-semibold text-neutral-700">
                Decision Confidence
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      confidence.confidence >= 75 && 'bg-emerald-500',
                      confidence.confidence >= 50 && confidence.confidence < 75 && 'bg-amber-500',
                      confidence.confidence < 50 && 'bg-red-500'
                    )}
                    style={{ width: `${confidence.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-neutral-900">
                  {confidence.confidence}%
                </span>
              </div>
              <div className="space-y-1">
                {confidence.factors.map((factor, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 text-xs',
                      factor.impact === 'positive' && 'text-emerald-600',
                      factor.impact === 'negative' && 'text-red-500',
                      factor.impact === 'neutral' && 'text-neutral-500'
                    )}
                  >
                    <span>
                      {factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '⚠' : '•'}
                    </span>
                    <span>{factor.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State-specific guidance */}
        <StateGuidance state={decisionState} candidatesCount={candidates.length} criteriaCount={criteria.length} />
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t bg-neutral-50/50 space-y-2">
        {decisionState === 'framing' && (
          <button
            onClick={onGoForward}
            disabled={candidates.length < 1}
            className={cn(
              'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              candidates.length >= 1
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            Start Comparing
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {decisionState === 'evaluating' && (
          <>
            <button
              onClick={onDecide}
              disabled={candidates.length < 2}
              className={cn(
                'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                candidates.length >= 2
                  ? 'bg-teal-500 text-white hover:bg-teal-600'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              )}
            >
              Make Decision
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGoBack}
              className="w-full py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Adjust Criteria
            </button>
          </>
        )}

        {decisionState === 'decided' && (
          <button
            onClick={onReconsider}
            className="w-full py-2.5 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Reconsider
          </button>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// TRADEOFF CARD
// =============================================================================

interface TradeoffCardProps {
  tradeoff: Tradeoff;
}

const TradeoffCard: React.FC<TradeoffCardProps> = ({ tradeoff }) => {
  const colorClass = getTradeoffColor(tradeoff.significance);

  return (
    <div className={cn('p-2 rounded-lg text-xs', colorClass)}>
      <div className="font-medium mb-0.5">{tradeoff.criterion}</div>
      <div className="opacity-75">
        {tradeoff.winner} beats {tradeoff.loser}
      </div>
    </div>
  );
};

// =============================================================================
// STATE GUIDANCE
// =============================================================================

interface StateGuidanceProps {
  state: DecisionState;
  candidatesCount: number;
  criteriaCount: number;
}

const StateGuidance: React.FC<StateGuidanceProps> = ({
  state,
  candidatesCount,
  criteriaCount,
}) => {
  let content: React.ReactNode = null;

  if (state === 'framing') {
    content = (
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Getting Started</h4>
        <p className="text-xs text-blue-600">
          {criteriaCount === 0
            ? 'First, add criteria that matter for your decision.'
            : candidatesCount === 0
              ? 'Now add some products to compare.'
              : `Great! You have ${candidatesCount} product${candidatesCount !== 1 ? 's' : ''} and ${criteriaCount} criteria. Adjust weights, then start comparing.`
          }
        </p>
      </div>
    );
  }

  if (state === 'evaluating') {
    content = (
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
        <h4 className="text-sm font-medium text-amber-800 mb-1">Evaluation Tips</h4>
        <p className="text-xs text-amber-600">
          {candidatesCount < 2
            ? 'Add at least 2 products to make a meaningful comparison.'
            : 'Review the scores and tradeoffs above. Adjust criteria weights to see how rankings change.'
          }
        </p>
      </div>
    );
  }

  if (state === 'decided') {
    content = (
      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <h4 className="text-sm font-medium text-emerald-800 mb-1">Decision Made!</h4>
        <p className="text-xs text-emerald-600">
          You&apos;ve completed your evaluation. You can still go back to reconsider if needed.
        </p>
      </div>
    );
  }

  return content;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default AnalysisPanel;
