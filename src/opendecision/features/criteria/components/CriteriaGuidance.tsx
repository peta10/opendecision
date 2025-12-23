'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/opendecision/shared/components/ui/button';

interface CriteriaGuidanceProps {
  isVisible: boolean;
  onClose: () => void;
  onUseGuided: () => void;
}

export const CriteriaGuidance: React.FC<CriteriaGuidanceProps> = ({
  isVisible,
  onClose,
  onUseGuided
}) => {
  // Debug logging
  useEffect(() => {
    console.log('CriteriaGuidance visibility changed:', isVisible);
  }, [isVisible]);

  // Auto-close after 8 seconds
  useEffect(() => {
    if (isVisible) {
      console.log('CriteriaGuidance starting 8-second timer');
      const timer = setTimeout(() => {
        console.log('CriteriaGuidance auto-closing after 8 seconds');
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as const
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.2,
        ease: [0.42, 0, 1, 1] as const
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div 
            className="fixed inset-0 bg-black/10" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10 border border-gray-200"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Tip</h3>
                  <p className="text-sm text-gray-600">Get better results with guided ranking</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Manual ranking can be tricky. Our guided questions help you prioritize criteria based on your specific role and business needs.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-900">More accurate rankings</strong> based on your actual needs
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-900">Takes only 2-3 minutes</strong> and avoids common mistakes
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={onUseGuided}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Try Guided Ranking
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="px-4 border-gray-300 hover:border-gray-400"
                >
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 