'use client';

import React, { useState } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { EmailCaptureModal } from '@/ppm-tool/components/forms/EmailCaptureModal';
import { useGuidance } from '@/ppm-tool/shared/contexts/GuidanceContext';
import { hasMinimumCriteriaAdjusted } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { ReportPill } from '@/ppm-tool/components/ai/ReportPill';
import '@/ppm-tool/components/ui/ModernPill.css';
// REMOVED: PDF generation functionality - now focuses on email reports only
import type { Tool, Criterion } from '@/ppm-tool/shared/types';

interface ActionButtonsProps {
  selectedTools?: Tool[];
  selectedCriteria?: Criterion[];
  filteredTools?: Tool[];
  onShowHowItWorks?: () => void;
  getReportButtonRef?: React.RefObject<HTMLButtonElement>;
  // External control for email modal (optional - for animation integration)
  showEmailModal?: boolean;
  onOpenEmailModal?: () => void;
  onCloseEmailModal?: () => void;
  onOpenGuidedRanking?: (criterionId?: string) => void;
}

// 3D Tower Loader Component (smaller version for buttons) - Mobile Safari compatible
const TowerLoader: React.FC<{ className?: string }> = ({ className = "" }) => {
  // Generate unique IDs for this instance to avoid conflicts
  const uniqueId = Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`tower-loader-${uniqueId} ${className}`} style={{
      height: '12px',
      width: '10px',
      position: 'relative',
      display: 'inline-block'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .tower-loader-${uniqueId} .tower-box {
            position: relative;
            opacity: 0;
            left: 2px;
            will-change: transform, opacity;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }

          .tower-loader-${uniqueId} .side-left {
            position: absolute;
            background-color: #87CEEB;
            width: 5px;
            height: 1.5px;
            top: 4px;
            left: 3px;
            transform: skew(0deg, -25deg);
            -webkit-transform: skew(0deg, -25deg);
            -moz-transform: skew(0deg, -25deg);
            -ms-transform: skew(0deg, -25deg);
            will-change: transform;
          }

          .tower-loader-${uniqueId} .side-right {
            position: absolute;
            background-color: #5DADE2;
            width: 5px;
            height: 1.5px;
            top: 4px;
            left: -2px;
            transform: skew(0deg, 25deg);
            -webkit-transform: skew(0deg, 25deg);
            -moz-transform: skew(0deg, 25deg);
            -ms-transform: skew(0deg, 25deg);
            will-change: transform;
          }

          .tower-loader-${uniqueId} .side-top {
            position: absolute;
            background-color: #AED6F1;
            width: 5px;
            height: 5px;
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
              transform: translate3d(-5px, -1.5px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              transform: translate3d(0px, 1px, 0);
            }
            60% {
              z-index: 8;
              transform: translate3d(0px, 2px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              transform: translate3d(0px, 3px, 0);
            }
            100% {
              z-index: 5;
              transform: translate3d(0px, 8px, 0);
              opacity: 0;
            }
          }

          @keyframes tower-from-right-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              transform: translate3d(5px, -1.5px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              transform: translate3d(0px, 1px, 0);
            }
            60% {
              z-index: 8;
              transform: translate3d(0px, 2px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              transform: translate3d(0px, 3px, 0);
            }
            100% {
              z-index: 5;
              transform: translate3d(0px, 8px, 0);
              opacity: 0;
            }
          }

          @-webkit-keyframes tower-from-left-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              -webkit-transform: translate3d(-5px, -1.5px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              -webkit-transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              -webkit-transform: translate3d(0px, 1px, 0);
            }
            60% {
              z-index: 8;
              -webkit-transform: translate3d(0px, 2px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              -webkit-transform: translate3d(0px, 3px, 0);
            }
            100% {
              z-index: 5;
              -webkit-transform: translate3d(0px, 8px, 0);
              opacity: 0;
            }
          }

          @-webkit-keyframes tower-from-right-${uniqueId} {
            0% {
              z-index: 20;
              opacity: 0;
              -webkit-transform: translate3d(5px, -1.5px, 0);
            }
            20% {
              z-index: 10;
              opacity: 1;
              -webkit-transform: translate3d(0px, 0px, 0);
            }
            40% {
              z-index: 9;
              -webkit-transform: translate3d(0px, 1px, 0);
            }
            60% {
              z-index: 8;
              -webkit-transform: translate3d(0px, 2px, 0);
            }
            80% {
              z-index: 7;
              opacity: 1;
              -webkit-transform: translate3d(0px, 3px, 0);
            }
            100% {
              z-index: 5;
              -webkit-transform: translate3d(0px, 8px, 0);
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

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  selectedTools = [],
  selectedCriteria = [],
  filteredTools = [],
  onShowHowItWorks,
  getReportButtonRef,
  showEmailModal: externalShowEmailModal,
  onOpenEmailModal,
  onCloseEmailModal,
  onOpenGuidedRanking,
}) => {
  const isMobile = useMobileDetection();
  const [internalShowEmailModal, setInternalShowEmailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { onComparisonReportClick, onComparisonReportOpen, onComparisonReportClose } = useGuidance();

  // Check if at least 3 criteria have been ranked
  const hasEnoughCriteriaRanked = hasMinimumCriteriaAdjusted(selectedCriteria, 3);

  // Use external state if provided, otherwise use internal state
  const showEmailModal = externalShowEmailModal !== undefined ? externalShowEmailModal : internalShowEmailModal;
  const setShowEmailModal = onOpenEmailModal !== undefined 
    ? (value: boolean) => value ? onOpenEmailModal() : onCloseEmailModal?.()
    : setInternalShowEmailModal;

  const handleHowItWorksClick = () => {
    // Update URL to show overlay
    const url = new URL(window.location.href);
    url.searchParams.set('overlay', 'how-it-works');
    window.history.pushState({}, '', url.toString());
    
    // Trigger the overlay (this will be handled by the useEffect in the main page)
    onShowHowItWorks?.();
  };
  
  const handleGetReport = () => {
    // Record that user clicked into Comparison Report
    onComparisonReportClick();
    onComparisonReportOpen();
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (email: string, firstName: string, lastName: string) => {
    try {
      setIsProcessing(true);
      
      // TODO: Send email report via API instead of PDF generation
      // await sendEmailReport(email, firstName, lastName, selectedTools, selectedCriteria);
      
      console.log('Email report request for:', email);
      console.log('Name:', firstName, lastName);
      console.log('Tools:', selectedTools.length);
      console.log('Criteria:', selectedCriteria.length);
      
      // Close modal after successful submission
      onComparisonReportClose();
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email report:', error);
      // Keep modal open so user can try again
    } finally {
      setIsProcessing(false);
    }
  };

  // Mobile version - fixed bottom bar
  if (isMobile) {
    return (
      <>
        <div className={cn(
          "fixed bottom-0 left-0 right-0",
          isMobile ? "z-[65]" : "z-50" // Same z-index as navigation on mobile
        )}>
          {/* Safe area padding for modern mobile devices */}
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg p-3 pb-safe">
            <div className="flex gap-2 justify-center max-w-lg mx-auto">
              {/* How It Works Button - Blue (Mobile) */}
              {onShowHowItWorks && (
                <button
                  onClick={handleHowItWorksClick}
                  className="modern-pill modern-pill--blue modern-pill--md flex-1"
                >
                  <span className="modern-pill__lighting"></span>
                  <span className="modern-pill__content">
                    <HelpCircle className="w-4 h-4" />
                    How It Works
                  </span>
                </button>
              )}
              {/* Get Report Button - Blue (Mobile) */}
              <button
                ref={getReportButtonRef}
                onClick={handleGetReport}
                className={`modern-pill modern-pill--blue modern-pill--md ${onShowHowItWorks ? 'flex-1' : 'modern-pill--full'}`}
              >
                <span className="modern-pill__lighting"></span>
                <span className="modern-pill__content">
                  <Send className="w-4 h-4" />
                  Get My Free Comparison Report
                </span>
              </button>
            </div>
          </div>
        </div>

        <EmailCaptureModal
          isOpen={showEmailModal}
          onClose={() => {
            onComparisonReportClose();
            setShowEmailModal(false);
          }}
          onSubmit={handleEmailSubmit}
          isLoading={isProcessing}
          selectedTools={filteredTools.length > 0 ? filteredTools : selectedTools}
          selectedCriteria={selectedCriteria}
          onOpenGuidedRanking={onOpenGuidedRanking}
        />
      </>
    );
  }

  // Desktop version - inline buttons
  return (
    <>
      <div className="flex items-center justify-center gap-6">
        {/* How It Works | Trust - Plain Text */}
        {onShowHowItWorks && (
          <button
            onClick={handleHowItWorksClick}
            className="text-scout text-xs md:text-sm font-medium flex items-center gap-2 hover:text-scout/80 transition-colors mr-2"
          >
            <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">How It Works | Trust</span>
            <span className="sm:hidden">How It Works</span>
          </button>
        )}

        {/* Always show the report button - removed hasEnoughCriteriaRanked condition */}
        <ReportPill
          ref={getReportButtonRef}
          onClick={handleGetReport}
          fullText="Get my Free Comparison Report"
          shortText="Get Report"
        />
      </div>

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={(submitted = false) => {
          onComparisonReportClose(submitted);
          setShowEmailModal(false);
        }}
        onSubmit={handleEmailSubmit}
        isLoading={isProcessing}
        selectedTools={filteredTools.length > 0 ? filteredTools : selectedTools}
        selectedCriteria={selectedCriteria}
        onOpenGuidedRanking={onOpenGuidedRanking}
      />
    </>
  );
}; 