import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

interface DesktopTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/**
 * Desktop-only tooltip that shows on hover for non-touch devices.
 * On touch devices, this renders children without any tooltip behavior.
 */
export const DesktopTooltip: React.FC<DesktopTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = ''
}) => {
  const { isTouchDevice } = useUnifiedMobileDetection();

  // Debug logging
  React.useEffect(() => {
    console.log('DesktopTooltip - isTouchDevice:', isTouchDevice);
    console.log('DesktopTooltip - window.matchMedia hover:', window.matchMedia('(hover: hover)').matches);
    console.log('DesktopTooltip - window.matchMedia pointer:', window.matchMedia('(pointer: fine)').matches);
  }, [isTouchDevice]);

  // On touch devices, just render children without tooltip
  if (isTouchDevice) {
    console.log('DesktopTooltip - Skipping tooltip due to touch device');
    return <>{children}</>;
  }

  console.log('DesktopTooltip - Rendering tooltip for desktop');

  // On desktop, provide hover tooltip
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
