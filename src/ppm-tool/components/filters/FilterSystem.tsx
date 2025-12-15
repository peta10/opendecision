'use client';

import React from 'react';
import { Filter, Plus, X } from 'lucide-react';
import { Criterion } from '@/ppm-tool/shared/types';

export type FilterType = 'Methodology' | 'Criteria';

export interface FilterCondition {
  id: string;
  type: FilterType;
  value: string;
  operator?: '>' | '>=' | '=' | '<=' | '<';
  rating?: number;
}

interface FilterSystemProps {
  selectedCriteria: Criterion[];
  conditions: FilterCondition[];
  onAddCondition: () => void;
  incompleteFilterId?: string | null;
  onRemoveCondition: (id: string) => void;
  onUpdateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  filterMode: 'AND' | 'OR';
  onToggleFilterMode: () => void;
}

const METHODOLOGIES = ['Waterfall', 'Agile', 'Continuous Improvement'];

export const FilterSystem: React.FC<FilterSystemProps> = ({
  selectedCriteria,
  conditions,
  onAddCondition,
  incompleteFilterId,
  onRemoveCondition,
  onUpdateCondition,
  filterMode,
  onToggleFilterMode,
}) => {
  // Debug logging
  React.useEffect(() => {
    console.debug('FilterSystem - Current conditions:', conditions);
    console.debug('FilterSystem - Selected criteria:', selectedCriteria);
  }, [conditions, selectedCriteria]);

  const isFieldIncomplete = (condition: FilterCondition, fieldName: keyof FilterCondition) => {
    if (condition.type === 'Criteria') {
      switch (fieldName) {
        case 'value':
          return !condition.value;
        case 'operator':
          return !condition.operator;
        case 'rating':
          return condition.rating === undefined || condition.rating === null;
        default:
          return false;
      }
    }
    return !condition.value;
  };

  const isConditionIncomplete = (condition: FilterCondition) => {
    if (condition.type === 'Criteria') {
      return !condition.value || !condition.operator || condition.rating === undefined || condition.rating === null;
    }
    return !condition.value;
  };

  const handleUpdateCondition = (id: string, updates: Partial<FilterCondition>) => {
    console.debug('FilterSystem - Updating condition:', id, updates);
    onUpdateCondition(id, updates);
  };

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Filter className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          <span className="text-xs md:text-sm font-medium">Filters</span>
        </div>
        <button
          onClick={onToggleFilterMode}
          className="text-xs font-medium text-alpine-blue-500 hover:text-alpine-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-alpine-blue-50"
        >
          Match {filterMode === 'AND' ? 'ALL' : 'ANY'}
        </button>
      </div>

      <div className="space-y-3">
        {conditions.map((condition) => {
          const isIncomplete = isConditionIncomplete(condition);
          return (
            <div 
              key={condition.id} 
              className="border border-gray-200 rounded-lg p-3 space-y-2 relative bg-gray-50/30"
            >
              {/* Remove button positioned absolutely */}
              <button
                onClick={() => onRemoveCondition(condition.id)}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 touch-manipulation"
                aria-label="Remove filter"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Filter Type Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">Filter Type</label>
                <select
                  value={condition.type}
                  onChange={(e) => handleUpdateCondition(condition.id, { 
                    type: e.target.value as FilterType,
                    value: '',
                    operator: undefined,
                    rating: undefined
                  })}
                  className={`w-full text-sm text-gray-700 rounded-md border py-3 px-3 border-gray-300 focus:border-alpine-blue-500 focus:ring-1 focus:ring-alpine-blue-500 touch-manipulation ${
                    !condition.type ? 'border-gray-300' : ''
                  }`}
                >
                  <option value="">Select type...</option>
                  <option value="Methodology">Methodology</option>
                  <option value="Criteria">Criteria</option>
                </select>
              </div>

              {/* Methodology Filter */}
              {condition.type === 'Methodology' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">Methodology</label>
                  <select
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                    className={`w-full text-sm text-gray-700 rounded-md border py-3 px-3 border-gray-300 focus:border-alpine-blue-500 focus:ring-1 focus:ring-alpine-blue-500 touch-manipulation ${
                      isFieldIncomplete(condition, 'value') ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Select methodology...</option>
                    {METHODOLOGIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Criteria Filter */}
              {condition.type === 'Criteria' && (
                <div className="space-y-2">
                  {/* Criteria Selection */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">Criteria</label>
                    <select
                      value={condition.value}
                      onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                                              className={`w-full text-sm text-gray-700 rounded-md border py-3 px-3 border-gray-300 focus:border-alpine-blue-500 focus:ring-1 focus:ring-alpine-blue-500 touch-manipulation ${
                          isFieldIncomplete(condition, 'value') ? 'border-red-300' : ''
                        }`}
                    >
                      <option value="">Select criteria...</option>
                      {selectedCriteria.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator and Rating in a responsive grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">Operator</label>
                      <select
                        value={condition.operator || ''}
                        onChange={(e) => handleUpdateCondition(condition.id, { 
                          operator: e.target.value as '>' | '>=' | '=' | '<=' | '<'
                        })}
                        className={`w-full text-sm text-gray-700 rounded-md border py-3 px-3 border-gray-300 focus:border-alpine-blue-500 focus:ring-1 focus:ring-alpine-blue-500 touch-manipulation ${
                          isFieldIncomplete(condition, 'operator') ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="">Select...</option>
                        <option value=">">Greater than</option>
                        <option value=">=">Greater or equal</option>
                        <option value="=">Equal to</option>
                        <option value="<=">Less or equal</option>
                        <option value="<">Less than</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">Rating</label>
                      <select
                        value={condition.rating || ''}
                        onChange={(e) => handleUpdateCondition(condition.id, { 
                          rating: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className={`w-full text-sm text-gray-700 rounded-md border py-3 px-3 border-gray-300 focus:border-alpine-blue-500 focus:ring-1 focus:ring-alpine-blue-500 touch-manipulation ${
                          isFieldIncomplete(condition, 'rating') ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="">Select...</option>
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onAddCondition}
        className="flex items-center justify-center space-x-2 w-full text-sm text-alpine-blue-500 hover:text-alpine-blue-700 px-4 py-3 rounded-lg hover:bg-alpine-blue-50 transition-colors border border-alpine-blue-200 border-dashed touch-manipulation"
      >
        <Plus className="w-4 h-4" />
        <span>Add Filter</span>
      </button>

      {/* Debug section - remove in production */}
      {process.env.NODE_ENV === 'development' && conditions.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs">
          <div className="font-medium text-gray-700 mb-2">Debug Info:</div>
          <div className="space-y-1 text-gray-700">
            <div>Filter Mode: {filterMode}</div>
            <div>Conditions: {conditions.length}</div>
            {conditions.map((condition, index) => (
              <div key={condition.id} className="ml-2">
                {index + 1}. {condition.type}: {condition.value} {condition.operator} {condition.rating}
                {isConditionIncomplete(condition) && <span className="text-red-500 ml-2">(incomplete)</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};