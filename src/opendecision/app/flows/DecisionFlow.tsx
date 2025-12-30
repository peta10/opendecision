'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { NavigationToggle } from '@/opendecision/shared/components/layout/NavigationToggle';
import { SplitView } from '@/opendecision/shared/components/layout/SplitView';
import { defaultCriteria } from '@/opendecision/data/criteria';
import { defaultTools } from '@/opendecision/data/tools';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { FilterCondition } from '@/opendecision/features/tools/components/FilterSystem';
import { filterTools } from '@/opendecision/shared/utils/filterTools';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/opendecision/shared/components/common/ErrorBoundary';
import { useUnifiedMobileDetection } from '@/opendecision/shared/hooks/useUnifiedMobileDetection';
import { useLenis } from '@/opendecision/shared/hooks/useLenis';
import { CriteriaSection } from '@/opendecision/features/criteria/components/CriteriaSection';
import { ToolSection } from '@/opendecision/features/tools/components/ToolSection';
import { cn } from '@/opendecision/shared/lib/utils';
import { ActionButtons } from '@/opendecision/shared/components/layout/ActionButtons';
import { MobileOptimizedLoader } from '@/components/MobileOptimizedLoader';
import { useGuidance } from '@/opendecision/shared/contexts/GuidanceContext';
import { hasCompletedAnyGuidedRanking } from '@/opendecision/shared/utils/guidedRankingState';
import { MobileRecoverySystem } from '@/opendecision/shared/components/common/MobileRecoverySystem';
import { useGuidedSubmitAnimation } from '@/opendecision/shared/hooks/useGuidedSubmitAnimation';
import { buildAIContext } from '@/opendecision/shared/utils/aiContextBuilder';
import {
  loadSavedCriteriaValues,
  saveCriteriaValues,
  mergeCriteriaWithSaved,
  clearSavedCriteriaValues
} from '@/opendecision/shared/utils/criteriaStorage';
import { useDecisionSpaceSync } from '@/opendecision/shared/hooks/useDecisionSpaceSync';
import { useDecisionSpaceProducts } from '@/opendecision/shared/hooks/useDecisionSpaceProducts';
import { useTools } from '@/opendecision/shared/hooks/useTools';
import { resetGuidedRankingCompletion, markGuidedRankingAsCompleted, getGuidedRankingCriteriaIds } from '@/opendecision/shared/utils/guidedRankingState';
import { hasCriteriaBeenAdjusted } from '@/opendecision/shared/utils/criteriaAdjustmentState';
import { checkAndTrackNewActive } from '@/lib/posthog';
import { analytics } from '@/lib/analytics';
import { SaveButton } from '@/opendecision/shared/components/auth';
import { AppHeaderV2 } from '@/opendecision/shared/components/layout/AppHeaderV2';
import { ScoutFABV2 } from '@/opendecision/shared/components/scout/ScoutFABV2';
import { SetupViewV2 } from '@/opendecision/features/setup/components/SetupViewV2';
import { AIChatProvider } from '@/opendecision/shared/contexts/AIChatContext';
import { useCurrentSpace } from '@/opendecision/shared/contexts/SpaceContext';
import { DecisionHubLayout } from '@/opendecision/features/decision-hub/components/DecisionHubLayout';
import { DecisionHubV2 } from '@/opendecision/features/decision-hub/components/DecisionHubV2';
import { StateTransition } from '@/opendecision/features/decision-hub/types/decisionState';

// Dynamic imports for heavy components (reduces initial bundle)
const AIChatPanel = dynamic(
  () => import('@/opendecision/features/ai-chat/components/AIChatPanel').then(mod => ({ default: mod.AIChatPanel })),
  { ssr: false, loading: () => <div className="w-16 h-full bg-white/50 animate-pulse" /> }
);

const ScoutOverlay = dynamic(
  () => import('@/opendecision/features/ai-chat/components/ScoutOverlayV2').then(mod => ({ default: mod.ScoutOverlayV2 })),
  { ssr: false }
);

const ComparisonChart = dynamic(
  () => import('@/opendecision/features/comparison/components/ComparisonChart').then(mod => ({ default: mod.ComparisonChart })),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-white/50 animate-pulse rounded-xl" /> }
);

const GuidedRankingForm = dynamic(
  () => import('@/opendecision/features/ranking/components/GuidedRankingForm').then(mod => ({ default: mod.GuidedRankingForm })),
  { ssr: false }
);

const GuidedSubmitAnimation = dynamic(
  () => import('@/opendecision/features/ranking/components/GuidedSubmitAnimation').then(mod => ({ default: mod.GuidedSubmitAnimation })),
  { ssr: false }
);

// DecisionHub is now imported as DecisionHubLayout above (state machine integrated)

interface EmbeddedPPMToolFlowProps {
  showGuidedRanking?: boolean;
  guidedRankingCriterionId?: string;
  onGuidedRankingComplete?: () => void;
  onOpenGuidedRanking?: (criterionId?: string) => void;
  onShowHowItWorks?: () => void;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
  initialView?: string;
  initialMessage?: string | null;
}

interface GuidedRankingAnswer {
  value: number | number[] | string;
  timestamp: string;
}

interface PersonalizationData {
  userCount?: number;
  departments?: string[];
  methodologies?: string[];
  timestamp: string;
}

export const EmbeddedPPMToolFlow: React.FC<EmbeddedPPMToolFlowProps> = ({
  showGuidedRanking = false,
  guidedRankingCriterionId,
  onGuidedRankingComplete: onGuidedRankingCompleteFromParent,
  onOpenGuidedRanking,
  onShowHowItWorks,
  guidedButtonRef,
  initialView
}) => {
  // Unified device detection - correctly identifies true mobile devices vs touchscreen laptops
  const { isMobile, isTouchDevice, hasTouch } = useUnifiedMobileDetection();

  // Decision Space state machine integration
  const { space, setDecisionState } = useCurrentSpace();
  
  // Track hydration to prevent SSR/client mismatches
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Disable Lenis smooth scroll on mobile to prevent tooltip interference
  useLenis({
    disabled: isMobile, // Completely disable Lenis on mobile devices
    isMobile: isMobile
  });
  
  const {
    onGuidedRankingStart,
    onGuidedRankingComplete,
    onGuidedRankingClick,
    onComparisonReportClick,
    onComparisonReportOpen,
    onComparisonReportClose
  } = useGuidance();
  // Set initial step - wait for hydration to determine correct starting page
  const [currentStep, setCurrentStep] = useState<string>('');
  
  // Set correct initial step after hydration based on device detection or initialView prop
  useEffect(() => {
    if (isHydrated && !currentStep) {
      // If initialView is provided (e.g., 'chart' from URL), use that
      if (initialView) {
        setCurrentStep(initialView);
      } else {
        // Otherwise use device-based default
        setCurrentStep(isMobile ? 'tools' : 'criteria-tools');
      }
    }
  }, [isHydrated, isMobile, currentStep, initialView]);
  
  // Update current step when initialView changes (for URL navigation)
  useEffect(() => {
    if (isHydrated && currentStep) {
      if (initialView) {
        // URL specifies a view, navigate to it
        setCurrentStep(initialView);
      } else if (currentStep === 'chart') {
        // URL doesn't specify view and we're on chart, go back to default
        setCurrentStep(isMobile ? 'tools' : 'criteria-tools');
      }
    }
  }, [initialView, isHydrated, isMobile, currentStep]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedTools, setSelectedTools] = useState<Tool[]>(defaultTools);
  const [removedCriteria, setRemovedCriteria] = useState<Criterion[]>([]);
  const [removedTools, setRemovedTools] = useState<Tool[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('AND');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch tools from Supabase with automatic fallback to defaults
  const { tools: fetchedTools, isLoading: isLoadingTools, error: toolsError, isUsingFallback } = useTools();
  const [comparedTools, setComparedTools] = useState<Set<string>>(new Set());
  const [chartButtonPosition, setChartButtonPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Get Report button ref
  const getReportButtonRef = useRef<HTMLButtonElement>(null);

  // Add state for guided ranking answers and personalization data
  const [guidedRankingAnswers, setGuidedRankingAnswers] = useState<Record<string, GuidedRankingAnswer>>({});
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData>({
    timestamp: new Date().toISOString()
  });

  // Animation state for guided submit
  const guidedAnimation = useGuidedSubmitAnimation();
  const [pendingRankings, setPendingRankings] = useState<{ [key: string]: number } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Scout Overlay state
  const [isScoutOverlayOpen, setIsScoutOverlayOpen] = useState(false);

  // Decision Space sync - persists state to Supabase
  const {
    syncCriteria,
    syncSelectedTools,
    syncGuidedData,
    spaceId,
    hasLoaded: hasSpaceLoaded,
  } = useDecisionSpaceSync({
    onSpaceLoaded: (state) => {
      console.log('📥 Space data loaded, hydrating local state:', state);
      // Hydrate criteria from space (if available)
      if (state.criteria?.length > 0) {
        setCriteria(prev => prev.map(c => {
          const saved = state.criteria.find(s => s.id === c.id);
          return saved ? { ...c, userRating: saved.rating } : c;
        }));
      }
      // Hydrate guided ranking answers (if available)
      if (state.guidedRankingAnswers) {
        setGuidedRankingAnswers(state.guidedRankingAnswers);
      }
      // Hydrate personalization from context (if available)
      if (state.context) {
        setPersonalizationData(prev => ({
          ...prev,
          methodologies: state.context?.methodology ? [state.context.methodology] : prev.methodologies,
          userCount: state.context?.userCount ?? prev.userCount,
        }));
      }
    },
    onSaved: () => console.log('✅ Decision Space synced'),
    onSaveError: (error) => console.error('❌ Decision Space sync failed:', error),
  });

  // Decision Space Products - manages products in the decision hub via junction table
  const {
    products: decisionSpaceProducts,
    isLoading: isProductsLoading,
    addProduct: addProductToSpace,
    removeProduct: removeProductFromSpace,
    isProductAdded: isProductInSpace,
    productIds: decisionSpaceProductIds,
    counts: productCounts,
  } = useDecisionSpaceProducts(spaceId);

  // AI Panel state (inline panel on left edge, not overlay)
  const [isAIPanelExpanded, setIsAIPanelExpanded] = useState(false);

  // Control tool shuffle during guided animation sequence
  const [disableAutoShuffle, setDisableAutoShuffle] = useState(false);
  const manualShuffleRef = useRef<(() => void) | null>(null);
  
  // NEW: Flag to prevent ANY shuffling during animation preparation (prevents race conditions)
  const [isPreparingAnimation, setIsPreparingAnimation] = useState(false);
  
  // Imperative shuffle control (immediate, synchronous)
  const shuffleControlRef = useRef<{ disable: () => void; enable: () => void } | null>(null);

  // Flag to keep tools in alphabetical order during guided animation sequence
  const [isAnimatingGuidedRankings, setIsAnimatingGuidedRankings] = useState(false);

  // Dynamic shuffle duration - 3s for guided animations, 1s for normal interactions
  const [shuffleDurationMs, setShuffleDurationMs] = useState(1000);

  // Track if email modal has been shown this session (survives page refresh)
  const hasShownEmailModalRef = useRef<boolean>(false);
  
  // Track if email modal has EVER been shown (permanent, survives any guided ranking completion)
  const hasShownEmailModalEverRef = useRef<boolean>(false);

  // Track if this is the initial mount to prevent saving default values
  const isInitialMountRef = useRef(true);
  
  // Track the debounce timer for slider-based email modal check
  const emailModalCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced localStorage handling for guided ranking answers and personalization
  useEffect(() => {
    try {
      // Check if localStorage is available and working
      if (typeof window === 'undefined' || typeof Storage === 'undefined') {
        console.warn('localStorage not available');
        return;
      }
      
      // Test localStorage functionality
      try {
        const testKey = '__ppm_tool_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (storageError) {
        console.warn('localStorage not working properly:', storageError);
        return;
      }
      
      const savedAnswers = localStorage.getItem('guidedRankingAnswers');
      const savedPersonalization = localStorage.getItem('personalizationData');
      
      if (savedAnswers) {
        try {
          const parsedAnswers = JSON.parse(savedAnswers);
          setGuidedRankingAnswers(parsedAnswers);
        } catch (parseError) {
          console.warn('Error parsing saved answers, clearing:', parseError);
          localStorage.removeItem('guidedRankingAnswers');
        }
      }
      
      if (savedPersonalization) {
        try {
          const parsedPersonalization = JSON.parse(savedPersonalization);
          setPersonalizationData(parsedPersonalization);
        } catch (parseError) {
          console.warn('Error parsing saved personalization, clearing:', parseError);
          localStorage.removeItem('personalizationData');
        }
      }
    } catch (error) {
      console.error('Error loading saved guided ranking data:', error);
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('guidedRankingAnswers');
        localStorage.removeItem('personalizationData');
      } catch (clearError) {
        console.error('Error clearing corrupted data:', clearError);
      }
    }
  }, []);

  // Debounced save for criteria values - only saves after changes settle
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      return;
    }

    // Debounce: wait 1 second after last change before saving
    const saveTimer = setTimeout(() => {
      saveCriteriaValues(criteria);
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [criteria]);

  // Initialize email modal shown state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const hasShown = sessionStorage.getItem('ppm-email-modal-shown') === 'true';
        hasShownEmailModalRef.current = hasShown;
        hasShownEmailModalEverRef.current = hasShown; // Also set permanent flag
        console.log('📧 Email modal shown this session:', hasShown);
      } catch (error) {
        console.warn('Error reading from sessionStorage:', error);
      }
    }
  }, []);

  // Note: sessionStorage is updated directly in handleUpdateRankings when we set hasShownEmailModalRef.current = true
  // No separate useEffect needed since ref mutations don't trigger re-renders

  // Convert saved answers from storage format (with timestamps) to form format (just values)
  const convertSavedAnswersToFormFormat = (
    savedAnswers: Record<string, GuidedRankingAnswer>
  ): Record<string, number | number[] | string> => {
    const formattedAnswers: Record<string, number | number[] | string> = {};
    Object.entries(savedAnswers).forEach(([key, answer]) => {
      formattedAnswers[key] = answer.value;
    });
    return formattedAnswers;
  };

  // Save answers and personalization data to localStorage
  const handleSaveAnswers = (
    answers: Record<string, number | number[] | string>,
    personalization: Record<string, number | number[] | string>
  ) => {
    try {
      // Format guided ranking answers with timestamps
      const formattedAnswers: Record<string, GuidedRankingAnswer> = {};
      Object.entries(answers).forEach(([key, value]) => {
        formattedAnswers[key] = {
          value,
          timestamp: new Date().toISOString()
        };
      });

      // Format personalization data
      const formattedPersonalization: PersonalizationData = {
        userCount: personalization.q10 as number,
        departments: Array.isArray(personalization.q11) ? personalization.q11.map(String) : [],
        methodologies: Array.isArray(personalization.q12) ? personalization.q12.map(String) : [],
        timestamp: new Date().toISOString()
      };

      // Update state
      setGuidedRankingAnswers(formattedAnswers);
      setPersonalizationData(formattedPersonalization);

      // Save to localStorage
      localStorage.setItem('guidedRankingAnswers', JSON.stringify(formattedAnswers));
      localStorage.setItem('personalizationData', JSON.stringify(formattedPersonalization));

      // Sync to Decision Space (debounced)
      syncGuidedData(formattedAnswers, formattedPersonalization);

      // Log the data for analytics (you can integrate with your analytics system here)
      console.log('💾 Saved Guided Ranking Answers:', Object.keys(formattedAnswers).length, 'questions');
      console.log('💾 Saved Personalization Data:', formattedPersonalization);
    } catch (error) {
      console.error('Error saving guided ranking data:', error);
    }
  };

  // Update currentStep when mobile state changes with error handling
  useEffect(() => {
    try {
      if (isMobile && currentStep === 'criteria-tools') {
        setCurrentStep('criteria');
      } else if (!isMobile && ['criteria', 'tools'].includes(currentStep)) {
        setCurrentStep('criteria-tools');
      }
    } catch (error) {
      console.warn('Error updating step based on mobile state:', error);
      // Keep current step if there's an error
    }
  }, [isMobile, currentStep]);

  // Enhanced criteria fetching with mobile-friendly error handling
  // Combined fetch + load to eliminate race condition
  useEffect(() => {
    const fetchAndLoadCriteria = async () => {
      try {
        let fetchedCriteria: Criterion[];

        // Step 1: Fetch criteria from database or use defaults
        if (!supabase) {
          console.warn('Supabase not available, using default criteria');
          fetchedCriteria = defaultCriteria.map(item => ({
            ...item,
            description: item.tooltipDescription || 'No description available'
          }));
        } else {
          try {
            const { data, error } = await supabase
              .from('criteria')
              .select('*');

            if (error) {
              throw error;
            }

            if (data && Array.isArray(data) && data.length > 0) {
              console.log('✅ Fetched criteria from database:', data);
              
              // Transform database criteria to match Criterion type
              const transformedCriteria: Criterion[] = data.map((item: any) => {
                const defaultCriterion = defaultCriteria.find(dc => dc.name === item.name);
                return {
                  id: item.id,
                  name: item.name,
                  description: defaultCriterion?.tooltipDescription || 'No description available',
                  tooltipDescription: defaultCriterion?.tooltipDescription,
                  userRating: 3, // Default rating (will be overridden by saved values)
                  ratingDescriptions: defaultCriterion?.ratingDescriptions || {
                    low: 'Basic functionality',
                    high: 'Advanced features'
                  }
                };
              });
              
              // Sort criteria in desired order
              const desiredOrder = [
                'Scalability',
                'Integrations & Extensibility', 
                'Ease of Use',
                'Flexibility & Customization',
                'Portfolio Management',
                'Reporting & Analytics',
                'Security & Compliance'
              ];
              
              fetchedCriteria = desiredOrder
                .map(name => transformedCriteria.find(criterion => criterion.name === name))
                .filter(Boolean) as Criterion[];
              
              if (fetchedCriteria.length === 0) {
                throw new Error('No valid criteria found in database');
              }
            } else {
              throw new Error('No criteria data received from database');
            }
          } catch (dbError) {
            console.error('Error fetching from database, using defaults:', dbError);
            setFetchError(null);
            
            // Fallback to defaults
            fetchedCriteria = defaultCriteria.map(item => ({
              ...item,
              description: item.tooltipDescription || 'No description available'
            }));
          }
        }

        // Step 2: Load saved criteria values from localStorage
        const savedValues = loadSavedCriteriaValues();

        // Step 3: Merge fetched criteria with saved values
        const mergedCriteria = mergeCriteriaWithSaved(fetchedCriteria, savedValues);

        // Step 4: Set criteria state ONCE with merged data
        console.log('✅ Setting criteria with merged values:', mergedCriteria.length, 'items');
        setCriteria(mergedCriteria);

        // Step 5: Mark initial mount as complete AFTER criteria are set
        // This prevents the save effect from triggering on initial load
        setTimeout(() => {
          isInitialMountRef.current = false;
          console.log('✅ Initial mount complete - criteria saves now enabled');
        }, 500);

      } catch (err) {
        console.error('Critical error loading criteria:', err);
        setFetchError('Unable to load tool criteria. Please refresh the page.');
      }
    };

    // Delay execution slightly to allow mobile browsers to settle
    const timeoutId = setTimeout(fetchAndLoadCriteria, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Sync fetched tools to selectedTools state (from useTools hook)
  useEffect(() => {
    if (!isLoadingTools && fetchedTools.length > 0) {
      console.log('✅ Tools loaded:', fetchedTools.length, 'items', isUsingFallback ? '(fallback)' : '(database)');
      setSelectedTools(fetchedTools);
      setFetchError(toolsError);
    }
  }, [fetchedTools, isLoadingTools, isUsingFallback, toolsError]);

  // Track guided ranking state for coordination
  useEffect(() => {
    if (showGuidedRanking) {
      onGuidedRankingStart();
    }
  }, [showGuidedRanking, onGuidedRankingStart]);

  const filteredTools = filterTools(selectedTools, filterConditions, filterMode);

  // Derive full Tool objects for Decision Hub from junction table products
  // This hydrates the minimal product data with full tool ratings/criteria
  const decisionHubTools = useMemo(() => {
    if (decisionSpaceProductIds.size === 0) return [];

    // Map product IDs to full Tool objects from filteredTools
    return filteredTools.filter(tool => decisionSpaceProductIds.has(tool.id));
  }, [filteredTools, decisionSpaceProductIds]);
  
  // Check if criteria have been adjusted from defaults (isolated from bumper logic)
  // NO LONGER force to false during animation - this allows tools to stay in their current sort order
  // during Phase 1 (whether that's alphabetical for first-time users or score-based for returning users)
  // This prevents the unwanted "snap back to alphabetical" shuffle when re-ranking
  const criteriaAdjusted = hasCriteriaBeenAdjusted(criteria);

  // Build AI context from current state (memoized for performance)
  const aiContext = useMemo(() => {
    if (filteredTools.length === 0 || criteria.length === 0) {
      return undefined;
    }
    return buildAIContext({
      selectedTools: filteredTools,
      selectedCriteria: criteria,
      personalizationData,
      guidedRankingAnswers
    });
  }, [filteredTools, criteria, personalizationData, guidedRankingAnswers]);

  // Check if any product has a high match score (>85%) - triggers Scout eye pulse
  const hasHighMatchScore = useMemo(() => {
    // Calculate match score for a tool (same logic as ProductsPanel)
    const calculateMatchScore = (tool: Tool): number => {
      const ratings = tool.ratings;
      if (!ratings) return 50;
      const ratingValues = Object.values(ratings).filter(
        (v): v is number => typeof v === 'number'
      );
      if (ratingValues.length === 0) return 50;
      const avg = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
      return Math.round((avg / 5) * 100);
    };

    return filteredTools.some((tool) => calculateMatchScore(tool) > 85);
  }, [filteredTools]);

  // AI Panel handlers
  const handleToggleAIPanel = useCallback(() => {
    // Block toggle during animations to prevent layout conflicts
    if (isAnimatingGuidedRankings || isPreparingAnimation) {
      console.log('🚫 AI Panel toggle blocked - animation in progress');
      return;
    }
    setIsAIPanelExpanded(prev => !prev);
  }, [isAnimatingGuidedRankings, isPreparingAnimation]);

  // Compute if AI panel toggle should be blocked
  const isAIPanelAnimationBlocked = isAnimatingGuidedRankings || isPreparingAnimation;

  // Handle criteria updates from AI chat (e.g., "security is more important")
  const handleAICriteriaUpdate = useCallback((updates: Record<string, number>) => {
    console.log('🤖 Applying AI-triggered criteria updates:', updates);
    setCriteria(prevCriteria => {
      const newCriteria = prevCriteria.map(c => {
        // Match by criterion ID or name (AI might return either)
        const updateValue = updates[c.id] ?? updates[c.name.toLowerCase()];
        if (updateValue !== undefined) {
          console.log(`  → ${c.name}: ${c.userRating} → ${updateValue}`);
          return { ...c, userRating: Math.max(1, Math.min(5, updateValue)) };
        }
        return c;
      });
      // Sync to Decision Space
      syncCriteria(newCriteria);
      return newCriteria;
    });
  }, [syncCriteria]);

  // Debug log for animation state (only when animation flag changes)
  useEffect(() => {
    if (isAnimatingGuidedRankings || isPreparingAnimation) {
      console.log(`🎬 Animation active (preparing=${isPreparingAnimation}, animating=${isAnimatingGuidedRankings}) → tools stay in current order (criteriaAdjusted=${criteriaAdjusted})`);
    } else {
      console.log(`✨ Animation inactive → criteriaAdjusted=${criteriaAdjusted} (normal state)`);
    }
  }, [isAnimatingGuidedRankings, isPreparingAnimation, criteriaAdjusted]);

  // Handlers for criteria
  const handleCriteriaChange = (newCriteria: Criterion[]) => {
    setCriteria(newCriteria);

    // Sync to Decision Space (debounced)
    syncCriteria(newCriteria);

    // Clear any existing timer
    if (emailModalCheckTimerRef.current) {
      clearTimeout(emailModalCheckTimerRef.current);
    }

    // Debounce: Wait 500ms after last slider change to check for email modal trigger
    emailModalCheckTimerRef.current = setTimeout(() => {
      checkAndShowEmailModal(newCriteria);
    }, 500);
  };

  // Handler for full criteria reset (including guided answers)
  const handleFullCriteriaReset = () => {
    // 1. Reset criteria to default values
    const resetCriteria = defaultCriteria.map(dc => ({
      ...dc,
      userRating: 3 // Reset to default middle value
    }));
    setCriteria(resetCriteria);

    // 2. Clear guided ranking answers from state
    setGuidedRankingAnswers({});

    // 3. Clear personalization data from state (reset to default with just timestamp)
    const resetPersonalization: PersonalizationData = {
      timestamp: new Date().toISOString()
    };
    setPersonalizationData(resetPersonalization);

    // 4. Sync reset state to Decision Space
    syncCriteria(resetCriteria);
    syncGuidedData({}, resetPersonalization);

    // 5. Clear guided ranking completion flag (this hides match scores)
    resetGuidedRankingCompletion();

    // 6. Clear saved criteria values
    clearSavedCriteriaValues();

    // 7. Clear from localStorage
    try {
      localStorage.removeItem('guidedRankingAnswers');
      localStorage.removeItem('personalizationData');
      console.log('✅ Full criteria reset: cleared guided answers, personalization data, and match score visibility');
    } catch (error) {
      console.error('Error clearing localStorage during reset:', error);
    }

    // 8. Track analytics
    try {
      checkAndTrackNewActive('Active-reset-criteria-full', {
        component: 'embedded_ppm_tool_flow',
        interaction_type: 'full_criteria_reset',
        had_guided_answers: Object.keys(guidedRankingAnswers).length > 0,
        had_personalization: !!(personalizationData?.userCount || personalizationData?.departments?.length || personalizationData?.methodologies?.length)
      });
    } catch (error) {
      console.warn('Failed to track full criteria reset:', error);
    }
  };

  // Handlers for tools
  const handleToolSelect = (tool: Tool) => {
    const newTools = [...selectedTools, tool];
    setSelectedTools(newTools);
    // Sync tool IDs to Decision Space
    syncSelectedTools(newTools.map(t => t.id));
  };

  const handleRestoreAllTools = () => {
    const newTools = [...selectedTools, ...removedTools];
    setSelectedTools(newTools);
    setRemovedTools([]);
    // Sync tool IDs to Decision Space
    syncSelectedTools(newTools.map(t => t.id));
    // Also clear all filter conditions and reset filter mode
    setFilterConditions([]);
    setFilterMode('AND');
    emitFilterAction({
      actionType: 'clear_all',
      filterModeOverride: 'AND',
      context: { reason: 'restore_all_tools', filter_count: 0, previous_mode: filterMode },
    });
  };

  const handleToolRemove = (toolId: string) => {
    const toolToRemove = selectedTools.find((t) => t.id === toolId);
    if (toolToRemove) {
      const newTools = selectedTools.filter((t) => t.id !== toolId);
      setSelectedTools(newTools);
      setRemovedTools([...removedTools, toolToRemove]);
      // Sync tool IDs to Decision Space
      syncSelectedTools(newTools.map(t => t.id));
    }
  };

  const emitFilterAction = React.useCallback(
    (options: {
      actionType: 'add' | 'update' | 'remove' | 'toggle_mode' | 'clear_all' | 'guided_sync';
      filterType?: string;
      filterValue?: string;
      operator?: string;
      rating?: number;
      filterModeOverride?: string;
      context?: Record<string, any>;
    }) => {
      const baseContext = {
        source_component: 'embedded_ppm_tool_flow',
        filter_count: options.context?.filter_count ?? filterConditions.length,
        ...options.context,
      };

      void analytics.trackFilterAction({
        actionType: options.actionType,
        filterType: options.filterType,
        filterValue: options.filterValue,
        operator: options.operator,
        rating: options.rating,
        filterMode: options.filterModeOverride ?? filterMode,
        context: baseContext,
      });
    },
    [filterConditions.length, filterMode]
  );

  // Handlers for filters
  const handleAddFilterCondition = () => {
    const newCondition: FilterCondition = { id: Date.now().toString(), type: 'Methodology', value: '' };
    setFilterConditions([
      ...filterConditions,
      newCondition,
    ]);
    emitFilterAction({
      actionType: 'add',
      filterType: newCondition.type,
      filterValue: newCondition.value,
      context: { filter_count: filterConditions.length + 1, reason: 'manual_add' },
    });
  };

  const handleRemoveFilterCondition = (id: string) => {
    const condition = filterConditions.find((c) => c.id === id);
    setFilterConditions(filterConditions.filter((c) => c.id !== id));
    if (condition) {
      emitFilterAction({
        actionType: 'remove',
        filterType: condition.type,
        filterValue: condition.value,
        operator: condition.operator,
        rating: condition.rating,
        context: { filter_count: Math.max(0, filterConditions.length - 1), removed_id: id },
      });
    }
  };

  const handleUpdateFilterCondition = (
    id: string,
    updates: Partial<FilterCondition>
  ) => {
    const existingCondition = filterConditions.find((c) => c.id === id);
    const updatedCondition = existingCondition ? { ...existingCondition, ...updates } : undefined;
    setFilterConditions(
      filterConditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    if (updatedCondition) {
      emitFilterAction({
        actionType: 'update',
        filterType: updatedCondition.type,
        filterValue: updatedCondition.value,
        operator: updatedCondition.operator,
        rating: updatedCondition.rating,
        context: { updated_id: id },
      });
    }
  };

  // Handler for guided ranking methodology filtering
  const handleMethodologyFilter = React.useCallback((methodologies: string[]) => {
    setFilterConditions(prevFilterConditions => {
      // Clear existing methodology filters
      const nonMethodologyFilters = prevFilterConditions.filter(c => c.type !== 'Methodology');
      
      if (methodologies.length === 0) {
        // No methodologies selected or "Not Sure" - show all tools
        const result = nonMethodologyFilters;
        emitFilterAction({
          actionType: 'guided_sync',
          filterType: 'Methodology',
          filterValue: '',
          filterModeOverride: filterMode,
          context: { filter_count: result.length, source: 'guided_methodology_clear', previous_mode: filterMode },
        });
        return result;
      } else {
        // Create methodology filter conditions for each selected methodology
        const methodologyFilters: FilterCondition[] = methodologies.map((methodology, index) => ({
          id: `guided-methodology-${index}`,
          type: 'Methodology' as const,
          value: methodology,
          operator: undefined,
          rating: undefined
        }));
        
        // Set filter mode to OR when multiple methodologies are selected
        if (methodologies.length > 1) {
          setFilterMode('OR');
          emitFilterAction({
            actionType: 'toggle_mode',
            filterModeOverride: 'OR',
            context: { filter_count: nonMethodologyFilters.length + methodologyFilters.length, reason: 'guided_methodology_multiple', previous_mode: filterMode },
          });
        }
        
        // Apply the new methodology filters
        const result = [...nonMethodologyFilters, ...methodologyFilters];
        emitFilterAction({
          actionType: 'guided_sync',
          filterType: 'Methodology',
          filterValue: methodologies.join(','),
          filterModeOverride: methodologies.length > 1 ? 'OR' : filterMode,
          context: { filter_count: result.length, source: 'guided_methodology_apply', previous_mode: filterMode },
        });
        return result;
      }
    });
  }, [emitFilterAction, filterMode]);

  const handleToggleFilterMode = () => {
    const nextMode = filterMode === 'AND' ? 'OR' : 'AND';
    setFilterMode(nextMode);
    emitFilterAction({
      actionType: 'toggle_mode',
      filterModeOverride: nextMode,
      context: { filter_count: filterConditions.length, reason: 'manual_toggle', previous_mode: filterMode },
    });
  };

  // Update criteria rankings from guided form
  // Helper function to check and show email modal based on criteria adjustments
  const checkAndShowEmailModal = async (criteriaToCheck: Criterion[]) => {
    // Check if we should show the email modal (works for ANY 3+ adjusted criteria)
    // Count criteria that are either:
    // 1. Adjusted from default (userRating !== 3), OR
    // 2. Completed via guided ranking (even if result is 3)
    const nonDefaultCount = criteriaToCheck.filter(c => c.userRating !== 3).length;
    const guidedRankingCriteriaIds = getGuidedRankingCriteriaIds();
    
    // Count criteria that were ranked via guided ranking (even if value is 3)
    const guidedRankingCount = criteriaToCheck.filter(c => 
      guidedRankingCriteriaIds.includes(c.id)
    ).length;
    
    // Total adjusted count = non-default values + guided ranking completions (avoid double counting)
    // If a criterion was ranked via guided ranking AND has non-default value, it's already counted in nonDefaultCount
    // So we only need to add guided ranking criteria that still have value 3
    const guidedRankingAtDefaultCount = criteriaToCheck.filter(c => 
      guidedRankingCriteriaIds.includes(c.id) && c.userRating === 3
    ).length;
    
    const adjustedCount = nonDefaultCount + guidedRankingAtDefaultCount;
    
    // Detailed logging for debugging
    console.log(`📊 Email Modal Check:`, {
      totalCriteria: criteriaToCheck.length,
      nonDefaultCount,
      guidedRankingCount,
      guidedRankingAtDefaultCount,
      adjustedCount,
      requiredCount: 3,
      hasShownThisSession: hasShownEmailModalRef.current,
      hasShownEver: hasShownEmailModalEverRef.current,
      sessionStorageValue: typeof window !== 'undefined' && window.sessionStorage 
        ? sessionStorage.getItem('ppm-email-modal-shown') 
        : 'N/A',
      criteriaBreakdown: criteriaToCheck.map(c => ({
        id: c.id,
        name: c.name,
        rating: c.userRating,
        isNonDefault: c.userRating !== 3,
        wasGuidedRanked: guidedRankingCriteriaIds.includes(c.id),
        counted: (c.userRating !== 3) || (guidedRankingCriteriaIds.includes(c.id) && c.userRating === 3)
      }))
    });
    
    const shouldShowModal = 
      !hasShownEmailModalRef.current && // Haven't shown this session
      !hasShownEmailModalEverRef.current && // Haven't shown ever (permanent check)
      adjustedCount >= 3; // 3+ criteria adjusted from default (ANY method: sliders, guided, individual)
    
    console.log(`📊 Email Modal Decision: ${shouldShowModal ? '✅ SHOW' : '❌ BLOCK'} - Adjusted: ${adjustedCount}/3`);
    
    if (shouldShowModal) {
      // Mark as shown for this session AND permanently
      hasShownEmailModalRef.current = true;
      hasShownEmailModalEverRef.current = true;
      
      // Persist to sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          sessionStorage.setItem('ppm-email-modal-shown', 'true');
          console.log('📧 Marked email modal as shown in sessionStorage (permanent)');
        } catch (error) {
          console.warn('Error writing to sessionStorage:', error);
        }
      }
      
      // Check if user is on main state (criteria-tools view)
      const isOnMainState = currentStep === 'criteria-tools';
      
      if (isOnMainState) {
        // On main state: Wait 2 seconds before showing email modal
        console.log('⏸️ On main state - pausing 2 seconds before opening email modal');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📧 Opening email modal now (main state)');
        
        // Track click BEFORE opening modal (important for Exit Intent Bumper eligibility)
        onComparisonReportClick();
        
        // Open the modal
        setShowEmailModal(true);
        
        // Record that modal opened (sets overlay state)
        onComparisonReportOpen();
      } else {
        // On other state: Show modal when user returns to main state (2 second delay)
        console.log('📍 Not on main state - will show email modal when user returns');
        
        // Wait for user to return to main state
        const checkInterval = setInterval(() => {
          if (currentStep === 'criteria-tools') {
            clearInterval(checkInterval);
            console.log('✅ User returned to main state');
            
            // Wait 2 seconds then show modal
            setTimeout(() => {
              console.log('📧 Opening email modal now (returned to main state)');
              
              // Track click BEFORE opening modal
              onComparisonReportClick();
              
              // Open the modal
              setShowEmailModal(true);
              
              // Record that modal opened
              onComparisonReportOpen();
            }, 2000);
          }
        }, 500); // Check every 500ms
        
        // Safety timeout: Stop checking after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('⏰ Email modal check timeout - user did not return to main state');
        }, 30000);
      }
    } else {
      console.log('⏭️ Skipping email modal - already shown or not enough criteria adjusted');
    }
  };

  const handleUpdateRankings = async (rankings: { [key: string]: number }) => {
    // Desktop: Run animation sequence
    if (!isMobile) {
      console.log('🎬 Starting guided submit animation on desktop');
      
      // ============================================================================
      // PHASE 0: LOCK DOWN - Prevent ANY shuffling before animation starts
      // ============================================================================
      // Set ALL freeze flags synchronously to prevent race conditions
      // This creates a multi-layer defense against premature shuffling
      
      // Layer 1: Immediate preparation flag (blocks criteriaAdjusted calculation)
      setIsPreparingAnimation(true);
      console.log('🔒 Pre-animation flag SET - blocking all shuffle triggers');
      
      // Layer 2: Animation flag (primary control)
      setIsAnimatingGuidedRankings(true);
      console.log('📋 Animation flag SET - tools will stay alphabetical');
      
      // Layer 3: Imperative shuffle control (synchronous backup)
      if (shuffleControlRef.current) {
        shuffleControlRef.current.disable();
        console.log('🚫 Imperative shuffle control: DISABLED (immediate)');
      }
      
      // Layer 4: State-based disable (React-based backup)
      setDisableAutoShuffle(true);
      console.log('🚫 State-based auto-shuffle disabled for animation sequence');
      
      // Set shuffle duration to 3 seconds for elegant simultaneous animation
      setShuffleDurationMs(3000);
      console.log('⏱️ Shuffle duration set to 3 seconds for guided animation');
      
      // CRITICAL: Wait for React to process ALL state updates before continuing
      // This ensures sortedTools recalculates with ALL freeze flags active
      await new Promise(resolve => setTimeout(resolve, 0));
      console.log('✅ All freeze flags processed - ready for animation');
      
      // ============================================================================
      // PHASE 1: WAVE ANIMATION - GooeyLoader plays alone
      // ============================================================================
      // Start wave animation (non-blocking, runs in background)
      guidedAnimation.startAnimation();
      console.log('🌊 Wave animation started (running in background)');
      console.log('⏸️ Phase 1: Wave plays alone - tools frozen, sliders not updated yet');
      
      // Wait for wave animation to complete (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reset wave animation state
      guidedAnimation.reset();
      console.log('✅ Wave animation complete');
      
      // Brief pause for anticipation (0.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('⏸️ Brief pause after wave (0.5s)');
      
      // ============================================================================
      // PHASE 2: SIMULTANEOUS SLIDER + TOOL ANIMATION
      // ============================================================================
      console.log('🎭 Phase 2: Starting simultaneous slider + tool animation (3 seconds)');
      
      // FIRST: Clear ALL freeze flags to enable the final shuffle
      // Clear preparation flag first
      setIsPreparingAnimation(false);
      console.log('🔓 Pre-animation flag CLEARED');
      
      // Clear animation flag
      setIsAnimatingGuidedRankings(false);
      console.log('📋 Animation flag CLEARED');
      
      // Re-enable imperative shuffle control
      if (shuffleControlRef.current) {
        shuffleControlRef.current.enable();
        console.log('✅ Imperative shuffle control: ENABLED');
      }
      
      // Re-enable state-based shuffle
      setDisableAutoShuffle(false);
      console.log('✅ State-based auto-shuffle ENABLED');
      
      // CRITICAL: Wait for React to process the flag changes before updating criteria
      // This ensures sortedTools sees criteriaAdjusted=true when criteria update
      await new Promise(resolve => setTimeout(resolve, 0));
      console.log('✨ Animation flags cleared and shuffle enabled - ready for simultaneous animation');
      
      // Calculate NEW criteria values BEFORE updating state (for email modal check)
      const newCriteriaValues = criteria.map(c => ({
        ...c,
        userRating: rankings[c.id] !== undefined ? rankings[c.id] : c.userRating
      }));
      
      // NOW update criteria - this triggers BOTH slider animations AND tool shuffle simultaneously
      setCriteria(newCriteriaValues);
      // Sync to Decision Space
      syncCriteria(newCriteriaValues);
      console.log('📊 Criteria updated - sliders + tools animating together now');
      
      // Wait for BOTH animations to complete (0.5 seconds - they're simultaneous)
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ All animations complete (sliders + tools finished together)');
      
      // NOW mark as completed (shows match scores) - done AFTER animation to prevent pre-animation jump
      // Pass criterionId if this was an individual criterion ranking
      markGuidedRankingAsCompleted(guidedRankingCriterionId);
      console.log('✅ Marked guided ranking as completed - match scores will now display');
      
      // Reset shuffle duration back to normal for future interactions
      setShuffleDurationMs(1000);
      console.log('🔄 Shuffle duration reset to 1s for normal interactions');
      
      // Check and show email modal if applicable (use NEW criteria values, not old state)
      await checkAndShowEmailModal(newCriteriaValues);
    } else {
      // Mobile: Apply immediately without animation
      console.log('📱 Applying rankings immediately on mobile (no animation)');
      const mobileCriteriaValues = criteria.map(c => ({
        ...c,
        userRating: rankings[c.id] !== undefined ? rankings[c.id] : c.userRating
      }));
      setCriteria(mobileCriteriaValues);
      // Sync to Decision Space
      syncCriteria(mobileCriteriaValues);

      // Mark as completed on mobile too (pass criterionId if individual ranking)
      markGuidedRankingAsCompleted(guidedRankingCriterionId);

      // Check email modal on mobile as well
      checkAndShowEmailModal(mobileCriteriaValues);
    }
    
    // Call completion callback AFTER all processing is done (including animation on desktop)
    // This ensures the modal doesn't close prematurely
    onGuidedRankingCompleteFromParent?.();
  };

  // No effect needed - we apply rankings manually in the sequence


  // Throttled real-time update for background preview
  // DISABLED during guided form to allow animation reveal
  const handleRealTimeUpdate = React.useCallback((rankings: { [key: string]: number }) => {
    // Skip real-time updates on desktop - we want to reveal during animation
    if (!isMobile) {
      console.log('🚫 Skipping real-time update on desktop - will reveal during animation');
      return;
    }
    
    // Mobile: Apply immediately as before
    const timeoutId = setTimeout(() => {
      setCriteria(prevCriteria => {
        const hasChanges = prevCriteria.some(criterion => 
          rankings[criterion.id] !== undefined && rankings[criterion.id] !== criterion.userRating
        );
        
        if (!hasChanges) return prevCriteria;
        
        return prevCriteria.map(criterion => ({
          ...criterion,
          userRating: rankings[criterion.id] !== undefined ? rankings[criterion.id] : criterion.userRating
        }));
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isMobile]);

  const handleCompare = (tool: Tool) => {
    setComparedTools(prev => {
      const newSet = new Set(prev);
      const isCurrentlySelected = newSet.has(tool.id);

      if (isCurrentlySelected) {
        // Tool is being REMOVED - no glow
        newSet.delete(tool.id);
      } else {
        // Tool is being ADDED - trigger glow
        newSet.add(tool.id);
        // Defer event dispatch to after render cycle completes
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chartToggleGlow'));
        }, 0);
      }
      return newSet;
    });
  };

  // Decision state machine transition handler - syncs to SpaceContext
  const handleDecisionStateChange = useCallback((transition: StateTransition) => {
    console.log('📊 Decision state transition:', transition.from, '→', transition.to);
    setDecisionState(transition.to);
  }, [setDecisionState]);

  // Handler for criteria weight changes from Decision Hub
  const handleWeightChange = useCallback((criterionId: string, newWeight: number) => {
    setCriteria(prev => {
      const updated = prev.map(c =>
        c.id === criterionId ? { ...c, userRating: newWeight } : c
      );
      syncCriteria(updated);
      return updated;
    });
  }, [syncCriteria]);

  // Show loading state
  // if (isLoading) {
  //   return <AppLoadingScreen />;
  // }

  // Show error state
  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="glass-card p-4 border-l-4 border-l-red-500 bg-red-50/80">
          <div className="text-red-700 font-medium">{fetchError}</div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      if (isMobile) {
        switch (currentStep) {
          case 'criteria':
            return (
              <div className="mobile-height-fix overflow-y-auto bg-white rounded-lg shadow-sm border">
                <CriteriaSection
                  criteria={criteria}
                  onCriteriaChange={handleCriteriaChange}
                  startWithGuidedQuestions={false}
                  guidedButtonRef={guidedButtonRef}
                  onOpenGuidedRanking={onOpenGuidedRanking}
                />
              </div>
            );
                  case 'tools':
            return (
              <div className="mobile-height-fix overflow-y-auto bg-white rounded-lg shadow-sm border">
                <ToolSection
                  tools={defaultTools}
                  selectedTools={filteredTools}
                  removedTools={removedTools}
                  selectedCriteria={criteria}
                  filterConditions={filterConditions}
                  filterMode={filterMode}
                  onAddFilterCondition={handleAddFilterCondition}
                  onRemoveFilterCondition={handleRemoveFilterCondition}
                  onUpdateFilterCondition={handleUpdateFilterCondition}
                  onToggleFilterMode={handleToggleFilterMode}
                  onToolSelect={handleToolSelect}
                  onToolRemove={handleToolRemove}
                  onRestoreAll={handleRestoreAllTools}
                  onCompare={handleCompare}
                  comparedTools={comparedTools}
                  chartButtonPosition={chartButtonPosition}
                  onOpenGuidedRanking={onOpenGuidedRanking}
                  onNavigateToCriteria={() => {
                    // Navigate to criteria tab on mobile
                    setCurrentStep('criteria');
                    // Then scroll to criteria section after DOM update
                    setTimeout(() => {
                      const criteriaSection = document.getElementById('criteria-section');
                      if (criteriaSection) {
                        criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                />
              </div>
            );
        case 'chart':
          return (
            <div className="mobile-height-fix overflow-y-auto bg-white rounded-lg shadow-sm border">
              <ComparisonChart
                tools={filteredTools}
                criteria={criteria}
                comparedTools={comparedTools}
                onOpenGuidedRanking={onOpenGuidedRanking}
                onNavigateToCriteria={() => {
                  // Navigate to criteria tab on mobile
                  setCurrentStep('criteria');
                  // Then scroll to criteria section after DOM update
                  setTimeout(() => {
                    const criteriaSection = document.getElementById('criteria-section');
                    if (criteriaSection) {
                      criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
              />
            </div>
          );
        default:
          return null;
        }
      }

      switch (currentStep) {
      case 'criteria-tools':
        return (
          <SetupViewV2
            tools={filteredTools}
            addedTools={decisionHubTools}
            onAddTool={(tool) => addProductToSpace(tool.id)}
            onRemoveTool={async (toolId) => {
              try {
                await removeProductFromSpace(toolId);
              } catch (err) {
                console.error('Failed to remove product:', err);
              }
            }}
            onGuidedProfile={() => onOpenGuidedRanking && onOpenGuidedRanking()}
            onOpenAIChat={() => setIsScoutOverlayOpen(true)}
          />
        );
      case 'chart':
        return (
          <div className="h-[calc(100dvh-120px)] min-h-[400px] max-h-[800px] overflow-y-auto bg-white rounded-lg shadow-sm border">
            <ComparisonChart
              tools={filteredTools}
              criteria={criteria}
              comparedTools={comparedTools}
              onOpenGuidedRanking={onOpenGuidedRanking}
              onNavigateToCriteria={() => {
                // Navigate to criteria-tools tab on desktop
                setCurrentStep('criteria-tools');
                // Then scroll to criteria section after DOM update
                setTimeout(() => {
                  const criteriaSection = document.getElementById('criteria-section');
                  if (criteriaSection) {
                    criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
            />
          </div>
        );
      case 'decision-hub':
        return (
          <div className="od-v2 p-4 md:p-6" style={{ background: 'var(--od-bg-base)' }}>
            <DecisionHubV2
              tools={decisionHubTools}
              criteria={criteria}
              onRemoveProduct={async (toolId) => {
                try {
                  await removeProductFromSpace(toolId);
                } catch (err) {
                  console.error('Failed to remove product:', err);
                }
              }}
              onAddProduct={() => {
                // Switch to Setup tab to add more products
                setCurrentStep('criteria-tools');
              }}
              onRatingClick={(tool, criterionId, rating) => {
                // Open Scout overlay with context about the rating
                setIsScoutOverlayOpen(true);
                // TODO: Pass context to Scout about which tool/criterion was clicked
                console.log(`AI explanation requested: ${tool.name} - ${criterionId}: ${rating}`);
              }}
            />
          </div>
        );
      default:
        return null;
      }
    } catch (error) {
      console.error('Error rendering PPM Tool content:', error);
      
      // Store error for diagnostics
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lastPPMError', `${error?.toString()} - ${new Date().toISOString()}`);
        } catch (storageError) {
          // Ignore storage errors
        }
      }
      
      return (
        <div className="min-h-[25rem] flex items-center justify-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Issue</h3>
            <p className="text-gray-600 mb-4">
              The tool is having trouble loading on your device. This might be due to viewport size issues on mobile devices.
            </p>
            <div className="space-y-2">
                          <button
              onClick={() => {
                try {
                  console.log('Attempting to reload page...');
                  window.location.reload();
                } catch (reloadError) {
                  console.error('Reload failed:', reloadError);
                  window.location.href = window.location.href;
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mobile-button"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                try {
                  console.log('Clearing all data and reloading...');
                  // Clear specific PPM tool data
                  const keysToRemove = [
                    'guidedRankingAnswers',
                    'personalizationData',
                    'lastPPMError',
                    '__ppm_tool_test__'
                  ];
                  
                  keysToRemove.forEach(key => {
                    try {
                      localStorage.removeItem(key);
                    } catch (e) {
                      console.warn(`Failed to remove ${key}:`, e);
                    }
                  });
                  
                  // Force reload
                  setTimeout(() => {
                    try {
                      window.location.reload();
                    } catch (reloadError) {
                      window.location.href = '/ppm-tool';
                    }
                  }, 100);
                  
                } catch (e) {
                  console.error('Clear data failed:', e);
                  try {
                    window.location.href = '/ppm-tool';
                  } catch (navError) {
                    window.location.reload();
                  }
                }
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm mobile-button"
            >
              Clear Data & Reload
            </button>
            {isMobile && (
              <button
                onClick={() => {
                  try {
                    // Mobile-specific recovery
                    console.log('Attempting mobile recovery...');
                    
                    // Try to navigate to desktop version
                    const currentUrl = window.location.href;
                    const desktopUrl = currentUrl.includes('?') 
                      ? currentUrl + '&mobile=0' 
                      : currentUrl + '?mobile=0';
                    
                    window.location.href = desktopUrl;
                  } catch (e) {
                    console.error('Mobile recovery failed:', e);
                    window.location.href = '/';
                  }
                }}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm mobile-button"
              >
                Try Desktop Version
              </button>
            )}
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  {error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <AIChatProvider
        initialContext={aiContext}
        decisionSpaceId={spaceId ?? undefined}
        decisionState={space?.decision_state || 'framing'}
        candidates={decisionHubTools}
        criteria={criteria}
      >
      <MobileOptimizedLoader isHydrated={isHydrated}>
        {/* PPM Tool Embedded Application */}
        <div
          className="min-h-screen workspace-ambient-bg"
          role="application"
          aria-label="PPM Tool Finder"
        >
          {/* App Header - Single row minimal design */}
          {isHydrated && !isMobile && (
            <AppHeaderV2
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onShowHowItWorks={onShowHowItWorks}
              isAIPanelExpanded={isAIPanelExpanded}
            />
          )}

          {/* NavigationToggle removed - replaced by global Header */}
          {/*
          <NavigationToggle
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            compareCount={comparedTools.size}
            selectedTools={selectedTools}
            selectedCriteria={criteria}
            filteredTools={filteredTools}
            onShowHowItWorks={onShowHowItWorks}
            getReportButtonRef={getReportButtonRef}
            onChartButtonPosition={setChartButtonPosition}
            showEmailModal={showEmailModal}
            onOpenEmailModal={() => setShowEmailModal(true)}
            onCloseEmailModal={() => {
              setShowEmailModal(false);
              onComparisonReportClose();
            }}
            onOpenGuidedRanking={(criterionId) => {
              // Differentiate between full and criteria-specific guided rankings
              if (criterionId) {
                recordCriteriaSpecificGuidedRankingsClick();
                console.log('🎯 Opening criteria-specific guided ranking for:', criterionId);
              } else {
                onGuidedRankingClick(); // Full guided rankings
                recordFullGuidedRankingsClick();
                console.log('🎯 Opening full guided rankings');
              }
              onGuidedRankingStart();
              onOpenGuidedRanking && onOpenGuidedRanking(criterionId);
            }}
            isAIPanelExpanded={isAIPanelExpanded}
          />
          */}

          {/* AI Chat Panel - Fixed position on left, full height, ABOVE header */}
          {isHydrated && !isMobile && (
            <div
              className="fixed left-0 top-0 z-[100]"
              style={{
                height: "100vh",
              }}
            >
              <AIChatPanel
                isExpanded={isAIPanelExpanded}
                onToggle={handleToggleAIPanel}
                context={aiContext}
                tools={filteredTools}
                criteria={criteria}
                isAnimationBlocked={isAIPanelAnimationBlocked}
                decisionSpaceId={spaceId}
                hasHighMatchScore={hasHighMatchScore}
                onCriteriaUpdate={handleAICriteriaUpdate}
              />
            </div>
          )}

          {/* Main Content - Responsive margin for AI rail */}
          <main
            className={cn(
              'min-h-screen bg-[#f5f7f7]',
              isHydrated && isMobile && "pb-32"
            )}
            style={{
              // Header (44px h-11) + minimal spacing
              paddingTop: isHydrated && !isMobile ? "calc(44px + 0.5rem)" : "0.5rem",
              marginLeft: isHydrated && !isMobile
                ? isAIPanelExpanded
                  ? 'calc(var(--ai-panel-width, 380px) + var(--ai-content-gap, 24px))'
                  : 'var(--content-margin, 88px)'
                : '0',
              transition: 'margin-left 0.15s ease-out',
            }}
          >
            {/* Page Title - Space name is now in AppHeader */}

            {/* Content container */}
            <div
              className="ppm-content-container w-full pb-8"
              style={{ paddingRight: 'var(--ai-content-gap, 24px)' }}
            >
              {renderContent()}
            </div>
          </main>
          {/* ActionButtons are rendered in NavigationToggle component - no duplicate needed here */}
        </div>

        {/* Guided Ranking Form */}
        <GuidedRankingForm
          isOpen={showGuidedRanking}
          onClose={() => {
            // Only call completion handler if we're not in the middle of an animation
            // This prevents premature closing that interferes with the animation sequence
            if (!isAnimatingGuidedRankings && !isPreparingAnimation) {
              // Call the coordination handler first from useGuidance
              onGuidedRankingComplete();
              // Then call the original handler from props
              onGuidedRankingCompleteFromParent && onGuidedRankingCompleteFromParent();
            } else {
              console.log('⏸️ Skipping guided ranking complete callback - animation in progress');
            }
          }}
          criteria={criteria}
          criterionId={guidedRankingCriterionId}
          onUpdateRankings={handleUpdateRankings}
          onRealTimeUpdate={handleRealTimeUpdate}
          onSaveAnswers={handleSaveAnswers}
          onMethodologyFilter={handleMethodologyFilter}
          initialAnswers={convertSavedAnswersToFormFormat(guidedRankingAnswers)}
        />

        {/* Guided Submit Animation Overlay (Desktop Only) */}
        {!isMobile && (
          <GuidedSubmitAnimation
            isActive={guidedAnimation.isAnimating}
            phase={guidedAnimation.phase}
            message={guidedAnimation.getMessage()}
          />
        )}

        {/* REMOVED: Mobile Diagnostics - Causes browser compatibility issues with Edge/Safari
            <MobileDiagnostics /> */}

        {/* Mobile Recovery System */}
        {isMobile && (
          <MobileRecoverySystem
            onRecovery={() => {
              console.log('🔧 Mobile recovery initiated');
              // Reset all state
              setCriteria([]);
              setSelectedTools([]);
              setFetchError(null);
            }}
          />
        )}

        {/* Scout FAB - Floating Action Button for Scout AI (Desktop only) */}
        {isHydrated && !isMobile && (
          <ScoutFABV2
            onClick={() => setIsScoutOverlayOpen(!isScoutOverlayOpen)}
            isOpen={isScoutOverlayOpen}
          />
        )}

        {/* Scout Overlay - Full-screen chat modal */}
        <ScoutOverlay
          isOpen={isScoutOverlayOpen}
          onClose={() => setIsScoutOverlayOpen(false)}
          context={aiContext}
          tools={filteredTools}
          criteria={criteria}
          decisionSpaceId={spaceId ?? undefined}
        />

        </MobileOptimizedLoader>
      </AIChatProvider>
    </ErrorBoundary>
  );
}; 