'use client';

import React, { useState } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { ScoreBreakdown } from '../types/decisionState';
import { getScoreColor, formatScore } from '../utils/scoreCalculation';
import { ChevronDown, Info } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface CandidateScoreCellProps {
  /** Score value (0-100) */
  score: number;
  /** Score breakdown for this criterion (optional, for drill-down) */
  breakdown?: ScoreBreakdown;
  /** Is this the highest score in the row? */
  isHighest?: boolean;
  /** Is this the overall score row? */
  isOverall?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

interface OverallScoreCellProps {
  /** Total score (0-100) */
  score: number;
  /** Full breakdown for tooltip */
  breakdown: ScoreBreakdown[];
  /** Tool name */
  toolName: string;
  /** Is this the winner (highest score)? */
  isWinner?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// CANDIDATE SCORE CELL
// =============================================================================

/**
 * CandidateScoreCell - Shows a score with optional drill-down
 *
 * Features:
 * - Color-coded based on score value
 * - Winner highlight
 * - Hover to see breakdown
 */
export const CandidateScoreCell: React.FC<CandidateScoreCellProps> = ({
  score,
  breakdown,
  isHighest = false,
  isOverall = false,
  size = 'md',
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Convert 1-5 rating to percentage for display
  const displayScore = isOverall ? score : Math.round((score / 5) * 100);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  return (
    <div
      className={cn(
        'relative',
        sizeClasses[size],
        'font-medium rounded-lg transition-all',
        // Color based on score
        displayScore >= 85 && 'text-emerald-700 bg-emerald-50',
        displayScore >= 70 && displayScore < 85 && 'text-teal-700 bg-teal-50',
        displayScore >= 50 && displayScore < 70 && 'text-amber-700 bg-amber-50',
        displayScore < 50 && 'text-red-600 bg-red-50',
        // Winner highlight
        isHighest && 'ring-2 ring-teal-500 ring-offset-1',
        // Overall row styling
        isOverall && 'font-bold',
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between gap-1">
        <span>{formatScore(displayScore)}</span>
        {breakdown && (
          <Info className="w-3 h-3 opacity-50" />
        )}
      </div>

      {/* Breakdown tooltip */}
      {showTooltip && breakdown && (
        <ScoreTooltip breakdown={breakdown} />
      )}
    </div>
  );
};

// =============================================================================
// OVERALL SCORE CELL (with full breakdown)
// =============================================================================

/**
 * OverallScoreCell - Shows the total match score with full breakdown on hover
 */
export const OverallScoreCell: React.FC<OverallScoreCellProps> = ({
  score,
  breakdown,
  toolName,
  isWinner = false,
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-xl transition-all cursor-default',
        isWinner
          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg'
          : 'bg-neutral-100 text-neutral-700',
        className
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{formatScore(score)}</div>
          {isWinner && (
            <div className="text-xs opacity-75">Best Match</div>
          )}
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          showTooltip && 'rotate-180'
        )} />
      </div>

      {/* Full breakdown tooltip */}
      {showTooltip && (
        <BreakdownTooltip
          toolName={toolName}
          breakdown={breakdown}
          totalScore={score}
        />
      )}
    </div>
  );
};

// =============================================================================
// TOOLTIPS
// =============================================================================

interface ScoreTooltipProps {
  breakdown: ScoreBreakdown;
}

const ScoreTooltip: React.FC<ScoreTooltipProps> = ({ breakdown }) => {
  return (
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-neutral-900 text-white text-xs rounded-lg shadow-xl min-w-[180px]">
      {/* Arrow */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45" />

      <div className="space-y-2">
        <div className="font-medium text-neutral-300">
          {breakdown.criterionName}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-neutral-400">Raw Score:</span>
            <span>{breakdown.rawScore}/5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Your Weight:</span>
            <span>{breakdown.weight}/5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Contribution:</span>
            <span>{Math.round(breakdown.contribution)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BreakdownTooltipProps {
  toolName: string;
  breakdown: ScoreBreakdown[];
  totalScore: number;
}

const BreakdownTooltip: React.FC<BreakdownTooltipProps> = ({
  toolName,
  breakdown,
  totalScore,
}) => {
  // Sort by contribution (highest first)
  const sortedBreakdown = [...breakdown].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="absolute z-50 top-full left-0 mt-2 p-4 bg-white text-neutral-900 rounded-xl shadow-xl border min-w-[280px]">
      {/* Arrow */}
      <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t rotate-45" />

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="font-semibold">{toolName}</span>
          <span className="text-lg font-bold text-teal-600">
            {formatScore(totalScore)}
          </span>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-500 uppercase">
            Score Breakdown
          </div>

          {sortedBreakdown.map(item => (
            <div key={item.criterionId} className="flex items-center gap-2">
              {/* Contribution bar */}
              <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${item.contribution}%` }}
                />
              </div>

              {/* Criterion name */}
              <span className="flex-1 text-xs text-neutral-600 truncate">
                {item.criterionName}
              </span>

              {/* Raw score */}
              <span className={cn(
                'text-xs font-medium',
                getScoreColor(item.rawScore * 20)
              )}>
                {item.rawScore}/5
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t text-xs text-neutral-500">
          Scores weighted by your importance ratings
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SIMPLE SCORE BAR
// =============================================================================

interface ScoreBarProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * Simple horizontal score bar
 */
export const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  maxScore = 100,
  showLabel = true,
  className,
}) => {
  const percentage = (score / maxScore) * 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            score >= 85 && 'bg-emerald-500',
            score >= 70 && score < 85 && 'bg-teal-500',
            score >= 50 && score < 70 && 'bg-amber-500',
            score < 50 && 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'text-sm font-medium w-10 text-right',
          getScoreColor(score)
        )}>
          {formatScore(score)}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default CandidateScoreCell;
