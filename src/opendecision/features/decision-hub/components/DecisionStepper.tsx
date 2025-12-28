'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { DecisionStep, DecisionState } from '../types/decisionState';
import { Check, CircleDot, Circle, Lock } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface DecisionStepperProps {
  /** Steps configuration */
  steps: DecisionStep[];
  /** Called when user clicks a step */
  onStepClick?: (state: DecisionState) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * DecisionStepper - Visual progress indicator for the decision lifecycle
 *
 * Shows: Frame ────●──── Compare ────○──── Decide
 *
 * Features:
 * - Shows current state with emphasis
 * - Completed states with checkmarks
 * - Locked states with lock icon
 * - Clickable for navigation (when accessible)
 */
export const DecisionStepper: React.FC<DecisionStepperProps> = ({
  steps,
  onStepClick,
  orientation = 'horizontal',
  size = 'md',
  className,
}) => {
  const isHorizontal = orientation === 'horizontal';

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-xs',
      connector: isHorizontal ? 'w-8 h-0.5' : 'h-8 w-0.5',
    },
    md: {
      icon: 'w-8 h-8',
      text: 'text-sm',
      connector: isHorizontal ? 'w-12 h-0.5' : 'h-12 w-0.5',
    },
    lg: {
      icon: 'w-10 h-10',
      text: 'text-base',
      connector: isHorizontal ? 'w-16 h-1' : 'h-16 w-1',
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.state}>
          {/* Step */}
          <StepItem
            step={step}
            config={config}
            onStepClick={onStepClick}
          />

          {/* Connector (not after last step) */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                config.connector,
                'flex-shrink-0',
                step.isComplete
                  ? 'bg-teal-500'
                  : 'bg-neutral-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// =============================================================================
// STEP ITEM
// =============================================================================

interface StepItemProps {
  step: DecisionStep;
  config: {
    icon: string;
    text: string;
    connector: string;
  };
  onStepClick?: (state: DecisionState) => void;
}

const StepItem: React.FC<StepItemProps> = ({ step, config, onStepClick }) => {
  const isClickable = step.isAccessible && onStepClick;

  const handleClick = () => {
    if (isClickable) {
      onStepClick(step.state);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        'flex flex-col items-center gap-1 transition-all group',
        isClickable && 'cursor-pointer hover:scale-105',
        !isClickable && 'cursor-default'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          config.icon,
          'rounded-full flex items-center justify-center transition-all',
          // Current state
          step.isCurrent && 'bg-teal-500 text-white shadow-md ring-4 ring-teal-100',
          // Completed state
          step.isComplete && !step.isCurrent && 'bg-teal-500 text-white',
          // Future accessible state
          !step.isComplete && !step.isCurrent && step.isAccessible && 'bg-neutral-100 text-neutral-500 group-hover:bg-teal-50 group-hover:text-teal-600',
          // Future locked state
          !step.isComplete && !step.isCurrent && !step.isAccessible && 'bg-neutral-100 text-neutral-300'
        )}
      >
        {step.isComplete && !step.isCurrent ? (
          <Check className="w-4 h-4" />
        ) : step.isCurrent ? (
          <CircleDot className="w-4 h-4" />
        ) : !step.isAccessible ? (
          <Lock className="w-3 h-3" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          config.text,
          'font-medium transition-colors',
          step.isCurrent && 'text-teal-700',
          step.isComplete && !step.isCurrent && 'text-teal-600',
          !step.isComplete && !step.isCurrent && step.isAccessible && 'text-neutral-500 group-hover:text-teal-600',
          !step.isComplete && !step.isCurrent && !step.isAccessible && 'text-neutral-300'
        )}
      >
        {step.label}
      </span>
    </button>
  );
};

// =============================================================================
// COMPACT VARIANT
// =============================================================================

interface CompactStepperProps {
  steps: DecisionStep[];
  className?: string;
}

/**
 * Compact version for tight spaces (just dots)
 */
export const CompactStepper: React.FC<CompactStepperProps> = ({
  steps,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.state}>
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              step.isCurrent && 'w-3 h-3 bg-teal-500 ring-2 ring-teal-200',
              step.isComplete && !step.isCurrent && 'bg-teal-400',
              !step.isComplete && !step.isCurrent && step.isAccessible && 'bg-neutral-300',
              !step.isComplete && !step.isCurrent && !step.isAccessible && 'bg-neutral-200'
            )}
            title={step.label}
          />
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-4 h-px',
                step.isComplete ? 'bg-teal-400' : 'bg-neutral-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default DecisionStepper;
