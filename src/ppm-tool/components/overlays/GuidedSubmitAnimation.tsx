'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GooeyLoader } from '@/ppm-tool/components/animations/GooeyLoader';

interface GuidedSubmitAnimationProps {
  /** Whether animation is currently active */
  isActive: boolean;
  /** Animation phase: 'idle' | 'animating' | 'complete' */
  phase: 'idle' | 'animating' | 'complete';
  /** Message to display during animation */
  message?: string;
}

export const GuidedSubmitAnimation: React.FC<GuidedSubmitAnimationProps> = ({
  isActive,
  phase,
  message = '🪄 Adjusting your priorities and re-ranking tools...'
}) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[75] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/5 backdrop-blur-[2px]" />
          
          {/* Centered content - Wave + Text stacked vertically */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Wave Loader - Shows during animating phase */}
            {phase === 'animating' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                <GooeyLoader />
              </motion.div>
            )}
            
            {/* Text - Shows during animating phase (under the wave) */}
            {phase === 'animating' && message && (
              <motion.div
                className="text-center px-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <p className="text-xl md:text-2xl font-semibold text-alpine-blue-700 drop-shadow-sm bg-white/90 px-8 py-4 rounded-2xl shadow-lg">
                  {message}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

