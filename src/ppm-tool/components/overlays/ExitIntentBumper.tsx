'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail } from 'lucide-react';
import { getCriteriaAdjustmentMessage } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

interface ExitIntentBumperProps {
  isVisible: boolean;
  onClose: () => void;
  triggerType?: 'mouse-leave' | 'tab-switch';
  toolCount?: number;
  hasFilters?: boolean;
  emailButtonRef?: React.RefObject<HTMLButtonElement>;
  criteriaAdjusted?: boolean;
}

export const ExitIntentBumper: React.FC<ExitIntentBumperProps> = ({
  isVisible,
  onClose,
  triggerType = 'mouse-leave',
  toolCount = 0,
  hasFilters = false,
  emailButtonRef,
  criteriaAdjusted = true
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { isTouchDevice } = useUnifiedMobileDetection();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [emailButtonPosition, setEmailButtonPosition] = useState({ 
    x: '50%', 
    y: '50%', 
    width: '200px',
    height: '50px' 
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // NOTE: Exit intent detection is handled by useUnifiedExitIntent hook in EmbeddedPPMToolFlow
  // This component only handles rendering and email button position tracking

  // Track email button position for the unblur cutout
  useEffect(() => {
    if (isVisible) {
      const updateEmailButtonPosition = () => {
        // Try multiple selectors to find the email button
        const selectors = [
          '[data-testid="get-report-button"]',
          'button:contains("Get my Free Comparison Report")',
          'button[class*="get-report"]',
          'button:has-text("Get my Free Comparison Report")',
          // Fallback: look for any button with "report" or "comparison" in text
          'button'
        ];
        
        let emailButton = null;
        
        // Try using the ref first
        if (emailButtonRef?.current) {
          emailButton = emailButtonRef.current;
        } else {
          // Fallback: search for the button by text content
          const buttons = document.querySelectorAll('button');
          for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = button.textContent?.toLowerCase() || '';
            if (text.includes('get my free comparison report') || 
                text.includes('get report') || 
                text.includes('free comparison') ||
                text.includes('comparison report')) {
              emailButton = button;
              console.log('📍 Found email button via text search:', text);
              break;
            }
          }
        }
        
        // If still not found, try a more aggressive search
        if (!emailButton) {
          const allButtons = document.querySelectorAll('button');
          for (let i = 0; i < allButtons.length; i++) {
            const button = allButtons[i];
            const text = button.textContent?.toLowerCase() || '';
            if (text.includes('report') && text.includes('free')) {
              emailButton = button;
              console.log('📍 Found email button via aggressive search:', text);
              break;
            }
          }
        }
        
        if (emailButton) {
          const rect = emailButton.getBoundingClientRect();
          
          // Calculate the rectangular area with some padding
          const padding = 8; // Reduced padding for thinner fit
          const left = rect.left - padding;
          const top = rect.top - padding;
          const width = rect.width + (padding * 2);
          const height = rect.height + (padding * 2);
          
          // Convert to pixels for precise positioning
          setEmailButtonPosition({
            x: `${left}px`,
            y: `${top}px`,
            width: `${width}px`,
            height: `${height}px`
          });
          
          console.log('📍 Email button found and tracked (rectangular):', { 
            left, top, width, height
          });
        } else {
          console.warn('⚠️ Email button not found for unblur cutout');
        }
      };
      
      // Update position immediately and on changes
      updateEmailButtonPosition();
      
      const handleUpdate = () => {
        requestAnimationFrame(updateEmailButtonPosition);
      };
      
      window.addEventListener('scroll', handleUpdate, { passive: true });
      window.addEventListener('resize', handleUpdate, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isVisible, emailButtonRef]);

  // Calculate popup position when visible - position near header button
  useEffect(() => {
    if (isVisible) {
      const updatePosition = () => {
        // Position near the header button - shifted left and down
        const viewportTop = 160; // Further down from header
        const viewportLeft = window.innerWidth * 0.65; // More to the left
        
        setPosition({
          top: viewportTop,
          left: viewportLeft
        });
      };
      
      // Update position immediately
      updatePosition();
      
      // Update position on resize
      const handleResize = () => {
        requestAnimationFrame(updatePosition);
      };
      
      window.addEventListener('resize', handleResize, { passive: true });
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  const getMessage = () => {
    // Use the same message logic as EmailCaptureModal for consistency
    return getCriteriaAdjustmentMessage(toolCount, criteriaAdjusted);
  };

  const getSubMessage = () => {
    switch (triggerType) {
      case 'mouse-leave':
        return "Our research-backed analysis will help you choose the right tool for your needs.";
      case 'tab-switch':
        return "Save your personalized recommendations and avoid costly trial-and-error.";
      default:
        return "Get expert insights on the best PPM tools for your specific requirements.";
    }
  };

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

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Create four separate blur rectangles around the button area */}
          {/* Top rectangle */}
          <motion.div 
            className="fixed z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // REMOVED: onClick={onClose} - Users must click X button to close
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: emailButtonPosition.y,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Bottom rectangle */}
          <motion.div 
            className="fixed z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // REMOVED: onClick={onClose} - Users must click X button to close
            style={{
              top: `calc(${emailButtonPosition.y} + ${emailButtonPosition.height})`,
              left: 0,
              width: '100%',
              height: `calc(100% - ${emailButtonPosition.y} - ${emailButtonPosition.height})`,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Left rectangle */}
          <motion.div 
            className="fixed z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // REMOVED: onClick={onClose} - Users must click X button to close
            style={{
              top: emailButtonPosition.y,
              left: 0,
              width: emailButtonPosition.x,
              height: emailButtonPosition.height,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Right rectangle */}
          <motion.div 
            className="fixed z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // REMOVED: onClick={onClose} - Users must click X button to close
            style={{
              top: emailButtonPosition.y,
              left: `calc(${emailButtonPosition.x} + ${emailButtonPosition.width})`,
              width: `calc(100% - ${emailButtonPosition.x} - ${emailButtonPosition.width})`,
              height: emailButtonPosition.height,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />
          
          {/* Exit Intent Popup - Positioned near header button */}
          <motion.div
            ref={popupRef}
            className="fixed z-[80]" 
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translateX(-50%)',
              maxWidth: '380px',
              width: 'calc(100vw - 32px)',
              minWidth: '320px',
              zIndex: 80
            }}
          >
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full overflow-hidden relative">
              {/* Arrow pointing up to header button */}
              <div 
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"
                style={{ zIndex: -1 }}
              />
              
              {/* Header - Professional styling matching ProductBumper */}
              <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Get My Free Comparison Report
                    </h2>
                    <p className="text-sm text-gray-500">Personalized PPM tool analysis</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close exit intent popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content - Professional styling */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  {getMessage()}
                </p>
                <p className="text-xs text-gray-500">
                  {getSubMessage()}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
