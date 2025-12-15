import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { PPMReportEmailTemplate } from '@/components/email/PPMReportEmailTemplate';
import { render } from '@react-email/render';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY!);

// Initialize Supabase client (with fallback for missing env vars)
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
      ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)!
    )
  : null;

// Helper function to get tool rating using the same logic as frontend
function getToolRating(tool: any, criterion: any): number {
  try {
    const id = criterion.id;
    
    // First try to find in backend criteria array (source of truth)
    if (Array.isArray(tool.criteria) && tool.criteria.length > 0) {
      const criterionDataById = tool.criteria.find((c: any) => c.id === id);
      if (criterionDataById && typeof criterionDataById.ranking === 'number') {
        return criterionDataById.ranking;
      }
      
      const criterionDataByName = tool.criteria.find((c: any) => c.name === criterion.name);
      if (criterionDataByName && typeof criterionDataByName.ranking === 'number') {
        return criterionDataByName.ranking;
      }
    }
    
    // Fallback: check tool.ratings object
    if (tool.ratings && typeof tool.ratings === 'object') {
      if (typeof tool.ratings[id] === 'number') {
        return tool.ratings[id];
      }
      
      // Try by name
      if (typeof tool.ratings[criterion.name] === 'number') {
        return tool.ratings[criterion.name];
      }
    }
    
    return 0; // Not found
  } catch (error) {
    console.warn(`Error getting rating for criterion ${criterion.id}:`, error);
    return 0;
  }
}

// Helper function using the exact same scoring algorithm as the frontend
function calculateTopRecommendations(tools: any[], criteria: any[]) {
  const scoredTools = tools.map(tool => {
    let totalScore = 0;
    let meetsAllCriteria = true;

    criteria.forEach((criterion) => {
      // Get tool's capability rating (1-5) from criteria_tools table
      const toolRating = getToolRating(tool, criterion);
      
      // Get user's importance ranking (1-5) - this is the weight/userRating
      const userRating = criterion.userRating || criterion.weight || 5;

      // Check if tool meets minimum requirement
      if (toolRating < userRating) {
        meetsAllCriteria = false;
      }

      // Calculate individual criterion score using frontend algorithm
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
    });

    // Calculate average score across all criteria
    let finalScore = totalScore / criteria.length;

    // Only give perfect score if the calculated score is already very high
    if (finalScore >= 9.8) {
      finalScore = 10;
    }
    
    // Convert to percentage for display (0-10 scale to 0-100%)
    const percentageScore = (finalScore / 10) * 100;

    return {
      tool,
      score: Math.round(percentageScore), // Round to whole percentage
      rawScore: finalScore, // Keep raw 0-10 score
      averageRating: finalScore
    };
  });
  
  // Sort by raw score descending and add ranks
  const sortedTools = scoredTools
    .sort((a, b) => b.rawScore - a.rawScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
  return sortedTools;
}

// NOTE: generateDynamicInsights has been replaced with generateAIInsights which uses the AIAnalysisService

// Helper function to parse guided ranking data for marketing insights
function parseGuidedRankingData(guidedRankingAnswers: any, personalizationData: any) {
  const parsedData = {
    project_volume_annually: null,
    tasks_per_project: null,
    user_expertise_level: null,
    user_count: null,
    departments: [],
    methodologies: [],
    has_guided_data: false
  };

  // Extract key marketing data from guided ranking answers
  if (guidedRankingAnswers && typeof guidedRankingAnswers === 'object') {
    parsedData.has_guided_data = true;
    
    // Q1: Project volume annually
    if (guidedRankingAnswers.q1?.value) {
      parsedData.project_volume_annually = guidedRankingAnswers.q1.value;
    }
    
    // Q2: Tasks per project
    if (guidedRankingAnswers.q2?.value) {
      parsedData.tasks_per_project = guidedRankingAnswers.q2.value;
    }
    
    // Q3: User expertise level
    if (guidedRankingAnswers.q3?.value) {
      parsedData.user_expertise_level = guidedRankingAnswers.q3.value;
    }
    
    // Q10: User count
    if (guidedRankingAnswers.q10?.value) {
      parsedData.user_count = guidedRankingAnswers.q10.value;
    }
    
    // Q11: Departments (multi-select)
    if (guidedRankingAnswers.q11?.value && Array.isArray(guidedRankingAnswers.q11.value)) {
      const departmentMap: { [key: number]: string } = {
        1: 'Engineering',
        2: 'Marketing', 
        3: 'Product & Design',
        4: 'IT & Support',
        5: 'Sales & Account Management',
        6: 'Operations',
        7: 'Finance',
        8: 'HR',
        9: 'Other'
      };
      parsedData.departments = guidedRankingAnswers.q11.value.map((val: number) => departmentMap[val]).filter(Boolean);
    }
    
    // Q12: Methodologies (multi-select)
    if (guidedRankingAnswers.q12?.value && Array.isArray(guidedRankingAnswers.q12.value)) {
      const methodologyMap: { [key: number]: string } = {
        1: 'Agile',
        2: 'Waterfall',
        3: 'Continuous Improvement'
      };
      parsedData.methodologies = guidedRankingAnswers.q12.value.map((val: number) => methodologyMap[val]).filter(Boolean);
    }
  }

  // Also check personalization data as fallback
  if (personalizationData && typeof personalizationData === 'object') {
    if (!parsedData.user_count && personalizationData.userCount) {
      parsedData.user_count = personalizationData.userCount;
      parsedData.has_guided_data = true;
    }
    
    if (!parsedData.departments.length && personalizationData.departments) {
      parsedData.departments = personalizationData.departments;
      parsedData.has_guided_data = true;
    }
    
    if (!parsedData.methodologies.length && personalizationData.methodologies) {
      parsedData.methodologies = personalizationData.methodologies;
      parsedData.has_guided_data = true;
    }
  }

  return parsedData;
}

// Handle React email format
async function handleReactEmail(request: NextRequest, body: any) {
  const { 
    userEmail,
    firstName,
    lastName, 
    selectedTools, 
    selectedCriteria, 
    chartImageUrl,
    userAgent,
    guidedRankingAnswers,
    personalizationData
  } = body;

  // Validate required fields
  if (!userEmail || !firstName || !lastName || !selectedTools || !selectedCriteria) {
    return NextResponse.json(
      { message: 'Missing required fields: userEmail, firstName, lastName, selectedTools, selectedCriteria' },
      { status: 400 }
    );
  }

  // Generate email hash for privacy
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex');
  
  // Debug: Log the data structures we're working with
  console.log('📧 Email API Debug:');
  console.log('Tools count:', selectedTools.length);
  console.log('Criteria count:', selectedCriteria.length);
  
  // Log first tool structure
  if (selectedTools.length > 0) {
    console.log('First tool structure:', {
      name: selectedTools[0].name,
      hasRatings: !!selectedTools[0].ratings,
      hasCriteria: !!selectedTools[0].criteria,
      ratingsKeys: selectedTools[0].ratings ? Object.keys(selectedTools[0].ratings) : [],
      criteriaCount: selectedTools[0].criteria ? selectedTools[0].criteria.length : 0
    });
  }
  
  // Log first criterion structure
  if (selectedCriteria.length > 0) {
    console.log('First criterion structure:', {
      id: selectedCriteria[0].id,
      name: selectedCriteria[0].name,
      weight: selectedCriteria[0].weight,
      userRating: selectedCriteria[0].userRating,
      allKeys: Object.keys(selectedCriteria[0])
    });
  }

  // Calculate top recommendations
  const topRecommendations = calculateTopRecommendations(selectedTools, selectedCriteria);
  
  // Extract user rankings from criteria for chart generation
  const userRankings = selectedCriteria.reduce((acc: any, criterion: any) => {
    acc[criterion.id] = criterion.userRating || 3; // Default to 3 if not specified
    return acc;
  }, {});
  
  // Parse guided ranking data for marketing insights
  const marketingData = parseGuidedRankingData(guidedRankingAnswers, personalizationData);
  console.log('📊 Parsed marketing data:', marketingData);

  // Helper function to get tool color in hex format for legends (simplified to just blue)
  const getToolColorHex = (): string => {
    return '2563eb'; // Blue for all tools
  };

  // Helper function to get tool explanation (same as in the components)
  const getToolExplanation = (tool: any, criterion: any): string => {
    try {
      if (Array.isArray(tool.criteria)) {
        const criterionData = tool.criteria.find((c: any) => 
          c.id === criterion.id || c.name === criterion.name
        );
        if (criterionData && typeof criterionData.description === 'string') {
          return criterionData.description;
        }
      }

      if (tool.ratingExplanations && typeof tool.ratingExplanations[criterion.id] === 'string') {
        return tool.ratingExplanations[criterion.id];
      }

      return '';
    } catch (error) {
      return '';
    }
  };

  // Smart highlights generator - Uses actual tool insights from database
  const generateSmartHighlights = async (tool: any, userCriteria: any[]) => {
    try {
      // Step 1: Rules-based logic to identify tool strengths with actual insights
      const toolStrengths = userCriteria
        .map((criterion: any) => {
          const toolScore = getToolRating(tool, criterion);
          const importance = (criterion.userRating || criterion.weight || 5) * (toolScore || 0);
          
          // Get actual explanation from tool data
          const explanation = getToolExplanation(tool, criterion);
          
          return {
            name: criterion.name,
            toolScore,
            userPriority: criterion.userRating || criterion.weight || 5,
            importance,
            explanation: explanation || ''
          };
        })
        .filter(item => item.toolScore >= 4) // Only consider strong areas (4+ rating)
        .sort((a, b) => b.importance - a.importance) // Sort by importance (user priority * tool score)
        .slice(0, 2); // Top 2 most important strengths

      // Identify user's top priorities (highest user ratings)
      const topPriorities = userCriteria
        .sort((a, b) => (b.userRating || 0) - (a.userRating || 0))
        .slice(0, 3)
        .map(c => c.name);

      if (toolStrengths.length === 0) {
        // No strong areas found, create a generic but tool-specific highlight
        const toolSpecificHighlights: Record<string, string> = {
          'Airtable': 'Flexible database approach with excellent usability',
          'Smartsheet': 'Spreadsheet-like interface with powerful automation',
          'Monday.com': 'Intuitive interface and team collaboration features',
          'Jira': 'Comprehensive project tracking and agile capabilities',
          'Asana': 'Clean interface with strong task management',
          'ClickUp': 'All-in-one workspace with customizable features',
          'Notion': 'Versatile workspace combining notes and project management',
          'Trello': 'Visual boards for simple project organization',
          'Azure DevOps': 'Integrated development and project management suite',
          'MS Project': 'Enterprise-grade project planning and scheduling'
        };
        
        return toolSpecificHighlights[tool.name] || "Balanced performance across all areas";
      }

      // Step 2: Create comprehensive data for AI polishing using actual insights
      const rawHighlight = toolStrengths.map(s => `${s.name} ${s.toolScore}/5`).join(', ');
      const strengthNames = toolStrengths.map(s => s.name);
      const actualInsights = toolStrengths
        .filter(s => s.explanation && s.explanation.trim().length > 0)
        .map(s => `${s.name}: ${s.explanation.trim()}`)
        .join(' | ');
      
      // Step 3: AI Polish via OpenAI using actual tool insights (with fallback to rules-based)
      if (process.env.OPENAI_API_KEY) {
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
                content: `You are a business consultant creating unique, specific highlights for PPM tools. Each tool needs a DISTINCT value proposition.

CRITICAL RULES:
1. NO generic phrases like "Strong in" or "Excels at" 
2. Be SPECIFIC about HOW the tool delivers value
3. Focus on the UNIQUE differentiator for this specific tool
4. Use CONCRETE benefits, not abstract strengths
5. Each highlight must sound completely different from others

SPECIFIC GUIDANCE BY TOOL:
- Airtable: Emphasize database flexibility + ease of use combination
- Jira: Focus on agile/development workflow integration
- Smartsheet: Highlight familiar spreadsheet interface + enterprise features
- Monday.com: Emphasize visual project management + team collaboration
- Asana: Focus on task organization + simplicity
- ClickUp: Emphasize all-in-one functionality + customization
- Planview: Focus on enterprise portfolio management capabilities

OUTPUT FORMATS (vary these):
- "Built for [specific use case] with [unique approach]"
- "[Unique feature] designed for [target user]"
- "Transforms [process] through [specific method]"
- "[Key differentiator] meets [business need]"
- "Specialized for [use case] requiring [specific capability]"

Keep under 12 words. Be concrete and specific, not generic.`
              },
              {
                role: 'user',
                content: `Tool: ${tool.name}
User's top priorities: ${topPriorities.join(', ')}
Tool scores: ${rawHighlight}
Key differentiators: ${strengthNames.join(' and ')}

ACTUAL TOOL INSIGHTS FROM DATABASE:
${actualInsights || 'No specific insights available - use tool knowledge'}

Create a UNIQUE highlight for ${tool.name} that:
1. Uses the actual insights above to explain HOW it delivers value
2. Focuses on its specific competitive advantage based on real data
3. Connects to user priorities: ${topPriorities.slice(0, 2).join(' and ')}
4. Transforms technical insights into business benefits

Base your response on the actual insights provided, not generic assumptions.`
              }
            ],
            max_tokens: 50,
            temperature: 0.9
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiHighlight = data.choices[0]?.message?.content?.trim();
          
          if (aiHighlight && aiHighlight.length > 0 && aiHighlight.length <= 80) {
            console.log(`🤖 AI-polished highlight for ${tool.name}: "${aiHighlight}"`);
            return aiHighlight.replace(/["""]/g, ''); // Remove any quotes
          }
        }
        } catch (aiError) {
          console.log(`⚠️ AI highlight failed for ${tool.name}, using rules-based fallback`);
        }
      } else {
        console.log(`ℹ️ OpenAI API key not configured, using rules-based highlights for ${tool.name}`);
      }
      
      // Fallback: Rules-based highlight with tool-specific uniqueness
      const primaryStrength = strengthNames[0]?.toLowerCase() || 'overall performance';
      const secondaryStrength = strengthNames[1]?.toLowerCase();
      
      // Tool-specific fallback highlights that emphasize unique value props
      const toolSpecificFallbacks: Record<string, string> = {
        'Airtable': secondaryStrength ? `Database flexibility meets ${secondaryStrength} for hybrid teams` : 'Database-driven project management with spreadsheet familiarity',
        'Jira': secondaryStrength ? `Agile-native platform with strong ${secondaryStrength}` : 'Developer-centric project tracking with enterprise scalability',
        'Smartsheet': secondaryStrength ? `Spreadsheet interface enhanced by ${secondaryStrength}` : 'Enterprise spreadsheet approach to project management',
        'Monday.com': secondaryStrength ? `Visual workflow design with ${secondaryStrength}` : 'Color-coded project boards for team transparency',
        'Asana': secondaryStrength ? `Clean task management with ${secondaryStrength}` : 'Intuitive task organization for focus-driven teams',
        'ClickUp': secondaryStrength ? `All-in-one workspace featuring ${secondaryStrength}` : 'Comprehensive project hub with customizable workflows',
        'Planview': secondaryStrength ? `Enterprise portfolio control with ${secondaryStrength}` : 'Strategic portfolio management for large organizations',
        'Azure DevOps': secondaryStrength ? `Integrated development lifecycle with ${secondaryStrength}` : 'End-to-end DevOps platform for technical teams'
      };
      
      if (toolSpecificFallbacks[tool.name]) {
        return toolSpecificFallbacks[tool.name];
      }
      
      // Generic fallback patterns with more variation
      const fallbackPatterns = [
        () => `Built for ${primaryStrength} with enterprise-grade reliability`,
        () => `Specialized approach to ${primaryStrength} for modern teams`,
        () => `Transforms ${primaryStrength} through intuitive design`,
        () => secondaryStrength ? `Balances ${primaryStrength} with ${secondaryStrength} capabilities` : `Focused on ${primaryStrength} excellence`,
        () => `Designed for teams where ${primaryStrength} drives success`,
        () => `Professional-grade ${primaryStrength} platform`,
        () => {
          // Context-aware pattern selection
          if (primaryStrength.includes('ease of use') || primaryStrength.includes('usability')) {
            return `User-friendly with strong functionality`;
          } else if (primaryStrength.includes('integration')) {
            return `Seamless connectivity and workflow integration`;
          } else if (primaryStrength.includes('collaboration')) {
            return `Built for team coordination and communication`;
          } else {
            return `Balances ${primaryStrength} with intuitive design`;
          }
        }
      ];
      
      // Use tool name hash to consistently pick a pattern (but still varied across tools)
      const patternIndex = Math.abs(tool.name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % fallbackPatterns.length;
      return fallbackPatterns[patternIndex]();
      
    } catch (error) {
      console.error('Error generating highlights:', error);
      return "Solid overall capabilities";
    }
  };
  
  // Function to generate comparison table for the top 3 tools (replaces radar charts)
  const generateComparisonTableHTML = async (tools: any[], criteria: any[], userRankings: any) => {
    try {
      console.log('📊 Generating comparison table for', tools.length, 'tools');
      
      if (tools.length === 0 || criteria.length === 0) {
        return '<p style="text-align: center; color: #666;">No comparison data available.</p>';
      }

      // Show all criteria, sorted by user ratings for table display
      const topCriteria = criteria
        .sort((a: any, b: any) => (b.userRating || 0) - (a.userRating || 0));

      // Generate enhanced insights for each tool/criterion combination using OpenAI
      const enhancedInsights = await generateTableInsights(tools, topCriteria, userRankings);

      return generateTableHTML(tools, topCriteria, enhancedInsights, userRankings);

    } catch (error) {
      console.error('❌ Error generating comparison table:', error);
      return '<p style="text-align: center; color: #666;">Comparison table temporarily unavailable.</p>';
    }
  };

  // Generate enhanced table insights using OpenAI
  const generateTableInsights = async (tools: any[], topCriteria: any[], userRankings: any): Promise<Record<string, Record<string, string>>> => {
    const insights: Record<string, Record<string, string>> = {};

    // Only use OpenAI if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('ℹ️ OpenAI API key not configured, using database insights for table');
      return extractDatabaseInsights(tools, topCriteria, userRankings);
    }

    try {
      // Process tools in parallel for better performance
      const toolPromises = tools.map(async (recommendation: any) => {
        const tool = recommendation.tool;
        const toolInsights: Record<string, string> = {};

        // Get criteria insights for this tool
        for (const criterion of topCriteria) {
          const toolRating = getToolRating(tool, criterion);
          const databaseInsight = getToolExplanation(tool, criterion);
          
          // Generate enhanced insight using OpenAI
          const enhancedInsight = await generateSingleInsight(
            tool.name,
            criterion.name,
            toolRating,
            criterion.userRating || 3,
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
      return extractDatabaseInsights(tools, topCriteria, userRankings);
    }
  };

  // Generate a single enhanced insight using OpenAI
  const generateSingleInsight = async (
    toolName: string,
    criterionName: string,
    toolRating: number,
    userRating: number,
    databaseInsight: string
  ): Promise<string> => {
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
1. Maximum 80 characters for email table display
2. Focus on business value, not technical features
3. Use action-oriented language
4. Be specific about HOW the tool delivers value
5. Consider the user's rating vs tool's rating
6. Leverage the database insight provided

COMPARISON CONTEXT:
- If tool rating > user rating: Emphasize "exceeds needs" 
- If tool rating = user rating: Focus on "perfect fit"
- If tool rating < user rating: Highlight "basic coverage"

OUTPUT: Single phrase, business-focused, under 80 characters.`
            },
            {
              role: 'user',
              content: `Tool: ${toolName}
Criterion: ${criterionName}
Tool Rating: ${toolRating}/5
User Rating: ${userRating}/5
Database Insight: ${databaseInsight || 'Standard capabilities available'}

Create a concise business insight (max 80 chars) that explains the VALUE this tool provides for this criterion. Use the database insight to make it specific and meaningful.`
            }
          ],
          max_tokens: 30,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const insight = data.choices[0]?.message?.content?.trim();
        
        if (insight && insight.length <= 80) {
          return insight.replace(/["""]/g, '');
        }
      }
    } catch (error) {
      console.warn(`Failed to generate insight for ${toolName} - ${criterionName}:`, error);
    }

    // Fallback to database insight or generate basic insight
    return generateBasicInsight(toolName, criterionName, toolRating, userRating, databaseInsight);
  };

  // Extract insights from database without OpenAI enhancement
  const extractDatabaseInsights = (tools: any[], topCriteria: any[], userRankings: any): Record<string, Record<string, string>> => {
    const insights: Record<string, Record<string, string>> = {};

    tools.forEach((recommendation: any) => {
      const tool = recommendation.tool;
      const toolInsights: Record<string, string> = {};

      topCriteria.forEach((criterion: any) => {
        const toolRating = getToolRating(tool, criterion);
        const databaseInsight = getToolExplanation(tool, criterion);
        
        toolInsights[criterion.id] = generateBasicInsight(
          tool.name,
          criterion.name,
          toolRating,
          criterion.userRating || 3,
          databaseInsight
        );
      });

      insights[tool.id] = toolInsights;
    });

    return insights;
  };

  // Generate a basic insight without OpenAI
  const generateBasicInsight = (
    toolName: string,
    criterionName: string,
    toolRating: number,
    userRating: number,
    databaseInsight: string
  ): string => {
    // Use database insight if available, truncate to 80 chars
    if (databaseInsight && databaseInsight.trim().length > 0) {
      const truncated = databaseInsight.trim();
      return truncated.length > 80 ? truncated.substring(0, 77) + '...' : truncated;
    }

    // Generate more descriptive basic insight based on ratings
    if (toolRating >= 4) {
      if (toolRating > userRating) {
        return 'Exceeds your needs with strong capabilities';
      } else {
        return 'Perfect fit for your requirements';
      }
    } else if (toolRating >= 3) {
      if (toolRating >= userRating) {
        return 'Meets your needs with good coverage';
      } else {
        return 'Good coverage but may need supplements';
      }
    } else {
      return 'Basic coverage - consider alternatives';
    }
  };

  // Generate the HTML table
  const generateTableHTML = (tools: any[], topCriteria: any[], enhancedInsights: Record<string, Record<string, string>>, userRankings: any): string => {
    const toolsSlice = tools.slice(0, Math.min(tools.length, 3)); // Dynamic number of tools, max 3
    
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
          Criteria<br/>
          <span style="font-size: 11px; opacity: 0.9;">(Your Ranking)</span>
        </th>
        ${toolsSlice.map((recommendation: any, index: number) => `
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
            ${getRankingNumber(index)} ${recommendation.tool.name}
          </th>
        `).join('')}
      </tr>
    `;

    // Generate table rows for each criterion
    const criteriaRows = topCriteria.map((criterion: any) => {
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
              Your Ranking: ${criterion.userRating || 3}/5
            </div>
          </td>
          ${toolsSlice.map((recommendation: any) => {
            const tool = recommendation.tool;
            const toolRating = getToolRating(tool, criterion);
            const comparisonClass = getComparisonClass(toolRating, criterion.userRating || 3);
            const insight = enhancedInsights[tool.id]?.[criterion.id] || 'Standard capabilities';
            
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
                <div style="color: #4a5568; font-size: 11px; line-height: 1.4; word-wrap: break-word; max-width: 200px;">
                  ${insight}
                </div>
              </td>
            `;
          }).join('')}
        </tr>
      `;
    }).join('');

    return `
      <div style="margin: 40px 0;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background-color: #f8fafc; padding: 12px 20px; border-radius: 6px; font-size: 12px; color: #4a5568;">
            <span style="color: #065f46;">■ Exceeds your needs</span>
            <span style="margin: 0 15px; color: #1e40af;">■ Meets your needs</span>
            <span style="color: #9a3412;">■ Basic coverage</span>
          </div>
        </div>
        
        <div style="overflow-x: auto; margin: 0 -15px;">
          <table style="
            width: 100%;
            max-width: 100%;
            min-width: 800px;
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
      </div>
    `;
  };

  // Generate varied and natural tool highlights for honorable mentions
  const generateVariedToolHighlight = async (tool: any, selectedCriteria: any[]): Promise<string> => {
    try {
      // Get tool's strongest areas
      const toolStrengths = selectedCriteria
        .map((criterion: any) => ({
          name: criterion.name,
          toolRating: getToolRating(tool, criterion),
          userImportance: criterion.userRating || 3
        }))
        .filter(item => item.toolRating >= 4) // Only consider strong areas
        .sort((a, b) => (b.toolRating * b.userImportance) - (a.toolRating * a.userImportance)) // Sort by weighted importance
        .slice(0, 2); // Top 2 strengths

      // Tool-specific highlight templates for variety
      const toolTemplates: Record<string, string[]> = {
        'Jira': [
          'Developer-focused with robust agile capabilities',
          'Comprehensive issue tracking and sprint management',
          'Enterprise-grade with strong DevOps integration'
        ],
        'MS Project': [
          'Enterprise scheduling with advanced resource management',
          'Traditional project planning with Microsoft ecosystem benefits',
          'Comprehensive reporting for large-scale initiatives'
        ],
        'ClickUp': [
          'All-in-one platform with extensive customization options',
          'Feature-rich workspace for diverse team needs',
          'Versatile tool combining multiple productivity features'
        ],
        'Asana': [
          'Clean interface focused on task clarity and team coordination',
          'User-friendly design with strong collaboration features',
          'Intuitive project organization for growing teams'
        ],
        'Azure DevOps': [
          'Integrated development lifecycle management',
          'Strong CI/CD pipeline integration for technical teams',
          'Microsoft ecosystem alignment with developer workflows'
        ],
        'Planview': [
          'Strategic portfolio management for enterprise environments',
          'Advanced resource optimization and capacity planning',
          'Executive-level reporting and portfolio governance'
        ],
        'Airtable': [
          'Database flexibility with spreadsheet familiarity',
          'Hybrid approach combining structured data with ease of use',
          'Creative workflow management with powerful integrations'
        ],
        'Smartsheet': [
          'Spreadsheet interface enhanced with project management features',
          'Enterprise automation with familiar user experience',
          'Grid-based approach with advanced workflow capabilities'
        ],
        'Monday.com': [
          'Visual project boards with intuitive team collaboration',
          'Color-coded workflows for clear project visibility',
          'Modern interface designed for team transparency'
        ]
      };

      // Use OpenAI to generate varied highlights if available
      if (process.env.OPENAI_API_KEY && toolStrengths.length > 0) {
        try {
          const strengthContext = toolStrengths.map(s => `${s.name} (${s.toolRating}/5)`).join(', ');
          
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
                  content: `Create UNIQUE honorable mention descriptions for PPM tools. Each description must be:
1. Under 12 words
2. Focus on the tool's UNIQUE value proposition
3. Use varied, natural language (no repetitive phrases)
4. Business-focused, not technical
5. Each tool needs a DIFFERENT style of description

VARY THE FORMATS:
- "Specialized for [use case]"
- "Combines [feature] with [benefit]"
- "Designed for [target user] requiring [need]"
- "[Unique approach] for [business outcome]"
- "Strong [differentiator] meets [requirement]"

Avoid repetitive words like "Strong", "Solid", "Good" - be creative and specific.`
                },
                {
                  role: 'user',
                  content: `Tool: ${tool.name}
Strengths: ${strengthContext}

Create a unique, varied description for ${tool.name} that stands out from other tools. Focus on what makes it different, not generic strengths.`
                }
              ],
              max_tokens: 25,
              temperature: 0.8,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const aiHighlight = data.choices[0]?.message?.content?.trim();
            
            if (aiHighlight && aiHighlight.length > 0 && aiHighlight.length <= 80) {
              return aiHighlight.replace(/["""]/g, '');
            }
          }
        } catch (aiError) {
          console.log(`⚠️ AI highlight failed for ${tool.name}, using template fallback`);
        }
      }

      // Fallback to template-based variety
      const templates = toolTemplates[tool.name];
      if (templates && templates.length > 0) {
        // Use tool name hash to consistently pick a template but ensure variety
        const templateIndex = Math.abs(tool.name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % templates.length;
        return templates[templateIndex];
      }

      // Generic fallback with variety based on strengths
      if (toolStrengths.length > 0) {
        const primaryStrength = toolStrengths[0].name.toLowerCase();
        const patterns = [
          `Specialized ${primaryStrength} capabilities with enterprise focus`,
          `Balanced approach to ${primaryStrength} and team coordination`,
          `${primaryStrength.charAt(0).toUpperCase() + primaryStrength.slice(1)}-focused platform for growing organizations`,
          `Comprehensive ${primaryStrength} solution with implementation support`,
          `Professional-grade ${primaryStrength} features for structured teams`
        ];
        
        const patternIndex = Math.abs(tool.name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % patterns.length;
        return patterns[patternIndex];
      }

      return 'Well-rounded platform with competitive feature set';
      
    } catch (error) {
      console.error(`Error generating highlight for ${tool.name}:`, error);
      return 'Solid capabilities with good implementation support';
    }
  };

  // Generate AI-powered insights using AIAnalysisService (replaces the old generateDynamicInsights)
  const generateAIInsights = async (topRecommendations: any[], selectedCriteria: any[], userEmail?: string) => {
    try {
      // Import the AIAnalysisService
      const { AIAnalysisService } = await import('@/ppm-tool/shared/services/aiAnalysisService');
      
      // Prepare data for AI analysis
      const criteriaWeights: Record<string, number> = {};
      selectedCriteria.forEach((criterion: any) => {
        criteriaWeights[criterion.name] = (criterion.userRating || 3) / 5; // Convert 1-5 rating to decimal
      });

      const analysisData = {
        topTools: topRecommendations.slice(0, 3).map((rec: any) => rec.tool),
        criteriaWeights,
        userEmail
      };

      const analysis = await AIAnalysisService.generateAnalysis(analysisData);
      
      // Convert the analysis summary to the format expected by the React template
      const top3 = topRecommendations.slice(0, 3);
      const honorableMentions = await Promise.all(topRecommendations.slice(3, 6).map(async (tool: any) => {
        const highlight = await generateVariedToolHighlight(tool.tool, selectedCriteria);
        return {
          name: tool.tool.name,
          highlight
        };
      }));

      return {
        mainInsight: analysis.summary, // Use the AI-generated summary instead of rule-based
        tieNote: null, // Let the AI analysis handle tie scenarios
        honorableMentions
      };

    } catch (error) {
      console.error('AI Analysis failed, using fallback:', error);
      
      // Fallback to a simple analysis if AI fails
      const top3 = topRecommendations.slice(0, 3);
      const winner = top3[0];
      const runnerUp = top3[1];
      
      const honorableMentions = topRecommendations.slice(3, 6).map((tool: any) => ({
        name: tool.tool.name,
        highlight: 'Solid implementation support'
      }));

      return {
        mainInsight: `${winner.tool.name} leads with ${Math.round(winner.score)}% vs ${runnerUp.tool.name}'s ${Math.round(runnerUp.score)}%. Each tool offers distinct advantages based on your specific priorities and requirements.`,
        tieNote: null,
        honorableMentions
      };
    }
  };

  // Helper function to get base URL
  function getBaseUrl(): string {
    if (process.env.NODE_ENV === 'production') {
      return process.env.NEXT_PUBLIC_SITE_URL || 'https://panoramic-solutions.com';
    }
    return 'http://localhost:3000';
  }
  
  try {
    // Generate AI-powered insights using the enhanced prompt system
    const insights = await generateAIInsights(topRecommendations, selectedCriteria, userEmail);
    
    // Generate AI-polished highlights for top 3 tools
    console.log('🤖 Generating AI-polished highlights for top 3 tools...');
    const top3WithHighlights = await Promise.all(
      topRecommendations.slice(0, 3).map(async (rec: any) => ({
        ...rec,
        highlights: await generateSmartHighlights(rec.tool, selectedCriteria)
      }))
    );
    console.log('✅ AI highlights generation completed');
    
    // Professional email template with alternating colors and improved content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PPM Tool Analysis Report</title>
</head>
<body style="margin:0;padding:0;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:0;margin:0;">
  <tr>
    <td align="center" style="padding:24px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #ececec;">
        
        <!-- Header Section - White Background -->
        <tr>
          <td style="padding:28px 28px 16px 28px;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">
            <div style="font-size:20px;font-weight:700;margin:0 0 8px 0;color:#2c3e50;">Your Personalized PPM Tool Analysis Report</div>
            ${firstName ? `<div style="font-size:16px;color:#2c3e50;margin:0 0 12px 0;">Hi ${firstName},</div>` : ''}
            <div style="font-size:14px;color:#444;margin:0 0 20px 0;">
              These results combine <strong>your ranked criteria</strong> with our <strong>independent research and real-world implementation experience</strong>, helping you set a foundation for <strong>lasting project portfolio success</strong>.
            </div>
            
            <!-- Value Propositions Section -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td style="width:33.33%;text-align:center;vertical-align:top;padding:0 8px;">
                  <div style="text-align:center;">
                    <div style="font-size:16px;margin-bottom:4px;">✅</div>
                    <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:4px;">Proven Methodology</div>
                    <div style="font-size:10px;color:#6c757d;line-height:1.3;">Designed using real-world implementations across industries</div>
                  </div>
                </td>
                <td style="width:33.33%;text-align:center;vertical-align:top;padding:0 8px;">
                  <div style="text-align:center;">
                    <div style="font-size:16px;margin-bottom:4px;">🎯</div>
                    <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:4px;">Tailored Results</div>
                    <div style="font-size:10px;color:#6c757d;line-height:1.3;">Recommendations specific to your organization's needs</div>
                  </div>
                </td>
                <td style="width:33.33%;text-align:center;vertical-align:top;padding:0 8px;">
                  <div style="text-align:center;">
                    <div style="font-size:16px;margin-bottom:4px;">📈</div>
                    <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:4px;">Start on Course</div>
                    <div style="font-size:10px;color:#6c757d;line-height:1.3;">Leverage our deep research and avoid costly tool selection mistakes</div>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Process cue -->
            <div style="font-size:12px;color:#666;line-height:1.5;margin-top:16px;">
              You ranked your priorities using our guided method across the following <strong>Project Portfolio Management (PPM)</strong> criteria:
              ${selectedCriteria.map((c: any) => c.name).join(', ')}. 
              ${selectedTools.length < 10 ? `Analysis includes ${selectedTools.length} ${selectedTools.length === 1 ? 'tool' : 'tools'} matching your current filters.` : ''}
            </div>
          </td>
        </tr>

                 <!-- Results Overview - Light Blue Background -->
         <tr>
           <td style="padding:20px 28px;font-family:Arial,Helvetica,sans-serif;background:#e3f2fd;">
             <div style="font-size:18px;font-weight:700;margin:0 0 12px 0;color:#1565c0;">Top ${Math.min(selectedTools.length, 3)} Tools for your Project Portfolio Management Use Case</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background:#e9ecef;">
                  <th align="left" style="padding:12px 16px;font-size:12px;color:#495057;font-weight:600;border-bottom:1px solid #dee2e6;">Tool</th>
                  <th align="left" style="padding:12px 16px;font-size:12px;color:#495057;font-weight:600;border-bottom:1px solid #dee2e6;">Highlights</th>
                  <th align="left" style="padding:12px 16px;font-size:12px;color:#495057;font-weight:600;border-bottom:1px solid #dee2e6;">Match to Your Priorities</th>
                </tr>
              </thead>
              <tbody>
                ${top3WithHighlights.map((rec: any, index: number) => `
                    <tr style="background:${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                      <td style="padding:12px 16px;border-bottom:1px solid #dee2e6;"><strong style="font-size:14px;color:#2c3e50;">${rec.tool.name}</strong></td>
                      <td style="padding:12px 16px;font-size:12px;color:#6c757d;border-bottom:1px solid #dee2e6;">${rec.highlights}</td>
                      <td style="padding:12px 16px;border-bottom:1px solid #dee2e6;"><strong style="color:#28a745;">${Math.round(rec.score)}%</strong></td>
                    </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="font-size:12px;color:#6c757d;margin-top:8px;font-style:italic;">
              These are the ${Math.min(selectedTools.length, 3)} best-fit tools based on your weighted priorities.
            </div>
          </td>
        </tr>

                 <!-- Analysis Summary & Additional Considerations - White Background -->
         <tr>
           <td style="padding:20px 28px;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">
             <div style="font-size:18px;font-weight:700;margin:0 0 8px 0;color:#2c3e50;">Analysis Summary</div>
            <div style="font-size:14px;color:#2c3e50;line-height:1.6;margin-bottom:16px;">
              ${insights.mainInsight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
              ${insights.tieNote ? `<div style="font-size:12px;color:#6c757d;margin-top:6px;"><strong>Note:</strong> ${insights.tieNote}</div>` : ''}
            </div>
            
            ${selectedTools.length > 3 ? `
            <div style="font-size:14px;font-weight:700;margin:0 0 8px 0;color:#2c3e50;">Additional Considerations</div>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:#2c3e50;line-height:1.6;">
              ${insights.honorableMentions.map(hm => `<li style="margin-bottom:4px;"><strong>${hm.name}</strong> - ${hm.highlight}</li>`).join('')}
            </ul>
            ` : ''}
          </td>
        </tr>

                 <!-- Your Rankings vs Tool Rankings - Light Blue Background -->
         <tr>
           <td style="padding:20px 28px;font-family:Arial,Helvetica,sans-serif;background:#e3f2fd;">
             <div style="font-size:18px;font-weight:700;margin:0 0 6px 0;color:#1565c0;">Your Rankings vs Tool Rankings</div>


             <div style="font-size:12px;color:#1565c0;line-height:1.6;margin:0 0 16px 0;">
               This table shows how your ranked criteria relates to each leader's research-backed rankings.
             </div>
            
            <!-- Comparison Table -->
            <div style="margin-top:16px;">
                ${await generateComparisonTableHTML(topRecommendations.slice(0, Math.min(selectedTools.length, 3)), selectedCriteria, userRankings)}
            </div>
            
          </td>
        </tr>

        <!-- Signature - White Background -->
        <tr>
          <td style="padding:24px 28px 28px 28px;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">
            <div style="font-size:16px;font-weight:600;color:#2c3e50;line-height:1.6;margin:0 0 16px 0;">
              We're glad you took the time to explore your priorities through this process. These insights serve as a launch point to accelerate progress toward successful PPM adoption.
            </div>
            <div style="font-size:12px;color:#2c3e50;margin:0 0 16px 0;">Regards,</div>
            <div style="font-size:14px;color:#2c3e50;font-weight:700;margin:0 0 4px 0;">Matt Wagner, PMP</div>
            <div style="font-size:12px;color:#6c757d;margin:0 0 12px 0;">Founder & Solutions Architect | Panoramic Solutions</div>
            
            <div style="font-size:12px;margin:0 0 8px 0;">
              <a href="https://panoramic-solutions.com" style="color:#1565c0;text-decoration:none;">🌐 panoramic-solutions.com</a>
            </div>
            <div style="font-size:12px;margin:0 0 16px 0;color:#6c757d;">
              Questions about your results? Reply to this email for guidance.
            </div>


            
            <div style="font-size:10px;color:#999;margin-top:16px;font-style:italic;">
              You are receiving this report because you requested a personalized analysis using the PPM Tool Finder.
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Matt Wagner <matt.wagner@panoramic-solutions.com>', // Use Matt's verified email
      to: [userEmail],
      subject: 'Your PPM Tool Analysis Report',
      html: emailHtml,
      tags: [
        { name: 'category', value: 'ppm-tool-report' },
        { name: 'source', value: 'comparison-tool' },
        { name: 'tool_count', value: selectedTools.length.toString() },
        { name: 'criteria_count', value: selectedCriteria.length.toString() }
      ]
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { message: 'Failed to send email', error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully via React template:', {
      id: (data as any)?.id,
      to: userEmail.replace(/(.{3}).*(@.*)/, '$1***$2'),
      timestamp: new Date().toISOString()
    });

    // Store email report in Supabase (if configured)
    console.log('🔍 Checking Supabase configuration...');
    console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key configured:', !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY));
    console.log('URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
    console.log('Using service key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY' : 'NONE');
    
    if (supabase) {
      try {
        console.log('💾 Storing/updating email report in Supabase...');
        // Use UPSERT to update existing record or insert new one (prevents duplicate marketing emails)
        const { data: reportData, error: dbError } = await supabase
          .from('email_reports')
          .upsert({
            user_email: userEmail, // Primary key for conflict resolution
            first_name: firstName,
            last_name: lastName,
            email_hash: emailHash,
            selected_tools: selectedTools,
            selected_criteria: selectedCriteria,
            top_recommendations: topRecommendations.slice(0, 5), // Store top 5
            resend_message_id: data?.id,
            tool_count: selectedTools.length,
            criteria_count: selectedCriteria.length,
            user_agent: userAgent || request.headers.get('user-agent'),
            ip_address: (() => {
              const forwarded = request.headers.get('x-forwarded-for');
              return forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
            })(),
            // Add guided ranking data for marketing insights
            guided_ranking_answers: guidedRankingAnswers,
            personalization_data: personalizationData,
            project_volume_annually: marketingData.project_volume_annually,
            tasks_per_project: marketingData.tasks_per_project,
            user_expertise_level: marketingData.user_expertise_level,
            user_count: marketingData.user_count,
            departments: marketingData.departments,
            methodologies: marketingData.methodologies,
            has_guided_data: marketingData.has_guided_data
          }, {
            onConflict: 'user_email', // Update existing record with same email
            ignoreDuplicates: false // Always update, don't ignore
          });

        if (dbError) {
          console.error('❌ Supabase insert error:', dbError);
          console.error('Error details:', {
            code: dbError.code,
            message: dbError.message,
            details: dbError.details
          });
          // Don't fail the email send if database insert fails
        } else {
          console.log('✅ Report successfully stored in Supabase!');
          console.log('📊 Stored report ID:', (reportData as any)?.[0]?.id);
        }
      } catch (dbError) {
        console.error('💥 Database storage error:', dbError);
        // Continue - don't fail email send due to DB issues
      }
    } else {
      console.log('⚠️ Supabase not configured - skipping database storage');
      console.log('📝 To enable database storage, add these to .env.local:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=https://vfqxzqhitumrxshrcqwr.supabase.co');
      console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email processing error:', error);
    return NextResponse.json(
      { message: 'Failed to process email', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is the new React email format or legacy format
    if (body.selectedTools && body.selectedCriteria) {
      // New React email format
      return await handleReactEmail(request, body);
    }
    
    // Legacy format - keep existing functionality
    const { from, to, subject, html, text, tags } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { message: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { message: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Log email attempt
    console.log('🚀 Attempting to send email via Resend:', {
      to: to.replace(/(.{3}).*(@.*)/, '$1***$2'),
      from: from || 'Matt Wagner <noreply@app.panoramic-solutions.com>',
      subject,
      hasHtml: !!html,
      hasText: !!text,
      timestamp: new Date().toISOString()
    });

    // Send email via Resend
    const data = await resend.emails.send({
      from: from || 'Matt Wagner <matt.wagner@panoramic-solutions.com>',
      to: [to],
      subject,
      html,
      text,
      // Add tags for analytics if provided
      tags: tags || [
        { name: 'category', value: 'ppm-tool-report' },
        { name: 'source', value: 'comparison-tool' }
      ]
    });

    // Log detailed Resend response
    console.log('✅ Resend API Response:', { 
      id: (data as any).id, 
      to: to.replace(/(.{3}).*(@.*)/, '$1***$2'),
      status: 'sent',
      timestamp: new Date().toISOString(),
      fullResponse: data
    });

    return NextResponse.json({ 
      success: true, 
      messageId: (data as any).id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email send error:', error);
    
    // Handle specific Resend errors
    if (error instanceof Error) {
      // Check for common Resend error patterns
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { message: 'Email service configuration error' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { message: 'Email service temporarily unavailable. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { message: 'Failed to send email', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
