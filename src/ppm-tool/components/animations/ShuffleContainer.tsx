'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Tool } from '@/ppm-tool/shared/types';
import { UseShuffleAnimationReturn } from '@/ppm-tool/hooks/useShuffleAnimation';

interface ShuffleContainerProps {
  children: React.ReactNode;
  tools: Tool[];
  shuffleAnimation: UseShuffleAnimationReturn;
  className?: string;
  isMobile?: boolean;
  enableParticles?: boolean;
}

/**
 * Container component that wraps tool lists and provides shuffle animations.
 * Uses Framer Motion to create smooth, staggered transitions when tool order changes.
 */
export const ShuffleContainer: React.FC<ShuffleContainerProps> = ({
  children,
  tools,
  shuffleAnimation,
  className = '',
  isMobile = false,
  enableParticles = true
}) => {
  const {
    isShuffling,
    isDelaying,
    shouldShuffle,
    animationId,
    getShuffleProps
  } = shuffleAnimation;

  // Animation variants for the container
  const containerVariants: Variants = {
    idle: {
      transition: {
        staggerChildren: 0
      }
    },
    delaying: {
      transition: {
        staggerChildren: 0
      }
    },
    shuffling: {
      transition: {
        staggerChildren: isMobile ? 0.05 : 0.08,
        delayChildren: 0.1
      }
    }
  };

  // Animation variants for individual tool items
  const itemVariants: Variants = {
    idle: {
      scale: 1,
      y: 0,
      opacity: 1,
      boxShadow: 'none',
      transition: {
        type: 'tween',
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    delaying: {
      scale: 1,
      y: 0,
      opacity: 1,
      boxShadow: 'none',
      transition: {
        type: 'tween',
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    shuffling: {
      scale: 1,
      y: 0,
      opacity: 1,
      boxShadow: 'none',
      transition: {
        type: 'tween',
        duration: 0.4,
        ease: 'easeInOut'
      }
    }
  };

  // Determine current animation state
  const currentVariant = useMemo(() => {
    if (isShuffling) return 'shuffling';
    if (isDelaying) return 'delaying';
    return 'idle';
  }, [isShuffling, isDelaying]);

  // Shuffle particles effect (optional visual enhancement)
  const ShuffleParticles = () => {
    if (!enableParticles || !isShuffling) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(isMobile ? 3 : 6)].map((_, i) => (
          <motion.div
            key={`particle-${animationId}-${i}`}
            initial={{
              opacity: 0,
              scale: 0,
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%'
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
              y: '-20px'
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: 'easeOut'
            }}
            className="absolute w-1 h-1 bg-alpine-blue-400 rounded-full"
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      {...getShuffleProps()}
      className={`relative ${className}`}
      variants={containerVariants}
      initial="idle"
      animate={currentVariant}
    >
      {/* Shuffle Particles */}
      <ShuffleParticles />

      {/* Animated Children */}
      <motion.div
        className="flex flex-col gap-4"
        layout={!isMobile} // Disable layout animation on true mobile to prevent bobbling
        transition={{
          type: 'tween',
          duration: isMobile ? 0 : 0.4,
          ease: 'easeInOut'
        }}
      >
        <AnimatePresence mode="popLayout">
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child;

            // Find the corresponding tool for this child
            const tool = tools[index];
            const toolId = tool?.id || `item-${index}`;

            return (
              <motion.div
                key={toolId}
                // Disable layoutId on true mobile to prevent bobbling during expand/collapse
                layoutId={isMobile ? undefined : `tool-${toolId}-${animationId || 'default'}`}
                variants={itemVariants}
                initial="idle"
                animate={currentVariant}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: 0.2 }
                }}
                className="will-change-transform"
                style={{
                  // Reduce motion for accessibility
                  transform: typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches 
                    ? 'none' 
                    : undefined
                }}
              >
                {child}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

/**
 * Higher-order component for wrapping existing tool list components
 * with shuffle animation capabilities.
 */
export const withShuffleAnimation = <P extends object>(
  Component: React.ComponentType<P>,
  defaultOptions: Partial<ShuffleContainerProps> = {}
) => {
  const WrappedComponent = React.forwardRef<any, P & Partial<ShuffleContainerProps>>(
    (props, ref) => {
      const {
        tools = [],
        shuffleAnimation,
        className = '',
        isMobile = false,
        enableParticles = true,
        ...componentProps
      } = props as any;

      if (!shuffleAnimation) {
        // If no shuffle animation provided, render component normally
        return <Component {...(componentProps as P)} ref={ref} />;
      }

      return (
        <ShuffleContainer
          tools={tools}
          shuffleAnimation={shuffleAnimation}
          className={className}
          isMobile={isMobile}
          enableParticles={enableParticles}
          {...defaultOptions}
        >
          <Component {...(componentProps as P)} ref={ref} />
        </ShuffleContainer>
      );
    }
  );

  WrappedComponent.displayName = `withShuffleAnimation(${Component.displayName || Component.name})`;

  return WrappedComponent;
};