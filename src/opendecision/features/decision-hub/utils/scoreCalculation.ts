/**
 * Score Calculation Utilities
 *
 * Provides explainable, weighted score calculations for comparing tools.
 * Every score change is traceable through the breakdown structure.
 */

import { Tool, Criterion } from '@/opendecision/shared/types';
import { ScoreBreakdown, WeightedScoreResult } from '../types/decisionState';

// =============================================================================
// CORE CALCULATION
// =============================================================================

/**
 * Calculate the weighted match score for a tool based on user criteria weights.
 *
 * Formula: sum((rawScore / 5) * (weight / totalWeight)) * 100
 *
 * @param tool - The tool to score
 * @param criteria - User's criteria with weights (userRating)
 * @returns Score result with total and breakdown for explainability
 */
export function calculateWeightedScore(
  tool: Tool,
  criteria: Criterion[]
): WeightedScoreResult {
  // Handle edge cases
  if (!criteria || criteria.length === 0) {
    return {
      total: 50, // Neutral score
      breakdown: [],
      toolId: tool.id,
      toolName: tool.name,
    };
  }

  // Calculate total weight (sum of all user ratings)
  const totalWeight = criteria.reduce((sum, c) => sum + c.userRating, 0);

  // If all weights are 0, return neutral score
  if (totalWeight === 0) {
    return {
      total: 50,
      breakdown: criteria.map(c => ({
        criterionId: c.id,
        criterionName: c.name,
        rawScore: getToolRating(tool, c.id),
        weight: 0,
        weightedScore: 0,
        contribution: 0,
      })),
      toolId: tool.id,
      toolName: tool.name,
    };
  }

  // Calculate breakdown for each criterion
  const breakdown: ScoreBreakdown[] = criteria.map(criterion => {
    const rawScore = getToolRating(tool, criterion.id);
    const weight = criterion.userRating;
    const normalizedWeight = weight / totalWeight;
    const normalizedScore = rawScore / 5; // Convert 1-5 to 0-1
    const weightedScore = normalizedScore * normalizedWeight;

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      rawScore,
      weight,
      weightedScore,
      contribution: normalizedWeight * 100,
    };
  });

  // Calculate total score (0-100)
  const total = breakdown.reduce((sum, b) => sum + b.weightedScore, 0) * 100;

  return {
    total: Math.round(total),
    breakdown,
    toolId: tool.id,
    toolName: tool.name,
  };
}

/**
 * Get a tool's rating for a specific criterion.
 * Handles various data formats and provides a default.
 */
function getToolRating(tool: Tool, criterionId: string): number {
  // Try to get from ratings object
  if (tool.ratings && typeof tool.ratings[criterionId] === 'number') {
    return tool.ratings[criterionId];
  }

  // Try to find in criteria array
  if (tool.criteria && Array.isArray(tool.criteria)) {
    const criterion = tool.criteria.find(c => c.id === criterionId);
    if (criterion && typeof criterion.ranking === 'number') {
      return criterion.ranking;
    }
  }

  // Default to middle rating
  return 3;
}

// =============================================================================
// BATCH CALCULATIONS
// =============================================================================

/**
 * Calculate weighted scores for multiple tools
 */
export function calculateAllScores(
  tools: Tool[],
  criteria: Criterion[]
): WeightedScoreResult[] {
  return tools.map(tool => calculateWeightedScore(tool, criteria));
}

/**
 * Get tools sorted by score (highest first)
 */
export function sortToolsByScore(
  tools: Tool[],
  criteria: Criterion[]
): { tool: Tool; score: WeightedScoreResult }[] {
  const scores = calculateAllScores(tools, criteria);

  const combined = tools.map((tool, index) => ({
    tool,
    score: scores[index],
  }));

  return combined.sort((a, b) => b.score.total - a.score.total);
}

/**
 * Get the top N tools by score
 */
export function getTopTools(
  tools: Tool[],
  criteria: Criterion[],
  count: number = 3
): { tool: Tool; score: WeightedScoreResult }[] {
  return sortToolsByScore(tools, criteria).slice(0, count);
}

// =============================================================================
// SCORE ANALYSIS
// =============================================================================

/**
 * Calculate the gap between #1 and #2 ranked tools
 */
export function calculateScoreGap(
  tools: Tool[],
  criteria: Criterion[]
): number {
  const sorted = sortToolsByScore(tools, criteria);

  if (sorted.length < 2) {
    return 0;
  }

  return sorted[0].score.total - sorted[1].score.total;
}

/**
 * Determine if the decision is "close" (top 2 within threshold)
 */
export function isCloseDecision(
  tools: Tool[],
  criteria: Criterion[],
  threshold: number = 5
): boolean {
  return calculateScoreGap(tools, criteria) <= threshold;
}

/**
 * Get the most impactful criteria (highest contribution to score)
 */
export function getMostImpactfulCriteria(
  scoreResult: WeightedScoreResult,
  topN: number = 3
): ScoreBreakdown[] {
  return [...scoreResult.breakdown]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, topN);
}

/**
 * Find criteria where a tool is strongest vs weakest
 */
export function getToolStrengthsWeaknesses(
  tool: Tool,
  criteria: Criterion[]
): { strengths: ScoreBreakdown[]; weaknesses: ScoreBreakdown[] } {
  const result = calculateWeightedScore(tool, criteria);

  const sorted = [...result.breakdown].sort((a, b) => b.rawScore - a.rawScore);

  // Top 2 are strengths, bottom 2 are weaknesses
  const strengths = sorted.slice(0, 2).filter(b => b.rawScore >= 4);
  const weaknesses = sorted.slice(-2).filter(b => b.rawScore <= 2);

  return { strengths, weaknesses };
}

// =============================================================================
// COMPARISON HELPERS
// =============================================================================

/**
 * Compare two tools on a specific criterion
 */
export function compareCriterion(
  tool1: Tool,
  tool2: Tool,
  criterionId: string
): { winner: Tool | null; gap: number } {
  const score1 = getToolRating(tool1, criterionId);
  const score2 = getToolRating(tool2, criterionId);

  if (score1 === score2) {
    return { winner: null, gap: 0 };
  }

  return {
    winner: score1 > score2 ? tool1 : tool2,
    gap: Math.abs(score1 - score2),
  };
}

/**
 * Get a human-readable explanation of why one tool scores higher
 */
export function explainScoreDifference(
  tool1: Tool,
  tool2: Tool,
  criteria: Criterion[]
): string {
  const score1 = calculateWeightedScore(tool1, criteria);
  const score2 = calculateWeightedScore(tool2, criteria);

  if (score1.total === score2.total) {
    return `${tool1.name} and ${tool2.name} have the same match score.`;
  }

  const winner = score1.total > score2.total ? score1 : score2;
  const loser = score1.total > score2.total ? score2 : score1;

  // Find the criteria where winner has biggest advantage
  const advantages = winner.breakdown
    .map((b, i) => ({
      criterion: b.criterionName,
      advantage: b.rawScore - loser.breakdown[i].rawScore,
      weight: b.weight,
    }))
    .filter(a => a.advantage > 0)
    .sort((a, b) => (b.advantage * b.weight) - (a.advantage * a.weight))
    .slice(0, 2);

  if (advantages.length === 0) {
    return `${winner.toolName} scores ${winner.total - loser.total}% higher overall.`;
  }

  const reasons = advantages
    .map(a => a.criterion)
    .join(' and ');

  return `${winner.toolName} scores higher due to better ${reasons}.`;
}

// =============================================================================
// SCORE FORMATTING
// =============================================================================

/**
 * Format a score for display
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Get a color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-teal-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

/**
 * Get a background color class based on score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 85) return 'bg-emerald-50';
  if (score >= 70) return 'bg-teal-50';
  if (score >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

/**
 * Get a label for the score range
 */
export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Good Match';
  if (score >= 50) return 'Fair Match';
  return 'Poor Match';
}
