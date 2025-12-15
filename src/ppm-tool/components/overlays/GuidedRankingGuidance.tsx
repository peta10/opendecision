'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import { Button } from '@/ppm-tool/components/ui/button';
import { checkAndTrackNewActive } from '@/lib/posthog';

interface GuidedRankingGuidanceProps {
  isVisible: boolean;
  onClose: () => void;
  onUseGuided: () => void;
  mousePosition: { x: number; y: number };
}

export const GuidedRankingGuidance: React.FC<GuidedRankingGuidanceProps> = ({
  isVisible,
  onClose,
  onUseGuided,
  mousePosition
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && mousePosition.x && mousePosition.y) {
      // Position the popup near the mouse but ensure it stays on screen
      const padding = 20;
      const popupWidth = 340;
      const popupHeight = 220;
      
      let x = mousePosition.x - popupWidth / 2;
      let y = mousePosition.y - popupHeight - 20; // Above the mouse
      
      // Keep popup on screen
      if (x < padding) x = padding;
      if (x + popupWidth > window.innerWidth - padding) {
        x = window.innerWidth - popupWidth - padding;
      }
      if (y < padding) {
        y = mousePosition.y + 20; // Below the mouse if no room above
      }
      
      setPosition({ x, y });
    }
  }, [isVisible, mousePosition]);

  const popupVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        duration: 0.4,
        bounce: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with slight blur */}
          <motion.div 
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden guidance-popup-pulse"
            style={{
              left: position.x,
              top: position.y,
              width: '340px'
            }}
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header with glow effect */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 p-4 relative overflow-hidden">
              {/* Animated background sparkles */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-600/20 animate-pulse"></div>
              
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center gap-2">
                      Get Better Results!
                      <Zap className="w-4 h-4 text-alpine-blue-200" />
                    </h3>
                    <p className="text-blue-100 text-sm">Why guided ranking works better</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-green-700">Smart criteria prioritization</strong> based on your role & business goals
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-blue-700">Better tool matches</strong> when criteria reflect your actual needs
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                  <p className="text-sm text-gray-700">
                    <strong className="text-purple-700">Takes only 2-3 minutes</strong> and avoids common ranking mistakes
                  </p>
                </div>
              </div>

              {/* Action button - only Use Guided, no continue */}
              <div className="pt-2">
                <Button
                  onClick={() => {
                    // Track guided ranking initiation for New_Active metric
                    try {
                      checkAndTrackNewActive('Active-guided', {
                        component: 'guided_ranking_guidance',
                        interaction_type: 'use_guided_clicked',
                        guidance_type: 'popup'
                      });
                    } catch (error) {
                      console.warn('Failed to track guided ranking guidance interaction:', error);
                    }
                    
                    onUseGuided();
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm h-9 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 guidance-glow"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use Guided
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
            
            {/* Subtle arrow pointing to where they clicked */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45 shadow-sm"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 