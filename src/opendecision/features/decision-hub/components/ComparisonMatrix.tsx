'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { CriteriaWeightSlider, WeightBar } from './CriteriaWeightSlider';
import { CandidateScoreCell, OverallScoreCell, ScoreBar } from './CandidateScoreCell';
import { calculateWeightedScore, sortToolsByScore } from '../utils/scoreCalculation';
import { WeightedScoreResult } from '../types/decisionState';
import { Trash2, Plus, ArrowUpDown, Info } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ComparisonMatrixProps {
  /** Criteria with user weights */
  criteria: Criterion[];
  /** Candidate tools to compare */
  candidates: Tool[];
  /** Called when user changes a criterion weight */
  onWeightChange?: (criterionId: string, newWeight: number) => void;
  /** Called when user removes a candidate */
  onRemoveCandidate?: (toolId: string) => void;
  /** Called when user wants to add more candidates */
  onAddCandidate?: () => void;
  /** Whether weights are editable */
  editable?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ComparisonMatrix - The heart of the Decision Hub
 *
 * Structure:
 * ┌────────────────┬─────────┬──────────┬──────────┬──────────┐
 * │ Criteria       │ Weight  │ Monday   │ Asana    │ Jira     │
 * ├────────────────┼─────────┼──────────┼──────────┼──────────┤
 * │ Scalability    │ ████░░  │ 92%      │ 87%      │ 85%      │
 * │ Ease of Use    │ ██████  │ 85%      │ 92%      │ 72%      │
 * │ Integrations   │ ███░░░  │ 88%      │ 79%      │ 95%      │
 * ├────────────────┼─────────┼──────────┼──────────┼──────────┤
 * │ OVERALL MATCH  │         │ 88%      │ 86%      │ 82%      │
 * └────────────────┴─────────┴──────────┴──────────┴──────────┘
 *
 * Features:
 * - Inline weight editing
 * - Score breakdown on hover
 * - Winner highlighting
 * - Sortable by any column
 * - Responsive
 */
export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  criteria,
  candidates,
  onWeightChange,
  onRemoveCandidate,
  onAddCandidate,
  editable = true,
  className,
}) => {
  // Sort state
  const [sortBy, setSortBy] = useState<'criteria' | string>('criteria');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calculate all scores
  const scoreResults = useMemo(() => {
    return candidates.map(tool => ({
      tool,
      result: calculateWeightedScore(tool, criteria),
    }));
  }, [candidates, criteria]);

  // Find the winner (highest score)
  const winnerToolId = useMemo(() => {
    if (scoreResults.length === 0) return null;
    const sorted = [...scoreResults].sort((a, b) => b.result.total - a.result.total);
    return sorted[0].tool.id;
  }, [scoreResults]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    if (sortBy === 'criteria') {
      // Default: sort by overall score descending
      return [...scoreResults].sort((a, b) =>
        sortDirection === 'desc'
          ? b.result.total - a.result.total
          : a.result.total - b.result.total
      );
    }

    // Sort by specific criterion
    const criterionId = sortBy;
    return [...scoreResults].sort((a, b) => {
      const aScore = getToolRating(a.tool, criterionId);
      const bScore = getToolRating(b.tool, criterionId);
      return sortDirection === 'desc' ? bScore - aScore : aScore - bScore;
    });
  }, [scoreResults, sortBy, sortDirection]);

  // Handle sort column click
  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortDirection('desc');
    }
  };

  // Empty state
  if (candidates.length === 0) {
    return (
      <div className={cn('bg-white rounded-2xl border p-8 text-center', className)}>
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No products to compare
          </h3>
          <p className="text-neutral-500 mb-4">
            Add products to your decision space to see how they compare against your criteria.
          </p>
          {onAddCandidate && (
            <button
              onClick={onAddCandidate}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Add Products
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl border overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b bg-neutral-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Comparison Matrix
            </h3>
            <p className="text-sm text-neutral-500">
              {candidates.length} product{candidates.length !== 1 ? 's' : ''} • {criteria.length} criteria
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              title="How scores are calculated"
            >
              <Info className="w-4 h-4" />
            </button>
            {onAddCandidate && (
              <button
                onClick={onAddCandidate}
                className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Column Headers */}
          <thead>
            <tr className="border-b">
              {/* Criteria column */}
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider w-[200px] sticky left-0 bg-white z-10">
                Criteria
              </th>
              {/* Weight column */}
              <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider w-[100px]">
                Weight
              </th>
              {/* Candidate columns */}
              {sortedCandidates.map(({ tool }) => (
                <th
                  key={tool.id}
                  className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[120px]"
                >
                  <button
                    onClick={() => handleSort(tool.id)}
                    className="flex items-center gap-1 hover:text-neutral-700 transition-colors group"
                  >
                    <span className="truncate max-w-[100px]">{tool.name}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </th>
              ))}
              {/* Actions column */}
              {onRemoveCandidate && <th className="w-12" />}
            </tr>
          </thead>

          <tbody>
            {/* Criterion rows */}
            {criteria.map((criterion, index) => (
              <tr
                key={criterion.id}
                className={cn(
                  'border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors',
                  index % 2 === 0 && 'bg-white',
                  index % 2 === 1 && 'bg-neutral-50/30'
                )}
              >
                {/* Criterion name */}
                <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                      {criterion.name}
                    </span>
                  </div>
                </td>

                {/* Weight slider */}
                <td className="py-3 px-4">
                  {editable && onWeightChange ? (
                    <CriteriaWeightSlider
                      criterion={criterion}
                      onWeightChange={onWeightChange}
                      compact
                    />
                  ) : (
                    <WeightBar weight={criterion.userRating} />
                  )}
                </td>

                {/* Candidate scores */}
                {sortedCandidates.map(({ tool, result }) => {
                  const criterionBreakdown = result.breakdown.find(
                    b => b.criterionId === criterion.id
                  );
                  const rawScore = criterionBreakdown?.rawScore || 3;

                  // Check if this is the highest score in the row
                  const isHighest = sortedCandidates.every(({ tool: t }) => {
                    const otherScore = getToolRating(t, criterion.id);
                    return otherScore <= rawScore;
                  });

                  return (
                    <td key={tool.id} className="py-3 px-4">
                      <CandidateScoreCell
                        score={rawScore}
                        breakdown={criterionBreakdown}
                        isHighest={isHighest && candidates.length > 1}
                        size="sm"
                      />
                    </td>
                  );
                })}

                {/* Empty cell for actions */}
                {onRemoveCandidate && <td />}
              </tr>
            ))}

            {/* Divider */}
            <tr>
              <td colSpan={2 + candidates.length + (onRemoveCandidate ? 1 : 0)}>
                <div className="h-px bg-neutral-200 my-1" />
              </td>
            </tr>

            {/* Overall Match Row */}
            <tr className="bg-neutral-50/70">
              <td className="py-4 px-4 sticky left-0 bg-inherit z-10">
                <span className="text-sm font-bold text-neutral-900 uppercase">
                  Overall Match
                </span>
              </td>
              <td />
              {sortedCandidates.map(({ tool, result }) => (
                <td key={tool.id} className="py-4 px-4">
                  <OverallScoreCell
                    score={result.total}
                    breakdown={result.breakdown}
                    toolName={tool.name}
                    isWinner={tool.id === winnerToolId && candidates.length > 1}
                  />
                </td>
              ))}
              {onRemoveCandidate && <td />}
            </tr>

            {/* Remove buttons row (visible on hover) */}
            {onRemoveCandidate && (
              <tr>
                <td />
                <td />
                {sortedCandidates.map(({ tool }) => (
                  <td key={tool.id} className="py-2 px-4">
                    <button
                      onClick={() => onRemoveCandidate(tool.id)}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full flex items-center justify-center"
                      title={`Remove ${tool.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                ))}
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get a tool's rating for a specific criterion
 */
function getToolRating(tool: Tool, criterionId: string): number {
  if (tool.ratings && typeof tool.ratings[criterionId] === 'number') {
    return tool.ratings[criterionId];
  }

  if (tool.criteria && Array.isArray(tool.criteria)) {
    const criterion = tool.criteria.find(c => c.id === criterionId);
    if (criterion && typeof criterion.ranking === 'number') {
      return criterion.ranking;
    }
  }

  return 3;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ComparisonMatrix;
