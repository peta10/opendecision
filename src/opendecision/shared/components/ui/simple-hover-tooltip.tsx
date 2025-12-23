import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';

interface SimpleHoverTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/**
 * Simple hover tooltip that always works regardless of device type.
 * Use this for testing if the basic tooltip functionality works.
 */
export const SimpleHoverTooltip: React.FC<SimpleHoverTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = ''
}) => {
  console.log('SimpleHoverTooltip - Always rendering tooltip');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className={className}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
