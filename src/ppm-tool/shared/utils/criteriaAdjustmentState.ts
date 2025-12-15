import type { Criterion } from '../types';
import { hasCompletedAnyGuidedRanking } from './guidedRankingState';

/**
 * Isolated utility for detecting criteria adjustment state
 * This utility is completely separate from bumper and tooltip systems
 * to ensure no interference with critical functionality
 */

/**
 * Check if any criteria have been adjusted from their default value of 3
 * OR if user has completed any guided ranking
 * @param criteria - Array of criteria to check
 * @returns true if any criterion has userRating !== 3 OR user completed guided ranking
 */
export function hasCriteriaBeenAdjusted(criteria: Criterion[]): boolean {
  const hasAdjustedSliders = criteria.some(criterion => criterion.userRating !== 3);
  const hasCompletedGuidedRanking = hasCompletedAnyGuidedRanking();
  
  // Show match scores if EITHER:
  // 1. User manually adjusted sliders, OR
  // 2. User completed any guided ranking (even if all criteria are still at 3)
  return hasAdjustedSliders || hasCompletedGuidedRanking;
}

/**
 * Check if at least the specified number of criteria have been adjusted
 * @param criteria - Array of criteria to check
 * @param minimum - Minimum number of criteria that must be adjusted (default: 3)
 * @returns true if at least 'minimum' criteria have userRating !== 3
 */
export function hasMinimumCriteriaAdjusted(criteria: Criterion[], minimum: number = 3): boolean {
  const adjustedCount = criteria.filter(criterion => criterion.userRating !== 3).length;
  
  console.log(`📊 hasMinimumCriteriaAdjusted: ${adjustedCount}/${criteria.length} criteria adjusted (need ${minimum})`);
  
  // Simple check: count criteria that differ from default
  // Works for ANY adjustment method: manual sliders, full guided rankings, individual criterion rankings, or any mix
  return adjustedCount >= minimum;
}

/**
 * Get the appropriate message for the report based on criteria adjustment state
 * @param toolCount - Number of tools being analyzed
 * @param hasAdjusted - Whether criteria have been adjusted from defaults
 * @returns Appropriate message string
 */
export function getCriteriaAdjustmentMessage(toolCount: number, hasAdjusted: boolean): string {
  if (hasAdjusted) {
    return `Your report will include analysis of ${toolCount} ${toolCount === 1 ? 'tool' : 'tools'} based on your current rankings and filters.`;
  }
  return "For best results, complete the guided rankings or adjust the Criteria sliders to match your priorities.";
}

/**
 * Get styling classes for the criteria adjustment message
 * @param hasAdjusted - Whether criteria have been adjusted from defaults
 * @returns CSS classes for styling
 */
export function getCriteriaAdjustmentMessageStyles(hasAdjusted: boolean): string {
  if (hasAdjusted) {
    return "text-xs md:text-sm text-blue-700 font-medium";
  }
  return "text-xs md:text-sm text-yellow-700 font-medium";
}

/**
 * Get the tooltip content for match score explanation
 * @returns Tooltip content string
 */
export function getMatchScoreTooltipContent(): string {
  return "How to get your match score: complete the guided rankings or adjust the Criteria sliders to match your priorities.";
}

/**
 * Get the tooltip content for "Not Yet Ranked" explanation
 * @returns Tooltip content string
 */
export function getNotYetRankedTooltipContent(): string {
  return "How to get your tool's rankings: complete the guided rankings or adjust the Criteria sliders to match your priorities.";
}
