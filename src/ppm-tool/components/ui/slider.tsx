"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/ppm-tool/shared/lib/utils"
import { checkAndTrackNewActive } from "@/lib/posthog"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, onValueChange, onDragStart, onDragEnd, ...props }, ref) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (!isDragging) {
      setIsDragging(true);
      onDragStart?.();
    }
  }, [isDragging, onDragStart]);

  const handlePointerUp = React.useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
      
      // Track slider interaction for New_Active metric
      try {
        checkAndTrackNewActive('Active-slider', {
          component: 'criteria_slider',
          interaction_type: 'drag_end'
        });
      } catch (error) {
        console.warn('Failed to track slider interaction:', error);
      }
    }
  }, [isDragging, onDragEnd]);

  // Handle cases where pointer events end outside the component
  React.useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      onDragEnd?.();
      
      // Track slider interaction for New_Active metric
      try {
        checkAndTrackNewActive('Active-slider', {
          component: 'criteria_slider',
          interaction_type: 'drag_end_global'
        });
      } catch (error) {
        console.warn('Failed to track slider interaction:', error);
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging, onDragEnd]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center cursor-pointer overflow-hidden",
        className,
      )}
      onValueChange={onValueChange}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gray-200 hover:bg-gray-250 transition-colors duration-150">
        <SliderPrimitive.Range 
          className="absolute h-full bg-alpine-blue-400"
        style={{
          transition: isDragging ? 'none' : 'width 3000ms cubic-bezier(0.25, 0.1, 0.25, 1)'
        }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className="block h-6 w-6 rounded-full border-3 border-alpine-blue-400 bg-white shadow-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alpine-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 hover:shadow-xl active:scale-100 cursor-grab active:cursor-grabbing will-change-transform" 
        style={{
          // Cross-browser focus style overrides to prevent yellow highlighting
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          // Smooth 3-second transition when value changes programmatically, instant when dragging
          transition: isDragging ? 'none' : 'left 3000ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        } as React.CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onFocus={(e) => {
          // Explicitly prevent any browser default focus styles
          e.target.style.outline = 'none';
          e.target.style.boxShadow = 'none';
        }}
        onBlur={(e) => {
          // Reset any potential focus styles
          e.target.style.outline = 'none';
          e.target.style.boxShadow = 'none';
        }}
      />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 