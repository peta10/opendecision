import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useUnifiedMobileDetection } from '@/opendecision/shared/hooks/useUnifiedMobileDetection';
import { BasicHoverTooltip } from './basic-hover-tooltip';

interface MobileTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  forceOpen?: boolean; // New prop for external control
  disableClickInterception?: boolean; // Disable click event interception for nested interactive elements
}

/**
 * Hybrid tooltip that automatically chooses the right behavior:
 * - Desktop: Hover-based tooltip using BasicHoverTooltip
 * - Mobile/Touch: Touch-based tooltip with click activation
 * - External control: Can be forced open via forceOpen prop
 */
export const MobileTooltip: React.FC<MobileTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  forceOpen = false,
  disableClickInterception = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { isTouchDevice, hasTouch } = useUnifiedMobileDetection();

  // External control: forceOpen overrides internal state
  const effectiveIsOpen = forceOpen || isOpen;

  const handleClick = (e: React.MouseEvent) => {
    if (disableClickInterception) return; // Don't intercept clicks when disabled (for nested interactive elements)
    if (forceOpen) return; // Don't handle clicks when externally controlled
    // Handle clicks for mobile devices and touch-enabled laptops
    if (isTouchDevice || hasTouch) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to parent (like card expansion)
      
      // Add subtle haptic feedback on mobile devices
      if ('vibrate' in navigator && isTouchDevice) {
        navigator.vibrate(10); // Very brief 10ms vibration for tactile feedback
      }
      
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if ((!isTouchDevice && !hasTouch) || !effectiveIsOpen || forceOpen) return;
    
    // SIMPLIFIED SOLUTION: Use timeout to skip the opening click
    // This avoids the isOpeningClick flag bug that caused double-tap requirement
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Delay attaching the listener to skip the click that just opened the tooltip
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, { capture: true });
    }, 100);  // 100ms is sufficient to skip the opening click
    
      // Only auto-close on true mobile devices, not touch-enabled laptops
      // 6 seconds gives users enough time to read and interact with tooltip content
      const autoCloseTimer = isTouchDevice ? setTimeout(() => setIsOpen(false), 6000) : null;
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, { capture: true });
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [effectiveIsOpen, isTouchDevice, hasTouch, forceOpen]);

  useEffect(() => {
    if ((!isTouchDevice && !hasTouch) || !effectiveIsOpen || !triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
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
        top = triggerRect.bottom + 8;
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
        left = triggerRect.left - tooltipRect.width - 8;
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
        left = triggerRect.right + 8;
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

    // Viewport boundary checking
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Different behavior for mobile vs desktop
    // Mobile: Keep tooltip near trigger (no aggressive centering)
    // Desktop/Touch Laptops: Allow centering for better UX
    const isTrueMobile = isTouchDevice && window.innerWidth < 768;
    
    if (isTrueMobile) {
      // TRUE MOBILE: Simple boundary checks, keep tooltip near trigger
      if (left < padding) {
        left = padding;
      } else if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
      }
    } else {
      // DESKTOP & TABLETS: Use centering when align="center"
      if (align === 'center') {
        // Check if tooltip fits when centered
        const centeredLeft = (viewportWidth - tooltipRect.width) / 2;
        if (centeredLeft >= padding && centeredLeft + tooltipRect.width <= viewportWidth - padding) {
          left = centeredLeft;
        } else {
          // Fallback to calculated position with boundary checks
          if (left < padding) left = padding;
          if (left + tooltipRect.width > viewportWidth - padding) {
            left = viewportWidth - tooltipRect.width - padding;
          }
        }
      } else {
        // Non-centered: standard boundary checks
        if (left < padding) left = padding;
        if (left + tooltipRect.width > viewportWidth - padding) {
          left = viewportWidth - tooltipRect.width - padding;
        }
      }
    }

    // Vertical positioning: ensure tooltip is always visible
    if (top < padding) {
      // If tooltip would go above viewport, position it below trigger instead
      if (side === 'top') {
        top = triggerRect.bottom + 8;
      } else {
        top = padding;
      }
    } else if (top + tooltipRect.height > viewportHeight - padding) {
      // If tooltip would go below viewport, position it above trigger instead
      if (side === 'bottom') {
        top = triggerRect.top - tooltipRect.height - 8;
      } else {
        top = viewportHeight - tooltipRect.height - padding;
      }
    }

    setPosition({ top, left });
  }, [effectiveIsOpen, side, align, isTouchDevice, hasTouch]);

  // Three device types with different behaviors:
  if (isTouchDevice) {
    // Mobile phones/tablets: Click-only tooltip (UNCHANGED)
    return (
      <>
        <div
          ref={triggerRef}
          onClick={handleClick}
          className="inline-block cursor-pointer"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: disableClickInterception ? 'none' : 'auto'
          }}
        >
          {children}
        </div>
        
        {effectiveIsOpen && typeof document !== 'undefined' && createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] pl-5 pr-4 py-3 text-sm bg-white text-slate-700 rounded-lg pointer-events-auto max-w-xs break-words overflow-hidden ${className}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Panoramic Brand Gradient Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
              style={{ background: 'linear-gradient(to bottom, #FFB300, #0072bc, #00C853)' }}
            />
            {content}
          </div>,
          document.body
        )}
      </>
    );
  } else if (hasTouch) {
    // Touch-enabled laptops: Hybrid hover+click tooltip (NEW)
    return (
      <>
        <div
          ref={triggerRef}
          onClick={handleClick}
          className="inline-block cursor-pointer"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: disableClickInterception ? 'none' : 'auto'
          }}
        >
          <BasicHoverTooltip
            content={content}
            side={side}
            align={align}
            className={className}
            forceOpen={forceOpen}
          >
            {children}
          </BasicHoverTooltip>
        </div>
        
        {effectiveIsOpen && typeof document !== 'undefined' && createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] pl-5 pr-4 py-3 text-sm bg-white text-slate-700 rounded-lg pointer-events-auto max-w-xs break-words overflow-hidden ${className}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Panoramic Brand Gradient Bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
              style={{ background: 'linear-gradient(to bottom, #FFB300, #0072bc, #00C853)' }}
            />
            {content}
          </div>,
          document.body
        )}
      </>
    );
  } else {
    // Desktop-only: Hover tooltip (UNCHANGED)
    return (
      <BasicHoverTooltip
        content={content}
        side={side}
        align={align}
        className={className}
        forceOpen={forceOpen}
      >
        {children}
      </BasicHoverTooltip>
    );
  }
};
