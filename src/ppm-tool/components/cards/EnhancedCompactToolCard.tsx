import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Star, HelpCircle } from 'lucide-react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/ppm-tool/components/ui/card';
import { Button } from '@/ppm-tool/components/ui/button';
import { Progress } from '@/ppm-tool/components/ui/progress';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { formatMatchScorePercentage } from '@/ppm-tool/shared/utils/toolRating';
import { MethodologyTags } from '@/ppm-tool/components/common/MethodologyTags';
import { MobileTooltip } from '@/ppm-tool/components/ui/MobileTooltip';
import '@/ppm-tool/components/ui/ModernPill.css';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import { analytics } from '@/lib/analytics';
import { trackToolTryFreeClick, trackToolAddToCompareClick, trackToolViewDetailsClick } from '@/lib/posthog';

interface EnhancedCompactToolCardProps {
  tool: Tool;
  selectedCriteria: Criterion[];
  matchScore: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCompare?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isCompared?: boolean;
  criteriaAdjusted?: boolean;
  onOpenGuidedRanking?: () => void;
  onNavigateToCriteria?: () => void;
  position?: number; // Position in results for analytics
}

// Helper function to get tool rating for a criterion
const getToolRating = (tool: Tool, criterion: Criterion): number => {
  try {
    if (Array.isArray(tool.criteria)) {
      const criterionDataById = tool.criteria.find(c => c.id === criterion.id);
      if (criterionDataById && typeof criterionDataById.ranking === 'number') {
        return criterionDataById.ranking;
      }
      const criterionDataByName = tool.criteria.find(c => c.name === criterion.name);
      if (criterionDataByName && typeof criterionDataByName.ranking === 'number') {
        return criterionDataByName.ranking;
      }
    }
    return 0;
  } catch (error) {
    console.error(`Error getting rating for criterion ${criterion.name}:`, error);
    return 0;
  }
};

// Helper function to get tool explanation for a criterion
const getToolExplanation = (tool: Tool, criterion: Criterion): string => {
  try {
    if (Array.isArray(tool.criteria)) {
      const criterionData = tool.criteria.find(c => 
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
    console.warn(`Error getting explanation for criterion ${criterion.name}:`, error);
    return '';
  }
};

// Helper function to get match score display - with proper color coding
const getMatchScoreDisplay = (score: number): { value: string; color: string; variant: "default" | "secondary" | "destructive"; bgColor: string } => {
  const { label } = formatMatchScorePercentage(score);
  
  if (score >= 8) {
    return { 
      value: label, 
      color: 'text-green-700', 
      variant: 'secondary',
      bgColor: 'bg-green-50 border-green-200'
    };
  } else if (score >= 6) {
    return { 
      value: label, 
      color: 'text-alpine-blue-700', 
      variant: 'secondary',
      bgColor: 'bg-alpine-blue-50 border-alpine-blue-200'
    };
  } else {
    return { 
      value: label, 
      color: 'text-gray-700', 
      variant: 'secondary',
      bgColor: 'bg-gray-50 border-gray-200'
    };
  }
};

// Trial URLs for tools with free trials
const getTrialUrl = (toolName: string) => {
  const trialUrls: Record<string, string> = {
    'Smartsheet': 'https://www.smartsheet.com/try-it?srsltid=AfmBOor4RqT116TFY_48lksZ95POoe3B_Yh4UG0yOSkM36A8sDl_p8SD',
    'Airtable': 'https://airtable.com/signup?_gl=1*7li2z1*_gcl_au*MjQzMjA4MDQxLjE3NTQwODU1OTU.*_ga*MTQ1MzI0NTk3LjE3NTQwODU1OTU.*_ga_VJY8J9RFZM*czE3NTQwODU1OTQkbzEkZzEkdDE3NTQwODU4NTMkajM2JGwwJGgw',
    'Asana': 'https://asana.com/pricing#signup',
    'Monday.com': 'https://auth.monday.com/users/sign_up_new?origin=hp_fullbg_page_header',
    'Jira': 'https://www.atlassian.com/try/cloud/signup?bundle=jira-software&edition=free&skipBundles=true',
    'ClickUp': 'https://clickup.com/lp?utm_source=google&utm_medium=cpc&utm_campaign=gs_cpc_arlv_nnc_brand_trial_all-devices_troas_lp_x_all-departments_x_brand&utm_content=all-countries_kw-target_text_all-industries_all-features_all-use-cases_clickup_trial_broad&utm_term=clickup%20trial&utm_creative=651395804801_BrandChampion-03072023_rsa&utm_custom1=&utm_custom2=&utm_lptheme=&utm_lpmod=&utm_mt=b&gad_source=1&gad_campaignid=19826757985&gbraid=0AAAAACR5vIL4cH-uF4FtwbdbBQWPZclm0&gclid=EAIaIQobChMIkM-Gy8_qjgMVg5xaBR2cQQpKEAAYASAAEgLudPD_BwE',
    'Azure DevOps': 'https://go.microsoft.com/fwlink/?linkid=2227353&clcid=0x40a&l=es-es',
    'Planview': 'https://www.planview.com/products-solutions/products/projectplace/enterprise-trial/'
  };
  return trialUrls[toolName];
};

// Check if tool has free trial
const hasFreeTrial = (toolName: string) => {
  return getTrialUrl(toolName) !== undefined;
};

export const EnhancedCompactToolCard: React.FC<EnhancedCompactToolCardProps> = ({
  tool,
  selectedCriteria,
  matchScore,
  isExpanded,
  onToggleExpand,
  onCompare,
  isCompared = false,
  criteriaAdjusted = true,
  onOpenGuidedRanking,
  onNavigateToCriteria,
  position
}) => {
  const matchDisplay = getMatchScoreDisplay(matchScore);
  const { isTouchDevice } = useUnifiedMobileDetection();
  const baseActionContext = React.useMemo(
    () => ({
      source_component: 'enhanced_compact_tool_card',
      criteria_adjusted: criteriaAdjusted,
      card_position: position,
      filters_active_count: 0,
    }),
    [criteriaAdjusted, position]
  );

  // Enhanced tracking handlers with optimized dual tracking
  const handleTryFreeClick = async (event: React.MouseEvent) => {
    try {
      // ✅ Track in Supabase first (with deduplication)
      const tracked = await analytics.trackToolClick({
        toolId: tool.id,
        toolName: tool.name,
        actionType: 'try_free',
        position: position,
        matchScore: matchScore,
        context: {
          ...baseActionContext,
          match_score: matchScore,
        }
      });

      // ✅ Only track in PostHog if Supabase tracking succeeded
      if (tracked) {
        trackToolTryFreeClick({
          tool_id: tool.id,
          tool_name: tool.name,
          position: position,
          match_score: matchScore
        });
      }
    } catch (error) {
      console.warn('Failed to track try free click:', error);
    }
  };

  const handleCompareClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // ⚠️ CRITICAL: Persist event data before async operations
    // React nullifies event.currentTarget after the event handler completes
    const currentTarget = event.currentTarget; // Capture reference before async
    
    try {
      // ✅ Track in Supabase first (with deduplication)
      const tracked = await analytics.trackToolClick({
        toolId: tool.id,
        toolName: tool.name,
        actionType: 'add_to_compare',
        position: position,
        matchScore: matchScore,
        context: { 
          ...baseActionContext,
          currently_compared: isCompared
        }
      });

      // ✅ Only track in PostHog if Supabase tracking succeeded
      if (tracked) {
        trackToolAddToCompareClick({
          tool_id: tool.id,
          tool_name: tool.name,
          position: position,
          match_score: matchScore
        });
      }
    } catch (error) {
      console.warn('Failed to track compare click:', error);
    }

    // Call the original handler with the persisted event
    // Create a synthetic event with the captured currentTarget
    const syntheticEvent = {
      ...event,
      currentTarget: currentTarget
    } as React.MouseEvent<HTMLButtonElement>;
    
    onCompare?.(syntheticEvent);
  };

  const handleViewDetailsClick = async () => {
    try {
      // ✅ Track in Supabase first (with deduplication)
      const tracked = await analytics.trackToolClick({
        toolId: tool.id,
        toolName: tool.name,
        actionType: 'view_details',
        position: position,
        matchScore: matchScore,
        context: { 
          ...baseActionContext,
          expanding: !isExpanded
        }
      });

      // ✅ Only track in PostHog if Supabase tracking succeeded
      if (tracked) {
        trackToolViewDetailsClick({
          tool_id: tool.id,
          tool_name: tool.name,
          position: position,
          match_score: matchScore,
          expanded: !isExpanded
        });
      }
    } catch (error) {
      console.warn('Failed to track view details click:', error);
    }

    // Call the original handler
    onToggleExpand();
  };
  
  return (
    <Card
      className="border border-gray-200 hover:border-alpine-blue-300 cursor-pointer !bg-white shadow-none rounded-xl transition-colors duration-200 compact-card-height"
      onClick={handleViewDetailsClick}
      style={{ overflow: 'visible', minHeight: 'var(--compact-card-height, 88px)' }}
    >
      <CardHeader className="px-3 md:px-6 py-2.5 md:py-2.5 compact-padding">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-0.5">
              <CardTitle className="text-base md:text-lg text-gray-900 break-words compact-text-lg">{tool.name}</CardTitle>
              {criteriaAdjusted ? (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${matchDisplay.bgColor} flex-shrink-0 min-h-[44px] md:min-h-0 compact-button shadow-sm`}>
                  <span className={`text-xs md:text-sm font-bold ${matchDisplay.color}`}>{matchDisplay.value}</span>
                  <span className="text-xs ml-1.5 text-gray-600">Match Score</span>
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <MobileTooltip
                  content={
                    <div className="break-words">
                      <p className="text-sm leading-relaxed">Complete the guided rankings or adjust the Criteria sliders to see your match score.</p>
                      {onOpenGuidedRanking && (
                        <>
                          <div className="mt-3 pt-3 border-t border-gray-200" />

                          {/* Mobile: Show Guided Rankings and Criteria Sliders buttons */}
                          {isTouchDevice ? (
                            <div className="mt-2 space-y-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenGuidedRanking();
                                }}
                                className="modern-pill modern-pill--blue modern-pill--sm modern-pill--full"
                              >
                                <span className="modern-pill__lighting"></span>
                                <span className="modern-pill__content">
                                  Open Guided Rankings
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onNavigateToCriteria) {
                                    onNavigateToCriteria();
                                  } else {
                                    const criteriaSection = document.getElementById('criteria-section');
                                    if (criteriaSection) {
                                      criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }
                                }}
                                className="modern-pill modern-pill--gray modern-pill--sm modern-pill--full"
                              >
                                <span className="modern-pill__lighting"></span>
                                <span className="modern-pill__content">
                                  Adjust Criteria Sliders
                                </span>
                              </button>
                            </div>
                          ) : (
                            // Desktop: Only show Guided Rankings button
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenGuidedRanking();
                              }}
                              className="mt-2 modern-pill modern-pill--blue modern-pill--sm modern-pill--full"
                            >
                              <span className="modern-pill__lighting"></span>
                              <span className="modern-pill__content">
                                Open Guided Rankings
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  }
                  side={isTouchDevice ? "bottom" : "right"}
                  align="start"
                  className="max-w-xs text-sm"
                >
                  {/* Match Score trigger - same size as active state */}
                  <span
                    className="inline-flex items-center ml-3 px-2.5 py-1 rounded-full bg-gray-50 cursor-pointer"
                    aria-label="Match Score Information - Not yet ranked, tap to learn more"
                  >
                    <span className="text-xs md:text-sm font-semibold text-gray-400">N/A</span>
                    <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
                    <span className="text-xs ml-1 text-gray-500">Match Score</span>
                  </span>
                </MobileTooltip>
                </div>
              )}
            </div>
            <MethodologyTags tool={tool} />
          </div>
{/* Action buttons moved to expanded section for consistent card heights */}
        </div>
      </CardHeader>

      {/* Expanded content - only rendered when expanded */}
      {isExpanded && (
        <CardContent className="space-y-2 md:space-y-3 px-4 md:px-6 pt-0 pb-3">
          {/* Action buttons - shown only in expanded view */}
          <div className="flex items-center justify-end gap-2 pb-2 border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
            {hasFreeTrial(tool.name) && (
              <Button size="sm" variant="secondary" className="h-8 px-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700" asChild>
                <a
                  href={getTrialUrl(tool.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 justify-center"
                  onClick={handleTryFreeClick}
                >
                  <ExternalLink className="w-3 h-3" />
                  Try Free
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              className={cn(
                "h-8 px-3 text-xs",
                isCompared
                  ? "bg-alpine-blue-100 text-alpine-blue-700 hover:bg-alpine-blue-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
              onClick={handleCompareClick}
            >
              <Star className={cn(
                "w-3 h-3 mr-1",
                isCompared ? "fill-yellow-400 text-yellow-500" : "text-yellow-500"
              )} />
              {isCompared ? 'Added' : 'Compare'}
            </Button>
          </div>
          {selectedCriteria.map((criterion) => {
            const toolRating = getToolRating(tool, criterion);
            const userRating = criterion.userRating;
            const explanation = getToolExplanation(tool, criterion);
            const meetsRequirement = toolRating >= userRating;

            return (
              <div key={criterion.id} className={`p-2 md:p-3 rounded-lg border ${meetsRequirement ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="space-y-1 md:space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <span className="font-medium text-xs md:text-sm text-gray-900">{criterion.name}</span>
                    <div className="text-xs text-gray-600 flex-shrink-0">
                      My Rankings: <span className="font-medium">{userRating}/5</span>
                      <span className="mx-1">•</span>
                      <span className="font-bold text-gray-900">Tool Rankings:</span> <span className={meetsRequirement ? "text-green-600 font-medium" : "text-gray-600 font-medium"}>{toolRating}/5</span>
                    </div>
                  </div>
                  <Progress value={(toolRating / 5) * 100} className={`h-1.5 ${meetsRequirement ? 'bg-green-100' : 'bg-gray-100'}`} />
                  {explanation && (
                    <div className="text-xs text-gray-700 bg-white/60 p-2 rounded">
                      {explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      )}

      {/* Toggle button - ALWAYS rendered, positioned outside collapsing content to prevent bobbling */}
      <div 
        className="cursor-pointer px-4 md:px-6 py-2 md:py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-200 flex items-center justify-center gap-2 text-xs md:text-sm font-medium text-alpine-blue-500 rounded-b-xl"
        onClick={handleViewDetailsClick}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
            View Details
          </>
        )}
      </div>
    </Card>
  );
}; 