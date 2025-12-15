'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/ppm-tool/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmailReport } from '@/ppm-tool/shared/hooks/useEmailReport';
import type { Tool, Criterion } from '@/ppm-tool/shared/types';
import { useToast } from '@/hooks/use-toast';
import { hasCriteriaBeenAdjusted, getCriteriaAdjustmentMessage, getCriteriaAdjustmentMessageStyles } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { setOverlayOpen, setOverlayClosed, OVERLAY_TYPES } from '@/ppm-tool/shared/utils/homeState';
import '@/ppm-tool/components/ui/ModernPill.css';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: (submitted?: boolean) => void;
  onSubmit: (email: string, firstName: string, lastName: string) => void;
  isLoading: boolean;
  selectedTools?: Tool[];
  selectedCriteria?: Criterion[];
  onOpenGuidedRanking?: () => void;
}

// 3D Tower Loader Component - Mobile Safari compatible
const TowerLoader: React.FC<{ className?: string }> = ({ className = "" }) => {
  // Generate unique IDs for this instance to avoid conflicts
  const uniqueId = Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`tower-loader-${uniqueId} ${className}`} style={{
      height: '20px',
      width: '18px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .tower-loader-${uniqueId} .tower-box {
            position: relative;
            opacity: 0;
            left: 4px;
            will-change: transform, opacity;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }

          .tower-loader-${uniqueId} .side-left {
            position: absolute;
            background-color: #87CEEB;
            width: 9px;
            height: 2.5px;
            top: 6px;
            left: 5px;
            transform: skew(0deg, -25deg);
            -webkit-transform: skew(0deg, -25deg);
            -moz-transform: skew(0deg, -25deg);
            -ms-transform: skew(0deg, -25deg);
            will-change: transform;
          }

          .tower-loader-${uniqueId} .side-right {
            position: absolute;
            background-color: #5DADE2;
            width: 9px;
            height: 2.5px;
            top: 6px;
            left: -4px;
            transform: skew(0deg, 25deg);
            -webkit-transform: skew(0deg, 25deg);
            -moz-transform: skew(0deg, 25deg);
            -ms-transform: skew(0deg, 25deg);
            will-change: transform;
          }

          .tower-loader-${uniqueId} .side-top {
            position: absolute;
            background-color: #AED6F1;
            width: 9px;
            height: 9px;
            transform: rotate(45deg) skew(-20deg, -20deg);
            -webkit-transform: rotate(45deg) skew(-20deg, -20deg);
            -moz-transform: rotate(45deg) skew(-20deg, -20deg);
            -ms-transform: rotate(45deg) skew(-20deg, -20deg);
            will-change: transform;
          }

          .tower-loader-${uniqueId} .tower-box-1 {
            animation: tower-from-left-${uniqueId} 4s infinite;
            -webkit-animation: tower-from-left-${uniqueId} 4s infinite;
            -moz-animation: tower-from-left-${uniqueId} 4s infinite;
            z-index: 20;
          }

          .tower-loader-${uniqueId} .tower-box-2 {
            animation: tower-from-right-${uniqueId} 4s infinite;
            -webkit-animation: tower-from-right-${uniqueId} 4s infinite;
            -moz-animation: tower-from-right-${uniqueId} 4s infinite;
            animation-delay: 1s;
            -webkit-animation-delay: 1s;
            -moz-animation-delay: 1s;
            z-index: 19;
          }

          .tower-loader-${uniqueId} .tower-box-3 {
            animation: tower-from-left-${uniqueId} 4s infinite;
            -webkit-animation: tower-from-left-${uniqueId} 4s infinite;
            -moz-animation: tower-from-left-${uniqueId} 4s infinite;
            animation-delay: 2s;
            -webkit-animation-delay: 2s;
            -moz-animation-delay: 2s;
            z-index: 18;
          }

          .tower-loader-${uniqueId} .tower-box-4 {
            animation: tower-from-right-${uniqueId} 4s infinite;
            -webkit-animation: tower-from-right-${uniqueId} 4s infinite;
            -moz-animation: tower-from-right-${uniqueId} 4s infinite;
            animation-delay: 3s;
            -webkit-animation-delay: 3s;
            -moz-animation-delay: 3s;
            z-index: 17;
          }

          @keyframes tower-from-left-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              transform: translate3d(-9px, -3px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              transform: translate3d(0px, 2px, 0);
            }
            60% {
              z-index: 8;
              transform: translate3d(0px, 4px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              transform: translate3d(0px, 6px, 0);
            }
            100% {
              z-index: 5;
              transform: translate3d(0px, 14px, 0);
              opacity: 0;
            }
          }

          @keyframes tower-from-right-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              transform: translate3d(9px, -3px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              transform: translate3d(0px, 2px, 0);
            }
            60% {
              z-index: 8;
              transform: translate3d(0px, 4px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              transform: translate3d(0px, 6px, 0);
            }
            100% {
              z-index: 5;
              transform: translate3d(0px, 14px, 0);
              opacity: 0;
            }
          }

          @-webkit-keyframes tower-from-left-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              -webkit-transform: translate3d(-9px, -3px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              -webkit-transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              -webkit-transform: translate3d(0px, 2px, 0);
            }
            60% {
              z-index: 8;
              -webkit-transform: translate3d(0px, 4px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              -webkit-transform: translate3d(0px, 6px, 0);
            }
            100% {
              z-index: 5;
              -webkit-transform: translate3d(0px, 14px, 0);
              opacity: 0;
            }
          }

          @-webkit-keyframes tower-from-right-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              -webkit-transform: translate3d(9px, -3px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              -webkit-transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              -webkit-transform: translate3d(0px, 2px, 0);
            }
            60% {
              z-index: 8;
              -webkit-transform: translate3d(0px, 4px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              -webkit-transform: translate3d(0px, 6px, 0);
            }
            100% {
              z-index: 5;
              -webkit-transform: translate3d(0px, 14px, 0);
              opacity: 0;
            }
          }

          @-moz-keyframes tower-from-left-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              -moz-transform: translate3d(-9px, -3px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              -moz-transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              -moz-transform: translate3d(0px, 2px, 0);
            }
            60% {
              z-index: 8;
              -moz-transform: translate3d(0px, 4px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              -moz-transform: translate3d(0px, 6px, 0);
            }
            100% {
              z-index: 5;
              -moz-transform: translate3d(0px, 14px, 0);
              opacity: 0;
            }
          }

          @-moz-keyframes tower-from-right-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              -moz-transform: translate3d(9px, -3px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              -moz-transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              -moz-transform: translate3d(0px, 2px, 0);
            }
            60% {
              z-index: 8;
              -moz-transform: translate3d(0px, 4px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              -moz-transform: translate3d(0px, 6px, 0);
            }
            100% {
              z-index: 5;
              -moz-transform: translate3d(0px, 14px, 0);
              opacity: 0;
            }
          }
        `
      }} />
      
      <div className="tower-box tower-box-1">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
      <div className="tower-box tower-box-2">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
      <div className="tower-box tower-box-3">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
      <div className="tower-box tower-box-4">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
    </div>
  );
};

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  selectedTools = [],
  selectedCriteria = [],
  onOpenGuidedRanking
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Check if criteria have been adjusted from defaults (completely isolated from bumper logic)
  const criteriaAdjusted = hasCriteriaBeenAdjusted(selectedCriteria);
  const reportMessage = getCriteriaAdjustmentMessage(selectedTools.length, criteriaAdjusted);
  const messageStyles = getCriteriaAdjustmentMessageStyles(criteriaAdjusted);
  
  // Register this modal as an overlay to block bumpers when open
  useEffect(() => {
    if (isOpen) {
      console.log('📧 EmailCaptureModal opened - registering as overlay to block bumpers');
      setOverlayOpen(OVERLAY_TYPES.COMPARISON_REPORT);
    } else {
      console.log('📧 EmailCaptureModal closed - removing overlay registration');
      setOverlayClosed(OVERLAY_TYPES.COMPARISON_REPORT);
    }
    
    // Cleanup on unmount
    return () => {
      if (isOpen) {
        setOverlayClosed(OVERLAY_TYPES.COMPARISON_REPORT);
      }
    };
  }, [isOpen]);
  
  // REMOVED: useClickOutside(formRef, onClose);
  // Not needed - backdrop onClick handles outside clicks, and this was causing 
  // "second click closes modal" bug due to isOpeningClick flag behavior

  const { sendEmailReport, isLoading: isSendingEmail, error: emailError } = useEmailReport({
    onSuccess: (response) => {
      console.log('Email sent successfully:', response);
      // Don't call onSubmit to avoid PDF generation - email is the new primary flow
      onClose(true); // Pass true to indicate email was successfully submitted
      // Show success toast notification
      toast({
        title: "Report Sent",
        description: "Check your inbox for your personalized PPM tool analysis.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Email send failed:', error);
      setError('Failed to send email. Please try again.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate first name
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    // Validate last name
    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');

    // Always use the new email system - no PDF fallback unless explicitly requested
    console.log('📧 Attempting to send email report with:', {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      tools: selectedTools.length,
      criteria: selectedCriteria.length,
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2')
    });
    
    await sendEmailReport({
      userEmail: email,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      selectedTools,
      selectedCriteria
    });
  };

  // Animation variants matching GuidedRankingForm
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as const
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: [0.42, 0, 1, 1] as const
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 min-h-screen"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div 
            className="fixed inset-0 bg-black/20" 
            // REMOVED: onClick={onClose} - Users must click X button to close
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            ref={formRef} 
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Centered Modal */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Send Report</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Get your personalized tool comparison analysis</p>
              </div>
              <motion.button
                onClick={() => onClose(false)} // Pass false - user closed without submitting
                className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </div>
            
            {/* Content */}
            <div className="p-4 md:p-6">
              <div className={`${criteriaAdjusted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-3 mb-4 md:mb-6`}>
                <p className="text-sm md:text-base text-gray-600 mb-2">
                  We&apos;ll send a clean, easy-to-read version of your results, rankings, and recommendations to your inbox.
                </p>
                <p className={messageStyles}>
                  {reportMessage}
                </p>
                {!criteriaAdjusted && (
                  <button
                    type="button"
                    onClick={() => {
                      // Close modal first (user clicked "Complete Guided Rankings" - not submitting)
                      onClose(false);
                      // Then trigger guided rankings if callback is provided
                      if (onOpenGuidedRanking) {
                        onOpenGuidedRanking();
                      }
                    }}
                    className="mt-2 text-xs text-yellow-600 hover:text-yellow-700 underline font-medium"
                  >
                    Complete Guided Rankings →
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full px-3 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-alpine-blue-400 focus:border-alpine-blue-500 outline-none transition-all"
                      disabled={isLoading || isSendingEmail}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-3 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-alpine-blue-400 focus:border-alpine-blue-500 outline-none transition-all"
                      disabled={isLoading || isSendingEmail}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-alpine-blue-400 focus:border-alpine-blue-500 outline-none transition-all"
                    disabled={isLoading || isSendingEmail}
                  />
                  {(error || emailError) && (
                    <motion.p 
                      className="mt-1 text-xs md:text-sm text-red-600"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error || emailError}
                    </motion.p>
                  )}
                </div>
                <motion.button
                  type="submit"
                  className="modern-pill modern-pill--blue modern-pill--lg modern-pill--full"
                  disabled={isLoading || isSendingEmail}
                  whileTap={!(isLoading || isSendingEmail) ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <span className="modern-pill__lighting"></span>
                  <span className="modern-pill__content">
                    {(isLoading || isSendingEmail) ? (
                      <>
                        <TowerLoader />
                        <span>Generating Custom Report...</span>
                      </>
                    ) : (
                      'Send Report'
                    )}
                  </span>
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 