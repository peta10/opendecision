/**
 * Tradeoff Detection Utilities
 *
 * Detects and analyzes tradeoffs between candidates to help users
 * understand the key differences and make informed decisions.
 */

import { Tool, Criterion } from '@/opendecision/shared/types';
import { Tradeoff } from '../types/decisionState';
import { calculateWeightedScore, sortToolsByScore } from './scoreCalculation';

// =============================================================================
// TRADEOFF DETECTION
// =============================================================================

/**
 * Detect all significant tradeoffs between candidates.
 *
 * A tradeoff occurs when one tool beats another on a specific criterion.
 * We focus on tradeoffs that matter (weighted by user importance).
 */
export function detectTradeoffs(
  candidates: Tool[],
  criteria: Criterion[]
): Tradeoff[] {
  if (candidates.length < 2 || criteria.length === 0) {
    return [];
  }

  const tradeoffs: Tradeoff[] = [];

  // For each criterion, compare all candidate pairs
  criteria.forEach(criterion => {
    // Get all tools with their scores for this criterion
    const toolScores = candidates.map(tool => {
      const rawScore = getToolRating(tool, criterion.id);
      return {
        tool,
        score: rawScore,
      };
    }).sort((a, b) => b.score - a.score);

    // Compare top tool against others
    const winner = toolScores[0];

    toolScores.slice(1).forEach(loser => {
      const gap = winner.score - loser.score;

      // Only count as tradeoff if there's a meaningful difference
      if (gap >= 1) {
        tradeoffs.push({
          criterion: criterion.name,
          criterionId: criterion.id,
          winner: winner.tool.name,
          winnerId: winner.tool.id,
          loser: loser.tool.name,
          loserId: loser.tool.id,
          gap,
          significance: getSignificance(gap),
        });
      }
    });
  });

  return tradeoffs;
}

/**
 * Get significance level based on score gap
 */
function getSignificance(gap: number): 'minor' | 'notable' | 'major' {
  if (gap >= 2) return 'major';
  if (gap >= 1) return 'notable';
  return 'minor';
}

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
// TRADEOFF ANALYSIS
// =============================================================================

/**
 * Get the most significant tradeoffs (highest weighted importance)
 */
export function getTopTradeoffs(
  candidates: Tool[],
  criteria: Criterion[],
  topN: number = 5
): Tradeoff[] {
  const tradeoffs = detectTradeoffs(candidates, criteria);

  // Sort by gap * criterion weight
  const weighted = tradeoffs.map(t => {
    const criterion = criteria.find(c => c.id === t.criterionId);
    const weight = criterion?.userRating || 3;
    return {
      ...t,
      weightedImportance: t.gap * weight,
    };
  });

  return weighted
    .sort((a, b) => b.weightedImportance - a.weightedImportance)
    .slice(0, topN)
    .map(({ weightedImportance, ...t }) => t);
}

/**
 * Get tradeoffs where the top candidate loses to others
 * (These are potential concerns for the leading choice)
 */
export function getLeaderWeaknesses(
  candidates: Tool[],
  criteria: Criterion[]
): Tradeoff[] {
  if (candidates.length < 2) return [];

  const sorted = sortToolsByScore(candidates, criteria);
  const leader = sorted[0].tool;

  return detectTradeoffs(candidates, criteria)
    .filter(t => t.loserId === leader.id);
}

/**
 * Get tradeoffs between the top 2 candidates only
 * (Most relevant for close decisions)
 */
export function getHeadToHeadTradeoffs(
  candidates: Tool[],
  criteria: Criterion[]
): { tool1Wins: Tradeoff[]; tool2Wins: Tradeoff[]; ties: string[] } {
  if (candidates.length < 2) {
    return { tool1Wins: [], tool2Wins: [], ties: [] };
  }

  const sorted = sortToolsByScore(candidates, criteria);
  const tool1 = sorted[0].tool;
  const tool2 = sorted[1].tool;

  const allTradeoffs = detectTradeoffs([tool1, tool2], criteria);

  return {
    tool1Wins: allTradeoffs.filter(t => t.winnerId === tool1.id),
    tool2Wins: allTradeoffs.filter(t => t.winnerId === tool2.id),
    ties: criteria
      .filter(c => {
        const score1 = getToolRating(tool1, c.id);
        const score2 = getToolRating(tool2, c.id);
        return score1 === score2;
      })
      .map(c => c.name),
  };
}

/**
 * Find criteria where rankings flip between top candidates
 * (e.g., Tool A wins on Ease of Use, but Tool B wins on Scalability)
 */
export function findFlipCriteria(
  candidates: Tool[],
  criteria: Criterion[]
): string[] {
  if (candidates.length < 2) return [];

  const sorted = sortToolsByScore(candidates, criteria);
  const top2 = sorted.slice(0, 2).map(s => s.tool);

  const flipCriteria: string[] = [];

  criteria.forEach(criterion => {
    const score1 = getToolRating(top2[0], criterion.id);
    const score2 = getToolRating(top2[1], criterion.id);

    // A "flip" is when the second-place overall winner beats the leader on this criterion
    if (score2 > score1) {
      flipCriteria.push(criterion.name);
    }
  });

  return flipCriteria;
}

// =============================================================================
// TRADEOFF FORMATTING
// =============================================================================

/**
 * Generate a human-readable summary of a tradeoff
 */
export function formatTradeoff(tradeoff: Tradeoff): string {
  const gapText = tradeoff.gap === 1 ? 'slightly' :
                  tradeoff.gap === 2 ? 'notably' : 'significantly';

  return `${tradeoff.winner} is ${gapText} better at ${tradeoff.criterion} than ${tradeoff.loser}`;
}

/**
 * Generate a summary of key tradeoffs for Scout AI
 */
export function summarizeTradeoffs(
  candidates: Tool[],
  criteria: Criterion[]
): string {
  const topTradeoffs = getTopTradeoffs(candidates, criteria, 3);

  if (topTradeoffs.length === 0) {
    return 'The candidates are very similar across all criteria.';
  }

  const points = topTradeoffs.map(formatTradeoff);

  return `Key differences:\n• ${points.join('\n• ')}`;
}

/**
 * Get tradeoff icon based on significance
 */
export function getTradeoffIcon(significance: 'minor' | 'notable' | 'major'): string {
  switch (significance) {
    case 'major': return '🔴';
    case 'notable': return '🟡';
    case 'minor': return '🟢';
  }
}

/**
 * Get tradeoff color class based on significance
 */
export function getTradeoffColor(significance: 'minor' | 'notable' | 'major'): string {
  switch (significance) {
    case 'major': return 'text-red-600 bg-red-50';
    case 'notable': return 'text-amber-600 bg-amber-50';
    case 'minor': return 'text-emerald-600 bg-emerald-50';
  }
}

// =============================================================================
// DECISION CONFIDENCE
// =============================================================================

/**
 * Calculate confidence score for the top choice
 * Based on: score gap, number of major tradeoffs against leader, criteria coverage
 */
export function calculateDecisionConfidence(
  candidates: Tool[],
  criteria: Criterion[]
): { confidence: number; factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[] } {
  if (candidates.length < 2) {
    return {
      confidence: 100,
      factors: [{ label: 'Single candidate', impact: 'neutral', detail: 'Only one option to consider' }],
    };
  }

  const sorted = sortToolsByScore(candidates, criteria);
  const scoreGap = sorted[0].score.total - sorted[1].score.total;
  const leaderWeaknesses = getLeaderWeaknesses(candidates, criteria);
  const majorWeaknesses = leaderWeaknesses.filter(t => t.significance === 'major');

  const factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[] = [];
  let confidence = 75; // Base confidence

  // Score gap factor
  if (scoreGap >= 15) {
    confidence += 20;
    factors.push({ label: 'Clear leader', impact: 'positive', detail: `${scoreGap}% ahead of #2` });
  } else if (scoreGap >= 5) {
    confidence += 10;
    factors.push({ label: 'Moderate lead', impact: 'positive', detail: `${scoreGap}% ahead of #2` });
  } else {
    confidence -= 10;
    factors.push({ label: 'Close race', impact: 'negative', detail: `Only ${scoreGap}% ahead of #2` });
  }

  // Major weaknesses factor
  if (majorWeaknesses.length === 0) {
    confidence += 10;
    factors.push({ label: 'No major gaps', impact: 'positive', detail: 'Leader has no significant weaknesses' });
  } else if (majorWeaknesses.length >= 2) {
    confidence -= 15;
    factors.push({ label: 'Notable gaps', impact: 'negative', detail: `Leader loses on ${majorWeaknesses.length} key criteria` });
  }

  // Ensure confidence is within 0-100
  confidence = Math.max(0, Math.min(100, confidence));

  return { confidence, factors };
}
