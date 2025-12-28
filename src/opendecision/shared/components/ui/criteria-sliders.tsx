'use client';

import React, { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/opendecision/shared/lib/utils';
import { GripVertical, X } from 'lucide-react';

interface CriteriaWeight {
  id: string;
  name: string;
  weight: number; // 0-100
  color: string;
}

interface CriteriaSlidersProps {
  criteria?: CriteriaWeight[];
  onChange?: (criteria: CriteriaWeight[]) => void;
  className?: string;
}

// Default criteria based on tool ratings
const defaultCriteria: CriteriaWeight[] = [
  { id: 'scalability', name: 'Scalability', weight: 70, color: '#6EDCD1' },
  { id: 'integrations', name: 'Integrations', weight: 85, color: '#4BBEB3' },
  { id: 'easeOfUse', name: 'Ease of Use', weight: 90, color: '#22C55E' },
  { id: 'flexibility', name: 'Flexibility', weight: 60, color: '#3BA99E' },
  { id: 'ppmFeatures', name: 'PPM Features', weight: 75, color: '#0EA5E9' },
  { id: 'reporting', name: 'Reporting', weight: 55, color: '#8B5CF6' },
  { id: 'security', name: 'Security', weight: 80, color: '#F59E0B' },
];

/**
 * CriteriaSliders - Interactive weight sliders for decision criteria
 *
 * Features:
 * - Smooth slider interaction
 * - Real-time percentage display
 * - Color-coded visual feedback
 * - Weight distribution visualization
 * - Add/remove criteria
 */
export const CriteriaSliders: React.FC<CriteriaSlidersProps> = ({
  criteria: initialCriteria,
  onChange,
  className,
}) => {
  const [criteria, setCriteria] = useState<CriteriaWeight[]>(
    initialCriteria || defaultCriteria
  );

  const handleWeightChange = (id: string, newWeight: number) => {
    const updated = criteria.map((c) =>
      c.id === id ? { ...c, weight: newWeight } : c
    );
    setCriteria(updated);
    onChange?.(updated);
  };

  const handleRemove = (id: string) => {
    const updated = criteria.filter((c) => c.id !== id);
    setCriteria(updated);
    onChange?.(updated);
  };

  // Calculate total weight for distribution bar
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Weight Distribution Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
            Weight Distribution
          </span>
          <span className="text-xs text-[#7A8D9C]">
            {criteria.length} criteria
          </span>
        </div>
        <div className="h-2.5 bg-[#f5f7f7] rounded-full overflow-hidden flex">
          {criteria.map((c, index) => (
            <div
              key={c.id}
              className="h-full transition-all duration-300"
              style={{
                width: `${(c.weight / totalWeight) * 100}%`,
                backgroundColor: c.color,
                opacity: 0.8 + (index * 0.02),
              }}
              title={`${c.name}: ${Math.round((c.weight / totalWeight) * 100)}%`}
            />
          ))}
        </div>
      </div>

      {/* Individual Sliders */}
      <div className="space-y-4">
        {criteria.map((criterion, index) => (
          <div
            key={criterion.id}
            className="group animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* Drag Handle */}
              <div className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
                <GripVertical className="w-4 h-4 text-[#7A8D9C]" />
              </div>

              {/* Slider Container */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: criterion.color }}
                    />
                    <span className="text-sm font-medium text-[#0B1E2D]">
                      {criterion.name}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: criterion.color }}
                  >
                    {criterion.weight}%
                  </span>
                </div>

                {/* Radix UI Slider */}
                <Slider.Root
                  value={[criterion.weight]}
                  onValueChange={(value) => handleWeightChange(criterion.id, value[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="relative flex items-center w-full h-5 select-none touch-none"
                >
                  <Slider.Track className="relative flex-grow h-2 bg-[#f5f7f7] rounded-full overflow-hidden">
                    <Slider.Range
                      className="absolute h-full rounded-full"
                      style={{
                        backgroundColor: criterion.color,
                        boxShadow: `0 0 8px ${criterion.color}40`,
                      }}
                    />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-4 h-4 bg-white rounded-full border-2 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-transform hover:scale-110"
                    style={{
                      borderColor: criterion.color,
                      boxShadow: `0 2px 8px ${criterion.color}30`,
                    }}
                    aria-label={`${criterion.name} weight`}
                  />
                </Slider.Root>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(criterion.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all"
              >
                <X className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {criteria.length === 0 && (
        <div className="text-center py-8 text-[#7A8D9C]">
          <p className="text-sm">No criteria added yet.</p>
          <p className="text-xs mt-1">Click &quot;Add Criteria&quot; to get started.</p>
        </div>
      )}
    </div>
  );
};

export default CriteriaSliders;
