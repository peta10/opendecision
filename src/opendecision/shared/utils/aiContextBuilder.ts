/**
 * AI Context Builder Utility
 *
 * Transforms frontend application state into the context format expected
 * by the ai-chat Edge Function. This enables RAG-enhanced AI responses
 * that are aware of the user's current tool evaluation state.
 */

import {
  Tool,
  Criterion,
  AIChatContext,
  AIContextBuilderInput,
  PersonalizationData,
  GuidedRankingAnswer,
} from '../types';
import { calculateWeightedScore, generateMatchExplanation, MatchExplanation } from './toolRating';

// =============================================================================
// COMPANY SIZE MAPPING
// =============================================================================

/**
 * Map user count ranges to descriptive company size labels
 */
const USER_COUNT_TO_SIZE: Record<number, string> = {
  1: 'Small (1-10 users)',
  2: 'Small-Medium (11-50 users)',
  3: 'Medium (51-200 users)',
  4: 'Medium-Large (201-1000 users)',
  5: 'Enterprise (1000+ users)',
};

/**
 * Get company size label from user count value
 */
export const getCompanySizeLabel = (userCount?: number): string | undefined => {
  if (!userCount) return undefined;
  return USER_COUNT_TO_SIZE[userCount] || undefined;
};

// =============================================================================
// MAIN CONTEXT BUILDER
// =============================================================================

/**
 * Build the AI context object from frontend application state.
 *
 * This is the main function that transforms React state into the format
 * expected by the ai-chat Edge Function's context parameter.
 *
 * @param input - Frontend state including tools, criteria, personalization
 * @returns AIChatContext object ready to send to the Edge Function
 */
export const buildAIContext = (input: AIContextBuilderInput): AIChatContext => {
  const { selectedTools, selectedCriteria, personalizationData, guidedRankingAnswers } = input;

  // Extract tool names
  const selected_tools = selectedTools.map((tool) => tool.name);

  // Extract criteria names
  const selected_criteria = selectedCriteria.map((criterion) => criterion.name);

  // Build criteria weights map (criterion name → userRating 1-5)
  const criteria_weights: Record<string, number> = {};
  selectedCriteria.forEach((criterion) => {
    criteria_weights[criterion.name] = criterion.userRating;
  });

  // Calculate weighted match scores for each tool
  const match_scores: Record<string, number> = {};
  selectedTools.forEach((tool) => {
    const score = calculateWeightedScore(tool, selectedCriteria);
    // Convert 0-10 scale to 0-100 percentage
    match_scores[tool.name] = Math.round((score / 10) * 100);
  });

  // Extract methodology (join multiple with comma if needed)
  const methodology = personalizationData?.methodologies?.length
    ? personalizationData.methodologies.join(', ')
    : undefined;

  // Extract department (join multiple with comma if needed)
  const department = personalizationData?.departments?.length
    ? personalizationData.departments.join(', ')
    : undefined;

  // Get company size label
  const company_size = getCompanySizeLabel(personalizationData?.userCount);

  return {
    selected_tools,
    selected_criteria,
    criteria_weights,
    match_scores,
    methodology,
    department,
    company_size,
    user_count: personalizationData?.userCount,
  };
};

// =============================================================================
// CONTEXT ENRICHMENT
// =============================================================================

/**
 * Enrich context with detailed match explanations for top tools.
 * Useful when asking "Why did Tool X get this score?"
 *
 * @param context - Base AI context
 * @param tools - Tool objects to generate explanations for
 * @param criteria - Criteria with user ratings
 * @param topN - Number of top tools to include detailed explanations for
 * @returns Context with match_explanations added
 */
export const enrichContextWithExplanations = (
  context: AIChatContext,
  tools: Tool[],
  criteria: Criterion[],
  topN: number = 3
): AIChatContext & { match_explanations: Record<string, MatchExplanation> } => {
  // Sort tools by score descending
  const sortedTools = [...tools].sort((a, b) => {
    const scoreA = context.match_scores[a.name] || 0;
    const scoreB = context.match_scores[b.name] || 0;
    return scoreB - scoreA;
  });

  // Generate explanations for top N tools
  const match_explanations: Record<string, MatchExplanation> = {};
  sortedTools.slice(0, topN).forEach((tool) => {
    match_explanations[tool.name] = generateMatchExplanation(tool, criteria);
  });

  return {
    ...context,
    match_explanations,
  };
};

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Build a prompt for explaining a specific tool's match score.
 *
 * @param tool - The tool to explain
 * @param criteria - Criteria with user ratings
 * @returns Pre-formatted prompt string for the AI
 */
export const buildExplainScorePrompt = (tool: Tool, criteria: Criterion[]): string => {
  const explanation = generateMatchExplanation(tool, criteria);

  return `Explain why ${tool.name} received a ${explanation.overallPercent}% match score based on my criteria rankings.

Key data:
- Overall: ${explanation.overallLabel} (${explanation.overallPercent}%)
- Strengths (exceeds requirements): ${explanation.strengths.join(', ') || 'None'}
- Gaps (below requirements): ${explanation.gaps.join(', ') || 'None'}

Criteria breakdown:
${explanation.criteriaBreakdown
  .map(
    (c) =>
      `- ${c.criterionName}: Tool rated ${c.toolRating}/5, I need ${c.userRating}/5 (${c.status})`
  )
  .join('\n')}

Please explain this score in plain language, highlighting what makes this tool a good or poor fit for my needs.`;
};

/**
 * Build a prompt for comparing two tools.
 *
 * @param toolA - First tool (typically higher ranked)
 * @param toolB - Second tool
 * @param criteria - Criteria with user ratings
 * @returns Pre-formatted comparison prompt string
 */
export const buildCompareToolsPrompt = (
  toolA: Tool,
  toolB: Tool,
  criteria: Criterion[]
): string => {
  const explainA = generateMatchExplanation(toolA, criteria);
  const explainB = generateMatchExplanation(toolB, criteria);

  return `Compare ${toolA.name} (${explainA.overallPercent}%) vs ${toolB.name} (${explainB.overallPercent}%) based on my criteria.

${toolA.name}:
- Score: ${explainA.overallPercent}% (${explainA.overallLabel})
- Strengths: ${explainA.strengths.join(', ') || 'None identified'}
- Gaps: ${explainA.gaps.join(', ') || 'None'}

${toolB.name}:
- Score: ${explainB.overallPercent}% (${explainB.overallLabel})
- Strengths: ${explainB.strengths.join(', ') || 'None identified'}
- Gaps: ${explainB.gaps.join(', ') || 'None'}

Please explain which tool is the better fit for my needs and why, considering my priorities.`;
};

/**
 * Build a prompt for general tool recommendations.
 *
 * @param context - Current AI context
 * @returns Pre-formatted recommendation prompt
 */
export const buildRecommendationPrompt = (context: AIChatContext): string => {
  // Sort tools by score
  const sortedTools = Object.entries(context.match_scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topToolsList = sortedTools
    .map(([name, score], i) => `${i + 1}. ${name}: ${score}%`)
    .join('\n');

  const priorityCriteria = Object.entries(context.criteria_weights)
    .filter(([, rating]) => rating >= 4)
    .map(([name, rating]) => `${name} (${rating}/5)`)
    .join(', ');

  return `Based on my evaluation, here are my top-ranked PPM tools:

${topToolsList}

My high-priority criteria: ${priorityCriteria || 'All criteria weighted equally'}
${context.methodology ? `Methodology: ${context.methodology}` : ''}
${context.department ? `Department: ${context.department}` : ''}
${context.company_size ? `Company size: ${context.company_size}` : ''}

What's your recommendation? Should I go with the top-ranked tool, or are there factors I should consider?`;
};

// =============================================================================
// USER INTENT INFERENCE
// =============================================================================

/**
 * Infer user intent from guided ranking answers.
 * Helps the AI understand what the user is trying to accomplish.
 *
 * @param guidedAnswers - Guided ranking form answers
 * @returns Inferred intent string
 */
export const inferUserIntent = (
  guidedAnswers?: Record<string, GuidedRankingAnswer>
): string | undefined => {
  if (!guidedAnswers || Object.keys(guidedAnswers).length === 0) {
    return undefined;
  }

  const intents: string[] = [];

  // Check for scale/growth intent (Q1-Q2 typically relate to scalability)
  const q1Value = guidedAnswers['q1']?.value;
  const q2Value = guidedAnswers['q2']?.value;
  if (typeof q1Value === 'number' && q1Value >= 4) {
    intents.push('scaling to handle large workloads');
  }
  if (typeof q2Value === 'number' && q2Value >= 4) {
    intents.push('planning for growth');
  }

  // Check for ease of use priority (Q3)
  const q3Value = guidedAnswers['q3']?.value;
  if (typeof q3Value === 'number' && q3Value >= 4) {
    intents.push('finding an easy-to-use solution');
  }

  // Check for reporting needs (Q4)
  const q4Value = guidedAnswers['q4']?.value;
  if (typeof q4Value === 'number' && q4Value >= 4) {
    intents.push('strong reporting and analytics');
  }

  // Check for portfolio management (Q5)
  const q5Value = guidedAnswers['q5']?.value;
  if (typeof q5Value === 'number' && q5Value >= 4) {
    intents.push('enterprise portfolio management');
  }

  // Check for customization needs (Q6-Q7)
  const q6Value = guidedAnswers['q6']?.value;
  const q7Value = guidedAnswers['q7']?.value;
  if (
    (typeof q6Value === 'number' && q6Value >= 4) ||
    (typeof q7Value === 'number' && q7Value >= 4)
  ) {
    intents.push('high customization and flexibility');
  }

  // Check for integration needs (Q8)
  const q8Value = guidedAnswers['q8']?.value;
  if (typeof q8Value === 'number' && q8Value >= 4) {
    intents.push('extensive integrations with existing tools');
  }

  // Check for security priority (Q9)
  const q9Value = guidedAnswers['q9']?.value;
  if (typeof q9Value === 'number' && q9Value >= 4) {
    intents.push('enterprise-grade security and compliance');
  }

  if (intents.length === 0) {
    return 'finding a well-rounded PPM tool';
  }

  return intents.slice(0, 3).join(', ');
};

// =============================================================================
// CONTEXT SERIALIZATION
// =============================================================================

/**
 * Serialize context to a compact string for debugging or logging.
 *
 * @param context - AI context to serialize
 * @returns Human-readable summary string
 */
export const serializeContextSummary = (context: AIChatContext): string => {
  const topTools = Object.entries(context.match_scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, score]) => `${name}:${score}%`)
    .join(', ');

  const priorityCriteria = Object.entries(context.criteria_weights)
    .filter(([, rating]) => rating >= 4)
    .map(([name]) => name)
    .join(', ');

  return `Tools: ${context.selected_tools.length} | Top: ${topTools} | Priorities: ${priorityCriteria || 'balanced'} | Method: ${context.methodology || 'any'} | Size: ${context.company_size || 'unknown'}`;
};

/**
 * Check if context has meaningful data (not just defaults)
 *
 * @param context - AI context to check
 * @returns True if context has user-customized data
 */
export const hasSignificantContext = (context: AIChatContext): boolean => {
  // Check if any criteria have been adjusted from default (3)
  const hasAdjustedCriteria = Object.values(context.criteria_weights).some(
    (rating) => rating !== 3
  );

  // Check if methodology/department is set
  const hasPersonalization = !!(context.methodology || context.department || context.company_size);

  return hasAdjustedCriteria || hasPersonalization;
};
