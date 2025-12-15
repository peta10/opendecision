'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Tool } from '@/ppm-tool/shared/types';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

interface AnimatedToolCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  tool: Tool;
  index?: number;
  isExpanded?: boolean;
  className?: string;
}

/**
 * Wrapper component for tool cards that provides smooth layout animations.
 * Designed to work seamlessly with ShuffleContainer for position-based animations.
 * 
 * Features:
 * - Layout animations for position changes (disabled on true mobile for performance)
 * - Smooth expand/collapse transitions
 * - Hover effects with spring animations
 * - Accessibility-aware motion
 */
export const AnimatedToolCard: React.FC<AnimatedToolCardProps> = ({
  children,
  tool,
  index = 0,
  isExpanded = false,
  className = '',
  ...motionProps
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Detect true mobile devices (not touch laptops or tablets with hover)
  const { isTouchDevice } = useUnifiedMobileDetection();

  return (
    <motion.div
      // Use tool ID for consistent layoutId across re-renders
      layoutId={`tool-card-${tool.id}`}
      // Disable layout animation on true mobile devices to prevent bobbling during expand/collapse
      layout={isTouchDevice ? false : "position"}
      
      // Initial state
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }}
      
      // Animate in
      animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }}
      
      // Animate out
      exit={{
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: {
          duration: 0.2,
          ease: 'easeInOut'
        }
      }}
      
      // No hover or tap effects - keeping it professional
      // Original hover effects are handled by CSS classes in the wrapped components
      
      // Layout transition settings - disabled on true mobile
      transition={{
        layout: {
          type: 'tween',
          duration: isTouchDevice ? 0 : 0.4,
          ease: 'easeInOut'
        },
        default: {
          type: 'tween',
          duration: 0.3,
          ease: 'easeInOut'
        }
      }}
      
      className={`
        will-change-transform
        transform-gpu
        ${className}
      `}
      
      // Custom motion props
      {...motionProps}
      
      // Data attributes for debugging and testing
      data-tool-id={tool.id}
      data-tool-name={tool.name}
      data-card-index={index}
      data-is-expanded={isExpanded}
    >
      {children}
    </motion.div>
  );
};

/**
 * Simplified version of AnimatedToolCard for cases where you don't need
 * all the hover effects but still want layout animations.
 */
export const SimpleAnimatedCard: React.FC<{
  children: React.ReactNode;
  id: string;
  className?: string;
}> = ({ children, id, className = '' }) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      layoutId={`simple-card-${id}`}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        layout: {
          type: 'tween',
          duration: 0.4,
          ease: 'easeInOut'
        }
      }}
      className={`will-change-transform ${className}`}
      data-card-id={id}
    >
      {children}
    </motion.div>
  );
};

/**
 * Hook for managing tool card animation states
 */
export const useToolCardAnimation = (tool: Tool, options: {
  enableHover?: boolean;
  enableTap?: boolean;
} = {}) => {
  const { enableHover = false, enableTap = false } = options; // Disabled by default for professional look
  
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches 
    : false;

  const getAnimationProps = () => ({
    layoutId: `animated-tool-${tool.id}`,
    layout: true,
    // No hover or tap effects - keeping it professional
    // Original hover effects are handled by CSS classes in the wrapped components
    transition: {
      layout: { type: 'tween', duration: 0.4, ease: 'easeInOut' },
      default: { type: 'tween', duration: 0.3, ease: 'easeInOut' }
    }
  });

  return {
    getAnimationProps,
    prefersReducedMotion
  };
};