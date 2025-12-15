'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, X, Zap, Users, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/ppm-tool/components/ui/button';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
import '@/ppm-tool/components/ui/ModernPill.css';

type TabType = 'how-it-works' | 'trust';

interface HowItWorksOverlayProps {
  isVisible: boolean;
  onClose?: () => void;
  onGetStarted: () => void;
  onManualRanking: () => void;
}

const step1Criteria = [
  "Scalability",
  "Integrations & Extensibility", 
  "Ease of Use",
  "Flexibility & Customization",
  "Reporting & Analytics",
  "Security & Compliance",
  "Portfolio Management"
];

const remainingSteps = [
  {
    number: "02",
    title: "Analyze Tools and Recommendations",
    items: [
      "Explore and evaluate tools that are a best match for you.",
    ]
  },
  {
    number: "03",
    title: "Compare Results",
    items: [
      "Use the interactive chart for further comparisons.",
    ]
  },
  {
    number: "04", 
    title: "Get My Free Comparison Report",
    items: [
      "We'll send a clean, easy-to-read version of your results, rankings, and recommendations to your inbox.",
    ]
  }
];

const featureCards = [
  {
    icon: <Zap className="w-4 h-4 text-blue-600" />,
    title: "Instant Intelligence",
    description: "Get recommendations in minutes, not months"
  },
  {
    icon: <Users className="w-4 h-4 text-blue-600" />,
    title: "Proven Methodology",
    description: "Designed using real-world implementations across industries"
  },
  {
    icon: <Target className="w-4 h-4 text-blue-600" />,
    title: "Tailored Results",
    description: "Recommendations specific to your organization's needs"
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
    title: "Start on Course",
    description: "Leverage our deep research and avoid costly tool selection mistakes"
  }
];

export const HowItWorksOverlay: React.FC<HowItWorksOverlayProps> = ({
  isVisible,
  onClose,
  onGetStarted,
  onManualRanking
}) => {
  const isMobile = useMobileDetection();
  const [activeTab, setActiveTab] = useState<TabType>('how-it-works');

  // Always reset to 'how-it-works' tab when overlay opens
  useEffect(() => {
    if (isVisible) {
      setActiveTab('how-it-works');
    }
  }, [isVisible]);

  // Handle body scroll and mobile compatibility
  useEffect(() => {
    if (isVisible && typeof window !== 'undefined') {
      // Store original scroll position and prevent body scroll
      const scrollY = window.scrollY;
      const body = document.body;
      const html = document.documentElement;
      
      // Store original styles
      const originalBodyStyle = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        overflow: body.style.overflow,
        width: body.style.width,
        height: body.style.height
      };
      
      // Apply styles to prevent background scroll
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      body.style.width = '100%';
      body.style.height = '100%';
      
      return () => {
        // Restore original styles
        Object.keys(originalBodyStyle).forEach(key => {
          body.style[key as any] = originalBodyStyle[key as keyof typeof originalBodyStyle];
        });
        
        // Restore scroll position
        html.scrollTop = scrollY;
        body.scrollTop = scrollY;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;
  
  return (
    <>
      {/* Add CSS for fade-in animation */}
      <style>{`
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className="absolute inset-4 flex items-center justify-center pointer-events-none"
      >
        <div 
          className="bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-4xl lg:max-w-6xl h-[85vh] md:h-[90vh] lg:h-[85vh] overflow-hidden pointer-events-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - Top Right */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
              aria-label="Close How It Works"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
          
          {/* Scrollable content */}
          <div 
            className="h-full overflow-y-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              scrollBehavior: 'smooth'
            }}
            onWheel={(e) => {
              // Ensure wheel events work properly
              e.stopPropagation();
            }}
          >
            <div className="p-3 md:p-6 lg:p-8">
              {/* Tab Navigation - Desktop Only for Trust Tab */}
              <div className="relative text-center mb-6 pr-8">
                <div className="flex items-center justify-center gap-1 mb-4">
                  <button
                    onClick={() => setActiveTab('how-it-works')}
                    className={`
                      relative px-6 py-2 text-sm md:text-base lg:text-lg font-bold transition-all duration-200
                      ${activeTab === 'how-it-works'
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    How It Works
                    {activeTab === 'how-it-works' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                    )}
                  </button>
                  
                  {/* Trust Tab - Desktop/Laptop Only */}
                  {!isMobile && (
                    <button
                      onClick={() => setActiveTab('trust')}
                      className={`
                        relative px-6 py-2 text-sm md:text-base lg:text-lg font-bold transition-all duration-200
                        ${activeTab === 'trust'
                          ? 'text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                    >
                      Trust
                      {activeTab === 'trust' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Divider line beneath tabs */}
                <div className="w-full h-px bg-gray-200 mb-4"></div>
              </div>

              {/* Tab Content - How It Works */}
              {activeTab === 'how-it-works' && (
                <div className="fade-in">
                  {/* Value Statement - Hidden on Mobile */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 hidden md:block mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed text-center">
                      Get 100% free personalized recommendations in minutes with our intelligent Project Portfolio Management Tool assessment. Make informed decisions and focus on key features identified through deep research for lasting project portfolio success.
                    </p>
                  </div>

            {/* Feature Cards Section - Hidden on Mobile */}
            <div className="mb-6 hidden md:block">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {featureCards.map((card, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2 p-2 bg-blue-50 rounded-full">
                        {card.icon}
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs md:text-sm mb-1">{card.title}</h4>
                      <p className="text-xs text-gray-600 leading-tight">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main layout: Step 1 card with integrated button */}
            <div className="mb-6">
              {/* Step 1: Rank Your Criteria - Main Card with Button */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg border border-blue-200 relative overflow-visible">
                <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm md:text-base font-bold shadow-lg z-20">
                  01
                </div>
                <div className="pt-6 md:pt-7 px-4 md:px-6 pb-4 md:pb-6">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3">Rank Your Criteria</h3>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                  
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="flex-1 text-sm text-gray-700">
                      <p className="text-sm md:text-base mb-4 text-gray-600 leading-relaxed">
                      Guided rankings use our research-backed framework to produce more accurate rankings and tool matches.
                      </p>
                      <p className="font-semibold mb-3 text-sm md:text-base text-gray-900">Criteria That Is Analyzed:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        {step1Criteria.map((criterion, index) => (
                          <div key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0"></span>
                            <span className="text-sm md:text-base text-gray-700">{criterion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* CTA Button - positioned to the right on desktop, below on mobile */}
                    <div className="flex justify-center lg:items-center mt-4 lg:mt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          // Track how it works interaction for New_Active metric
                          try {
                            checkAndTrackNewActive('Active-how-it-works', {
                              component: 'how_it_works_overlay',
                              interaction_type: 'rank_criteria_clicked',
                              overlay_step: 'step_1'
                            });
                          } catch (error) {
                            console.warn('Failed to track how it works interaction:', error);
                          }

                          onGetStarted();
                        }}
                        className="modern-pill modern-pill--blue modern-pill--lg"
                        type="button"
                      >
                        <span className="modern-pill__lighting"></span>
                        <span className="modern-pill__content flex-col !gap-1">
                          <span>Rank Your Criteria</span>
                          <span className="flex items-center text-xs opacity-90">
                            Question 1
                            <ArrowRight className="ml-1 w-3 h-3" />
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom cards - responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {remainingSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 relative overflow-visible">
                  <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-full flex items-center justify-center text-sm md:text-base font-bold shadow-lg z-20">
                    {step.number}
                  </div>
                  <div className="pt-6 md:pt-7 px-4 md:px-5 pb-4 md:pb-5">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3">{step.title}</h3>
                    <div className={`w-10 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full ${step.number === "03" ? "mb-4" : "mb-3"}`}></div>
                    <div className="text-xs md:text-sm text-gray-700 leading-relaxed">
                      {step.items.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
                </div>
              )}

              {/* Tab Content - Trust */}
              {activeTab === 'trust' && (
                <div className="fade-in space-y-6">
                  {/* Introduction */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 md:p-6 border border-blue-100">
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed text-center font-medium">
                      PPM Tool Finder helps organizations choose the right project portfolio management software through an objective, research-driven process. Every recommendation is based on verified tool data, guided user input, and an intelligent matching algorithm shaped by real-world PMO experience.
                    </p>
                  </div>

                  {/* 1. How We Research Tools */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">1. How We Research Tools</h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                      Each platform in our database is tested and configured in realistic business environments. We evaluate tools across seven core criteria: Scalability, Integrations & Extensibility, Ease of Use, Flexibility & Customization, Portfolio Management, Reporting & Analytics, Security & Compliance.
                    </p>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Each category is scored through hands-on builds, verified data, and expert testing. Rankings are refreshed as tools release major updates.
                    </p>
                  </div>

                  {/* 2. How We Evaluate User Rankings */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">2. How We Evaluate User Rankings</h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                      When users complete the guided questionnaire or manual ranking, their responses form a requirement profile. Each answer is weighted by importance using the same criteria applied during tool research.
                    </p>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      This shared framework ensures that user priorities and platform capabilities are compared consistently and fairly.
                    </p>
                  </div>

                  {/* 3. How We Match Users to Tools */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">3. How We Match Users to Tools</h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                      The PPM Tool Finder algorithm compares each user&apos;s weighted profile to every platform&apos;s research data. It calculates alignment scores and produces a ranked list of tools best matched to the user&apos;s priorities.
                    </p>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      As more users participate, the system learns from patterns to enhance precision and relevance.
                    </p>
                  </div>

                  {/* 4. How PPM Tool Finder Sustains Itself */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">4. How PPM Tool Finder Sustains Itself</h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                      Transparency extends to how the platform operates. PPM Tool Finder is maintained through:
                    </p>
                    <div className="space-y-3 mb-4">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        <span className="font-semibold">Consulting & Implementation Services</span> – Delivered by Panoramic Solutions to help teams implement the tools featured in our research.
                      </p>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        <span className="font-semibold">Sponsored Visibility (Clearly Marked)</span> – Select vendors may sponsor educational content, never rankings or match results.
                      </p>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        <span className="font-semibold">Aggregated Insights</span> – Anonymous, aggregated data may be used to identify market trends. Individual data is never sold or shared without consent.
                      </p>
                    </div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Our goal is to provide clear, data-backed software intelligence, not to sell influence.
                    </p>
                  </div>

                  {/* 5. Our Promise */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">5. Our Promise</h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      We are committed to accuracy, independence, and transparency. Our team continually refines the evaluation model, updates tool data, and protects user privacy at every step.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}; 