'use client';

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import {
  EyeOff,
  LineChart,
} from 'lucide-react';
import { ChartControls } from './ChartControls';
import { MobileToolSelector } from './MobileToolSelector';
import { getToolColor } from '@/ppm-tool/shared/utils/chartColors';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { hasCriteriaBeenAdjusted } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { NotYetRankedTooltip } from '@/ppm-tool/components/ui/NotYetRankedTooltip';
import { analytics } from '@/lib/analytics';


interface ComparisonChartProps {
  tools: Tool[];
  criteria: Criterion[];
  comparedTools?: Set<string>;
  onOpenGuidedRanking?: () => void;
  onNavigateToCriteria?: () => void;
}

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  tools: selectedTools,
  criteria: selectedCriteria,
  comparedTools = new Set(),
  onOpenGuidedRanking,
  onNavigateToCriteria
}) => {
  const isMobile = useMobileDetection();
  
  // Check if criteria have been adjusted from defaults (isolated from bumper logic)
  const criteriaAdjusted = hasCriteriaBeenAdjusted(selectedCriteria);


  const [visibleCriteria, setVisibleCriteria] = useState<Set<string>>(
    new Set(selectedCriteria.map((c) => c.id))
  );

  // Update visible criteria when selected criteria changes
  React.useEffect(() => {
    setVisibleCriteria(new Set(selectedCriteria.map((c) => c.id)));
  }, [selectedCriteria]);

  // Initialize with requirements visible only if ranked, and compared tools visible by default
  const [visibleTools, setVisibleTools] = useState<Set<string>>(() => {
    const tools = new Set<string>();
    // Only add requirements if criteria have been adjusted
    if (criteriaAdjusted) {
      tools.add('requirements');
    }
    // Add compared tools to visible set
    comparedTools.forEach(toolId => tools.add(toolId));
    return tools;
  });

  // Update visible tools when compared tools change or criteria adjustment status changes
  React.useEffect(() => {
    setVisibleTools(() => {
      const newVisible = new Set<string>();
      // Only add requirements if criteria have been adjusted
      if (criteriaAdjusted) {
        newVisible.add('requirements');
      }
      comparedTools.forEach(toolId => newVisible.add(toolId));
      return newVisible;
    });
  }, [comparedTools, criteriaAdjusted]);

  const handleToggleTool = (toolId: string) => {
    const newVisible = new Set(visibleTools);
    const wasVisible = newVisible.has(toolId);
    
    if (wasVisible) {
      newVisible.delete(toolId);
    } else {
      newVisible.add(toolId);
    }
    
    // Track chart tool toggle for New_Active metric
    try {
      checkAndTrackNewActive('Active-comparison', {
        component: 'comparison_chart',
        tool_id: toolId,
        interaction_type: 'toggle_tool',
        action: wasVisible ? 'hide_tool' : 'show_tool'
      });
    } catch (error) {
      console.warn('Failed to track chart tool toggle:', error);
    }
    
    setVisibleTools(newVisible);
    void analytics.trackChartInteraction({
      interactionType: 'toggle_tool',
      toolId,
      action: wasVisible ? 'hide_tool' : 'show_tool',
      criteriaAdjusted,
      visibleToolCount: newVisible.size,
      visibleCriterionCount: visibleCriteria.size,
      context: {
        source_component: 'comparison_chart',
      },
    });
  };

  const handleToggleCriterion = (criterionId: string) => {
    const newVisible = new Set(visibleCriteria);
    const wasVisible = newVisible.has(criterionId);
    
    // Check if hiding would result in less than 1 visible criteria
    if (wasVisible && newVisible.size <= 1) {
      return; // Don't allow hiding if it would result in no visible criteria
    } else if (wasVisible) {
      newVisible.delete(criterionId);
    } else {
      newVisible.add(criterionId);
    }
    
    // Track chart criterion toggle for New_Active metric
    try {
      checkAndTrackNewActive('Active-comparison', {
        component: 'comparison_chart',
        criterion_id: criterionId,
        interaction_type: 'toggle_criterion',
        action: wasVisible ? 'hide_criterion' : 'show_criterion'
      });
    } catch (error) {
      console.warn('Failed to track chart criterion toggle:', error);
    }
    
    setVisibleCriteria(newVisible);
    void analytics.trackChartInteraction({
      interactionType: 'toggle_criterion',
      criterionId,
      action: wasVisible ? 'hide_criterion' : 'show_criterion',
      criteriaAdjusted,
      visibleToolCount: visibleTools.size,
      visibleCriterionCount: newVisible.size,
      context: {
        source_component: 'comparison_chart',
      },
    });
  };

  const handleToggleAllTools = (visible: boolean) => {
    const tools = new Set<string>();
    // Only add 'requirements' (Your Tool) if criteria have been adjusted
    if (criteriaAdjusted) {
      tools.add('requirements');
    }
    // Add or remove other tools based on the visible parameter
    if (visible) {
      selectedTools.forEach((tool) => tools.add(tool.id));
    }
    setVisibleTools(tools);
    void analytics.trackChartInteraction({
      interactionType: visible ? 'show_all_tools' : 'hide_all_tools',
      action: visible ? 'show_all_tools' : 'hide_all_tools',
      criteriaAdjusted,
      visibleToolCount: tools.size,
      visibleCriterionCount: visibleCriteria.size,
      context: {
        source_component: 'comparison_chart',
      },
    });
  };

  const handleToggleAllCriteria = (visible: boolean) => {
    if (visible) {
      // Show all criteria
      setVisibleCriteria(new Set(selectedCriteria.map((c) => c.id)));
    } else {
      // Hide all but keep the first criterion visible
      const firstCriterion = selectedCriteria[0];
      if (firstCriterion) {
        setVisibleCriteria(new Set([firstCriterion.id]));
      }
    }
    const nextVisibleCount = visible
      ? selectedCriteria.length
      : (selectedCriteria[0] ? 1 : 0);
    void analytics.trackChartInteraction({
      interactionType: visible ? 'show_all_criteria' : 'hide_all_criteria',
      action: visible ? 'show_all_criteria' : 'hide_all_criteria',
      criteriaAdjusted,
      visibleToolCount: visibleTools.size,
      visibleCriterionCount: nextVisibleCount,
      context: {
        source_component: 'comparison_chart',
      },
    });
  };

  // Enhanced function to get tool rating for a criterion
  const getToolRating = (tool: Tool, criterion: Criterion): number => {
    try {
      // First try to find the criterion in the tool's criteria array by ID
      if (Array.isArray(tool.criteria)) {
        const criterionDataById = tool.criteria.find(c => 
          c.id === criterion.id
        );
        if (criterionDataById && typeof criterionDataById.ranking === 'number') {
          return criterionDataById.ranking;
        }
        
        // Or by name
        const criterionDataByName = tool.criteria.find(c => 
          c.name === criterion.name
        );
        if (criterionDataByName && typeof criterionDataByName.ranking === 'number') {
          return criterionDataByName.ranking;
        }
        
        // Case-insensitive name match as a fallback
        const criterionByLowerName = tool.criteria.find(c => 
          c.name && criterion.name && 
          c.name.toLowerCase() === criterion.name.toLowerCase()
        );
        if (criterionByLowerName && typeof criterionByLowerName.ranking === 'number') {
          return criterionByLowerName.ranking;
        }
      }

      // Next try to get rating from ratings object using criterion ID
      if (tool.ratings && typeof tool.ratings[criterion.id] === 'number') {
        return tool.ratings[criterion.id];
      }
      
      // Special case for specific criterion IDs in the rating object
      const criterionMappings: Record<string, string[]> = {
        'scalability': ['Scalability', 'scalability'],
        'integrations': ['Integrations & Extensibility', 'integrations', 'Integrations'],
        'easeOfUse': ['Ease of Use', 'easeOfUse', 'ease_of_use', 'ease-of-use'],
        'flexibility': ['Flexibility & Customization', 'flexibility', 'customization'],
        'ppmFeatures': ['Portfolio Management', 'ppmFeatures', 'ppm_features', 'ppm'],
        'reporting': ['Reporting & Analytics', 'reporting', 'analytics'],
        'security': ['Security & Compliance', 'security', 'compliance']
      };
      
      // Try all possible criterion keys
      const possibleKeys = criterionMappings[criterion.id] || [criterion.name, criterion.id];
      
      for (const key of possibleKeys) {
        if (tool.ratings && typeof tool.ratings[key] === 'number') {
          return tool.ratings[key];
        }
      }
      
      // Check the ratings object with case-insensitive keys
      if (tool.ratings) {
        const criterionNameLower = criterion.name.toLowerCase();
        const matchingKey = Object.keys(tool.ratings).find(key => 
          key.toLowerCase() === criterionNameLower || 
          key.toLowerCase() === criterion.id.toLowerCase()
        );
        
        if (matchingKey && typeof tool.ratings[matchingKey] === 'number') {
          return tool.ratings[matchingKey];
        }
      }

      // Default to 0 if not found
      return 0;
    } catch (error) {
      console.error(`Error getting rating for criterion ${criterion.name}:`, error);
      return 0;
    }
  };

  // Filter criteria to only those that are visible
  const visibleCriteriaList = selectedCriteria.filter(c => visibleCriteria.has(c.id));

  // Prepare datasets for the chart
  const datasets = [];
  
  // Add requirements dataset if visible
  if (visibleTools.has('requirements')) {
    datasets.push({
      label: 'Your Tool',
      data: visibleCriteriaList.map((c) => c.userRating),
      backgroundColor: 'rgba(34, 197, 94, 0.25)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 4,
      borderDash: [8, 4],
      pointRadius: 8,
      pointHoverRadius: 10,
      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      pointBorderColor: 'rgba(255, 255, 255, 1)',
      pointBorderWidth: 3,
    });
  }
  
  // Add datasets for visible tools
  selectedTools.forEach((tool, index) => {
    if (visibleTools.has(tool.id)) {
      const [backgroundColor, borderColor] = getToolColor(index);
      
      // Use getToolRating for each criterion to ensure consistent data access
      const toolData = visibleCriteriaList.map((criterion) => getToolRating(tool, criterion));
      
      datasets.push({
        label: tool.name,
        data: toolData,
        backgroundColor,
        borderColor,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }
  });

  const data = {
    labels: visibleCriteriaList.map((c) => c.name),
    datasets
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        top: isMobile ? 10 : 20,
        right: isMobile ? 10 : 20,
        bottom: isMobile ? 10 : 20,
        left: isMobile ? 10 : 20,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: TooltipItem<'radar'>[]) => {
            const criterionName = context[0].label;
            return `${criterionName}`;
          },
          label: (context: TooltipItem<'radar'>) => {
            const label = context.dataset.label || '';
            const value = typeof context.raw === 'number' ? context.raw : 0;
            return `${label}: ${value}/5`;
          },
        },
      },
    },
    scales: {
      r: {
        angleLines: { display: true },
        pointLabels: {
          display: true,
          font: {
            size: isMobile ? 11 : 12,
          },
          padding: isMobile ? 12 : 18,
          color: '#374151',
          callback: function (value: string) {
            // Better text wrapping for mobile and desktop
            const maxLength = isMobile ? 10 : 15;
            if (value.length > maxLength) {
              const words = value.split(' ');
              const lines: string[] = [];
              let currentLine = '';

              words.forEach((word) => {
                if (currentLine.length + word.length > maxLength) {
                  if (currentLine) lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine += (currentLine.length === 0 ? '' : ' ') + word;
                }
              });
              if (currentLine.length > 0) {
                lines.push(currentLine);
              }
              return lines;
            }
            return value;
          },
        },
        min: 0,
        max: 5,
        ticks: {
          display: false,
          stepSize: 1,
          beginAtZero: true,
          precision: 0,
        },
        grid: {
          circular: false,
          lineWidth: 1,
        },
      },
    },
  };

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 pb-3 md:pb-4 border-b bg-white">
        <div className="flex items-center">
          <LineChart className="w-5 h-5 md:w-6 md:h-6 mr-2 text-alpine-blue-400" />
          <div className="flex items-center">
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Tools - Criteria Comparison</h2>
            <span className="hidden md:block ml-2 text-xs md:text-sm text-gray-500">
              {selectedTools.length} {selectedTools.length === 1 ? 'tool' : 'tools'} analyzed
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1 md:gap-2">
          <ChartControls
            tools={selectedTools}
            criteria={selectedCriteria}
            visibleTools={visibleTools}
            visibleCriteria={visibleCriteria}
            onToggleTool={handleToggleTool}
            onToggleCriterion={handleToggleCriterion}
            onToggleAllTools={handleToggleAllTools}
            onToggleAllCriteria={handleToggleAllCriteria}
          />
        </div>
      </div>

      {/* Sub-header */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        <div className="px-4 md:px-6 py-3">
          <p className="text-sm text-gray-600">
            Your needs and tool capabilities, side by side for easy analysis.
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="section-scroll" data-lenis-prevent>
        {/* Mobile Tool Selector */}
        {isMobile ? (
          <div className="p-2 bg-white">
            <MobileToolSelector
              tools={selectedTools}
              visibleTools={visibleTools}
              onToggleTool={handleToggleTool}
              criteria={selectedCriteria}
              onGuidedRankingClick={onOpenGuidedRanking}
              onNavigateToCriteria={onNavigateToCriteria}
            />
          </div>
        ) : (
          /* Desktop Tool Toggles */
          <div className="flex flex-wrap gap-4 py-2 justify-center bg-white/90 border-t">
            <button
              key="chart-toggle-requirements"
              onClick={() => handleToggleTool('requirements')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                visibleTools.has('requirements')
                  ? 'bg-green-100 border-2 border-green-300 shadow-sm'
                  : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              {visibleTools.has('requirements') ? (
                <div className="w-5 h-5 border-3 border-dashed border-green-600 bg-green-200 rounded-sm" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              {criteriaAdjusted ? (
                <span className={`inline-flex items-center text-sm font-semibold ${
                  visibleTools.has('requirements') ? 'text-green-800' : 'text-gray-600'
                }`}>
                  Your Tool
                </span>
              ) : (
                <NotYetRankedTooltip 
                  onGuidedRankingClick={onOpenGuidedRanking}
                  onNavigateToCriteria={onNavigateToCriteria}
                  inline={true}
                  wrapYourTool={true}
                  isVisible={visibleTools.has('requirements')}
                />
              )}
            </button>
            {selectedTools.map((tool, index) => {
              const [backgroundColor, borderColor] = getToolColor(index);
              return (
                <button
                  key={`chart-toggle-${tool.id}-${index}`}
                  onClick={() => handleToggleTool(tool.id)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  {visibleTools.has(tool.id) ? (
                    <div
                      className="w-4 h-4"
                      style={{
                        backgroundColor,
                        borderColor,
                        borderWidth: 2,
                        borderStyle: 'solid',
                      }}
                    />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">{tool.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className={`w-full ${isMobile ? 'h-[360px]' : 'h-[450px]'} ${isMobile ? 'pt-2 px-3' : 'pt-4 px-4'}`}>
          <Radar data={data} options={options} />
        </div>
      </div>
    </div>
  );

  // SIMPLIFIED: Always use standard layout (removed fullscreen complexity)
  return (
    <div
      id="chart-section"
      className="bg-white rounded-lg shadow-lg flex flex-col h-full overflow-hidden"
    >
      {content}
    </div>
  );
};

export default ComparisonChart;