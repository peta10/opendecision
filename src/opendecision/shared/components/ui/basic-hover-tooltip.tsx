import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/opendecision/shared/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { showAccent?: boolean }
>(({ className, sideOffset = 8, showAccent = true, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Premium Panoramic tooltip styling
        "z-50 overflow-hidden rounded-lg bg-white text-slate-700 pl-5 pr-4 py-3 text-sm pointer-events-auto",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Premium soft shadow
        "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.05)]",
        className
      )}
      {...props}
    >
      {/* Panoramic Brand Gradient Bar */}
      {showAccent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ background: 'linear-gradient(to bottom, #FFB300, #0072bc, #00C853)' }}
        />
      )}
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

interface BasicHoverTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  forceOpen?: boolean; // New prop for external control
}

/**
 * Basic hover tooltip with no device detection - just pure hover behavior
 * Now supports external control via forceOpen prop
 */
export const BasicHoverTooltip: React.FC<BasicHoverTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  forceOpen = false
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // When forceOpen is true, use that; otherwise use internal hover state
  const effectiveOpen = forceOpen || internalOpen;

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      <Tooltip 
        open={effectiveOpen}
        onOpenChange={forceOpen ? undefined : setInternalOpen}
      >
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
