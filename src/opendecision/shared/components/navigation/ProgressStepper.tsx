'use client';

import React from 'react';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface ProgressStepperProps {
  steps?: Step[];
  className?: string;
}

const defaultSteps: Step[] = [
  { id: 'profile', label: 'Profile', status: 'completed' },
  { id: 'products', label: 'Products', status: 'current' },
  { id: 'compare', label: 'Compare', status: 'upcoming' },
  { id: 'decide', label: 'Decide', status: 'upcoming' },
];

export function ProgressStepper({ steps = defaultSteps, className = '' }: ProgressStepperProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step */}
          <div className="flex items-center gap-2">
            {step.status === 'completed' ? (
              <div className="w-7 h-7 rounded-full bg-[#5BDFC2] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            ) : step.status === 'current' ? (
              <div className="w-7 h-7 rounded-full bg-[#5BDFC2]/20 border-2 border-[#5BDFC2] flex items-center justify-center">
                <span className="text-xs font-bold text-[#0D9488]">{index + 1}</span>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
                <span className="text-xs font-medium text-neutral-400">{index + 1}</span>
              </div>
            )}
            <span className={`text-sm ${
              step.status === 'completed'
                ? 'font-medium text-neutral-900'
                : step.status === 'current'
                  ? 'font-medium text-[#0D9488]'
                  : 'text-neutral-400'
            }`}>
              {step.label}
            </span>
          </div>

          {/* Connector (not after last step) */}
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 max-w-[60px] ${
              step.status === 'completed' ? 'bg-[#5BDFC2]' : 'bg-neutral-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
