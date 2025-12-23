'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Criterion } from '@/ppm-tool/shared/types';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/ppm-tool/components/ui/button';
import { Slider } from '@/ppm-tool/components/ui/Slider';
import { checkAndTrackNewActive, checkAndTrackNewPartialRanking, checkAndTrackNewFullRankingSubmittal } from '@/lib/posthog';
import { markGuidedRankingAsCompleted } from '@/ppm-tool/shared/utils/guidedRankingState';
import { analytics } from '@/lib/analytics';
import '@/ppm-tool/components/ui/ModernPill.css';

interface GuidedRankingFormProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: Criterion[];
  onUpdateRankings: (rankings: { [key: string]: number }) => void;
  onRealTimeUpdate?: (rankings: { [key: string]: number }) => void;
  onSaveAnswers?: (answers: Record<string, QuestionAnswer>, personalizationData: Record<string, QuestionAnswer>) => void;
  onMethodologyFilter?: (methodologies: string[]) => void;
  criterionId?: string; // Optional criterion ID for single-criterion guided ranking
  initialAnswers?: Record<string, QuestionAnswer>; // Saved answers from localStorage
}

interface QuestionOption {
  text: string;
  value: number;
}

interface Question {
  id: string;
  text: string;
  criteriaImpact: { [key: string]: number };
  options: QuestionOption[];
  isPersonalization?: boolean;
  isMultiSelect?: boolean;
}

type QuestionAnswer = number | number[] | string;

const questions: Question[] = [
  {
    id: 'q1',
    text: 'On average, how many projects does your organization complete annually?',
    criteriaImpact: { 'Scalability': 1 },
    options: [
      { text: 'Less than 10 projects per year', value: 1 },
      { text: '10-29 projects per year', value: 2 },
      { text: '30-99 projects per year', value: 3 },
      { text: '100-499 projects per year', value: 4 },
      { text: 'Greater than 499 projects per year', value: 5 }
    ]
  },
  {
    id: 'q2',
    text: 'Approximately how many tasks or action items are there per project?',
    criteriaImpact: { 'Scalability': 1 },
    options: [
      { text: 'Less than 20 tasks per project', value: 1 },
      { text: '20-99 tasks per project', value: 2 },
      { text: '100-499 tasks per project', value: 3 },
      { text: '500-999 tasks per project', value: 4 },
      { text: 'Greater than 999 tasks per project', value: 5 }
    ]
  },
  {
    id: 'q3',
    text: 'What is the typical technical expertise level of the primary users who will interact with the PPM tool?',
    criteriaImpact: { 'Ease of Use': 1 },
    options: [
      { text: 'Advanced technical users (devs/engineers, tolerates complex interfaces)', value: 1 },
      { text: 'Mostly technical with some non-technical (IT teams, needs intuitive but feature-rich UI, <2 days training)', value: 2 },
      { text: 'Mix of technical and non-technical (requires user-friendly design, drag-and-drop, <1 day training)', value: 3 },
      { text: 'Primarily non-technical with some technical (business users, demands simple navigation, templates, <4 hours training)', value: 4 },
      { text: 'All non-technical users (must be very simple to use, <1 hour onboarding)', value: 5 }
    ]
  },
  {
    id: 'q4',
    text: 'How critical are advanced data visualization and reporting features to your needs?',
    criteriaImpact: { 'Reporting & Analytics': 1 },
    options: [
      { text: 'Basic status reports (static PDFs, simple lists, no interactivity)', value: 1 },
      { text: 'Standard reports with basic charts (bar graphs, export to Excel)', value: 2 },
      { text: 'Customizable dashboards (real-time metrics, 5-10 chart types)', value: 3 },
      { text: 'Dynamic dashboards with drill-down (filters/sorts, slice/dice data, ad-hoc queries, 10+ visuals)', value: 4 },
      { text: 'Advanced analytics with trends (Month over Month / Year over Year tracking, predictive AI, full BI integration)', value: 5 }
    ]
  },
  {
    id: 'q5',
    text: 'What level of portfolio management functionality is required for your operations?',
    criteriaImpact: { 'Portfolio Management': 1 },
    options: [
      { text: 'Solo project tracking (single-user task views, no sharing or collaboration features)', value: 1 },
      { text: 'Basic team collaboration (shared portfolio views for small groups)', value: 2 },
      { text: 'Standard portfolio features (rollup dashboards with 3-5 KPIs like cost/schedule variance, real-time updates)', value: 3 },
      { text: 'Advanced portfolio optimization (dependency tracking with visual graphs, resource allocation and capacity planning)', value: 4 },
      { text: 'Enterprise portfolio suite (AI-driven resource allocation, predictive scheduling, multi-level dependency mapping)', value: 5 }
    ]
  },
  {
    id: 'q6',
    text: 'How frequently do your project & portfolio management processes change?',
    criteriaImpact: { 'Flexibility & Customization': 0.5 },
    options: [
      { text: 'Rarely (fixed process)', value: 1 },
      { text: 'Occasionally (minor adjustments)', value: 2 },
      { text: 'Regularly (4-6 changes/year)', value: 3 },
      { text: 'Frequently (7-12 changes/year)', value: 4 },
      { text: 'Constantly (>12 changes/year)', value: 5 }
    ]
  },
  {
    id: 'q7',
    text: 'What level of workflow automation do you need?',
    criteriaImpact: { 'Flexibility & Customization': 0.5 },
    options: [
      { text: 'Manual processes (no automation, basic alerts only)', value: 1 },
      { text: 'Simple automation (single-item automation)', value: 2 },
      { text: 'Basic rule-based (triggers, conditional logic, actions)', value: 3 },
      { text: 'Advanced workflows (dynamic variables)', value: 4 },
      { text: 'Complex automation (API/scripting)', value: 5 }
    ]
  },
  {
    id: 'q8',
    text: 'How many external systems or tools (CRM, ERP, budgeting software) need to integrate with your PPM solution?',
    criteriaImpact: { 'Integrations & Extensibility': 1 },
    options: [
      { text: '0 tools (standalone use, no data exchange needed)', value: 1 },
      { text: 'One-way import/export', value: 2 },
      { text: '1 tool (simple connection, once-a-day sync)', value: 3 },
      { text: '2-4 tools (multi-way integrations, close to real-time)', value: 4 },
      { text: '>4 tools/complex ecosystem (full stack, custom webhooks, zero-latency)', value: 5 }
    ]
  },
  {
    id: 'q9',
    text: 'What are your key requirements for security features and regulatory compliance?',
    criteriaImpact: { 'Security & Compliance': 1 },
    options: [
      { text: 'Basic security (password protection, no compliance requirements)', value: 1 },
      { text: 'Standard security (SSO, basic audit trails)', value: 2 },
      { text: 'Enhanced security (role-based access, detailed logging)', value: 3 },
      { text: 'Advanced security (encryption, compliance frameworks)', value: 4 },
      { text: 'Enterprise security (SOC 2, GDPR, HIPAA compliance)', value: 5 }
    ]
  },
  {
    id: 'q10',
    text: 'Approximately how many users will actively engage with the PPM tool?',
    criteriaImpact: {},
    isPersonalization: true,
    options: [
      { text: '1-10 users', value: 1 },
      { text: '11-50 users', value: 2 },
      { text: '51-200 users', value: 3 },
      { text: '201-1000 users', value: 4 },
      { text: '1000+ users', value: 5 }
    ]
  },
  {
    id: 'q11',
    text: 'In which primary functions or departments will the PPM tool be used? (Select all that apply)',
    criteriaImpact: {},
    isPersonalization: true,
    isMultiSelect: true,
    options: [
      { text: 'Engineering', value: 1 },
      { text: 'Marketing', value: 2 },
      { text: 'Product & Design', value: 3 },
      { text: 'IT & Support', value: 4 },
      { text: 'Sales & Account Management', value: 5 },
      { text: 'Operations', value: 6 },
      { text: 'Finance', value: 7 },
      { text: 'HR', value: 8 },
      { text: 'Other', value: 9 }
    ]
  },
  {
    id: 'q12',
    text: 'Which project management methodologies are you planning to support? (Select all that apply)',
    criteriaImpact: {},
    isPersonalization: true,
    isMultiSelect: true,
    options: [
      { text: 'Agile', value: 1 },
      { text: 'Waterfall', value: 2 },
      { text: 'Continuous Improvement', value: 3 },
      { text: 'Not Sure', value: 4 }
    ]
  }
];

// Remove the QuestionNavigation component since we won't use it anymore

export const GuidedRankingForm: React.FC<GuidedRankingFormProps> = ({
  isOpen,
  onClose,
  criteria,
  onUpdateRankings,
  onRealTimeUpdate,
  onSaveAnswers,
  onMethodologyFilter,
  criterionId,
  initialAnswers
}) => {
  const [answers, setAnswers] = React.useState<Record<string, QuestionAnswer>>(initialAnswers || {});
  const [currentStep, setCurrentStep] = React.useState(0);
  const [otherAnswers, setOtherAnswers] = React.useState<Record<string, string>>({});
  const [loadingAnswers, setLoadingAnswers] = React.useState(false);

  const formRef = React.useRef<HTMLDivElement>(null);
  const { isTouchDevice } = useUnifiedMobileDetection();
  
  // Create stable reference for onRealTimeUpdate to prevent unnecessary re-renders
  const onRealTimeUpdateRef = React.useRef(onRealTimeUpdate);
  onRealTimeUpdateRef.current = onRealTimeUpdate;
  
  // Filter questions based on criterionId if provided
  const relevantQuestions = React.useMemo(() => {
    if (!criterionId) {
      // Show all questions if no specific criterion is selected (full guided questionnaire)
      return questions;
    }
    
    // Find the criterion to get its name
    const targetCriterion = criteria.find(c => c.id === criterionId);
    if (!targetCriterion) {
      return questions;
    }
    
    // Filter questions that impact the selected criterion ONLY
    // Do NOT include personalization questions when filtering by criterion
    return questions.filter(q => {
      // Exclude personalization questions for single-criterion mode
      if (q.isPersonalization) {
        return false;
      }
      // Include ONLY questions that impact this specific criterion
      return Object.keys(q.criteriaImpact).includes(targetCriterion.name);
    });
  }, [criterionId, criteria]);
  
  // Reset form state whenever the form closes
  const resetFormState = React.useCallback(() => {
    setAnswers({});
    setOtherAnswers({});
    setCurrentStep(0);
  }, []);

  // Load answers from database
  const loadAnswersFromDatabase = React.useCallback(async () => {
    setLoadingAnswers(true);
    try {
      const userAnalytics = await analytics.getSessionData();
      if (userAnalytics && userAnalytics.question_responses) {
        const questionResponses = userAnalytics.question_responses;
        const loadedAnswers: Record<string, QuestionAnswer> = {};
        
        // Group responses by question
        questionResponses.forEach((response: any) => {
          const questionKey = `q${response.question_order}`;
          const question = relevantQuestions.find(q => q.id === questionKey);
          
          if (question?.isMultiSelect) {
            // For multi-select questions, collect all values into an array
            if (!loadedAnswers[questionKey]) {
              loadedAnswers[questionKey] = [];
            }
            if (response.choice_value) {
              (loadedAnswers[questionKey] as number[]).push(parseInt(response.choice_value));
            }
          } else {
            // For single-select questions, use the choice value or response text
            loadedAnswers[questionKey] = response.choice_value ? 
              parseInt(response.choice_value) : response.response_text;
          }
        });
        
        if (Object.keys(loadedAnswers).length > 0) {
          console.log('📂 Loaded answers from database:', Object.keys(loadedAnswers).length, 'questions');
          setAnswers(loadedAnswers);
          setLoadingAnswers(false);
          return loadedAnswers;
        }
      }
    } catch (error) {
      console.warn('Failed to load answers from database:', error);
    }
    setLoadingAnswers(false);
    return null;
  }, [relevantQuestions]);

  // Track if we've cleared filters to avoid unnecessary calls
  const hasOpenedRef = React.useRef(false);
  
  // Separate effect to clear methodology filters when form opens
  React.useEffect(() => {
    if (isOpen && !hasOpenedRef.current) {
      // Clear methodology filters when form opens for the first time
      onMethodologyFilter?.([]);
      hasOpenedRef.current = true;
    } else if (!isOpen) {
      // Reset the flag when form closes
      hasOpenedRef.current = false;
    }
  }, [isOpen, onMethodologyFilter]);

  const handleClose = () => {
    // Check if ANY questions were actually answered (not just if answers object has keys)
    // Filter out empty/null/undefined values and check if any real answers exist
    const hasAnyAnswers = Object.entries(answers).some(([key, value]) => {
      // Only count actual question answers (q1-q9), not personalization answers
      const isQuestionKey = /^q\d+$/.test(key);
      if (!isQuestionKey) return false;
      
      // Value must be truthy (number for questions, non-empty string/array for personalization)
      return value !== null && value !== undefined && value !== '';
    });
    
    // BOTH MODES: If there are actual answers, check if we should apply them with animation
    if (hasAnyAnswers) {
      console.log('📊 Checking for changes before closing:', { 
        mode: criterionId ? 'single-criteria' : 'full-guided',
        answersCount: Object.keys(answers).length,
        hasAnyAnswers
      });
      
      const rankings = calculateRankings();
      const personalizationData = extractPersonalizationData(answers);
      
      // Check if rankings would actually change anything (not all defaults)
      const hasMeaningfulChanges = Object.keys(rankings).some(criterionId => {
        const criterion = criteria.find(c => c.id === criterionId);
        return criterion && rankings[criterionId] !== criterion.userRating;
      });
      
      // ALSO check if calculations occurred (Q1+Q2, Q6+Q7, or single-question criteria)
      // This ensures animation triggers even if calculated value equals current value
      // because the user explicitly answered questions that calculate criteria
      const hasScalabilityCalculation = answers['q1'] && answers['q2'];
      const hasFlexibilityCalculation = answers['q6'] && answers['q7'];
      const hasSingleQuestionAnswers = ['q3', 'q4', 'q5', 'q8', 'q9'].some(qId => answers[qId]);
      const hasAnyCalculation = hasScalabilityCalculation || hasFlexibilityCalculation || hasSingleQuestionAnswers;
      
      // Trigger animation if values changed OR calculations occurred
      if (hasMeaningfulChanges || hasAnyCalculation) {
        console.log('✅ Rankings would change criteria or calculations occurred - triggering animation', {
          hasMeaningfulChanges,
          hasScalabilityCalculation,
          hasFlexibilityCalculation,
          hasSingleQuestionAnswers
        });
        // Save answers first
        onSaveAnswers?.(answers, personalizationData);
        
        // Close modal first, then trigger animation after modal closes
        resetFormState();
        onClose();
        
        // Wait for modal to close before starting animation
        setTimeout(() => {
          onUpdateRankings(rankings);
        }, isTouchDevice ? 100 : 500); // Mobile: 100ms, Desktop: 500ms (0.5 seconds delay)
      } else {
        // No meaningful changes, just save and close
        console.log('⚠️ No meaningful changes from answers - saving but not applying');
        onSaveAnswers?.(answers, personalizationData);
        resetFormState();
        onClose();
      }
    } else {
      // No answers at all, just close
      console.log('🚪 No answers provided - closing without applying');
      resetFormState();
      onClose();
    }
  };

  useClickOutside(formRef, handleClose);

  // Load initial answers when form opens (database first, then localStorage fallback)
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔍 GuidedRankingForm opened:', { 
        criterionId, 
        hasInitialAnswers: !!initialAnswers && Object.keys(initialAnswers).length > 0 
      });
      
      // Initialize start time for completion tracking
      (window as any)._guidedRankingStartTime = Date.now();
      
      // Try loading from database first
      const loadInitialData = async () => {
        const databaseAnswers = await loadAnswersFromDatabase();
        
        if (!databaseAnswers || Object.keys(databaseAnswers).length === 0) {
          // Fall back to initialAnswers (localStorage) if database has no data
          if (initialAnswers && Object.keys(initialAnswers).length > 0) {
            console.log('📂 Loading saved answers from localStorage fallback:', Object.keys(initialAnswers).length, 'questions');
            setAnswers(initialAnswers);
          } else {
            console.log('📝 Resetting form state (no saved answers in database or localStorage)');
            resetFormState();
          }
        }
        // If database had answers, they're already set by loadAnswersFromDatabase
      };
      
      loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, criterionId]); // initialAnswers and resetFormState intentionally omitted to prevent loops

  const handleAnswer = (questionId: string, value: number) => {
    const question = relevantQuestions.find(q => q.id === questionId);
    
    // Track guided ranking interaction for New_Active metric
    try {
      checkAndTrackNewActive('Active-guided', {
        component: 'guided_ranking_form',
        question_id: questionId,
        question_number: currentStep + 1,
        interaction_type: question?.isMultiSelect ? 'multi_select_answer' : 'single_select_answer'
      });
    } catch (error) {
      console.warn('Failed to track guided ranking interaction:', error);
    }
    
    // Track New_Partial_Ranking in PostHog (ONCE per user)
    try {
      checkAndTrackNewPartialRanking({
        question_id: questionId,
        question_text: question?.text || '',
        question_number: currentStep + 1,
        answer: value,
        affects_criteria: question?.isPersonalization ? 'personalization' : Object.keys(question?.criteriaImpact || {}).join(', '),
        total_questions: relevantQuestions.length,
        // ✅ NEW: Add user properties
        $set: {
          latest_question_answered: question?.text,
          total_questions_answered: Object.keys(answers).length + 1
        },
        $set_once: {
          first_question_answered_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track partial ranking:', error);
    }
    
    // Track in Supabase analytics (fire-and-forget)
    try {
      analytics.trackGuidedRankingAnswer({
        questionId: questionId,
        questionOrder: currentStep + 1,
        answer: value,
        questionText: question?.text || '',
        affectsCriteria: question?.isPersonalization ? 'personalization' : Object.keys(question?.criteriaImpact || {}).join(', '),
      });
    } catch (error) {
      console.warn('Failed to track guided ranking in Supabase:', error);
    }
    
    if (question?.isMultiSelect) {
      // For multi-select, toggle values in an array
      setAnswers(prev => {
        const currentValues = (prev[questionId] as number[]) || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v: number) => v !== value)
          : [...currentValues, value];
        
        // Track answer in Supabase analytics
        analytics.trackGuidedRankingAnswer({
          questionId,
          questionOrder: (question?.id.match(/\d+/) ? parseInt(question.id.match(/\d+/)![0]) : currentStep + 1),
          questionText: question?.text || '',
          answer: newValues,
          affectsCriteria: question?.isPersonalization ? 'personalization' : Object.keys(question?.criteriaImpact || {}).join(', '),
          isComplete: false
        });
        
        return { ...prev, [questionId]: newValues };
      });
    } else {
      // For single-select, just set the value
      setAnswers(prev => {
        // Track answer in Supabase analytics
        analytics.trackGuidedRankingAnswer({
          questionId,
          questionOrder: (question?.id.match(/\d+/) ? parseInt(question.id.match(/\d+/)![0]) : currentStep + 1),
          questionText: question?.text || '',
          answer: value,
          affectsCriteria: question?.isPersonalization ? 'personalization' : Object.keys(question?.criteriaImpact || {}).join(', '),
          isComplete: false
        });
        
        return { ...prev, [questionId]: value };
      });
    }
  };

  // Effect to apply methodology filtering when Q12 changes (outside of render)
  React.useEffect(() => {
    const q12Answer = answers['q12'];
    if (!q12Answer || !onMethodologyFilter) return;
    
    const selectedValues = q12Answer as number[];
    
    // Map values to methodology names
    const valueToMethodology: { [key: number]: string } = {
      1: 'Agile',
      2: 'Waterfall', 
      3: 'Continuous Improvement',
      4: 'Not Sure'
    };
    
    const selectedMethodologies = selectedValues
      .map(value => valueToMethodology[value])
      .filter(Boolean);
    
    // If "Not Sure" is selected or no methodologies selected, show all tools (empty filter)
    if (selectedMethodologies.includes('Not Sure') || selectedMethodologies.length === 0) {
      onMethodologyFilter([]);
    } else {
      // Apply actual methodology filters (OR logic - show tools that support ANY selected methodology)
      onMethodologyFilter(selectedMethodologies);
    }
  }, [answers, onMethodologyFilter]);

  const isQuestionAnswered = (question: Question) => {
    // Q11 multi-select needs at least one selection
    if (question.id === 'q11') {
      const selectedValues = (answers[question.id] as number[]) || [];
      // If "Other" is selected, check if text is provided
      if (selectedValues.includes(9) && !otherAnswers[question.id]?.trim()) {
        return false;
      }
      return selectedValues.length > 0;
    }
    return !!answers[question.id];
  };

  const extractPersonalizationData = (answers: Record<string, QuestionAnswer>) => {
    const personalizationData: Record<string, QuestionAnswer> = {};
    relevantQuestions.forEach(question => {
      if (question.isPersonalization && answers[question.id]) {
        personalizationData[question.id] = answers[question.id];
        // Include other text answers for Q11
        if (question.id === 'q11' && otherAnswers[question.id]) {
          personalizationData[`${question.id}_other`] = otherAnswers[question.id];
        }
      }
    });
    return personalizationData;
  };

  const calculateRankings = React.useCallback(() => {
    const rankings: { [key: string]: number } = {};
    const weights: { [key: string]: number } = {};
    
    // Create a mapping from criteria names to IDs for easier lookup
    const criteriaNameToId: { [key: string]: string } = {};
    criteria.forEach(criterion => {
      criteriaNameToId[criterion.name] = criterion.id;
    });

    // If individual criterion mode (criterionId provided), only calculate that specific criterion
    if (criterionId) {
      const targetCriterion = criteria.find(c => c.id === criterionId);
      if (!targetCriterion) {
        // If criterion not found, return empty object (shouldn't happen)
        return {};
      }

      // Initialize only the target criterion with its current value
      rankings[criterionId] = targetCriterion.userRating;
      weights[criterionId] = 0;

      // Calculate Scalability using multiplication rule for Q1 and Q2
      const scalabilityId = criteriaNameToId['Scalability'];
      if (criterionId === scalabilityId && answers['q1'] && answers['q2']) {
        const projectsQuestionValue = answers['q1'] as number;
        const tasksQuestionValue = answers['q2'] as number;
        
        const projectRanges = [10, 29, 99, 499, 500];
        const taskRanges = [20, 99, 499, 999, 1000];
        
        const projectsPerYear = projectRanges[projectsQuestionValue - 1] || 500;
        const tasksPerProject = taskRanges[tasksQuestionValue - 1] || 1000;
        const totalVolume = projectsPerYear * tasksPerProject;
        
        let scalabilityScore = 1;
        if (totalVolume >= 200000) scalabilityScore = 5;
        else if (totalVolume >= 30000) scalabilityScore = 4;
        else if (totalVolume >= 5000) scalabilityScore = 3;
        else if (totalVolume >= 500) scalabilityScore = 2;
        
        rankings[scalabilityId] = scalabilityScore;
      }
      // Handle Flexibility calculation (Q6 + Q7 / 2)
      else if (criterionId === criteriaNameToId['Flexibility & Customization'] && answers['q6'] && answers['q7']) {
        const processChanges = answers['q6'] as number;
        const workflowAutomation = answers['q7'] as number;
        const flexibilityAverage = (processChanges + workflowAutomation) / 2;
        rankings[criterionId] = Math.ceil(flexibilityAverage);
      }
      // Handle other single-question criteria
      else {
        Object.entries(answers).forEach(([questionId, answer]) => {
          const question = questions.find(q => q.id === questionId);
          if (question && !question.isPersonalization && !Array.isArray(answer) && typeof answer === 'number') {
            Object.entries(question.criteriaImpact).forEach(([criteriaName, weight]) => {
              const criteriaIdFromQuestion = criteriaNameToId[criteriaName];
              // Only process if this question affects the target criterion
              if (criteriaIdFromQuestion === criterionId) {
                if (weights[criterionId] === 0) {
                  rankings[criterionId] = 0;
                }
                rankings[criterionId] += answer * weight;
                weights[criterionId] += weight;
              }
            });
          }
        });

        // Calculate weighted average if we have answers
        if (weights[criterionId] > 0) {
          rankings[criterionId] = Math.round(rankings[criterionId] / weights[criterionId]);
          rankings[criterionId] = Math.max(1, Math.min(5, rankings[criterionId]));
        }
      }

      // Return ONLY the target criterion - this preserves all other criteria
      return { [criterionId]: rankings[criterionId] };
    }

    // Full mode: Calculate all criteria (preserve existing behavior)
    criteria.forEach(criterion => {
      rankings[criterion.id] = criterion.userRating;
      weights[criterion.id] = 0;
    });

    // Calculate Scalability using multiplication rule for Q1 and Q2 with proper range mapping
    const scalabilityId = criteriaNameToId['Scalability'];
    
    // Only calculate scalability if both Q1 and Q2 are answered
    if (answers['q1'] && answers['q2'] && scalabilityId) {
      const projectsQuestionValue = answers['q1'] as number;
      const tasksQuestionValue = answers['q2'] as number;
      
      // Map question values to actual ranges (always use HIGH side of ranges)
      const projectRanges = [10, 29, 99, 499, 500]; // <10, 10-29, 30-99, 100-499, 500+
      const taskRanges = [20, 99, 499, 999, 1000];  // <20, 20-99, 100-499, 500-999, 1000+
      
      const projectsPerYear = projectRanges[projectsQuestionValue - 1] || 500;
      const tasksPerProject = taskRanges[tasksQuestionValue - 1] || 1000;
      const totalVolume = projectsPerYear * tasksPerProject;
      
      // Convert total volume to scalability score using correct bands
      let scalabilityScore = 1;
      if (totalVolume >= 200000) scalabilityScore = 5;     // ≥200,000 total = Score 5
      else if (totalVolume >= 30000) scalabilityScore = 4; // 30,000-199,999 total = Score 4  
      else if (totalVolume >= 5000) scalabilityScore = 3;  // 5,000-29,999 total = Score 3
      else if (totalVolume >= 500) scalabilityScore = 2;   // 500-4,999 total = Score 2
      // else scalabilityScore = 1;                         // <500 total = Score 1
      
      rankings[scalabilityId] = scalabilityScore;
      weights[scalabilityId] = 1;
    }
    // If Q1 or Q2 not answered, scalability remains at default value of 3

    // Calculate other criteria from individual questions
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question && !question.isPersonalization && !Array.isArray(answer) && typeof answer === 'number') {
        Object.entries(question.criteriaImpact).forEach(([criteriaName, weight]) => {
          // Map criteria names to actual IDs
          const criteriaIdFromQuestion = criteriaNameToId[criteriaName];
          if (criteriaIdFromQuestion && criteriaIdFromQuestion !== scalabilityId) { // Skip scalability as it's calculated above
            // Reset to 0 for calculation on first answer for this criterion
            if (weights[criteriaIdFromQuestion] === 0) {
              rankings[criteriaIdFromQuestion] = 0;
            }
            rankings[criteriaIdFromQuestion] += answer * weight;
            weights[criteriaIdFromQuestion] += weight;
          }
        });
      }
    });

    // Calculate weighted averages for non-scalability criteria
    Object.keys(rankings).forEach(criterionIdKey => {
      if (criterionIdKey !== scalabilityId && weights[criterionIdKey] > 0) {
        // Calculate the value from answered questions
        rankings[criterionIdKey] = Math.round(rankings[criterionIdKey] / weights[criterionIdKey]);
        rankings[criterionIdKey] = Math.max(1, Math.min(5, rankings[criterionIdKey]));
      }
      // If weights[criterionIdKey] === 0, keep the default value of 3
    });

    // Handle flexibility calculation (Q6 + Q7 / 2) - rounds UP for in-between values
    const flexibilityId = criteriaNameToId['Flexibility & Customization'];
    if (flexibilityId && answers['q6'] && answers['q7']) {
      // Only calculate if both Q6 and Q7 are answered
      const processChanges = answers['q6'] as number;
      const workflowAutomation = answers['q7'] as number;
      const flexibilityAverage = (processChanges + workflowAutomation) / 2;
      rankings[flexibilityId] = Math.ceil(flexibilityAverage);
    }
    // If Q6 or Q7 not answered, flexibility remains at default value of 3

    return rankings;
  }, [criteria, answers, criterionId]); // Include criterionId in dependencies

  // Debounced real-time update effect to prevent infinite loops
  React.useEffect(() => {
    if (!isOpen || Object.keys(answers).length === 0) return;
    
    // Debounce rapid answer changes to prevent overwhelming the parent component  
    const timeoutId = setTimeout(() => {
      const rankings = calculateRankings();
      onRealTimeUpdateRef.current?.(rankings);
    }, 150); // 150ms debounce for user input
    
    return () => clearTimeout(timeoutId);
  }, [calculateRankings, isOpen, answers]);

  const handleSubmit = () => {
    // Defensive check: Ensure at least one question was actually answered
    const hasAnyAnswers = Object.entries(answers).some(([key, value]) => {
      const isQuestionKey = /^q\d+$/.test(key);
      if (!isQuestionKey) return false;
      return value !== null && value !== undefined && value !== '';
    });
    
    if (!hasAnyAnswers) {
      console.log('⚠️ No answers provided - cannot submit without answers');
      return; // Early return if no answers
    }
    
    const rankings = calculateRankings();
    const personalizationData = extractPersonalizationData(answers);

    // NOTE: markGuidedRankingAsCompleted() is now called AFTER animation completes in handleUpdateRankings

    // Track PostHog New_Full_Ranking_Submittal event (once per session)
    try {
      checkAndTrackNewFullRankingSubmittal({
        completion_method: 'full_form_submit',
        ranking_type: 'guided',
        total_questions_answered: Object.keys(answers).length,
        criteria_affected: Object.keys(rankings),
        has_personalization: Object.keys(personalizationData).length > 0,
        firmographics: personalizationData,
        time_to_complete_seconds: Math.round((Date.now() - (window as any)._guidedRankingStartTime) / 1000) || 0
      });
      
      // Store start time for next session
      (window as any)._guidedRankingStartTime = Date.now();
    } catch (posthogError) {
      console.warn('Failed to track PostHog full ranking event:', posthogError);
      // Don't fail the form submission for PostHog tracking issues
    }
    
    // Track in Supabase analytics
    try {
      analytics.trackGuidedRankingAnswer({
        questionId: 'complete',
        questionOrder: questions.length, // Final completion event
        questionText: 'Guided Ranking Complete',
        answer: rankings,
        affectsCriteria: 'all',
        isComplete: true
      });
    } catch (analyticsError) {
      console.warn('Failed to track Supabase analytics:', analyticsError);
    }
    
    // Reset form state
    resetFormState();
    
    // Close modal FIRST, then start animation after modal fully closes
    // On mobile, close immediately and trigger animation immediately (no animation)
    if (isTouchDevice) {
      // Mobile: Close immediately (no animation)
      onClose();
      // Trigger rankings immediately on mobile
      setTimeout(() => {
        onUpdateRankings(rankings);
      }, 100); // Small delay to ensure modal closes
    } else {
      // Desktop: Close modal first, then wait for modal animation to complete before starting gooey
      onClose();
      // Wait for modal exit animation (300ms) + buffer before starting gooey animation
      setTimeout(() => {
        onUpdateRankings(rankings);
      }, 400); // Modal exit is 300ms, add 100ms buffer
    }
    
    // Save answers and personalization data AFTER closing (don't delay for this)
    onSaveAnswers?.(answers, personalizationData);
    
    // Track guided ranking completion in Supabase (fire-and-forget)
    // Track each answer individually for granular analysis
    Object.entries(answers).forEach(([questionId, answer]) => {
      const questionIndex = questions.findIndex(q => q.id === questionId);
      const question = questionIndex >= 0 ? questions[questionIndex] : null;
      if (question) {
        analytics.trackGuidedRankingAnswer({
          questionId: questionId,
          questionOrder: questionIndex + 1, // 1-based order
          questionText: question.text,
          answer: answer,
          affectsCriteria: Object.keys(question.criteriaImpact).join(', '),
          isComplete: false // Individual answer
        });
      }
    });
    
    // Track final completion event with all data
    analytics.trackGuidedRankingAnswer({
      questionId: 'completion',
      questionOrder: questions.length, // Final completion event
      questionText: 'Guided Ranking Complete',
      answer: {
        all_answers: answers,
        personalization: personalizationData,
        rankings: rankings,
        questions_answered: Object.keys(answers).length
      },
      isComplete: true
    });
  };

  if (!isOpen) return null;

  const currentQuestion = relevantQuestions[currentStep];
  const progress = (currentStep + 1) / relevantQuestions.length * 100;

  // Animation variants
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

  const questionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70]"
          onClick={handleClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div 
            className="absolute inset-2 sm:inset-4 flex items-center justify-center pointer-events-none"
            style={{ paddingTop: 'max(80px, env(safe-area-inset-top, 80px))' }}
          >
            <motion.div 
              ref={formRef} 
              className={`bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col ${
                isTouchDevice 
                  ? 'h-[85vh] max-h-[42rem] sm:h-[80vh] sm:max-h-[48rem] md:h-[85vh] md:max-h-[55rem]' 
                  : 'h-[88vh] max-h-[50rem] sm:h-[85vh] sm:max-h-[60rem] md:h-[92vh] md:max-h-[70rem] lg:h-[90vh] lg:max-h-[70rem]'
              }`}
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                scrollBehavior: 'smooth'
              }}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              
            >
            {/* Header */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Guided Rankings</h3>
                  <p className="text-xs md:text-sm text-gray-500">Guided rankings use our research-backed framework to produce more accurate rankings and tool matches.</p>
                </div>
                <div className="text-xs md:text-sm text-gray-600 flex-shrink-0 text-center leading-tight">
                  <div>Question</div>
                  <div>{currentStep + 1} of {relevantQuestions.length}</div>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
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

            {/* Question Content - Scrollable Container */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
              <div className={`p-4 md:p-6 ${isTouchDevice ? 'pb-6' : ''}`}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
                <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={questionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className="h-full"
                >
                  <div>
                    <h4 className="text-base md:text-lg font-medium text-gray-900 mb-4 md:mb-8">
                      {currentQuestion.text}
                    </h4>
                    <div 
                      className="space-y-2 md:space-y-3"
                    >
                        {currentQuestion.options.map((option) => {
                          const isSelected = currentQuestion.isMultiSelect
                            ? (answers[currentQuestion.id] as number[])?.includes(option.value)
                            : answers[currentQuestion.id] === option.value;

                          // Split text into main text and helper text (in parentheses)
                          const match = option.text.match(/(.*?)(\s*\((.*)\))?$/);
                          const mainText = match?.[1]?.trim() || option.text;
                          const helperText = match?.[3] || '';

                          return (
                            <button
                              key={option.value}
                              onClick={() => handleAnswer(currentQuestion.id, option.value)}
                              className={`w-full text-left px-3 md:px-4 py-3 md:py-4 rounded-lg border transition-all duration-200 text-sm md:text-base ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900'
                              } ${isTouchDevice ? 'py-4 touch-manipulation' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm md:text-base">{mainText}</span>
                                  {helperText && (
                                    <span className="text-xs md:text-sm text-gray-500 mt-1">{helperText}</span>
                                  )}
                                </div>
                                <AnimatePresence>
                                  {isSelected && (
                                    <motion.div
                                      className="w-4 h-4 md:w-5 md:h-5 bg-blue-500 rounded-full flex items-center justify-center"
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
                                        className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1 }}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </button>
                          );
                        })}
                        
                        {/* Other text input for Q11 */}
                        {currentQuestion.id === 'q11' && (answers[currentQuestion.id] as number[])?.includes(9) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3"
                          >
                            <input
                              type="text"
                              placeholder="Please specify your department/function..."
                              value={otherAnswers[currentQuestion.id] || ''}
                              onChange={(e) => setOtherAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                              autoFocus
                            />
                          </motion.div>
                        )}
                      </div>
                  </div>
                </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer - Always visible */}
            <div 
              className={`px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50 flex justify-between flex-shrink-0 sticky bottom-0 ${isTouchDevice ? 'py-4' : ''}`}
              style={{
                paddingBottom: isTouchDevice ? 'max(16px, env(safe-area-inset-bottom, 16px))' : undefined
              }}
            >
              <button
                onClick={() => {
                  // Track navigation for New_Active metric
                  try {
                    checkAndTrackNewActive('Active-guided', {
                      component: 'guided_ranking_form',
                      interaction_type: 'navigation_previous',
                      from_question: currentStep + 1,
                      to_question: currentStep
                    });
                  } catch (error) {
                    console.warn('Failed to track guided ranking navigation:', error);
                  }

                  setCurrentStep(prev => Math.max(0, prev - 1));
                }}
                disabled={currentStep === 0}
                className={`modern-pill modern-pill--gray modern-pill--md ${isTouchDevice ? 'touch-manipulation' : ''}`}
              >
                <span className="modern-pill__lighting"></span>
                <span className="modern-pill__content">Previous</span>
              </button>
              <button
                onClick={() => {
                  if (currentStep < relevantQuestions.length - 1) {
                    // Track navigation for New_Active metric
                    try {
                      checkAndTrackNewActive('Active-guided', {
                        component: 'guided_ranking_form',
                        interaction_type: 'navigation_next',
                        from_question: currentStep + 1,
                        to_question: currentStep + 2
                      });
                    } catch (error) {
                      console.warn('Failed to track guided ranking navigation:', error);
                    }

                    setCurrentStep(prev => prev + 1);
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={!isQuestionAnswered(currentQuestion)}
                className={`modern-pill modern-pill--blue modern-pill--md ${isTouchDevice ? 'touch-manipulation' : ''}`}
              >
                <span className="modern-pill__lighting"></span>
                <span className="modern-pill__content">
                  {currentStep < relevantQuestions.length - 1 ? 'Next' : 'Apply Guided Rankings'}
                </span>
              </button>
            </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};