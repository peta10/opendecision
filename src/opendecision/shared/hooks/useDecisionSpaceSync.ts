'use client';

/**
 * useDecisionSpaceSync Hook
 *
 * Syncs PPM tool state (criteria, selected tools, guided answers) with the
 * current Decision Space in Supabase. Provides bi-directional sync:
 * - On space load: Supabase → local state
 * - On state change: local state → Supabase (debounced)
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSpace } from '../contexts/SpaceContext';
import { Criterion, DecisionProfile, GuidedRankingAnswer, PersonalizationData } from '../types';
import { updateDecisionSpace } from '../services/decisionSpaceService';

// =============================================================================
// TYPES
// =============================================================================

export interface DecisionSpaceSyncState {
  /** Criteria with ratings from the decision space */
  criteria: Array<{ id: string; name: string; rating: number }>;
  /** Tool IDs selected in this space */
  selectedToolIds: string[];
  /** Context from guided ranking */
  context: DecisionProfile['context'];
  /** Raw guided ranking answers */
  guidedRankingAnswers?: Record<string, GuidedRankingAnswer>;
}

export interface UseDecisionSpaceSyncOptions {
  /** Debounce delay for saving to Supabase (ms) */
  saveDebounceMs?: number;
  /** Callback when space data is loaded */
  onSpaceLoaded?: (state: DecisionSpaceSyncState) => void;
  /** Callback when save completes */
  onSaved?: () => void;
  /** Callback on save error */
  onSaveError?: (error: Error) => void;
}

export interface UseDecisionSpaceSyncReturn {
  /** Whether we're currently loading space data */
  isLoading: boolean;
  /** Whether we're currently saving */
  isSaving: boolean;
  /** Last save error if any */
  saveError: string | null;
  /** Current space ID */
  spaceId: string | null;
  /** Whether the space has been loaded at least once */
  hasLoaded: boolean;
  /** Sync criteria ratings to the space */
  syncCriteria: (criteria: Criterion[]) => void;
  /** Sync selected tool IDs to the space */
  syncSelectedTools: (toolIds: string[]) => void;
  /** Sync guided ranking data to the space */
  syncGuidedData: (
    answers: Record<string, GuidedRankingAnswer>,
    personalization: PersonalizationData
  ) => void;
  /** Force immediate save (bypasses debounce) */
  saveNow: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useDecisionSpaceSync(
  options: UseDecisionSpaceSyncOptions = {}
): UseDecisionSpaceSyncReturn {
  const {
    saveDebounceMs = 2000,
    onSpaceLoaded,
    onSaved,
    onSaveError,
  } = options;

  const { currentSpace, isLoadingSpace, updateSpace } = useSpace();

  // Local state for tracking sync status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Refs for debouncing and tracking pending changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<DecisionProfile>>({});
  const pendingToolsRef = useRef<string[] | null>(null);
  const lastSpaceIdRef = useRef<string | null>(null);

  // ==========================================================================
  // LOAD SPACE DATA
  // ==========================================================================

  useEffect(() => {
    if (!currentSpace || isLoadingSpace) {
      return;
    }

    // Only trigger onSpaceLoaded when space ID changes (not on every update)
    if (lastSpaceIdRef.current === currentSpace.id) {
      return;
    }

    lastSpaceIdRef.current = currentSpace.id;
    setHasLoaded(true);

    // Extract state from space
    const state: DecisionSpaceSyncState = {
      criteria: currentSpace.decision_profile.criteria || [],
      selectedToolIds: currentSpace.selected_tools || [],
      context: currentSpace.decision_profile.context || {},
      guidedRankingAnswers: currentSpace.decision_profile.guidedRankingAnswers,
    };

    console.log('📥 Decision Space loaded:', currentSpace.id, state);
    onSpaceLoaded?.(state);
  }, [currentSpace, isLoadingSpace, onSpaceLoaded]);

  // ==========================================================================
  // DEBOUNCED SAVE
  // ==========================================================================

  const executeSave = useCallback(async () => {
    if (!currentSpace) return;

    const hasProfileChanges = Object.keys(pendingChangesRef.current).length > 0;
    const hasToolChanges = pendingToolsRef.current !== null;

    if (!hasProfileChanges && !hasToolChanges) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const updates: Parameters<typeof updateSpace>[0] = {};

      // Build decision_profile updates
      if (hasProfileChanges) {
        updates.decision_profile = pendingChangesRef.current;
      }

      // Build selected_tools updates
      if (hasToolChanges && pendingToolsRef.current) {
        updates.selected_tools = pendingToolsRef.current;
      }

      console.log('💾 Saving to Decision Space:', currentSpace.id, updates);
      await updateSpace(updates);

      // Clear pending changes
      pendingChangesRef.current = {};
      pendingToolsRef.current = null;

      console.log('✅ Decision Space saved');
      onSaved?.();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Save failed';
      console.error('❌ Decision Space save error:', error);
      setSaveError(errorMsg);
      onSaveError?.(error instanceof Error ? error : new Error(errorMsg));
    } finally {
      setIsSaving(false);
    }
  }, [currentSpace, updateSpace, onSaved, onSaveError]);

  const scheduleSave = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      executeSave();
    }, saveDebounceMs);
  }, [executeSave, saveDebounceMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // SYNC FUNCTIONS
  // ==========================================================================

  const syncCriteria = useCallback((criteria: Criterion[]) => {
    if (!currentSpace) return;

    // Convert to storage format
    const criteriaData = criteria.map(c => ({
      id: c.id,
      name: c.name,
      rating: c.userRating,
    }));

    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      criteria: criteriaData,
    };

    scheduleSave();
  }, [currentSpace, scheduleSave]);

  const syncSelectedTools = useCallback((toolIds: string[]) => {
    if (!currentSpace) return;

    pendingToolsRef.current = toolIds;
    scheduleSave();
  }, [currentSpace, scheduleSave]);

  const syncGuidedData = useCallback((
    answers: Record<string, GuidedRankingAnswer>,
    personalization: PersonalizationData
  ) => {
    if (!currentSpace) return;

    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      guidedRankingAnswers: answers,
      context: {
        ...pendingChangesRef.current.context,
        methodology: personalization.methodologies?.[0],
        userCount: personalization.userCount,
      },
    };

    scheduleSave();
  }, [currentSpace, scheduleSave]);

  const saveNow = useCallback(async () => {
    // Clear any pending debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    await executeSave();
  }, [executeSave]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    isLoading: isLoadingSpace,
    isSaving,
    saveError,
    spaceId: currentSpace?.id || null,
    hasLoaded,
    syncCriteria,
    syncSelectedTools,
    syncGuidedData,
    saveNow,
  };
}

export default useDecisionSpaceSync;
