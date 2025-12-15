'use client';

import React, { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import './PanoramicTooltip.css';

type TooltipPosition = 'top' | 'bottom';
type TooltipAlign = 'center' | 'left' | 'right';
type TooltipWidth = 'narrow' | 'default' | 'wide';

interface PanoramicTooltipProps {
  children: ReactNode;
  trigger?: ReactNode;
  position?: TooltipPosition;
  align?: TooltipAlign;
  width?: TooltipWidth;
  className?: string;
  iconSize?: number;
}

export const PanoramicTooltip: React.FC<PanoramicTooltipProps> = ({
  children,
  trigger,
  position = 'top',
  align = 'center',
  width = 'default',
  className = '',
  iconSize = 16,
}) => {
  const positionClass = position === 'bottom' ? 'panoramic-tooltip__content--bottom' : '';
  const alignClass = align === 'left'
    ? 'panoramic-tooltip__content--left'
    : align === 'right'
      ? 'panoramic-tooltip__content--right'
      : '';
  const widthClass = width === 'narrow'
    ? 'panoramic-tooltip__content--narrow'
    : width === 'wide'
      ? 'panoramic-tooltip__content--wide'
      : '';

  return (
    <div className={`panoramic-tooltip ${className}`}>
      <span className="panoramic-tooltip__trigger">
        {trigger || (
          <HelpCircle
            width={iconSize}
            height={iconSize}
            strokeWidth={2}
          />
        )}
      </span>

      <div className={`panoramic-tooltip__content ${positionClass} ${alignClass} ${widthClass}`}>
        <div className="panoramic-tooltip__accent"></div>
        {children}
      </div>
    </div>
  );
};

export default PanoramicTooltip;
