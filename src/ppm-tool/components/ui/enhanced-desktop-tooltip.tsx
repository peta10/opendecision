import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import { cn } from "@/ppm-tool/shared/lib/utils"
import './ScoutTooltip.css'

interface EnhancedDesktopTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  delay?: number;
  forceOpen?: boolean; // New prop for external control
}

/**
 * Enhanced desktop tooltip with better cross-browser compatibility
 * Designed to work consistently across different browsers and geographic locations
 * Now supports external control via forceOpen prop
 */
export const EnhancedDesktopTooltip: React.FC<EnhancedDesktopTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  delay = 200,
  forceOpen = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const { isTouchDevice, hasTouch } = useUnifiedMobileDetection();

  // External control: forceOpen overrides internal state
  const effectiveIsVisible = forceOpen || isVisible;

  // Enhanced hover detection with multiple fallback mechanisms
  const [supportsHover, setSupportsHover] = useState(() => {
    if (typeof window === 'undefined') return true;
    
    try {
      // Multi-layered hover capability detection - with SSR guards
      const userAgent = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
      const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
      
      // Enhanced desktop detection with geographic considerations
      const isDesktopUA = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);
      const isDesktopPlatform = /Win|Mac|Linux|X11/i.test(platform);
      
      // Screen size check as additional validation
      const hasDesktopScreen = window.screen ? 
        (window.screen.width >= 1024 && window.screen.height >= 768) : 
        (window.innerWidth >= 1024);
      
      // Additional touch capability check as backup
      const hasTouchCapability = 'ontouchstart' in window || 
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      
      // Comprehensive detection logic
      const isLikelyDesktop = isDesktopUA && isDesktopPlatform && hasDesktopScreen && !hasTouchCapability;
      
      // For debugging purposes in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Tooltip hover detection:', {
          userAgent: userAgent.slice(0, 50) + '...',
          platform,
          isDesktopUA,
          isDesktopPlatform,
          hasDesktopScreen,
          hasTouchCapability,
          finalResult: isLikelyDesktop
        });
      }
      
      return isLikelyDesktop;
    } catch (error) {
      console.warn('Error in hover detection, defaulting to true:', error);
      return true;
    }
  });

  const safeMatchMedia = (query: string) => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia(query).matches;
      }
    } catch (error) {
      console.warn('matchMedia error:', error);
    }
    return false;
  };

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current || !effectiveIsVisible) return;

    try {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let top = 0;
      let left = 0;
      const padding = 8;

      // Calculate initial position based on side
      switch (side) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - padding;
          switch (align) {
            case 'start':
              left = triggerRect.left;
              break;
            case 'center':
              left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
              break;
            case 'end':
              left = triggerRect.right - tooltipRect.width;
              break;
          }
          break;
        case 'bottom':
          top = triggerRect.bottom + padding;
          switch (align) {
            case 'start':
              left = triggerRect.left;
              break;
            case 'center':
              left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
              break;
            case 'end':
              left = triggerRect.right - tooltipRect.width;
              break;
          }
          break;
        case 'left':
          left = triggerRect.left - tooltipRect.width - padding;
          switch (align) {
            case 'start':
              top = triggerRect.top;
              break;
            case 'center':
              top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
              break;
            case 'end':
              top = triggerRect.bottom - tooltipRect.height;
              break;
          }
          break;
        case 'right':
          left = triggerRect.right + padding;
          switch (align) {
            case 'start':
              top = triggerRect.top;
              break;
            case 'center':
              top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
              break;
            case 'end':
              top = triggerRect.bottom - tooltipRect.height;
              break;
          }
          break;
      }

      // Viewport boundary checking with enhanced logic
      if (left < padding) {
        left = padding;
      } else if (left + tooltipRect.width > viewport.width - padding) {
        left = viewport.width - tooltipRect.width - padding;
      }

      if (top < padding) {
        // If tooltip would go above viewport, show below trigger instead
        if (side === 'top') {
          top = triggerRect.bottom + padding;
        } else {
          top = padding;
        }
      } else if (top + tooltipRect.height > viewport.height - padding) {
        // If tooltip would go below viewport, show above trigger instead
        if (side === 'bottom') {
          top = triggerRect.top - tooltipRect.height - padding;
        } else {
          top = viewport.height - tooltipRect.height - padding;
        }
      }

      setPosition({ top, left });
      setIsPositioned(true);
    } catch (error) {
      console.error('Error calculating tooltip position:', error);
      // Fallback positioning
      setPosition({ top: 0, left: 0 });
      setIsPositioned(true);
    }
  }, [effectiveIsVisible, side, align]);

  // Position calculation effect
  useEffect(() => {
    if (effectiveIsVisible) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(calculatePosition, 10);
      return () => clearTimeout(timeoutId);
    } else {
      setIsPositioned(false);
    }
  }, [effectiveIsVisible, calculatePosition]);

  // Window resize and scroll handlers
  useEffect(() => {
    if (!effectiveIsVisible) return;

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [effectiveIsVisible, calculatePosition]);

  const showTooltip = useCallback(() => {
    if (forceOpen) return; // Don't handle hover when externally controlled
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, forceOpen]);

  const hideTooltip = useCallback(() => {
    if (forceOpen) return; // Don't handle hover when externally controlled
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Small delay before hiding to prevent flicker
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsPositioned(false);
    }, 100);
  }, [forceOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Don't show tooltip on true mobile devices unless forced
  if (isTouchDevice && !forceOpen) {
    return <>{children}</>;
  }

  // Don't show tooltip on devices without proper hover support unless forced (but allow touch-enabled laptops)
  if (!supportsHover && !hasTouch && !forceOpen) {
    return <>{children}</>;
  }

  // Add click handler for touch-enabled laptops
  const handleClick = (e: React.MouseEvent) => {
    if (hasTouch && !isTouchDevice) {
      // Touch-enabled laptop: toggle tooltip on click
      if (effectiveIsVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={handleClick}
        style={hasTouch && !isTouchDevice ? { touchAction: 'manipulation' } : undefined}
      >
        {children}
      </div>

      {effectiveIsVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-[9999] pl-5 pr-4 py-3 text-sm bg-white text-slate-700 rounded-lg pointer-events-auto max-w-xs break-words overflow-hidden",
            !isPositioned && "opacity-0",
            className
          )}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transition: isPositioned ? 'opacity 0.2s ease-in-out' : 'none',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
          role="tooltip"
          aria-hidden={!effectiveIsVisible}
        >
          {/* Panoramic Brand Gradient Bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{ background: 'linear-gradient(to bottom, #FFB300, #0072bc, #00C853)' }}
          />
          {content}
        </div>
      )}
    </>
  );
};
