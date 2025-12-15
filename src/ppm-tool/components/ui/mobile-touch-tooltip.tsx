import React, { useState, useRef, useEffect } from 'react';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

interface MobileTouchTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/**
 * Mobile-only tooltip that shows on touch/click for touch devices.
 * On desktop devices, this renders children without any tooltip behavior.
 */
export const MobileTouchTooltip: React.FC<MobileTouchTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { isTouchDevice } = useUnifiedMobileDetection();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isTouchDevice || !isOpen) return;
    
    document.addEventListener('click', handleClickOutside);
    const timer = setTimeout(() => setIsOpen(false), 4000);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isOpen, isTouchDevice]);

  useEffect(() => {
    if (!isTouchDevice || !isOpen || !triggerRef.current || !tooltipRef.current) return;
    
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

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    setPosition({ top, left });
  }, [isOpen, side, align, isTouchDevice]);

  // On desktop, just render children without tooltip
  if (!isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleClick}
        className="inline-block cursor-pointer"
      >
        {children}
      </div>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          className={`fixed z-[100] px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg pointer-events-auto max-w-xs break-words ${className}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};
