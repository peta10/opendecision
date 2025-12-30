import { Tool, Criterion } from '../types';

/**
 * Unified function to get a tool's rating for a specific criterion
 * Always uses the database criteria array (tool.criteria) as the source of truth
 * @param tool - The tool object
 * @param criterionId - Either a criterion ID string or a Criterion object
 * @returns The ranking (1-5) or 0 if not found
 */
export const getToolRating = (tool: Tool, criterionId: string | Criterion): number => {
  try {
    let criterion: Criterion | null = null;
    let id: string = '';
    
    if (typeof criterionId === 'object' && criterionId !== null) {
      criterion = criterionId;
      id = criterion.id;
    } else {
      id = criterionId;
    }
    
    // First try to find in backend criteria array (source of truth)
    if (Array.isArray(tool.criteria) && tool.criteria.length > 0) {
      // First try to find by ID (most reliable)
      const criterionDataById = tool.criteria.find(c => c.id === id);
      if (criterionDataById && typeof criterionDataById.ranking === 'number') {
        return criterionDataById.ranking;
      }
      
      // Fallback: try to find by name if we have a criterion object
      const criterionName = criterion?.name;
      if (criterionName) {
        const criterionDataByName = tool.criteria.find(c => c.name === criterionName);
        if (criterionDataByName && typeof criterionDataByName.ranking === 'number') {
          return criterionDataByName.ranking;
        }
      }
    }
    
    // Fallback: check tool.ratings object (for default tools)
    if (tool.ratings && typeof tool.ratings === 'object') {
      // Try to find by criterion ID (convert to lowercase for matching)
      const ratingById = tool.ratings[id.toLowerCase()];
      if (typeof ratingById === 'number') {
        return ratingById;
      }
      
      // Try to find by criterion name (convert to lowercase for matching)
      const criterionName = criterion?.name;
      if (criterionName) {
        const ratingByName = tool.ratings[criterionName.toLowerCase()];
        if (typeof ratingByName === 'number') {
          return ratingByName;
        }
      }
    }
    
    // If not found, return 0
    return 0;
  } catch (error) {
    console.warn(`Error getting rating for criterion ${criterionId}:`, error);
    return 0;
  }
};

/**
 * Calculate the WEIGHTED match score for a tool based on selected criteria.
 * Criteria with higher user ratings (importance) count MORE in the final score.
 *
 * Formula: weightedScore = sum(criterionScore * userRating) / sum(userRatings)
 *
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate
 * @returns Score on 0-10 scale
 */
export const calculateScore = (tool: Tool, criteria: Criterion[]): number => {
  try {
    if (!criteria || criteria.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    criteria.forEach((criterion) => {
      // Get tool's capability rating (1-5) from criteria_tools table
      const toolRating = getToolRating(tool, criterion);

      // User rating IS the weight (1-5 scale)
      const userRating = criterion.userRating;

      // Calculate individual criterion score
      let criterionScore: number;
      if (toolRating >= userRating) {
        // Tool meets or exceeds requirement
        // Base score of 8 points + bonus for exceeding (max 2 bonus points)
        const excess = Math.min(toolRating - userRating, 2);
        criterionScore = 8 + excess;
      } else {
        // Tool falls short of requirement
        // Steeper penalty for not meeting requirements
        const shortfall = userRating - toolRating;
        criterionScore = Math.max(0, 7 - shortfall * 2);
      }

      // Weight by user importance
      weightedSum += criterionScore * userRating;
      totalWeight += userRating;
    });

    // Calculate weighted average
    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Only give perfect score if the calculated score is already very high
    return finalScore >= 9.8 ? 10 : finalScore;
  } catch (error) {
    console.warn('Error calculating weighted tool score:', error);
    return 0;
  }
};

/**
 * Legacy function - now uses the new calculateScore function
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate
 * @returns Score on 0-10 scale
 */
export const calculateToolScore = (tool: Tool, criteria: Criterion[]): number => {
  return calculateScore(tool, criteria);
};

/**
 * Get tool's top performing criteria (ratings >= 4)
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate
 * @returns String of comma-separated top performing criteria names
 */
export const getTopPerformerStrengths = (tool: Tool, criteria: Criterion[]): string => {
  const strengths = criteria
    .filter(c => getToolRating(tool, c) >= 4)
    .map(c => c.name)
    .slice(0, 3);
  
  return strengths.length > 0 ? strengths.join(', ') : 'No standout strengths identified';
};

/**
 * Check if a tool meets the user's rating requirement for a criterion
 * @param tool - The tool object
 * @param criterion - The criterion object with userRating
 * @returns True if tool rating >= user rating
 */
export const toolMeetsCriterion = (tool: Tool, criterion: Criterion): boolean => {
  const toolRating = getToolRating(tool, criterion);
  return toolRating >= criterion.userRating;
};

/**
 * Get the count of criteria that a tool meets user requirements for
 * @param tool - The tool object
 * @param criteria - Array of criteria with user ratings
 * @returns Number of criteria where tool rating >= user rating
 */
export const getCriteriaMatchCount = (tool: Tool, criteria: Criterion[]): number => {
  return criteria.filter(criterion => toolMeetsCriterion(tool, criterion)).length;
};

/**
 * Test function to verify getToolRating is working correctly
 * @param tool - The tool object to test
 * @param criterionId - The criterion ID to test
 * @returns Debug information about the rating lookup
 */
export const testGetToolRating = (tool: Tool, criterionId: string) => {
  // Debug logs disabled to prevent infinite loops
  // console.log('Testing getToolRating for:', tool.name, 'criterion:', criterionId);
  // console.log('Tool criteria array:', tool.criteria);
  // console.log('Tool ratings object:', tool.ratings);
  
  const rating = getToolRating(tool, criterionId);
  // console.log('Result:', rating);
  
  return {
    toolName: tool.name,
    criterionId,
    rating,
    hasCriteriaArray: Array.isArray(tool.criteria) && tool.criteria.length > 0,
    hasRatingsObject: tool.ratings && typeof tool.ratings === 'object',
    criteriaArrayLength: Array.isArray(tool.criteria) ? tool.criteria.length : 0,
    ratingsKeys: tool.ratings ? Object.keys(tool.ratings) : []
  };
};

/**
 * Custom rounding for match scores where .1-.5 rounds down, .6-.9 rounds up
 * Examples: 9.5 → 9, 8.5 → 8, 9.6 → 10, 9.3 → 9
 * @param score - The score to round
 * @returns Rounded integer
 */
export const roundMatchScore = (score: number): number => {
  const decimal = score % 1;
  
  if (decimal >= 0.6) {
    return Math.ceil(score);
  } else {
    return Math.floor(score);
  }
}; 

/**
 * Format a 0-10 match score into a percentage label for display purposes
 * while preserving the numeric percent value for optional use.
 *
 * @param score - Raw score on 0-10 scale
 * @returns Percent representation (rounded) and preformatted label string
 */
export const formatMatchScorePercentage = (
  score: number
): { percent: number; label: string } => {
  const clampedScore = Math.max(0, Math.min(10, score));
  const percent = Math.round((clampedScore / 10) * 100);

  return {
    percent,
    label: `${percent}%`
  };
};

// =============================================================================
// WEIGHTED SCORING ALGORITHM
// =============================================================================

/**
 * Calculate the WEIGHTED match score for a tool based on selected criteria.
 * Criteria with higher user ratings (importance) count MORE in the final score.
 *
 * Formula: weightedScore = sum(criterionScore * userRating) / sum(userRatings)
 *
 * Example:
 * - Scalability: userRating=5, criterionScore=9 → contribution = 45
 * - Ease of Use: userRating=2, criterionScore=6 → contribution = 12
 * - Security: userRating=4, criterionScore=8 → contribution = 32
 * - Total weight = 11, Total contribution = 89
 * - Weighted Score = 89 / 11 = 8.09
 *
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate (with userRating as weight)
 * @returns Score on 0-10 scale
 */
export const calculateWeightedScore = (tool: Tool, criteria: Criterion[]): number => {
  try {
    if (!criteria || criteria.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    criteria.forEach((criterion) => {
      // Get tool's capability rating (1-5) from criteria_tools table
      const toolRating = getToolRating(tool, criterion);

      // User rating IS the weight (1-5 scale)
      const userRating = criterion.userRating;

      // Calculate individual criterion score (same logic as calculateScore)
      let criterionScore: number;
      if (toolRating >= userRating) {
        // Tool meets or exceeds requirement
        // Base score of 8 points + bonus for exceeding (max 2 bonus points)
        const excess = Math.min(toolRating - userRating, 2);
        criterionScore = 8 + excess;
      } else {
        // Tool falls short of requirement
        // Steeper penalty for not meeting requirements
        const shortfall = userRating - toolRating;
        criterionScore = Math.max(0, 7 - shortfall * 2);
      }

      // Weight by user importance
      weightedSum += criterionScore * userRating;
      totalWeight += userRating;
    });

    // Calculate weighted average
    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Only give perfect score if the calculated score is already very high
    return finalScore >= 9.8 ? 10 : finalScore;
  } catch (error) {
    console.warn('Error calculating weighted tool score:', error);
    return 0;
  }
};

// =============================================================================
// MATCH EXPLANATION TYPES
// =============================================================================

export interface CriterionMatchDetail {
  criterionId: string;
  criterionName: string;
  toolRating: number;      // Tool's capability (1-5)
  userRating: number;      // User's requirement/importance (1-5)
  criterionScore: number;  // 0-10 score for this criterion
  status: 'exceeds' | 'meets' | 'below';
  delta: number;           // toolRating - userRating
  weight: number;          // userRating (used as weight)
  weightedContribution: number; // criterionScore * weight
}

export interface MatchExplanation {
  toolName: string;
  overallScore: number;           // Weighted score (0-10)
  overallScoreUnweighted: number; // Simple average (0-10) for comparison
  overallPercent: number;         // Weighted score as percentage
  overallLabel: string;           // "Excellent Match", "Strong Match", etc.
  criteriaBreakdown: CriterionMatchDetail[];
  strengths: string[];            // Criteria where tool exceeds requirements
  gaps: string[];                 // Criteria where tool falls short
  meetsAllCriteria: boolean;      // True if no gaps
  keyInsight: string;             // One-sentence summary for AI context
  totalWeight: number;            // Sum of all userRatings (weights)
}

/**
 * Get the display label for a match score
 * @param score - Score on 0-10 scale
 * @returns Human-readable match quality label
 */
export const getMatchLabel = (score: number): string => {
  const percent = (score / 10) * 100;
  if (percent >= 90) return 'Excellent Match';
  if (percent >= 80) return 'Strong Match';
  if (percent >= 70) return 'Good Match';
  if (percent >= 60) return 'Fair Match';
  if (percent >= 50) return 'Moderate Match';
  return 'Below Requirements';
};

/**
 * Generate a comprehensive match explanation for a tool.
 * Used by AI to explain "Why did this tool get X%?" with full data breakdown.
 *
 * @param tool - The tool to analyze
 * @param criteria - Array of criteria with user ratings
 * @returns Full explanation object with scores, breakdown, strengths, gaps, and AI insight
 */
export const generateMatchExplanation = (tool: Tool, criteria: Criterion[]): MatchExplanation => {
  const criteriaBreakdown: CriterionMatchDetail[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];
  let totalWeight = 0;
  let weightedSum = 0;
  let unweightedSum = 0;
  let meetsAllCriteria = true;

  criteria.forEach((criterion) => {
    const toolRating = getToolRating(tool, criterion);
    const userRating = criterion.userRating;
    const delta = toolRating - userRating;

    // Determine status
    let status: 'exceeds' | 'meets' | 'below';
    if (delta > 0) {
      status = 'exceeds';
      strengths.push(criterion.name);
    } else if (delta === 0) {
      status = 'meets';
    } else {
      status = 'below';
      gaps.push(criterion.name);
      meetsAllCriteria = false;
    }

    // Calculate criterion score (same logic as calculateScore)
    let criterionScore: number;
    if (toolRating >= userRating) {
      const excess = Math.min(toolRating - userRating, 2);
      criterionScore = 8 + excess;
    } else {
      const shortfall = userRating - toolRating;
      criterionScore = Math.max(0, 7 - shortfall * 2);
    }

    const weightedContribution = criterionScore * userRating;
    totalWeight += userRating;
    weightedSum += weightedContribution;
    unweightedSum += criterionScore;

    criteriaBreakdown.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      toolRating,
      userRating,
      criterionScore,
      status,
      delta,
      weight: userRating,
      weightedContribution
    });
  });

  // Calculate scores
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const overallScoreUnweighted = criteria.length > 0 ? unweightedSum / criteria.length : 0;
  const finalScore = overallScore >= 9.8 ? 10 : overallScore;
  const overallPercent = Math.round((finalScore / 10) * 100);
  const overallLabel = getMatchLabel(finalScore);

  // Generate AI-friendly key insight
  let keyInsight: string;
  if (gaps.length === 0) {
    if (strengths.length > 0) {
      keyInsight = `${tool.name} meets or exceeds all requirements, with standout performance in ${strengths.slice(0, 2).join(' and ')}.`;
    } else {
      keyInsight = `${tool.name} meets all your requirements with consistent performance across all criteria.`;
    }
  } else if (gaps.length <= 2) {
    keyInsight = `${tool.name} scores ${overallPercent}% overall but falls short in ${gaps.join(' and ')}. ${strengths.length > 0 ? `Strengths include ${strengths[0]}.` : ''}`;
  } else {
    keyInsight = `${tool.name} scores ${overallPercent}% with gaps in ${gaps.length} criteria: ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? ', and more' : ''}.`;
  }

  return {
    toolName: tool.name,
    overallScore: finalScore,
    overallScoreUnweighted,
    overallPercent,
    overallLabel,
    criteriaBreakdown,
    strengths,
    gaps,
    meetsAllCriteria,
    keyInsight,
    totalWeight
  };
};

/**
 * Generate a brief explanation string for why a tool got a specific score.
 * Useful for tooltips and quick explanations.
 *
 * @param tool - The tool to explain
 * @param criteria - Array of criteria with user ratings
 * @returns Short explanation string
 */
export const generateBriefExplanation = (tool: Tool, criteria: Criterion[]): string => {
  const explanation = generateMatchExplanation(tool, criteria);
  return explanation.keyInsight;
};

/**
 * Compare two tools and generate a comparison explanation.
 * Useful for AI to explain "Why is Tool A ranked higher than Tool B?"
 *
 * @param toolA - First tool (typically higher ranked)
 * @param toolB - Second tool (typically lower ranked)
 * @param criteria - Array of criteria with user ratings
 * @returns Comparison insight string
 */
export const generateComparisonInsight = (
  toolA: Tool,
  toolB: Tool,
  criteria: Criterion[]
): string => {
  const explainA = generateMatchExplanation(toolA, criteria);
  const explainB = generateMatchExplanation(toolB, criteria);

  const scoreDiff = explainA.overallPercent - explainB.overallPercent;

  // Find where toolA beats toolB
  const advantages: string[] = [];
  const disadvantages: string[] = [];

  criteria.forEach((criterion) => {
    const ratingA = getToolRating(toolA, criterion);
    const ratingB = getToolRating(toolB, criterion);

    if (ratingA > ratingB) {
      advantages.push(criterion.name);
    } else if (ratingB > ratingA) {
      disadvantages.push(criterion.name);
    }
  });

  if (scoreDiff > 0) {
    const advStr = advantages.length > 0
      ? `outperforms in ${advantages.slice(0, 2).join(' and ')}`
      : 'has more consistent ratings';
    return `${toolA.name} scores ${scoreDiff} points higher than ${toolB.name} because it ${advStr}.`;
  } else if (scoreDiff < 0) {
    return `${toolB.name} actually scores ${Math.abs(scoreDiff)} points higher than ${toolA.name}.`;
  } else {
    return `${toolA.name} and ${toolB.name} have identical weighted scores of ${explainA.overallPercent}%.`;
  }
}; 