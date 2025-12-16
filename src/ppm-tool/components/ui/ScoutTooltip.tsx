'use client';

import React, { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import './ScoutTooltip.css';

type TooltipPosition = 'top' | 'bottom';
type TooltipAlign = 'center' | 'left' | 'right';
type TooltipWidth = 'narrow' | 'default' | 'wide';

interface ScoutTooltipProps {
  children: ReactNode;
  trigger?: ReactNode;
  position?: TooltipPosition;
  align?: TooltipAlign;
  width?: TooltipWidth;
  className?: string;
  iconSize?: number;
}

export const ScoutTooltip: React.FC<ScoutTooltipProps> = ({
  children,
  trigger,
  position = 'top',
  align = 'center',
  width = 'default',
  className = '',
  iconSize = 16,
}) => {
  const positionClass = position === 'bottom' ? 'scout-tooltip__content--bottom' : '';
  const alignClass = align === 'left'
    ? 'scout-tooltip__content--left'
    : align === 'right'
      ? 'scout-tooltip__content--right'
      : '';
  const widthClass = width === 'narrow'
    ? 'scout-tooltip__content--narrow'
    : width === 'wide'
      ? 'scout-tooltip__content--wide'
      : '';

  return (
    <div className={`scout-tooltip ${className}`}>
      <span className="scout-tooltip__trigger">
        {trigger || (
          <HelpCircle
            width={iconSize}
            height={iconSize}
            strokeWidth={2}
          />
        )}
      </span>

      <div className={`scout-tooltip__content ${positionClass} ${alignClass} ${widthClass}`}>
        <div className="scout-tooltip__accent"></div>
        {children}
      </div>
    </div>
  );
};

export default ScoutTooltip;
