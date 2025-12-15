import React from 'react';
import { Tag } from 'lucide-react';

const METHODOLOGIES = ['Waterfall', 'Agile', 'Continuous Improvement'] as const;

interface MethodologyFilterProps {
  selectedMethodologies: Set<string>;
  onToggleMethodology: (methodology: string) => void;
  filterMode: 'AND' | 'OR';
  onToggleFilterMode: () => void;
}

export const MethodologyFilter: React.FC<MethodologyFilterProps> = ({
  selectedMethodologies,
  onToggleMethodology,
  filterMode,
  onToggleFilterMode,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Tag className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Methodology</span>
        </div>
        <button
          onClick={onToggleFilterMode}
                      className="text-xs font-medium text-alpine-blue-500 hover:text-alpine-blue-700"
        >
          Match {filterMode === 'AND' ? 'ALL' : 'ANY'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {METHODOLOGIES.map((methodology) => (
          <button
            key={methodology}
            onClick={() => onToggleMethodology(methodology)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedMethodologies.has(methodology)
                ? 'bg-alpine-blue-100 text-alpine-blue-700 hover:bg-alpine-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {methodology}
          </button>
        ))}
      </div>
    </div>
  );
};