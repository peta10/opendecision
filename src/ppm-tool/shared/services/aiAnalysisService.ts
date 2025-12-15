import { Tool, Criterion } from '../types';

interface AnalysisData {
  topTools: Tool[];
  criteriaWeights: Record<string, number>;
  userEmail?: string;
}

interface AnalysisResult {
  summary: string;
  keyInsights: string[];
  recommendations: string;
}

export class AIAnalysisService {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  
  static async generateAnalysis(data: AnalysisData): Promise<AnalysisResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback to basic analysis if no API key
      return this.generateBasicAnalysis(data);
    }

    try {
      const prompt = this.buildAnalysisPrompt(data);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a seasoned Project Portfolio Management consultant. Write EXTREMELY concisely - maximum 3-4 short sentences. Always bold tool names using **ToolName** format. Be direct and specific, no fluff. Focus on key differentiators and scores. Every word must add value.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return this.parseAnalysisResponse(content);
    } catch (error) {
      console.error('AI Analysis failed, using fallback:', error);
      return this.generateBasicAnalysis(data);
    }
  }

  private static buildAnalysisPrompt(data: AnalysisData): string {
    const { topTools, criteriaWeights } = data;
    
    // Get top 3 tools with their scores
    const top3 = topTools.slice(0, 3);
    
    // Find the most important criteria (highest weights)
    const sortedCriteria = Object.entries(criteriaWeights)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    const toolsData = top3.map((tool, index) => {
      // Use the EXACT same scoring algorithm as the email route
      let totalScore = 0;
      let criteriaCount = 0;

      Object.entries(criteriaWeights).forEach(([criterion, weight]) => {
        // Get tool rating using the same logic as email route
        let toolRating = 0;
        
        // First try to find in criteria array (using 'ranking' field)
        if (Array.isArray(tool.criteria)) {
          const criterionData = tool.criteria.find((c: any) => 
            c.name === criterion || 
            c.id === criterion ||
            c.name?.toLowerCase() === criterion.toLowerCase()
          );
          if (criterionData && typeof criterionData.ranking === 'number') {
            toolRating = criterionData.ranking;
          }
        }
        
        // Fallback: check tool.ratings object
        if (toolRating === 0 && tool.ratings && typeof tool.ratings === 'object') {
          toolRating = tool.ratings[criterion] || 
                      tool.ratings[criterion.toLowerCase()] || 
                      tool.ratings[criterion.replace(/\s+/g, '_')] || 0;
        }
        
        // Convert weight (0-1 decimal) back to user rating (1-5 scale)
        const userRating = Math.round(weight * 5) || 3;
        
        // Apply the EXACT frontend scoring algorithm
        if (toolRating >= userRating) {
          // Tool meets or exceeds requirement
          // Base score of 8 points + bonus for exceeding (max 2 bonus points)
          const excess = Math.min(toolRating - userRating, 2);
          totalScore += 8 + excess;
        } else {
          // Tool falls short of requirement
          // Steeper penalty for not meeting requirements
          const shortfall = userRating - toolRating;
          totalScore += Math.max(0, 7 - shortfall * 2);
        }
        
        criteriaCount++;
        console.log(`Tool: ${tool.name}, Criterion: ${criterion}, ToolRating: ${toolRating}, UserRating: ${userRating}, Weight: ${weight}`);
      });

      // Calculate final score using exact same logic as email route
      let finalScore = criteriaCount > 0 ? totalScore / criteriaCount : 0;
      
      // Only give perfect score if the calculated score is already very high
      if (finalScore >= 9.8) {
        finalScore = 10;
      }
      
      // Convert to percentage for display (0-10 scale to 0-100%)
      const percentage = Math.round((finalScore / 10) * 100);
      
      // Get unique strengths for each tool to avoid overlap
      const allStrengths = this.getToolStrengths(tool, criteriaWeights);
      const uniqueStrengths = this.getUniqueStrengths(tool, allStrengths, index, top3, criteriaWeights);
      
      // Get actual insights for each strength
      const strengthInsights = uniqueStrengths.map(strength => {
        const explanation = this.getToolExplanation(tool, strength);
        return explanation ? `${strength}: ${explanation}` : strength;
      });
      
      return {
        name: tool.name,
        score: percentage,
        strengths: uniqueStrengths,
        strengthInsights,
        position: index + 1
      };
    });

    // Calculate score differences for competitive analysis
    const scoreDiff1to2 = top3.length > 1 ? toolsData[0].score - toolsData[1].score : 0;
    const scoreDiff2to3 = top3.length > 2 ? toolsData[1].score - toolsData[2].score : 0;

    return `
You are a senior PPM consultant analyzing tool evaluation results using ACTUAL tool insights from the database. Provide analysis based on real data, not assumptions.

EVALUATION RESULTS WITH ACTUAL INSIGHTS:
${toolsData.map(tool => {
  const basicInfo = `${tool.position}. ${tool.name}: ${tool.score}%`;
  const insights = tool.strengthInsights.length > 0 
    ? `\n   Real strengths: ${tool.strengthInsights.join(' | ')}`
    : `\n   Basic strengths: ${tool.strengths.join(', ')}`;
  return basicInfo + insights;
}).join('\n\n')}

COMPETITIVE LANDSCAPE:
- Score gap between #1 and #2: ${scoreDiff1to2} points
- Score gap between #2 and #3: ${scoreDiff2to3} points

USER'S KEY PRIORITIES (weighted by importance):
${sortedCriteria.map(([criterion, weight]) => `• ${criterion}: ${Math.round(weight * 100)}% weight`).join('\n')}

ANALYSIS REQUIREMENTS:
Write EXACTLY 3-4 concise sentences maximum. Each sentence should be impactful and specific.

CRITICAL FORMATTING RULES:
- ALWAYS use **ToolName** format for bolding (exactly like this: **Smartsheet**, **Monday.com**, **Airtable**)
- Maximum 3-4 sentences total - be extremely concise
- Each tool gets ONE brief mention with its key differentiator
- Use specific percentages/scores in the analysis
- No fluff words or lengthy explanations

EXAMPLE LENGTH (do NOT copy content, just match the brevity):
"**Smartsheet** leads at 78% with enterprise-grade security features that align with your compliance priorities. **Monday.com** follows at 72% through its intuitive interface that ensures quick team adoption. **Airtable** rounds out the top three at 69% by offering unique database flexibility for complex reporting needs."

Write EXACTLY like this - short, punchy, specific. Do NOT exceed 4 sentences.`;
  }

  private static getToolStrengths(tool: Tool, criteriaWeights: Record<string, number>): string[] {
    const toolScores = Object.entries(tool.ratings).map(([criterion, rating]) => ({
      criterion,
      rating,
      weight: criteriaWeights[criterion] || 0,
      weightedScore: rating * (criteriaWeights[criterion] || 0)
    }));

    return toolScores
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3) // Get top 3 instead of 2 for more options
      .map(item => item.criterion);
  }

  private static getToolExplanation(tool: Tool, criterionName: string): string {
    try {
      // First try to find in criteria array
      if (Array.isArray(tool.criteria)) {
        const criterionData = tool.criteria.find(c => 
          c.name === criterionName || c.id === criterionName
        );
        if (criterionData && typeof criterionData.description === 'string') {
          return criterionData.description;
        }
      }

      // Then try ratingExplanations
      if (tool.ratingExplanations && typeof tool.ratingExplanations[criterionName] === 'string') {
        return tool.ratingExplanations[criterionName];
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  private static getUniqueStrengths(
    tool: Tool, 
    allStrengths: string[], 
    toolIndex: number, 
    allTools: Tool[], 
    criteriaWeights: Record<string, number>
  ): string[] {
    // Get already used strengths from previous tools
    const usedStrengths = new Set<string>();
    
    for (let i = 0; i < toolIndex; i++) {
      const prevToolStrengths = this.getToolStrengths(allTools[i], criteriaWeights);
      prevToolStrengths.forEach(strength => usedStrengths.add(strength));
    }

    // Find unique strengths for this tool
    const uniqueStrengths = allStrengths.filter(strength => !usedStrengths.has(strength));
    
    // If we have unique strengths, return up to 2
    if (uniqueStrengths.length > 0) {
      return uniqueStrengths.slice(0, 2);
    }
    
    // Fallback: return the tool's strongest areas even if not unique
    // But try to differentiate by focusing on secondary strengths
    const fallbackStrengths = allStrengths.slice(toolIndex, toolIndex + 2);
    return fallbackStrengths.length > 0 ? fallbackStrengths : allStrengths.slice(0, 1);
  }

  private static parseAnalysisResponse(content: string): AnalysisResult {
    const lines = content.split('\n').filter(line => line.trim());
    
    let summary = '';
    const keyInsights: string[] = [];
    let recommendations = '';

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('KEY_INSIGHT_')) {
        keyInsights.push(line.replace(/KEY_INSIGHT_\d+:/, '').trim());
      } else if (line.startsWith('RECOMMENDATION:')) {
        recommendations = line.replace('RECOMMENDATION:', '').trim();
      }
    }

    return {
      summary: summary || content.split('\n')[0] || 'Analysis completed successfully.',
      keyInsights: keyInsights.length > 0 ? keyInsights : ['Detailed analysis available in full report.'],
      recommendations: recommendations || 'Consider your specific organizational needs when making the final decision.'
    };
  }

  private static generateBasicAnalysis(data: AnalysisData): AnalysisResult {
    const { topTools } = data;
    const top3 = topTools.slice(0, 3);
    
    if (top3.length === 0) {
      return {
        summary: 'No tools were evaluated in this analysis.',
        keyInsights: ['Please ensure tool ratings are provided for a comprehensive analysis.'],
        recommendations: 'Review your evaluation criteria and tool selection.'
      };
    }

    const scores = top3.map(tool => {
      const totalScore = Object.values(tool.ratings).reduce((sum, rating) => sum + rating, 0) / Object.keys(tool.ratings).length;
      return Math.round(totalScore * 20); // Convert to percentage
    });

    const leader = top3[0];
    const isCloseRace = scores.length > 1 && (scores[0] - scores[1]) <= 5;

    let summary = '';
    if (isCloseRace) {
      summary = `Your evaluation reveals a competitive landscape with ${leader.name} leading at ${scores[0]}%, followed closely by ${top3[1]?.name} at ${scores[1]}%. This tight competition suggests multiple viable options for your organization.`;
    } else {
      summary = `${leader.name} emerges as the clear frontrunner with a ${scores[0]}% fit score, significantly outperforming other options in your evaluation criteria.`;
    }

    return {
      summary,
      keyInsights: [
        `${leader.name} demonstrates the strongest overall alignment with your priorities.`,
        top3.length > 1 ? `Consider ${top3[1]?.name} as a strong alternative option.` : 'Single tool evaluation completed.'
      ],
      recommendations: 'Schedule demos with your top-ranked tools to validate these findings with hands-on experience.'
    };
  }
}
