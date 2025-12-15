'use client';

import React, { useState } from 'react';
import { Tag, ChevronDown } from 'lucide-react';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';

interface UseCaseFilterProps {
  selectedUseCases: Set<string>;
  onToggleUseCase: (useCase: string) => void;
  filterMode: 'AND' | 'OR';
  onToggleFilterMode: () => void;
}

const USE_CASES = ['Waterfall', 'Agile', 'Marketing', 'R&D'];

export const UseCaseFilter: React.FC<UseCaseFilterProps> = ({
  selectedUseCases,
  onToggleUseCase,
  filterMode,
  onToggleFilterMode,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Tag className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium mr-3">Use Cases</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
            >
              <span>Match {filterMode === 'AND' ? 'ALL' : 'ANY'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isOpen && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                <div className="p-1">
                  <button
                    onClick={() => {
                      if (filterMode === 'AND') onToggleFilterMode();
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded ${
                      filterMode === 'OR' ? 'bg-alpine-blue-50 text-alpine-blue-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    Match ANY selected use case
                  </button>
                  <button
                    onClick={() => {
                      if (filterMode === 'OR') onToggleFilterMode();
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded ${
                      filterMode === 'AND' ? 'bg-alpine-blue-50 text-alpine-blue-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    Match ALL selected use cases
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {USE_CASES.map((useCase) => (
          <button
            key={useCase}
            onClick={() => onToggleUseCase(useCase)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedUseCases.has(useCase)
                ? 'bg-alpine-blue-100 text-alpine-blue-700 hover:bg-alpine-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {useCase}
          </button>
        ))}
      </div>
    </div>
  );
}