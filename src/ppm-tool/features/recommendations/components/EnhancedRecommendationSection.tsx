import React, { useCallback } from 'react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { Award, ExternalLink, Star, TrendingUp, ArrowRight } from 'lucide-react';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
// REMOVED: FullscreenNavigation - no longer needed without FullscreenContext
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ppm-tool/components/ui/card';
import { Badge } from '@/ppm-tool/components/ui/badge';
import { Button } from '@/ppm-tool/components/ui/button';
import { Progress } from '@/ppm-tool/components/ui/progress';
import { Separator } from '@/ppm-tool/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ppm-tool/components/ui/accordion';
import { MobileTooltip } from '@/ppm-tool/components/ui/mobile-tooltip';
import { calculateScore, getCriteriaMatchCount, formatMatchScorePercentage } from '@/ppm-tool/shared/utils/toolRating';
import { hasCriteriaBeenAdjusted } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { MethodologyTags } from '@/ppm-tool/components/common/MethodologyTags';
import { useShuffleAnimation, useToolOrderShuffle } from '@/ppm-tool/hooks/useShuffleAnimation';
import { ShuffleContainer } from '@/ppm-tool/components/animations/ShuffleContainer';
import { AnimatedToolCard } from '@/ppm-tool/components/animations/AnimatedToolCard';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { trackToolTryFreeClick, trackToolAddToCompareClick, trackToolViewDetailsClick } from '@/lib/posthog';
import { analytics } from '@/lib/analytics';


interface RecommendationSectionProps {
  selectedTools: Tool[];
  selectedCriteria: Criterion[];
  onContinue?: () => void;
  isSubmitting?: boolean;
}

export const EnhancedRecommendationSection: React.FC<RecommendationSectionProps> = ({
  selectedTools,
  selectedCriteria,
  onContinue,
  isSubmitting = false,
}) => {
  const isMobile = useMobileDetection();
  const criteriaAdjusted = hasCriteriaBeenAdjusted(selectedCriteria);
  // REMOVED: fullscreen functionality - simplified without FullscreenContext

  // Initialize shuffle animation
  const shuffleAnimation = useShuffleAnimation({
    delayMs: 500,
    shuffleDurationMs: isMobile ? 800 : 1200,
    disabled: false
  });

  const calculateToolScore = useCallback((tool: Tool) => {
    // Use the new calculateScore function with 0-10 scale
    return calculateScore(tool, selectedCriteria);
  }, [selectedCriteria]);

  // Enhanced score display function - using 0-10 scale with proper color coding
  const getMatchScoreDisplay = (score: number): { value: string; color: string; bgColor: string } => {
    const { label } = formatMatchScorePercentage(score);
    
    if (score >= 8) {
      return { 
        value: label, 
        color: 'text-green-700', 
        bgColor: 'bg-green-50 border-green-200'
      };
    } else if (score >= 6) {
      return { 
        value: label, 
        color: 'text-alpine-blue-700', 
        bgColor: 'bg-alpine-blue-50 border-alpine-blue-200'
      };
    } else {
      return { 
        value: label, 
        color: 'text-gray-700', 
        bgColor: 'bg-gray-50 border-gray-200'
      };
    }
  };

  // Use unified getCriteriaMatchCount function
  const getMatchCount = (tool: Tool) => getCriteriaMatchCount(tool, selectedCriteria);

  const selectedToolCount = selectedTools.length;
  const selectedCriteriaCount = selectedCriteria.length;

  const baseActionContext = React.useMemo(() => ({
    source_component: 'enhanced_recommendation_section',
    selected_tool_count: selectedToolCount,
    selected_criteria_count: selectedCriteriaCount,
    criteria_adjusted: criteriaAdjusted,
    filters_active_count: 0,
  }), [selectedToolCount, selectedCriteriaCount, criteriaAdjusted]);

  const sortedTools = React.useMemo(() => {
    return [...selectedTools].sort((a, b) => calculateToolScore(b) - calculateToolScore(a));
  }, [selectedTools, calculateToolScore]);

  // Set up tool order shuffle animation - triggers when sortedTools order changes
  useToolOrderShuffle(sortedTools, shuffleAnimation, {
    triggerOnChange: true
  });

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

  const content = (
    <div className="space-y-6">
      {/* Enhanced Header with alpine-blue background */}
      <div className="flex items-center justify-between p-4 md:p-6 pb-3 md:pb-4 border-b bg-alpine-blue-50">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Award className="w-5 h-5 md:w-6 md:h-6 text-alpine-blue-500" />
          <div>
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Tool Finder Results</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
              <p className="text-xs md:text-sm text-gray-500">
                {selectedCriteria.length} criteria • {selectedTools.length} tools analyzed
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* REMOVED: FullscreenNavigation - no longer needed */}

          {onContinue && (
            <button
              onClick={onContinue}
              disabled={isSubmitting}
              className={`
                flex items-center px-3 md:px-4 py-2 md:py-2.5
                bg-alpine-blue-500 hover:bg-alpine-blue-600 text-white font-medium 
                rounded-lg transition-colors shadow-sm text-xs md:text-sm
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Processing</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  View Final Results
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Score Info */}
      <div className="px-6">
        <Accordion type="single" collapsible>
          <AccordionItem value="score-info" className="border-0">
            <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Understanding Match Scores
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>Tools are scored based on how well they meet your requirements:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">8.0-10.0</Badge>
                  <span>Excellent matches</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-alpine-blue-100 text-alpine-blue-800">6.0-7.9</Badge>
                  <span>Good matches</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">4.0-5.9</Badge>
                  <span>Fair matches</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive">0.0-3.9</Badge>
                  <span>Below requirements</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

             {/* Enhanced Tool Cards */}
       <div className="px-6 pb-6">
         {sortedTools.length === 0 ? (
           <div className="text-center py-12">
             <div className="text-gray-400 mb-4">
               <Award className="w-16 h-16 mx-auto" />
             </div>
             <h3 className="text-lg font-medium text-gray-900 mb-2">No tools to analyze</h3>
             <p className="text-gray-600 mb-4">Add some tools from the previous step to see your personalized recommendations.</p>
           </div>
          ) : (
           <ShuffleContainer
             tools={sortedTools}
             shuffleAnimation={shuffleAnimation}
             className="flex flex-col gap-4"
             isMobile={isMobile}
             enableParticles={true}
           >
             {sortedTools.map((tool, index) => {
             const score = calculateToolScore(tool);
             const matchCount = getMatchCount(tool);
             const matchPercentage = selectedCriteria.length > 0 ? (matchCount / selectedCriteria.length) * 100 : 0;
             const matchDisplay = getMatchScoreDisplay(score);

             return (
               <AnimatedToolCard
                 key={`recommendation-${tool.id}-${index}`}
                 tool={tool}
                 index={index}
               >
                 <Card className="overflow-hidden border-2 hover:border-alpine-blue-200 transition-all duration-200 hover:shadow-lg !bg-white">
               <CardHeader className="pb-4">
                 {/* Responsive header layout - stacks on medium screens, side-by-side on large screens */}
                 <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                   <div className="flex-1 min-w-0 space-y-2">
                     <div className="flex items-center space-x-2">
                       <CardTitle className="text-lg sm:text-xl text-gray-900 break-words">{tool.name}</CardTitle>
                     </div>
                     <MethodologyTags tool={tool} className="mb-1" />
                     <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
                       <div className="flex items-center space-x-2">
                         <span className="text-green-600 font-medium">✅ Meets {matchCount}/{selectedCriteria.length} criteria</span>
                         <Separator orientation="vertical" className="h-4 hidden sm:block" />
                       </div>
                       <div className="flex items-center space-x-1">
                         <TrendingUp className="w-3 h-3 text-alpine-blue-500" />
                         <span className="font-medium text-alpine-blue-600">{matchPercentage.toFixed(0)}% match</span>
                       </div>
                     </CardDescription>
                     
                     {/* Match score below text on medium screens, will be moved to right side on large screens */}
                     <div className="lg:hidden">
                       <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${matchDisplay.bgColor} shadow-sm text-sm`}>
                         <div className={`font-bold ${matchDisplay.color}`}>
                           {matchDisplay.value}
                         </div>
                         <div className="text-xs text-gray-600 font-medium">Match Score</div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Enhanced match score display - hidden on medium, shown on large screens */}
                   <div className="hidden lg:flex flex-shrink-0 self-start lg:self-center">
                     <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${matchDisplay.bgColor} shadow-sm`}>
                       <div className="text-right">
                         <div className={`text-xl lg:text-2xl font-bold ${matchDisplay.color}`}>
                           {matchDisplay.value}
                         </div>
                         <div className="text-xs text-gray-600 font-medium">Match Score</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </CardHeader>

               <CardContent className="space-y-4">
                 {/* Enhanced Match Progress */}
                 <div className="space-y-3">
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted-foreground font-medium">Overall Match Progress</span>
                     <span className="font-bold text-alpine-blue-600">{matchPercentage.toFixed(0)}%</span>
                   </div>
                   <Progress value={matchPercentage} className="h-3 rounded-full" />
                   <div className="text-xs text-muted-foreground">
                     {score >= 8 ? "🎯 Excellent fit for your requirements" : 
                      score >= 6 ? "✨ Good match with minor gaps" : 
                      score >= 4 ? "📊 Fair match - review carefully" :
                      "⚠️ Review carefully - may have significant gaps"}
                   </div>
                 </div>

                 {/* Enhanced Tags */}
                 <div className="space-y-2">
                   <div className="text-sm font-medium text-gray-700">Categories</div>
                   <div className="flex flex-wrap gap-2">
                     {(tool.tags || []).slice(0, 6).map((tag) => (
                       <Badge key={tag.id} variant="outline" className="text-xs font-medium bg-alpine-blue-50 text-alpine-blue-700 border-alpine-blue-200">
                         {tag.name}
                       </Badge>
                     ))}
                     {(tool.tags || []).length > 6 && (
                       <Badge variant="outline" className="text-xs bg-gray-50">
                         +{(tool.tags || []).length - 6} more
                       </Badge>
                     )}
                   </div>
                 </div>

                {/* Enhanced Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {hasFreeTrial(tool.name) && (
                    <MobileTooltip 
                      content={<p>Start a free trial of {tool.name}</p>}
                      side="top"
                      align="center"
                    >
                      <Button size="sm" className="flex-1 sm:flex-initial bg-alpine-blue-500 hover:bg-alpine-blue-600" asChild>
                        <a 
                          href={getTrialUrl(tool.name)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2"
                          onClick={async () => {
                            // Calculate match score
                            const matchScore = calculateToolScore(tool);
                            
                            // ✅ Track in Supabase first (with deduplication)
                            const actionContext = {
                              ...baseActionContext,
                              criteria_count: selectedCriteriaCount,
                              meets_requirements: getCriteriaMatchCount(tool, selectedCriteria),
                              result_rank: index + 1,
                              match_score: matchScore,
                            };
                            const tracked = await analytics.trackToolClick({
                              toolId: tool.id,
                              toolName: tool.name,
                              actionType: 'try_free',
                              position: index + 1,
                              matchScore: matchScore,
                              context: actionContext,
                            });
                            
                            // ✅ Only track in PostHog if Supabase succeeded
                            if (tracked) {
                              trackToolTryFreeClick({
                                tool_id: tool.id,
                                tool_name: tool.name,
                                position: index + 1,
                                match_score: matchScore,
                                criteria_rankings: selectedCriteria.reduce((acc, c) => ({...acc, [c.id]: c.userRating}), {})
                              });
                              
                              // Track as active user
                              checkAndTrackNewActive('try_free_clicked', {
                                tool_id: tool.id,
                                tool_name: tool.name,
                                position: index + 1
                              });
                            }
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Try Free Trial</span>
                        </a>
                      </Button>
                    </MobileTooltip>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial border-alpine-blue-200 text-alpine-blue-600 hover:bg-alpine-blue-50"
                    onClick={async () => {
                      // Calculate match score
                      const matchScore = calculateToolScore(tool);
                      
                      // ✅ Track in Supabase first (with deduplication)
                      const tracked = await analytics.trackToolClick({
                        toolId: tool.id,
                        toolName: tool.name,
                        actionType: 'add_to_compare',
                        position: index + 1,
                        matchScore: matchScore,
                        context: {
                          ...baseActionContext,
                          criteria_count: selectedCriteriaCount,
                          meets_requirements: getCriteriaMatchCount(tool, selectedCriteria),
                          result_rank: index + 1,
                          match_score: matchScore,
                        }
                      });
                      
                      // ✅ Only track in PostHog if Supabase succeeded
                      if (tracked) {
                        trackToolAddToCompareClick({
                          tool_id: tool.id,
                          tool_name: tool.name,
                          position: index + 1,
                          match_score: matchScore,
                          comparing_with: sortedTools.slice(0, 3).map(t => t.name).filter(n => n !== tool.name)
                        });
                        
                        // Track as active user
                        checkAndTrackNewActive('add_to_compare_clicked', {
                          tool_id: tool.id,
                          tool_name: tool.name,
                          position: index + 1
                        });
                      }
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Add to Compare
                  </Button>
                </div>

                 {/* Detailed Breakdown */}
                 <Accordion type="single" collapsible>
                   <AccordionItem value={`details-${tool.id}`} className="border-0">
                    <AccordionTrigger 
                      className="text-sm font-medium text-alpine-blue-600 hover:text-alpine-blue-800 hover:bg-alpine-blue-50 rounded-lg px-3 py-2"
                      onClick={async () => {
                        // Calculate match score
                        const matchScore = calculateToolScore(tool);
                        
                        // ✅ Track in Supabase first (with deduplication)
                        const tracked = await analytics.trackToolClick({
                          toolId: tool.id,
                          toolName: tool.name,
                          actionType: 'view_details',
                          position: index + 1,
                          matchScore: matchScore,
                        context: {
                          ...baseActionContext,
                          criteria_count: selectedCriteriaCount,
                          meets_requirements: getCriteriaMatchCount(tool, selectedCriteria),
                          result_rank: index + 1,
                          match_score: matchScore,
                        }
                        });
                        
                        // ✅ Only track in PostHog if Supabase succeeded
                        if (tracked) {
                          // Track in PostHog
                          trackToolViewDetailsClick({
                            tool_id: tool.id,
                            tool_name: tool.name,
                            position: index + 1,
                            match_score: matchScore,
                            expanded: true
                          });
                          
                          // Track as active user
                          try {
                            checkAndTrackNewActive('Active-details', {
                              component: 'enhanced_recommendation_section',
                              tool_id: tool.id,
                              tool_name: tool.name,
                              interaction_type: 'detailed_breakdown_expanded'
                            });
                          } catch (error) {
                            console.warn('Failed to track tool details expansion:', error);
                          }
                        }
                      }}
                    >
                      View Detailed Breakdown
                    </AccordionTrigger>
                     <AccordionContent className="space-y-3 pt-4">
                       <div className="p-4 bg-gradient-to-br from-alpine-blue-25 to-snow-white rounded-lg border border-alpine-blue-100">
                         <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                           <span className="w-1 h-5 bg-alpine-blue-500 rounded-full"></span>
                           Detailed Criteria Analysis
                         </h4>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {selectedCriteria.map((criterion) => {
                             const criterionData = tool.criteria.find(
                               (c) => c.id === criterion.id
                             );
                             const toolRating = criterionData?.ranking || 0;
                             const userRating = criterion.userRating;
                             const explanation = criterionData?.description || '';
                             const comparison = toolRating >= userRating ? 'Meets your requirement' : 'Below your requirement';
                             const meetsRequirement = toolRating >= userRating;

                             return (
                               <Card key={criterion.id} className={`p-3 border-2 ${meetsRequirement ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                 <div className="space-y-2">
                                   <div className="flex items-center justify-between">
                                     <span className="font-medium text-sm text-gray-900 leading-tight">{criterion.name}</span>
                                     <Badge 
                                       variant={meetsRequirement ? "default" : "destructive"}
                                       className="text-xs font-bold"
                                     >
                                       {toolRating}/5
                                     </Badge>
                                   </div>
                                   <div className="text-xs text-gray-600 font-medium">
                                     Your requirement: {userRating}/5 • {comparison}
                                   </div>
                                   <Progress 
                                     value={(toolRating / 5) * 100} 
                                     className="h-2"
                                   />
                                   {explanation && (
                                     <div className="text-xs text-gray-700 leading-relaxed bg-white/60 p-2 rounded border">
                                       {explanation}
                                     </div>
                                   )}
                                 </div>
                               </Card>
                             );
                           })}
                         </div>
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </CardContent>
                 </Card>
               </AnimatedToolCard>
             );
           })}
           </ShuffleContainer>
         )}
       </div>


     </div>
  );

  // SIMPLIFIED: Always use standard layout (removed fullscreen complexity)
  return (
    <div id="recommendations-section" className="bg-white rounded-lg border shadow-none">
      <div className="flex flex-col h-full">
        {content}
      </div>
    </div>
  );
}; 