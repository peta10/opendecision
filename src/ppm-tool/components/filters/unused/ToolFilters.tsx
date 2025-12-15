import React from 'react';
import { MethodologyFilter } from './MethodologyFilter';
import { CustomFilter } from './CustomFilter';
import { Criterion } from '@/ppm-tool/shared/types';

interface ToolFiltersProps {
  selectedCriteria: Criterion[];
  selectedMethodologies: Set<string>;
  selectedFunctions: Set<string>;
  customConditions: Array<{
    id: string;
    criterionId: string;
    operator: '>' | '>=' | '=' | '<=' | '<';
    value: number;
  }>;
  methodologyFilterMode: 'AND' | 'OR';
  functionFilterMode: 'AND' | 'OR';
  customFilterMode: 'AND' | 'OR';
  onToggleMethodology: (methodology: string) => void;
  onToggleFunction: (fn: string) => void;
  onAddCondition: () => void;
  onRemoveCondition: (id: string) => void;
  onUpdateCondition: (id: string, updates: Partial<{
    criterionId: string;
    operator: '>' | '>=' | '=' | '<=' | '<';
    value: number;
  }>) => void;
  onToggleMethodologyFilterMode: () => void;
  onToggleFunctionFilterMode: () => void;
  onToggleCustomFilterMode: () => void;
}

export const ToolFilters: React.FC<ToolFiltersProps> = ({
  selectedCriteria,
  selectedMethodologies,
  selectedFunctions,
  customConditions,
  methodologyFilterMode,
  functionFilterMode,
  customFilterMode,
  onToggleMethodology,
  onToggleFunction,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  onToggleMethodologyFilterMode,
  onToggleFunctionFilterMode,
  onToggleCustomFilterMode,
}) => {
  return (
    <div className="space-y-6">
      <MethodologyFilter
        selectedMethodologies={selectedMethodologies}
        onToggleMethodology={onToggleMethodology}
        filterMode={methodologyFilterMode}
        onToggleFilterMode={onToggleMethodologyFilterMode}
      />
      {/* FunctionFilter component removed as it doesn't exist */}
      <CustomFilter
        selectedCriteria={selectedCriteria}
        conditions={customConditions}
        onAddCondition={onAddCondition}
        onRemoveCondition={onRemoveCondition}
        onUpdateCondition={onUpdateCondition}
        filterMode={customFilterMode}
        onToggleFilterMode={onToggleCustomFilterMode}
      />
    </div>
  );
};