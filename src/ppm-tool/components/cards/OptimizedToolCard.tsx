import React from 'react';
import Image from 'next/image';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { Badge } from '@/ppm-tool/components/ui/badge';
import { Button } from '@/ppm-tool/components/ui/button';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { getToolRating, formatMatchScorePercentage } from '@/ppm-tool/shared/utils/toolRating';
import { MethodologyTags } from '@/ppm-tool/components/common/MethodologyTags';
import { Star } from 'lucide-react';

interface OptimizedToolCardProps {
  tool: Tool;
  selectedCriteria: Criterion[];
  matchScore: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddToCompare?: () => void;
}

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

export const OptimizedToolCard: React.FC<OptimizedToolCardProps> = ({
  tool,
  selectedCriteria,
  matchScore,
  isExpanded,
  onToggleExpand,
  onAddToCompare,
}) => {
  const { value: matchLabel, color } = getMatchScoreDisplay(matchScore);
  const { label: percentLabel } = formatMatchScorePercentage(matchScore);
  const metCriteria = selectedCriteria.filter(c => getToolRating(tool, c) >= 3).length;
  const matchPercentage = Math.round((metCriteria / selectedCriteria.length) * 100);

  return (
    <div 
      className={cn(
        'bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow',
        isExpanded ? 'p-4 md:p-6' : 'p-3 md:p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Image 
              src={tool.logo} 
              alt={tool.name} 
              width={32}
              height={32}
              className="w-6 h-6 md:w-8 md:h-8 object-contain"
            />
          </div>
          <div>
            <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1">{tool.name}</h3>
            <MethodologyTags tool={tool} />
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-xs md:text-sm font-medium', color)}>{matchLabel} match</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg md:text-2xl font-bold ${getMatchScoreDisplay(matchScore).color.replace('text-', 'text-').replace('-700', '-600')}`}>{percentLabel}</div>
          <p className="text-xs text-gray-500">Match Score</p>
        </div>
      </div>

      {/* Match Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2 md:mb-3">
        <span className="text-xs md:text-sm text-green-600">✓ Meets {metCriteria}/{selectedCriteria.length} criteria</span>
        <span className="text-xs md:text-sm text-alpine-blue-600">→ {matchPercentage}% match</span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
        {tool.useCases.slice(0, 4).map((category) => (
          <Badge 
            key={category} 
            variant="secondary" 
            className="bg-alpine-blue-50 text-alpine-blue-700 hover:bg-alpine-blue-100 text-xs"
          >
            {category}
          </Badge>
        ))}
        {tool.useCases.length > 4 && (
          <span className="text-xs text-gray-500 self-center">
            +{tool.useCases.length - 4} more
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        {hasFreeTrial(tool.name) && (
          <Button
            variant="outline"
            className="flex-1 text-xs md:text-sm py-2 md:py-2.5"
            onClick={() => window.open(getTrialUrl(tool.name), '_blank')}
          >
            Try Free Trial
          </Button>
        )}
        <Button
          variant="outline"
          className="text-xs md:text-sm py-2 md:py-2.5 flex items-center gap-1"
          onClick={onAddToCompare}
        >
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" />
          Add to Compare
        </Button>
      </div>

      {/* Expand/Collapse */}
      <button
        onClick={onToggleExpand}
        className="mt-2 text-xs md:text-sm text-gray-500 hover:text-gray-700 w-full text-center"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}; 