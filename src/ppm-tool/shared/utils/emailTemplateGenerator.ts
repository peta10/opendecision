import { Tool, Criterion } from '../types';
import { getToolRating, calculateScore, roundMatchScore } from './toolRating';
import { AIAnalysisService } from '../services/aiAnalysisService';

interface EmailTemplateData {
  userEmail: string;
  firstName?: string;
  lastName?: string;
  selectedTools: Tool[];
  selectedCriteria: Criterion[];
  chartImageUrl?: string;
  logoUrl?: string;
  mattHeadshotUrl?: string;
  bookingLink?: string;
  unsubscribeLink?: string;
  preferencesLink?: string;
}

interface WeightedScore {
  tool: Tool;
  weightedScore: number;
  criteriaScores: Record<string, number>;
  overallScore: number;
}

export class PPMEmailTemplateGenerator {
  private static readonly DEFAULT_LOGO = 'https://panoramic-solutions.com/images/Logo_Panoramic_Solutions.webp';
  private static readonly DEFAULT_BOOKING_LINK = 'https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt';
  private static readonly DEFAULT_MATT_HEADSHOT = 'https://panoramic-solutions.com/images/Wagner_Headshot_2024.webp';

  /**
   * Calculate weighted scores for tools based on user criteria preferences
   */
  private static calculateWeightedScores(
    tools: Tool[],
    criteria: Criterion[]
  ): WeightedScore[] {
    return tools.map(tool => {
      // Use the same scoring algorithm as the main app
      const overallScore = calculateScore(tool, criteria);
      const criteriaScores: Record<string, number> = {};

      // Get individual criterion scores
      criteria.forEach(criterion => {
        criteriaScores[criterion.id] = getToolRating(tool, criterion);
      });

      return {
        tool,
        weightedScore: overallScore,
        criteriaScores,
        overallScore: roundMatchScore(overallScore)
      };
    }).sort((a, b) => b.weightedScore - a.weightedScore);
  }

  /**
   * Generate AI-powered insights text based on top 3 tools
   */
  private static async generateInsights(topTools: WeightedScore[], criteria: Criterion[], userEmail?: string): Promise<string> {
    if (topTools.length < 1) {
      return "Based on your criteria, these tools offer the best fit for your organization.";
    }

    try {
      // Prepare data for AI analysis
      const criteriaWeights: Record<string, number> = {};
      criteria.forEach(criterion => {
        criteriaWeights[criterion.name] = criterion.userRating / 5; // Convert 1-5 rating to decimal
      });

      const analysisData = {
        topTools: topTools.map(wt => wt.tool),
        criteriaWeights,
        userEmail
      };

      const analysis = await AIAnalysisService.generateAnalysis(analysisData);
      return analysis.summary;
    } catch (error) {
      console.error('AI Analysis failed, using fallback:', error);
      return this.generateBasicInsights(topTools, criteria);
    }
  }

  /**
   * Generate comparison table using OpenAI for enhanced insights
   */
  private static async generateComparisonTable(
    topThreeTools: WeightedScore[],
    selectedCriteria: Criterion[]
  ): Promise<string> {
    if (topThreeTools.length === 0 || selectedCriteria.length === 0) {
      return '<p style="text-align: center; color: #666;">No comparison data available.</p>';
    }

    // Get top 5 criteria based on user ratings for table display
    const topCriteria = selectedCriteria
      .sort((a, b) => b.userRating - a.userRating)
      .slice(0, 5);

    // Generate enhanced insights for each tool/criterion combination using OpenAI
    const enhancedInsights = await this.generateTableInsights(topThreeTools, topCriteria);

    return this.generateComparisonTableHTML(topThreeTools, topCriteria, enhancedInsights);
  }

  /**
   * Generate enhanced table insights using OpenAI
   */
  private static async generateTableInsights(
    topThreeTools: WeightedScore[],
    topCriteria: Criterion[]
  ): Promise<Record<string, Record<string, string>>> {
    const insights: Record<string, Record<string, string>> = {};

    // Only use OpenAI if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('ℹ️ OpenAI API key not configured, using database insights for table');
      return this.extractDatabaseInsights(topThreeTools, topCriteria);
    }

    try {
      // Process tools in parallel for better performance
      const toolPromises = topThreeTools.map(async (weightedTool) => {
        const tool = weightedTool.tool;
        const toolInsights: Record<string, string> = {};

        // Get criteria insights for this tool
        for (const criterion of topCriteria) {
          const toolRating = this.getToolRating(tool, criterion);
          const databaseInsight = this.getToolExplanation(tool, criterion);
          
          // Generate enhanced insight using OpenAI
          const enhancedInsight = await this.generateSingleInsight(
            tool.name,
            criterion.name,
            toolRating,
            criterion.userRating,
            databaseInsight
          );
          
          toolInsights[criterion.id] = enhancedInsight;
        }

        insights[tool.id] = toolInsights;
      });

      await Promise.all(toolPromises);
      return insights;

    } catch (error) {
      console.error('Error generating table insights with OpenAI:', error);
      return this.extractDatabaseInsights(topThreeTools, topCriteria);
    }
  }

  /**
   * Generate a single enhanced insight using OpenAI
   */
  private static async generateSingleInsight(
    toolName: string,
    criterionName: string,
    toolRating: number,
    userRating: number,
    databaseInsight: string
  ): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are creating concise insights for an email comparison table. Transform technical database insights into executive-friendly explanations.

RULES:
1. Maximum 60 characters for email table display
2. Focus on business value, not technical features
3. Use action-oriented language
4. Be specific about HOW the tool delivers value
5. Consider the user's rating vs tool's rating

COMPARISON CONTEXT:
- If tool rating > user rating: Emphasize "exceeds needs" 
- If tool rating = user rating: Focus on "perfect fit"
- If tool rating < user rating: Highlight "basic coverage"

OUTPUT: Single phrase, business-focused, under 60 characters.`
            },
            {
              role: 'user',
              content: `Tool: ${toolName}
Criterion: ${criterionName}
Tool Rating: ${toolRating}/5
User Rating: ${userRating}/5
Database Insight: ${databaseInsight || 'Standard capabilities available'}

Create a concise business insight (max 60 chars) that explains the VALUE this tool provides for this criterion.`
            }
          ],
          max_tokens: 30,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const insight = data.choices[0]?.message?.content?.trim();
        
        if (insight && insight.length <= 60) {
          return insight.replace(/["""]/g, '');
        }
      }
    } catch (error) {
      console.warn(`Failed to generate insight for ${toolName} - ${criterionName}:`, error);
    }

    // Fallback to database insight or generate basic insight
    return this.generateBasicInsight(toolName, criterionName, toolRating, userRating, databaseInsight);
  }

  /**
   * Extract insights from database without OpenAI enhancement
   */
  private static extractDatabaseInsights(
    topThreeTools: WeightedScore[],
    topCriteria: Criterion[]
  ): Record<string, Record<string, string>> {
    const insights: Record<string, Record<string, string>> = {};

    topThreeTools.forEach(weightedTool => {
      const tool = weightedTool.tool;
      const toolInsights: Record<string, string> = {};

      topCriteria.forEach(criterion => {
        const toolRating = this.getToolRating(tool, criterion);
        const databaseInsight = this.getToolExplanation(tool, criterion);
        
        toolInsights[criterion.id] = this.generateBasicInsight(
          tool.name,
          criterion.name,
          toolRating,
          criterion.userRating,
          databaseInsight
        );
      });

      insights[tool.id] = toolInsights;
    });

    return insights;
  }

  /**
   * Generate a basic insight without OpenAI
   */
  private static generateBasicInsight(
    toolName: string,
    criterionName: string,
    toolRating: number,
    userRating: number,
    databaseInsight: string
  ): string {
    // Use database insight if available, truncate to 60 chars
    if (databaseInsight && databaseInsight.trim().length > 0) {
      const truncated = databaseInsight.trim();
      return truncated.length > 60 ? truncated.substring(0, 57) + '...' : truncated;
    }

    // Generate basic insight based on ratings
    const comparison = toolRating >= userRating ? 'Strong' : 'Basic';
    const performance = toolRating >= 4 ? 'excellent' : toolRating >= 3 ? 'good' : 'standard';
    
    return `${comparison} ${performance} ${criterionName.toLowerCase()} capabilities`;
  }

  /**
   * Helper function to get tool rating for a criterion
   */
  private static getToolRating(tool: Tool, criterion: Criterion): number {
    // First try criteria array
    if (Array.isArray(tool.criteria)) {
      const criterionData = tool.criteria.find(c => 
        c.id === criterion.id || c.name === criterion.name
      );
      if (criterionData && typeof criterionData.ranking === 'number') {
        return criterionData.ranking;
      }
    }

    // Then try ratings object
    if (tool.ratings && typeof tool.ratings[criterion.name] === 'number') {
      return tool.ratings[criterion.name];
    }

    return 0;
  }

  /**
   * Helper function to get tool explanation for a criterion
   */
  private static getToolExplanation(tool: Tool, criterion: Criterion): string {
    // First try criteria array
    if (Array.isArray(tool.criteria)) {
      const criterionData = tool.criteria.find(c => 
        c.id === criterion.id || c.name === criterion.name
      );
      if (criterionData && typeof criterionData.description === 'string') {
        return criterionData.description;
      }
    }

    // Then try ratingExplanations
    if (tool.ratingExplanations && typeof tool.ratingExplanations[criterion.id] === 'string') {
      return tool.ratingExplanations[criterion.id];
    }

    return '';
  }

  /**
   * Fallback method for generating basic insights (original logic)
   */
  private static generateBasicInsights(topTools: WeightedScore[], criteria: Criterion[]): string {
    if (topTools.length < 2) {
      return "Based on your criteria, these tools offer the best fit for your organization.";
    }

    const tool1 = topTools[0]?.tool.name;
    const tool2 = topTools[1]?.tool.name;
    const tool3 = topTools[2]?.tool.name;

    // Find strongest criteria for top tools
    const getStrongestCriteria = (toolScores: Record<string, number>, count: number = 2) => {
      return Object.entries(toolScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, count)
        .map(([criterionId]) => {
          const criterion = criteria.find(c => c.id === criterionId);
          return criterion?.name || criterionId;
        });
    };

    const tool1Strengths = getStrongestCriteria(topTools[0].criteriaScores);
    const tool2Strengths = getStrongestCriteria(topTools[1].criteriaScores);

    if (topTools.length >= 3 && tool3) {
      return `Based on your inputs, **${tool1} ranked strongest for ${tool1Strengths.join(' and ').toLowerCase()}**, while **${tool2} excelled at ${tool2Strengths.join(' and ').toLowerCase()}**. **${tool3} remains highly competitive** across multiple criteria, making it a strong option for leaders who need balanced capabilities. Together, these insights reveal the trade-offs between specialized excellence and well-rounded performance.`;
    } else {
      return `Based on your inputs, **${tool1} ranked strongest for ${tool1Strengths.join(' and ').toLowerCase()}**, while **${tool2} excelled at ${tool2Strengths.join(' and ').toLowerCase()}**. These results highlight the key trade-offs between specialized excellence and well-rounded performance for your specific needs.`;
    }
  }

  /**
   * Generate honorable mentions list
   */
  private static generateHonorableMentions(
    allScoredTools: WeightedScore[],
    topThree: WeightedScore[]
  ): string {
    const honorableMentions = allScoredTools
      .slice(3, 6) // Get tools ranked 4-6
      .filter(scored => scored.weightedScore >= 4.0); // Only include reasonably good tools

    if (honorableMentions.length === 0) {
      return '<li><strong>No additional tools</strong> met the threshold for honorable mention based on your criteria.</li>';
    }

    return honorableMentions.map(scored => {
      const strength = this.getToolMainStrength(scored);
      return `<li><strong>${scored.tool.name}</strong> – ${strength}</li>`;
    }).join('');
  }

  /**
   * Get varied and natural strength description for a tool
   */
  private static getToolMainStrength(scoredTool: WeightedScore): string {
    const toolName = scoredTool.tool.name;
    
    // Multiple varied descriptions for each tool to avoid repetition
    const toolStrengthVariations: Record<string, string[]> = {
      'Jira': [
        'developer-centric with comprehensive agile capabilities',
        'enterprise-grade issue tracking and sprint management',
        'robust DevOps integration for technical workflows'
      ],
      'Asana': [
        'user-friendly design focused on team clarity',
        'intuitive task organization for growing teams',
        'clean interface with strong collaboration features'
      ],
      'Azure DevOps': [
        'integrated development lifecycle management',
        'Microsoft ecosystem alignment with CI/CD strengths',
        'end-to-end DevOps platform for technical teams'
      ],
      'ClickUp': [
        'all-in-one workspace with extensive customization',
        'feature-rich platform combining multiple productivity tools',
        'versatile solution for diverse organizational needs'
      ],
      'Planview': [
        'strategic portfolio management for large enterprises',
        'advanced resource optimization and capacity planning',
        'executive-level reporting with governance focus'
      ],
      'Smartsheet': [
        'spreadsheet familiarity enhanced with automation',
        'grid-based approach with enterprise workflow capabilities',
        'familiar interface bridging Excel and project management'
      ],
      'Monday.com': [
        'visual project boards with team transparency',
        'color-coded workflows for clear project visibility',
        'modern interface designed for collaborative teams'
      ],
      'Airtable': [
        'database flexibility with spreadsheet ease of use',
        'hybrid approach combining structure with usability',
        'creative workflow management with powerful integrations'
      ],
      'MS Project': [
        'comprehensive scheduling with Microsoft integration',
        'traditional project planning with enterprise features',
        'advanced resource management for complex initiatives'
      ],
      'Adobe Workfront': [
        'creative workflow optimization with portfolio management',
        'marketing-focused with strong creative team features',
        'campaign management integrated with project delivery'
      ],
      'Hive': [
        'modern interface with flexible workflow options',
        'team-centric design with good collaboration tools',
        'contemporary approach to project coordination'
      ]
    };

    const variations = toolStrengthVariations[toolName];
    if (variations && variations.length > 0) {
      // Use a hash-based approach to consistently select a variation but ensure variety
      const variationIndex = Math.abs(toolName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % variations.length;
      return variations[variationIndex];
    }

    // Fallback for unknown tools
    return `competitive performance across multiple criteria (${scoredTool.overallScore}/10 overall)`;
  }

  /**
   * Get top criteria names for display
   */
  private static getTopCriteriaForDisplay(criteria: Criterion[]): string[] {
    return criteria
      .sort((a, b) => (b.userRating || 3) - (a.userRating || 3))
      .slice(0, 3)
      .map(c => c.name);
  }

  /**
   * Generate individual radar chart images for top 3 tools
   */
  private static async generateRadarCharts(
    topThreeTools: WeightedScore[],
    selectedCriteria: Criterion[]
  ): Promise<{ toolName: string; chartImageUrl: string | null }[]> {
    const charts = [];
    
    for (let i = 0; i < topThreeTools.length; i++) {
      const { tool } = topThreeTools[i];
      
      try {
        // Use full URL for server-side requests
        const baseUrl = typeof window !== 'undefined' 
          ? '' // Client-side: use relative URL
          : process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000'; // Server-side: use full URL

        // Use canvas charts for Gmail compatibility (PNG format)
        const chartParams = new URLSearchParams({
          tool: tool.name,
          toolData: encodeURIComponent(JSON.stringify(tool)),
          criteria: selectedCriteria.map((c: any) => c.id).join(','),
          userRankings: selectedCriteria.map(() => '3').join(','), // Default user rating
          toolIndex: i.toString()
        });
        
        const imageUrl = `${baseUrl}/api/chart/dynamic.png?${chartParams.toString()}`;
        console.log(`📊 PPM Generator: Using canvas chart for ${tool.name}: ${imageUrl}`);
        charts.push({ toolName: tool.name, chartImageUrl: imageUrl });
      } catch (error) {
        console.warn(`Error generating radar chart for ${tool.name}:`, error);
        charts.push({ toolName: tool.name, chartImageUrl: null });
      }
    }
    
    return charts;
  }

  /**
   * Generate radar charts section HTML
   */
  private static generateRadarChartsHTML(
    radarCharts: { toolName: string; chartImageUrl: string | null }[]
  ): string {
    if (radarCharts.length === 0) return '';
    
    const chartsHTML = radarCharts.map(chart => `
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <h4 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px; font-weight: bold;">
          ${chart.toolName}
        </h4>
        ${chart.chartImageUrl ? `
          <img src="${chart.chartImageUrl}" alt="${chart.toolName} Comparison Chart" 
               style="max-width: 100%; height: auto; border-radius: 6px;" />
          <div style="margin-top: 10px;">
            <span style="color: #10b981; font-size: 12px;">● Your Rankings</span>
            <span style="color: #2563eb; font-size: 12px; margin-left: 15px;">● ${chart.toolName} Rankings</span>
          </div>
        ` : `
          <div style="background-color: #ffffff; padding: 30px; border-radius: 6px; border: 2px dashed #e2e8f0;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px; font-style: italic;">
              📊 Chart visualization available in your full report
            </p>
          </div>
        `}
      </div>
    `).join('');
    
    return `
      <!-- Radar Charts Section -->
      <tr>
        <td style="padding: 0 30px 25px;" class="mobile-padding">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 20px; font-weight: bold;" class="mobile-text">
            Your Rankings vs Tool Rankings
          </h3>


          <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; line-height: 22px;" class="mobile-small">
            These results combine <strong>your ranked criteria</strong> with our <strong>independent research and real-world 
            implementation experience</strong>, helping you set a foundation for <strong>lasting project portfolio success</strong>.
          </p>
          
          ${chartsHTML}
        </td>
      </tr>
    `;
  }

  /**
   * Generate comparison table HTML with enhanced insights
   */
  private static generateComparisonTableHTML(
    topThreeTools: WeightedScore[],
    topCriteria: Criterion[],
    enhancedInsights: Record<string, Record<string, string>>
  ): string {
    const tools = topThreeTools.slice(0, 3); // Ensure max 3 tools
    
    // Helper function to get star rating display
    const getStarRating = (rating: number): string => {
      const fullStars = '★'.repeat(rating);
      const emptyStars = '☆'.repeat(5 - rating);
      return fullStars + emptyStars;
    };

    // Helper function to get comparison indicator
    const getComparisonClass = (toolRating: number, userRating: number): string => {
      if (toolRating > userRating) return 'exceeds';
      if (toolRating === userRating) return 'meets';
      return 'below';
    };

    // Helper function to get ranking number
    const getRankingNumber = (index: number): string => {
      const rankings = ['#1', '#2', '#3'];
      return rankings[index] || `#${index + 1}`;
    };

    // Generate table headers
    const headerRow = `
      <tr>
        <th style="
          background-color: #4a5568;
          color: white;
          padding: 16px 12px;
          text-align: left;
          font-weight: bold;
          font-size: 14px;
          border: none;
          width: 25%;
        ">
          Your Criteria<br/>
          <span style="font-size: 11px; opacity: 0.9;">(Your Priority)</span>
        </th>
        ${tools.map((tool, index) => `
          <th style="
            background-color: #4a5568;
            color: white;
            padding: 16px 12px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            border: none;
            width: 25%;
          ">
            ${getRankingNumber(index)} ${tool.tool.name}<br/>
            <span style="font-size: 11px; opacity: 0.9;">${Math.round(tool.overallScore)}% Match</span>
          </th>
        `).join('')}
      </tr>
    `;

    // Generate table rows for each criterion
    const criteriaRows = topCriteria.map(criterion => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="
            padding: 16px 12px;
            background-color: #f8fafc;
            border: none;
            vertical-align: top;
            font-size: 13px;
            line-height: 1.4;
          ">
            <div style="font-weight: bold; color: #2d3748; margin-bottom: 4px;">
              ${criterion.name}
            </div>
            <div style="color: #4a5568; font-size: 11px;">
              Your Ranking: ${criterion.userRating}/5
            </div>
          </td>
          ${tools.map(tool => {
            const toolRating = this.getToolRating(tool.tool, criterion);
            const comparisonClass = getComparisonClass(toolRating, criterion.userRating);
            const insight = enhancedInsights[tool.tool.id]?.[criterion.id] || 'Standard capabilities';
            
            // Color coding based on comparison
            const bgColor = comparisonClass === 'exceeds' ? '#f0fff4' : 
                           comparisonClass === 'meets' ? '#eff6ff' : '#fef7f0';
            const textColor = comparisonClass === 'exceeds' ? '#065f46' : 
                             comparisonClass === 'meets' ? '#1e40af' : '#9a3412';
            
            return `
              <td style="
                padding: 16px 12px;
                background-color: ${bgColor};
                border: none;
                vertical-align: top;
                text-align: center;
                font-size: 13px;
                line-height: 1.4;
              ">
                <div style="margin-bottom: 6px;">
                  <span style="font-size: 16px;">${getStarRating(toolRating)}</span>
                </div>
                <div style="font-weight: bold; color: ${textColor}; margin-bottom: 4px;">
                  (${toolRating}/5)
                </div>
                <div style="color: #4a5568; font-size: 11px; line-height: 1.3;">
                  ${insight}
                </div>
              </td>
            `;
          }).join('')}
        </tr>
      `;
    }).join('');

    return `
      <!-- Comparison Table Section -->
      <tr>
        <td style="padding: 0 30px 25px;" class="mobile-padding">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 20px; font-weight: bold;" class="mobile-text">
            Tool Comparison Analysis
          </h3>
          <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; line-height: 22px;" class="mobile-small">
            Your top criteria vs. our recommended tools with <strong>AI-enhanced insights</strong> from our database.
          </p>
          
          <div style="overflow-x: auto; margin: 0 -15px;">
            <table style="
              width: 100%;
              max-width: 100%;
              min-width: 600px;
              border-collapse: collapse;
              background-color: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            ">
              ${headerRow}
              ${criteriaRows}
            </table>
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <div style="display: inline-block; background-color: #f8fafc; padding: 12px 20px; border-radius: 6px; font-size: 12px; color: #4a5568;">
              <span style="color: #065f46;">■ Exceeds your needs</span>
              <span style="margin: 0 15px; color: #1e40af;">■ Meets your needs</span>
              <span style="color: #9a3412;">■ Basic coverage</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }



  /**
   * Generate the complete HTML email template
   */
  public static async generateHTMLEmail(data: EmailTemplateData): Promise<string> {
    const {
      selectedTools,
      selectedCriteria,
      chartImageUrl,
      logoUrl = this.DEFAULT_LOGO,
      mattHeadshotUrl = this.DEFAULT_MATT_HEADSHOT,
      bookingLink = this.DEFAULT_BOOKING_LINK,
      unsubscribeLink = '#',
      preferencesLink = '#'
    } = data;

    // Calculate weighted scores and get top 3
    const scoredTools = this.calculateWeightedScores(selectedTools, selectedCriteria);
    const topThree = scoredTools.slice(0, 3);

    // Generate comparison table for top 3 tools using OpenAI enhancement
    const comparisonTableHTML = await this.generateComparisonTable(topThree, selectedCriteria);

    // Generate dynamic content
    const criteriaList = selectedCriteria.map(c => c.name).join(', ');
    const topCriteria = this.getTopCriteriaForDisplay(selectedCriteria);
    const insights = await this.generateInsights(topThree, selectedCriteria, data.userEmail);
    const honorableMentions = this.generateHonorableMentions(scoredTools, topThree);

    // Get our base template
    const template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Your PPM Tool Comparison Report</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset & Base Styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        
        /* Remove default styling */
        img { border: 0; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        
        /* Mobile Styles */
        @media screen and (max-width: 640px) {
            .mobile-full { width: 100% !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-text { font-size: 16px !important; line-height: 24px !important; }
            .mobile-small { font-size: 14px !important; line-height: 20px !important; }
            .mobile-center { text-align: center !important; }
            .hide-mobile { display: none !important; }
            .chart-container { width: 100% !important; }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .dark-mode-bg { background-color: #1a1a1a !important; }
            .dark-mode-text { color: #ffffff !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f9fc; font-family: Arial, sans-serif;">
    
    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0;">
        <tr>
            <td style="padding: 20px 0;">
                
                <!-- Main Email Table -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" class="mobile-full">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0057B7 0%, #2E8B57 100%); padding: 30px; border-radius: 8px 8px 0 0;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <!-- Logo -->
                                        <img src="${logoUrl}" alt="Panoramic Solutions" style="height: 40px; margin-bottom: 20px;" />
                                        
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; line-height: 34px;" class="mobile-text">
                                            ✅ Your Personalized PPM Tool Comparison Report
                                        </h1>
                                        
                                        <p style="margin: 15px 0 0 0; color: #ffffff; font-size: 16px; line-height: 24px; opacity: 0.9;" class="mobile-small">
                                            Here's how the leading tools stack up—based on your ranked criteria and our research-backed evaluation.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Criteria Context -->
                    <tr>
                        <td style="padding: 25px 30px 20px;" class="mobile-padding">
                            <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 22px;" class="mobile-small">
                                Because you ranked your priorities using our guided method across <strong>${criteriaList}</strong>, the results below map directly to what matters most for your organization.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Top 3 Recommendations Header -->
                    <tr>
                        <td style="padding: 0 30px;" class="mobile-padding">
                            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 24px; font-weight: bold; border-bottom: 3px solid #0057B7; padding-bottom: 10px;" class="mobile-text">
                                Top 3 Tools for your Project Portfolio Management Use Case
                            </h2>
                        </td>
                    </tr>
                    
                    <!-- Top 3 Tools Table -->
                    <tr>
                        <td style="padding: 0 30px 25px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <!-- Table Header -->
                                <tr style="background-color: #f7fafc;">
                                    <td style="padding: 15px; font-weight: bold; color: #2d3748; font-size: 14px; border-right: 1px solid #e2e8f0;">
                                        Tool
                                    </td>
                                    <td style="padding: 15px; font-weight: bold; color: #2d3748; font-size: 14px; border-right: 1px solid #e2e8f0; text-align: center;" class="hide-mobile">
                                        ${topCriteria[0] || 'Criterion 1'}
                                    </td>
                                    <td style="padding: 15px; font-weight: bold; color: #2d3748; font-size: 14px; border-right: 1px solid #e2e8f0; text-align: center;" class="hide-mobile">
                                        ${topCriteria[1] || 'Criterion 2'}
                                    </td>
                                    <td style="padding: 15px; font-weight: bold; color: #2d3748; font-size: 14px; border-right: 1px solid #e2e8f0; text-align: center;" class="hide-mobile">
                                        ${topCriteria[2] || 'Criterion 3'}
                                    </td>
                                    <td style="padding: 15px; font-weight: bold; color: #2d3748; font-size: 14px; text-align: center;">
                                        Overall
                                    </td>
                                </tr>
                                
                                ${topThree.map((scored, index) => {
                                  const tool = scored.tool;
                                  const topCriteriaObjects = topCriteria.map(name => 
                                    selectedCriteria.find(c => c.name === name)
                                  ).filter(Boolean) as Criterion[];
                                  
                                  const criterion1Score = topCriteriaObjects[0] ? getToolRating(tool, topCriteriaObjects[0]) : 0;
                                  const criterion2Score = topCriteriaObjects[1] ? getToolRating(tool, topCriteriaObjects[1]) : 0;
                                  const criterion3Score = topCriteriaObjects[2] ? getToolRating(tool, topCriteriaObjects[2]) : 0;
                                  
                                  return `
                                <!-- Tool ${index + 1} -->
                                <tr${index < 2 ? ' style="border-bottom: 1px solid #e2e8f0;"' : ''}>
                                    <td style="padding: 15px; font-weight: bold; color: #0057B7; font-size: 16px; border-right: 1px solid #e2e8f0;">
                                        ${tool.name}
                                    </td>
                                    <td style="padding: 15px; font-size: 16px; text-align: center; border-right: 1px solid #e2e8f0;" class="hide-mobile">
                                        <strong>${criterion1Score}/5</strong>
                                    </td>
                                    <td style="padding: 15px; font-size: 16px; text-align: center; border-right: 1px solid #e2e8f0;" class="hide-mobile">
                                        <strong>${criterion2Score}/5</strong>
                                    </td>
                                    <td style="padding: 15px; font-size: 16px; text-align: center; border-right: 1px solid #e2e8f0;" class="hide-mobile">
                                        <strong>${criterion3Score}/5</strong>
                                    </td>
                                    <td style="padding: 15px; font-size: 18px; font-weight: bold; color: #0057B7; text-align: center;">
                                        ${scored.overallScore}/10
                                    </td>
                                </tr>`;
                                }).join('')}
                            </table>
                            
                            <p style="margin: 15px 0 0 0; color: #718096; font-size: 14px; font-style: italic;" class="mobile-small">
                                *These are the three best-fit tools based on your weighted priorities.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Key Insights -->
                    <tr>
                        <td style="padding: 0 30px 25px;" class="mobile-padding">
                            <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 24px; font-weight: bold;" class="mobile-text">
                                Analysis Summary
                            </h3>
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0057B7;">
                                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 24px;" class="mobile-small">
                                    ${insights.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Honorable Mentions -->
                    <tr>
                        <td style="padding: 0 30px 25px;" class="mobile-padding">
                            <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 20px; font-weight: bold;" class="mobile-text">
                                Honorable Mentions:
                            </h3>
                            <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 15px; line-height: 24px;" class="mobile-small">
                                ${honorableMentions}
                            </ul>
                        </td>
                    </tr>
                    
                    ${comparisonTableHTML}
                    
                    <!-- Value Proposition -->
                    <tr>
                        <td style="padding: 0 30px 25px;" class="mobile-padding">
                            <div style="background-color: #edf2f7; padding: 25px; border-radius: 8px; text-align: center;">
                                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 24px;" class="mobile-small">
                                    These results combine <strong>your ranked criteria</strong> with our <strong>independent research and real-world implementation experience</strong>, giving you a clear foundation to build your business case while avoiding costly trial-and-error.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA Section -->
                    <tr>
                        <td style="padding: 0 30px 40px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <h3 style="margin: 0 0 20px 0; color: #2d3748; font-size: 20px; font-weight: bold;" class="mobile-text">
                                            👉 Ready to Move Forward?
                                        </h3>
                                        <p style="margin: 0 0 25px 0; color: #4a5568; font-size: 15px; line-height: 22px;" class="mobile-small">
                                            We'll walk through your results and map the fastest path to adoption success.
                                        </p>
                                        
                                        <!-- Contact Information -->
                                        <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 22px; text-align: center;" class="mobile-small">
                                            Questions about your results? Reply to this email and we'll help you interpret the findings.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Signature -->
                    <tr>
                        <td style="padding: 30px; background-color: #f7fafc; border-radius: 0 0 8px 8px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 15px; line-height: 22px;" class="mobile-small">
                                            Talk soon,
                                        </p>
                                        <p style="margin: 0; color: #2d3748; font-size: 16px; font-weight: bold;" class="mobile-text">
                                            <strong>Matt Wagner</strong><br>
                                            <span style="font-weight: normal; color: #4a5568;">Founder, Panoramic Solutions</span>
                                        </p>
                                    </td>
                                    <td style="text-align: right; width: 80px;" class="hide-mobile">
                                        <img src="${mattHeadshotUrl}" alt="Matt Wagner" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid #e2e8f0;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Footer -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 20px auto 0;" class="mobile-full">
                    <tr>
                        <td style="padding: 20px 30px; text-align: center;" class="mobile-padding">
                            <p style="margin: 0 0 10px 0; color: #718096; font-size: 13px; line-height: 18px;" class="mobile-small">
                                © 2024 Panoramic Solutions. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #718096; font-size: 12px; line-height: 16px;" class="mobile-small">
                                You received this email because you requested a PPM tool comparison report from PanoramicSolutions.com<br>
                                <a href="${unsubscribeLink}" style="color: #0057B7; text-decoration: underline;">Unsubscribe</a> | 
                                <a href="${preferencesLink}" style="color: #0057B7; text-decoration: underline;">Email Preferences</a>
                            </p>
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>`;

    return template;
  }

  /**
   * Generate plain text version for email clients that don't support HTML
   */
  public static async generatePlainTextEmail(data: EmailTemplateData): Promise<string> {
    const { selectedTools, selectedCriteria } = data;
    
    // Calculate weighted scores and get top 3
    const scoredTools = this.calculateWeightedScores(selectedTools, selectedCriteria);
    const topThree = scoredTools.slice(0, 3);

    const criteriaList = selectedCriteria.map(c => c.name).join(', ');
    const rawInsights = await this.generateInsights(topThree, selectedCriteria, data.userEmail);
    const insights = rawInsights
      .replace(/\*\*/g, '')
      .replace(/<[^>]*>/g, '');

    return `
YOUR PPM TOOL COMPARISON REPORT
================================

${data.firstName ? `Hi ${data.firstName}!` : 'Hi there!'}

Here's how the leading PPM tools stack up based on your ranked criteria and our research-backed evaluation.

CRITERIA ANALYZED: ${criteriaList}

TOP 3 RECOMMENDATIONS:
======================

1. ${topThree[0]?.tool.name || 'N/A'} - Overall Score: ${topThree[0]?.overallScore || 'N/A'}/10
2. ${topThree[1]?.tool.name || 'N/A'} - Overall Score: ${topThree[1]?.overallScore || 'N/A'}/10
3. ${topThree[2]?.tool.name || 'N/A'} - Overall Score: ${topThree[2]?.overallScore || 'N/A'}/10

*These are the three best-fit tools based on your weighted priorities.

KEY INSIGHTS:
=============
${insights}

These results combine your ranked criteria with our independent research and real-world implementation experience, giving you a clear foundation to build your business case while avoiding costly trial-and-error.

READY TO MOVE FORWARD?
======================
We'll walk through your results and map the fastest path to adoption success.

Book your strategy call: ${data.bookingLink || this.DEFAULT_BOOKING_LINK}

Talk soon,
Matt Wagner
Founder, Panoramic Solutions

---
© 2024 Panoramic Solutions. All rights reserved.
You received this email because you requested a PPM tool comparison report from PanoramicSolutions.com

To unsubscribe: ${data.unsubscribeLink || '#'}
`;
  }

  /**
   * Generate Resend-compatible email payload
   */
  public static async generateResendPayload(data: EmailTemplateData, testMode = false): Promise<{
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    tags: Array<{ name: string; value: string }>;
  }> {
    // In test mode, use a simple template to isolate delivery issues
    if (testMode) {
      const simpleHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1 style="color: #0057B7;">PPM Tool Report Test</h1>
            <p>This is a test email from your PPM Tool comparison system.</p>
            <p><strong>Tools analyzed:</strong> ${data.selectedTools.length}</p>
            <p><strong>Criteria used:</strong> ${data.selectedCriteria.length}</p>
            <p>If you received this email, the system is working correctly!</p>
            <hr>
            <p><em>Matt Wagner, PMP<br>Panoramic Solutions</em></p>
          </body>
        </html>
      `;
      
      const simpleText = `
PPM Tool Report Test

This is a test email from your PPM Tool comparison system.
Tools analyzed: ${data.selectedTools.length}
Criteria used: ${data.selectedCriteria.length}

If you received this email, the system is working correctly!

Matt Wagner, PMP
Panoramic Solutions
      `.trim();

      return {
        from: 'Matt Wagner <matt.wagner@panoramic-solutions.com>',
        to: data.userEmail,
        subject: '[TEST] PPM Tool Comparison System',
        html: simpleHtml,
        text: simpleText,
        tags: [
          { name: 'category', value: 'ppm-tool-test' },
          { name: 'source', value: 'comparison-tool-test' }
        ]
      };
    }

    const topTool = this.calculateWeightedScores(data.selectedTools, data.selectedCriteria)[0];
    const subjectLine = topTool ? 
      `Your PPM Tool Report: ${topTool.tool.name} Leads Your Analysis` :
      'Your PPM Tool Comparison Report (See Results Below)';

    return {
      from: 'Matt Wagner <matt.wagner@panoramic-solutions.com>',
      to: data.userEmail,
      subject: subjectLine,
      html: await this.generateHTMLEmail(data),
      text: await this.generatePlainTextEmail(data),
      tags: [
        { name: 'category', value: 'ppm-tool-report' },
        { name: 'source', value: 'comparison-tool' },
        { name: 'tool_count', value: data.selectedTools.length.toString() },
        { name: 'criteria_count', value: data.selectedCriteria.length.toString() }
      ]
    };
  }
}
