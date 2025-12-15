import React from 'react';
import { SlidersHorizontal, Plus, X } from 'lucide-react';
import { Criterion } from '@/ppm-tool/shared/types';

type Operator = '>' | '>=' | '=' | '<=' | '<';
type Condition = {
  id: string;
  criterionId: string;
  operator: Operator;
  value: number;
};

interface CustomFilterProps {
  selectedCriteria: Criterion[];
  conditions: Condition[];
  onAddCondition: () => void;
  onRemoveCondition: (id: string) => void;
  onUpdateCondition: (id: string, updates: Partial<Condition>) => void;
  filterMode: 'AND' | 'OR';
  onToggleFilterMode: () => void;
}

export const CustomFilter: React.FC<CustomFilterProps> = ({
  selectedCriteria,
  conditions,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
  filterMode,
  onToggleFilterMode,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Custom Filters</span>
        </div>
        <button
          onClick={onToggleFilterMode}
                      className="text-xs font-medium text-alpine-blue-500 hover:text-alpine-blue-700"
        >
          Match {filterMode === 'AND' ? 'ALL' : 'ANY'}
        </button>
      </div>

      <div className="space-y-2">
        {conditions.map((condition) => (
          <div key={condition.id} className="flex items-center gap-2">
            <select
              value={condition.criterionId}
              onChange={(e) => onUpdateCondition(condition.id, { criterionId: e.target.value })}
              className="flex-1 text-sm rounded-md border border-gray-300 shadow-sm focus:border-alpine-blue-500 focus:ring-alpine-blue-500 py-1.5 px-3"
            >
              {selectedCriteria.map((criterion) => (
                <option key={criterion.id} value={criterion.id}>
                  {criterion.name}
                </option>
              ))}
            </select>
            <select
              value={condition.operator}
              onChange={(e) => onUpdateCondition(condition.id, { operator: e.target.value as Operator })}
              className="w-20 text-sm rounded-md border border-gray-300 shadow-sm focus:border-alpine-blue-500 focus:ring-alpine-blue-500 py-1.5 px-3"
            >
              <option value=">">{'>'}</option>
              <option value=">=">{'>='}</option>
              <option value="=">{'='}</option>
              <option value="<=">{'<='}</option>
              <option value="<">{'<'}</option>
            </select>
            <input
              type="number"
              min="1"
              max="10"
              value={condition.value}
              onChange={(e) => onUpdateCondition(condition.id, { value: parseInt(e.target.value) })}
              className="w-20 text-sm rounded-md border border-gray-300 shadow-sm focus:border-alpine-blue-500 focus:ring-alpine-blue-500 py-1.5 px-3"
            />
            <button
              onClick={() => onRemoveCondition(condition.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAddCondition}
                    className="flex items-center space-x-1 text-sm text-alpine-blue-500 hover:text-alpine-blue-700"
      >
        <Plus className="w-4 h-4" />
        <span>Add Filter</span>
      </button>
    </div>
  );
};