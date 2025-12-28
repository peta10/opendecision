'use client';

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { ComparisonMatrix } from './ComparisonMatrix';
import { AnalysisPanel } from './AnalysisPanel';
import { useDecisionStateMachine } from '../hooks/useDecisionStateMachine';
import { DecisionState, StateTransition } from '../types/decisionState';

// =============================================================================
// TYPES
// =============================================================================

interface DecisionHubLayoutProps {
  /** Candidate tools to compare */
  candidates: Tool[];
  /** User criteria with weights */
  criteria: Criterion[];
  /** Called when user changes a criterion weight */
  onWeightChange?: (criterionId: string, newWeight: number) => void;
  /** Called when user removes a candidate */
  onRemoveCandidate?: (toolId: string) => void;
  /** Called when user wants to add more candidates */
  onAddCandidate?: () => void;
  /** Called when decision state changes */
  onStateChange?: (transition: StateTransition) => void;
  /** Initial decision state (from database) */
  initialState?: DecisionState;
  /** Space ID for persistence */
  spaceId?: string;
  /** Whether Scout panel is shown (for layout adjustment) */
  isScoutPanelVisible?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * DecisionHubLayout - The main Decision Hub container
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     DecisionHubLayout                           │
 * ├──────────────────────────────────────────────┬──────────────────┤
 * │           ComparisonMatrix (center)          │  AnalysisPanel   │
 * │                                              │     (right)      │
 * │  Criteria × Candidates table                 │                  │
 * │  with inline weight editing                  │  - Stepper       │
 * │  and explainable scores                      │  - Tradeoffs     │
 * │                                              │  - Confidence    │
 * │                                              │  - Actions       │
 * └──────────────────────────────────────────────┴──────────────────┘
 *
 * Features:
 * - Integrated state machine
 * - Responsive layout
 * - Scout panel coordination
 */
export const DecisionHubLayout: React.FC<DecisionHubLayoutProps> = ({
  candidates,
  criteria,
  onWeightChange,
  onRemoveCandidate,
  onAddCandidate,
  onStateChange,
  initialState = 'framing',
  spaceId,
  isScoutPanelVisible = false,
  className,
}) => {
  // Count criteria that are not at default value
  const criteriaRatedCount = useMemo(() => {
    return criteria.filter(c => c.userRating !== 3).length;
  }, [criteria]);

  // State machine
  const {
    currentState,
    steps,
    transitionTo,
    goToNext,
    goToPrevious,
  } = useDecisionStateMachine({
    initialState,
    context: {
      criteriaRatedCount,
      candidatesCount: candidates.length,
    },
    onStateChange,
  });

  // Navigation handlers
  const handleNavigate = useCallback((state: DecisionState) => {
    transitionTo(state, 'user_action');
  }, [transitionTo]);

  const handleGoForward = useCallback(() => {
    goToNext('user_action');
  }, [goToNext]);

  const handleGoBack = useCallback(() => {
    goToPrevious('user_action');
  }, [goToPrevious]);

  const handleDecide = useCallback(() => {
    transitionTo('decided', 'user_action');
  }, [transitionTo]);

  const handleReconsider = useCallback(() => {
    transitionTo('evaluating', 'user_action');
  }, [transitionTo]);

  return (
    <div className={cn(
      'flex gap-4 h-full',
      className
    )}>
      {/* Main Content: Comparison Matrix */}
      <div className="flex-1 min-w-0">
        <ComparisonMatrix
          criteria={criteria}
          candidates={candidates}
          onWeightChange={onWeightChange}
          onRemoveCandidate={onRemoveCandidate}
          onAddCandidate={onAddCandidate}
          editable={currentState !== 'decided'}
        />
      </div>

      {/* Right Sidebar: Analysis Panel */}
      <div className="w-80 flex-shrink-0">
        <AnalysisPanel
          decisionState={currentState}
          steps={steps}
          candidates={candidates}
          criteria={criteria}
          onNavigate={handleNavigate}
          onDecide={handleDecide}
          onReconsider={handleReconsider}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
        />
      </div>
    </div>
  );
};

// =============================================================================
// RESPONSIVE VERSION
// =============================================================================

interface ResponsiveDecisionHubProps extends DecisionHubLayoutProps {
  /** Whether on mobile view */
  isMobile?: boolean;
}

/**
 * Responsive wrapper that shows stacked layout on mobile
 */
export const ResponsiveDecisionHub: React.FC<ResponsiveDecisionHubProps> = ({
  isMobile = false,
  ...props
}) => {
  if (isMobile) {
    return <MobileDecisionHub {...props} />;
  }

  return <DecisionHubLayout {...props} />;
};

// =============================================================================
// MOBILE VERSION
// =============================================================================

const MobileDecisionHub: React.FC<DecisionHubLayoutProps> = ({
  candidates,
  criteria,
  onWeightChange,
  onRemoveCandidate,
  onAddCandidate,
  onStateChange,
  initialState = 'framing',
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState<'matrix' | 'analysis'>('matrix');

  const criteriaRatedCount = useMemo(() => {
    return criteria.filter(c => c.userRating !== 3).length;
  }, [criteria]);

  const {
    currentState,
    steps,
    transitionTo,
    goToNext,
    goToPrevious,
  } = useDecisionStateMachine({
    initialState,
    context: {
      criteriaRatedCount,
      candidatesCount: candidates.length,
    },
    onStateChange,
  });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Tab switcher */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'matrix'
              ? 'text-teal-600 border-b-2 border-teal-500'
              : 'text-neutral-500'
          )}
        >
          Compare
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'analysis'
              ? 'text-teal-600 border-b-2 border-teal-500'
              : 'text-neutral-500'
          )}
        >
          Analysis
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'matrix' && (
          <div className="h-full overflow-auto p-4">
            <ComparisonMatrix
              criteria={criteria}
              candidates={candidates}
              onWeightChange={onWeightChange}
              onRemoveCandidate={onRemoveCandidate}
              onAddCandidate={onAddCandidate}
              editable={currentState !== 'decided'}
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="h-full">
            <AnalysisPanel
              decisionState={currentState}
              steps={steps}
              candidates={candidates}
              criteria={criteria}
              onNavigate={(state) => transitionTo(state, 'user_action')}
              onDecide={() => transitionTo('decided', 'user_action')}
              onReconsider={() => transitionTo('evaluating', 'user_action')}
              onGoBack={() => goToPrevious('user_action')}
              onGoForward={() => goToNext('user_action')}
              className="h-full rounded-none border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default DecisionHubLayout;
