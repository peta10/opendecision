'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ppm-tool/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { analytics } from '@/lib/analytics';

interface Question {
  id: string;
  text: string;
  criteriaImpact: { [key: string]: number };
  options: {
    text: string;
    value: number;
  }[];
}

interface Criterion {
  id: string;
  name: string;
  description: string;
}

interface GuidedCriteriaQuestionsProps {
  onNext: (rankings: { [key: string]: number }) => void;
  onBack: () => void;
  userRole?: string;
  onRealTimeUpdate?: (rankings: { [key: string]: number }) => void;
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'How many users will be actively using the PPM tool?',
    criteriaImpact: { scalability: 1, security: 0.5 },
    options: [
      { text: '1-10 users', value: 1 },
      { text: '11-50 users', value: 2 },
      { text: '51-200 users', value: 3 },
      { text: '201-1000 users', value: 4 },
      { text: '1000+ users', value: 5 }
    ]
  },
  {
    id: 'q2',
    text: 'How many external tools need to integrate with your PPM solution?',
    criteriaImpact: { integrations: 1 },
    options: [
      { text: 'No integrations needed', value: 1 },
      { text: '1-3 key tools', value: 2 },
      { text: '4-7 tools', value: 3 },
      { text: '8-12 tools', value: 4 },
      { text: '12+ tools or complex ecosystem', value: 5 }
    ]
  },
  {
    id: 'q3',
    text: 'What is the technical expertise level of your primary users?',
    criteriaImpact: { easeOfUse: 1, flexibility: 0.5 },
    options: [
      { text: 'Advanced technical users', value: 1 },
      { text: 'Mix of technical and non-technical', value: 3 },
      { text: 'Primarily non-technical users', value: 5 }
    ]
  },
  {
    id: 'q4',
    text: 'How frequently do your project management processes change?',
    criteriaImpact: { flexibility: 1 },
    options: [
      { text: 'Rarely - stable processes', value: 1 },
      { text: 'Occasionally - minor adjustments', value: 2 },
      { text: 'Regularly - evolving needs', value: 4 },
      { text: 'Frequently - highly dynamic', value: 5 }
    ]
  },
  {
    id: 'q5',
    text: 'What level of portfolio management capabilities do you need?',
    criteriaImpact: { ppmFeatures: 1 },
    options: [
      { text: 'Basic project tracking', value: 1 },
      { text: 'Standard portfolio features', value: 3 },
      { text: 'Advanced portfolio optimization', value: 5 }
    ]
  },
  {
    id: 'q6',
    text: 'How important is data visualization and reporting?',
    criteriaImpact: { reporting: 1 },
    options: [
      { text: 'Basic status reports', value: 1 },
      { text: 'Standard dashboards', value: 3 },
      { text: 'Advanced analytics & insights', value: 5 }
    ]
  }
];

const criteria: Criterion[] = [
  {
    id: 'scalability',
    name: 'Scalability',
    description: 'How well the tool scales with team size and project volume'
  },
  {
    id: 'integrations',
    name: 'Integrations & Extensibility', 
    description: 'Third-party integrations and API capabilities'
  },
  {
    id: 'easeOfUse',
    name: 'Ease of Use',
    description: 'User interface and learning curve for team members'
  },
  {
    id: 'flexibility',
    name: 'Flexibility & Customization',
    description: 'Ability to adapt workflows and customize features'
  },
  {
    id: 'ppmFeatures',
    name: 'PPM Features',
    description: 'Portfolio management capabilities and project oversight'
  },
  {
    id: 'reporting',
    name: 'Reporting & Analytics',
    description: 'Data visualization and business intelligence features'
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    description: 'Data protection and regulatory compliance features'
  }
];

export const GuidedCriteriaQuestions: React.FC<GuidedCriteriaQuestionsProps> = ({ 
  onNext, 
  onBack, 
  userRole,
  onRealTimeUpdate
}) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [manualRankings, setManualRankings] = useState<{ [key: string]: number }>(() => {
    // Initialize with default values
    const defaults: { [key: string]: number } = {};
    criteria.forEach(c => defaults[c.id] = 3);
    return defaults;
  });
  const questionStartRef = useRef<number>(Date.now());
  const hasCompletedRef = useRef(false);
  const latestFlowStateRef = useRef<{ isManualMode: boolean; answersCount: number }>({
    isManualMode,
    answersCount: 0,
  });

  useEffect(() => {
    latestFlowStateRef.current = {
      isManualMode,
      answersCount: Object.keys(answers).length,
    };
  }, [isManualMode, answers]);

  useEffect(() => {
    void analytics.trackGuidedFlowEvent({
      eventType: 'flow_started',
      mode: isManualMode ? 'manual' : 'guided',
      context: {
        source_component: 'guided_criteria_questions',
        total_questions: questions.length,
        user_role: userRole || 'unknown',
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  useEffect(() => {
    questionStartRef.current = Date.now();
    const question = questions[currentQuestion];
    if (!isManualMode && question) {
      void analytics.trackGuidedFlowEvent({
        eventType: 'step_viewed',
        questionId: question.id,
        questionOrder: currentQuestion + 1,
        mode: 'guided',
        context: {
          source_component: 'guided_criteria_questions',
        },
      });
    }
  }, [currentQuestion, isManualMode]);

  // Real-time calculated rankings based on current answers
  const [realTimeRankings, setRealTimeRankings] = useState<{ [key: string]: number }>(() => {
    const defaults: { [key: string]: number } = {};
    criteria.forEach(c => defaults[c.id] = 3);
    return defaults;
  });

  const calculateRankings = useCallback(() => {
    if (isManualMode) {
      return manualRankings;
    }

    const rankings: { [key: string]: number } = {};
    const weights: { [key: string]: number } = {};
    
    // Initialize all criteria
    const criteriaIds = ['scalability', 'integrations', 'easeOfUse', 'flexibility', 'ppmFeatures', 'reporting', 'security'];
    criteriaIds.forEach(criterion => {
      rankings[criterion] = 0;
      weights[criterion] = 0;
    });

    // Calculate weighted scores
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question) {
        Object.entries(question.criteriaImpact).forEach(([criterionId, weight]) => {
          rankings[criterionId] += answer * weight;
          weights[criterionId] += weight;
        });
      }
    });

    // Calculate final scores based on weighted averages
    Object.keys(rankings).forEach(criterionId => {
      if (weights[criterionId] > 0) {
        rankings[criterionId] = Math.round(rankings[criterionId] / weights[criterionId]);
        rankings[criterionId] = Math.max(1, Math.min(5, rankings[criterionId]));
      } else {
        rankings[criterionId] = 3; // Default to medium priority
      }
    });

    // Apply role-based adjustments
    if (userRole === 'executive') {
      rankings.reporting = Math.min(5, rankings.reporting + 1);
      rankings.security = Math.min(5, rankings.security + 1);
    } else if (userRole === 'it-leader') {
      rankings.security = Math.min(5, rankings.security + 1);
      rankings.integrations = Math.min(5, rankings.integrations + 1);
    } else if (userRole === 'project-manager') {
      rankings.easeOfUse = Math.min(5, rankings.easeOfUse + 1);
      rankings.ppmFeatures = Math.min(5, rankings.ppmFeatures + 1);
    }

    return rankings;
  }, [isManualMode, manualRankings, answers, userRole]);

  // Update real-time rankings whenever answers change
  useEffect(() => {
    if (!isManualMode && Object.keys(answers).length > 0) {
      const newRankings = calculateRankings();
      setRealTimeRankings(newRankings);
      // Call the real-time update callback to update background sliders
      onRealTimeUpdate?.(newRankings);
    }
  }, [answers, isManualMode, userRole, manualRankings, onRealTimeUpdate, calculateRankings]);

  // Update real-time rankings when manual rankings change
  useEffect(() => {
    if (isManualMode) {
      // Call the real-time update callback for manual mode too
      onRealTimeUpdate?.(manualRankings);
    }
  }, [manualRankings, isManualMode, onRealTimeUpdate]);

  const handleAnswer = (questionId: string, value: number) => {
    // Track guided criteria question answer for New_Active metric
    try {
      checkAndTrackNewActive('Active-guided', {
        component: 'guided_criteria_questions',
        question_id: questionId,
        question_number: currentQuestion + 1,
        interaction_type: 'criteria_question_answer'
      });
    } catch (error) {
      console.warn('Failed to track guided criteria question interaction:', error);
    }
    
    const elapsed = Date.now() - questionStartRef.current;
    void analytics.trackGuidedFlowEvent({
      eventType: 'question_answered',
      questionId,
      questionOrder: currentQuestion + 1,
      mode: isManualMode ? 'manual' : 'guided',
      numericValue: value,
      timeSpentMs: elapsed,
      context: {
        source_component: 'guided_criteria_questions',
      },
    });
    
    // Track in Supabase analytics (fire-and-forget)
    try {
      const question = questions[currentQuestion];
      analytics.trackGuidedRankingAnswer({
        questionId: questionId,
        questionOrder: currentQuestion + 1,
        answer: value,
        questionText: question?.text || '',
        affectsCriteria: Object.keys(question?.criteriaImpact || {}).join(', '),
      });
    } catch (error) {
      console.warn('Failed to track guided criteria question in Supabase:', error);
    }
    
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        questionStartRef.current = Date.now();
      }
    }, 500);
  };

  const handleManualRankingChange = (criterionId: string, value: number) => {
    // Track manual ranking change for New_Active metric
    try {
      checkAndTrackNewActive('Active-guided', {
        component: 'guided_criteria_questions',
        criterion_id: criterionId,
        new_value: value,
        interaction_type: 'manual_ranking_change'
      });
    } catch (error) {
      console.warn('Failed to track manual ranking change:', error);
    }
    
    void analytics.trackGuidedFlowEvent({
      eventType: 'manual_rank_update',
      questionId: criterionId,
      mode: 'manual',
      numericValue: value,
      context: {
        source_component: 'guided_criteria_questions',
      },
    });
    
    setManualRankings(prev => ({ ...prev, [criterionId]: value }));
  };



  const handleComplete = () => {
    const rankings = calculateRankings();
    hasCompletedRef.current = true;
    void analytics.trackGuidedFlowEvent({
      eventType: 'flow_completed',
      mode: isManualMode ? 'manual' : 'guided',
      context: {
        source_component: 'guided_criteria_questions',
        answered_questions: Object.keys(answers).length,
      },
    });
    onNext(rankings);
  };

  const currentQ = questions[currentQuestion];
  const progress = isManualMode ? 100 : ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const allAnswered = Object.keys(answers).length === questions.length;

  useEffect(() => {
    return () => {
      if (!hasCompletedRef.current) {
        const latest = latestFlowStateRef.current;
        void analytics.trackGuidedFlowEvent({
          eventType: 'flow_abandoned',
          mode: latest.isManualMode ? 'manual' : 'guided',
          context: {
            source_component: 'guided_criteria_questions',
            answered_questions: latest.answersCount,
          },
        });
      }
    };
  }, []);

  // Animation variants
  const questionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm h-[85vh] max-h-[50rem] md:h-[80vh] md:max-h-[53rem] lg:h-[75vh] lg:max-h-[56rem] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle className="text-lg md:text-xl lg:text-2xl text-gray-900">
            {isManualMode ? 'Manual Criteria Ranking' : `Rank Your Criteria: Question ${currentQuestion + 1}`}
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-gray-600">
            {isManualMode ? 'Set your criteria priorities manually' : 'Help us understand your priorities to get personalized recommendations'}
          </CardDescription>
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-center mt-4 space-x-3">
            <span className={`text-xs md:text-sm font-medium ${!isManualMode ? 'text-blue-600' : 'text-gray-500'}`}>
              Guided Questions
            </span>
            <motion.button
              onClick={() => {
                const newMode = !isManualMode;
                
                // Track mode toggle for New_Active metric
                try {
                  checkAndTrackNewActive('Active-guided', {
                    component: 'guided_criteria_questions',
                    interaction_type: 'mode_toggle',
                    from_mode: isManualMode ? 'manual' : 'guided',
                    to_mode: newMode ? 'manual' : 'guided'
                  });
                } catch (error) {
                  console.warn('Failed to track mode toggle:', error);
                }
                
                void analytics.trackGuidedFlowEvent({
                  eventType: 'mode_toggled',
                  mode: newMode ? 'manual' : 'guided',
                  context: {
                    source_component: 'guided_criteria_questions',
                    from_mode: isManualMode ? 'manual' : 'guided',
                  },
                });
                
                setIsManualMode(newMode);
                questionStartRef.current = Date.now();
              }}
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isManualMode ? 0 : 180 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {isManualMode ? (
                  <ToggleRight className="w-8 h-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </motion.div>
            </motion.button>
            <span className={`text-xs md:text-sm font-medium ${isManualMode ? 'text-blue-600' : 'text-gray-500'}`}>
              Manual Ranking
            </span>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            />
          </div>
          <motion.div 
            className="text-sm text-gray-500 mt-1"
            key={progress}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(progress)}% Complete
          </motion.div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col overflow-hidden">
          {isManualMode ? (
            /* Manual Ranking Mode */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex-1 overflow-y-auto" style={{ minHeight: '28rem', maxHeight: '40rem' }}
            >
              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <p className="text-gray-600">
                    Rate each criterion from 1 (low priority) to 5 (high priority)
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {criteria.map((criterion, index) => (
                  <motion.div 
                    key={criterion.id} 
                    className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{criterion.name}</h3>
                        <p className="text-sm text-gray-600">{criterion.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <motion.div 
                          className="text-2xl font-bold text-blue-600"
                          key={manualRankings[criterion.id]}
                          initial={{ scale: 1.2, opacity: 0.7 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ 
                            duration: 0.3,
                            ease: "easeOut",
                            type: "spring",
                            stiffness: 200
                          }}
                        >
                          {manualRankings[criterion.id]}
                        </motion.div>
                        <div className="text-xs text-gray-500">/ 5</div>
                      </div>
                    </div>
                    
                    {/* Animated Rating Buttons */}
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <motion.button
                          key={rating}
                          onClick={() => handleManualRankingChange(criterion.id, rating)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            manualRankings[criterion.id] === rating
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{
                            backgroundColor: manualRankings[criterion.id] === rating ? '#2563eb' : '#ffffff',
                            color: manualRankings[criterion.id] === rating ? '#ffffff' : '#4b5563'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {rating}
                        </motion.button>
                      ))}
                    </div>


                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Guided Questions Mode */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
              {/* Question Section */}
              <div className="lg:col-span-2 overflow-y-auto" style={{ minHeight: '26rem', maxHeight: '37rem' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    variants={questionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ 
                      duration: 0.4, 
                      ease: "easeInOut" 
                    }}
                    className="text-center mb-8"
                  >
                    <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                      {currentQ.text}
                    </h3>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      {currentQ.options.map((option, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleAnswer(currentQ.id, option.value)}
                          className={`w-full p-3 md:p-4 text-left rounded-lg border-2 transition-all duration-200 text-sm md:text-base ${
                            answers[currentQ.id] === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: index * 0.05
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm md:text-base">{option.text}</span>
                            <AnimatePresence>
                              {answers[currentQ.id] === option.value && (
                                <motion.div 
                                  className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ 
                                    duration: 0.3,
                                    type: "spring",
                                    stiffness: 200
                                  }}
                                >
                                  <motion.div 
                                    className="w-2 h-2 bg-white rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Real-time Criteria Rankings Preview */}
              <div className="lg:col-span-1 overflow-y-auto" style={{ maxHeight: '37rem' }}>
                <motion.div
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h4 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                    <motion.div
                      className="w-3 h-3 bg-blue-600 rounded-full mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    Live Preview
                  </h4>
                  <div className="space-y-4">
                    {criteria.map((criterion, index) => {
                      const currentRanking = isManualMode ? manualRankings[criterion.id] : realTimeRankings[criterion.id];
                      return (
                        <motion.div
                          key={criterion.id}
                          className="bg-white rounded-lg p-3 shadow-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: index * 0.03 
                          }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {criterion.name}
                            </span>
                            <motion.span 
                              className="text-sm font-bold text-blue-600"
                              key={currentRanking}
                              initial={{ scale: 1.3, opacity: 0.7 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ 
                                duration: 0.3,
                                type: "spring",
                                stiffness: 200
                              }}
                            >
                              {currentRanking}/5
                            </motion.span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                              initial={{ width: "60%" }}
                              animate={{ width: `${(currentRanking / 5) * 100}%` }}
                              transition={{
                                duration: 0.8,
                                ease: "easeOut",
                                type: "spring",
                                stiffness: 100,
                                damping: 15
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <motion.div 
            className="flex justify-between items-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={(!isManualMode && currentQuestion > 0) ? () => setCurrentQuestion(prev => prev - 1) : onBack}
              className="flex items-center px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {(!isManualMode && currentQuestion > 0) ? 'Previous' : 'Back'}
            </motion.button>

            {(isManualMode || (isLastQuestion && allAnswered)) ? (
              <motion.button
                onClick={handleComplete}
                className="flex items-center px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Complete Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!answers[currentQ.id] || currentQuestion >= questions.length - 1}
                className={`flex items-center px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-lg transition-all ${
                  answers[currentQ.id] && currentQuestion < questions.length - 1
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                whileHover={answers[currentQ.id] ? { scale: 1.05 } : {}}
                whileTap={answers[currentQ.id] ? { scale: 0.95 } : {}}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
            )}
          </motion.div>

          {/* Skip Option - only show in guided mode */}
          {!isManualMode && (
            <motion.div 
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={handleComplete}
                className="text-xs md:text-sm text-gray-500 hover:text-gray-700 underline"
                whileHover={{ scale: 1.05 }}
              >
                Skip remaining questions and use current answers
              </motion.button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 