'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import { analytics } from '@/lib/analytics';

interface ProductBumperProps {
  isVisible: boolean;
  onClose: (reason?: 'close_button' | 'cta' | 'auto') => void;
  onUseGuided: () => void;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const ProductBumper: React.FC<ProductBumperProps> = ({
  isVisible,
  onClose,
  onUseGuided,
  guidedButtonRef
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { isTouchDevice } = useUnifiedMobileDetection();
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate button position when visible
  useEffect(() => {
    if (isVisible && guidedButtonRef?.current) {
      const updatePosition = () => {
        const button = guidedButtonRef.current;
        if (!button) return;
        
        const rect = button.getBoundingClientRect();
        
        // Position directly below the button with small gap
        let viewportTop = rect.bottom + 12; // 12px gap below button
        const viewportLeft = rect.left + (rect.width / 2); // Center of button
        
        // Check if popup would go off-screen at bottom
        const popupHeight = 220; // Approximate height of popup
        const viewportHeight = window.innerHeight;
        if (viewportTop + popupHeight > viewportHeight - 20) {
          // Position above the button instead
          viewportTop = rect.top - popupHeight - 12;
        }
        
        setButtonPosition({
          top: viewportTop,
          left: viewportLeft,
          width: rect.width
        });
      };
      
      // Update position immediately
      updatePosition();
      
      // Update position on scroll and resize
      const handleUpdate = () => {
        requestAnimationFrame(updatePosition);
      };
      
      window.addEventListener('scroll', handleUpdate, { passive: true });
      window.addEventListener('resize', handleUpdate, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    } else if (isVisible) {
      // Fallback positioning if button ref is not available
      setButtonPosition({
        top: 120, // Default position below header
        left: window.innerWidth / 2,
        width: 0
      });
    }
  }, [isVisible, guidedButtonRef]);

  // Calculate connecting line coordinates

  
  // Debug logging for ProductBumper render
  // Debug log removed to prevent performance issues
  // console.log('🎯 ProductBumper render - isVisible:', isVisible, 'isMobile:', isMobile);

  // Remove all button-specific positioning logic since this is now page-wide

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
        duration: 0.5,
        bounce: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: {
        duration: 0.3
      }
    }
  };



  // Add this guard clause
  if (!isMounted) {
    return null;
  }

  // Don't render anything on touch devices (mobile/tablet)
  // Touch-screen laptops are NOT blocked - only true mobile/tablet devices
  if (isTouchDevice) {
    return null;
  }

  const handleUseGuided = () => {
    void analytics.trackOverlayEvent({
      overlay: 'product_bumper',
      eventType: 'cta_clicked',
      cta: 'use_guided_rankings',
      context: {
        source_component: 'product_bumper',
      },
    });
    onUseGuided();
    onClose('cta');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Simple full-page backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // REMOVED: onClick={onClose} - Users must click X button to close
          />
          
          
          
                     {/* Enhanced Popup positioned under Guided Rankings button */}
           <motion.div
             ref={popupRef}
             className="fixed z-50" 
             variants={popupVariants}
             initial="hidden"
             animate="visible"
             exit="exit"
             role="dialog"
             aria-modal="true"
             aria-labelledby="product-bumper-title"
             aria-describedby="product-bumper-description"
             style={{
               top: `${buttonPosition.top}px`,
               left: `${buttonPosition.left}px`,
               transform: 'translateX(-50%)', // Center horizontally relative to button
               maxWidth: '380px',
               width: 'calc(100vw - 32px)', // Responsive width with padding
               minWidth: '320px',
               zIndex: 50
             }}
           >
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full overflow-hidden relative">
              {/* Arrow pointing to button */}
              <div 
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"
                style={{ zIndex: -1 }}
              />
              
              {/* Header - Professional styling */}
              <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                                     <h2 className="text-lg font-semibold text-gray-900">
                     Get Better Results!
                   </h2>
                  <p className="text-sm text-gray-500">Why guided ranking works better</p>
                </div>
                <button
                  onClick={() => onClose('close_button')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                  aria-label="Close guided ranking suggestion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content - Professional styling */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                Guided rankings use our research-backed framework to produce more accurate rankings and tool matches.
                </p>

                <button
                  onClick={handleUseGuided}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded-lg font-medium transition-all"
                  aria-describedby="product-bumper-description"
                >
                  <Sparkles className="w-4 h-4 mr-2 inline" />
                  Use Guided Rankings
                  <ArrowRight className="w-4 h-4 ml-2 inline" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 