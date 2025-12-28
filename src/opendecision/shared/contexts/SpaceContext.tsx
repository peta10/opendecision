'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  DecisionSpace,
  DecisionState,
  UserAuthState,
  CreateDecisionSpaceInput,
  UpdateDecisionSpaceInput,
} from '../types';
import {
  createDecisionSpace,
  getDecisionSpace,
  listDecisionSpaces,
  updateDecisionSpace,
  deleteDecisionSpace,
  getOrCreateDefaultSpace,
} from '../services/decisionSpaceService';

// =============================================================================
// TYPES
// =============================================================================

interface SpaceContextType {
  // Auth state
  authState: UserAuthState;

  // Current space
  currentSpace: DecisionSpace | null;
  isLoadingSpace: boolean;
  spaceError: string | null;

  // All user spaces (for switcher)
  spaces: DecisionSpace[];
  isLoadingSpaces: boolean;

  // Space actions
  createSpace: (input?: CreateDecisionSpaceInput) => Promise<DecisionSpace>;
  updateSpace: (input: UpdateDecisionSpaceInput) => Promise<DecisionSpace>;
  deleteSpace: (id: string) => Promise<void>;
  switchSpace: (id: string) => Promise<void>;
  refreshSpaces: () => Promise<void>;

  // Decision state machine
  setDecisionState: (state: DecisionState) => Promise<void>;

  // Auth actions
  convertToPermament: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface SpaceProviderProps {
  children: ReactNode;
  /** Initial space ID from URL (e.g., /d/[id]) */
  initialSpaceId?: string;
}

export function SpaceProvider({ children, initialSpaceId }: SpaceProviderProps) {
  // Auth state
  const [authState, setAuthState] = useState<UserAuthState>({
    userId: '',
    isAnonymous: true,
    email: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Space state
  const [currentSpace, setCurrentSpace] = useState<DecisionSpace | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState(true);
  const [spaceError, setSpaceError] = useState<string | null>(null);

  // All spaces (for switcher)
  const [spaces, setSpaces] = useState<DecisionSpace[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // ==========================================================================
  // INITIALIZE AUTH (Anonymous Sign-In)
  // ==========================================================================

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase not configured, skipping auth initialization');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Store reference to avoid TypeScript null narrowing issues in async callbacks
    const client = supabase;
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (session?.user) {
          // User already authenticated
          if (mounted) {
            setAuthState({
              userId: session.user.id,
              isAnonymous: session.user.is_anonymous ?? false,
              email: session.user.email ?? null,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } else {
          // No session - sign in anonymously
          console.info('No session found, signing in anonymously...');
          const { data, error } = await client.auth.signInAnonymously();

          if (error) {
            console.error('Anonymous sign-in failed:', error);
            if (mounted) {
              setAuthState(prev => ({ ...prev, isLoading: false }));
            }
            return;
          }

          if (data.user && mounted) {
            console.info('Anonymous sign-in successful:', data.user.id);
            setAuthState({
              userId: data.user.id,
              isAnonymous: true,
              email: null,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        console.info('Auth state changed:', event);

        if (session?.user && mounted) {
          setAuthState({
            userId: session.user.id,
            isAnonymous: session.user.is_anonymous ?? false,
            email: session.user.email ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
        } else if (mounted) {
          // Session ended - re-initialize anonymous
          setAuthState({
            userId: '',
            isAnonymous: true,
            email: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================================================
  // INITIALIZE SPACE (after auth is ready)
  // ==========================================================================

  useEffect(() => {
    if (!authState.isAuthenticated || authState.isLoading) {
      return;
    }

    const initializeSpace = async () => {
      setIsLoadingSpace(true);
      setSpaceError(null);

      try {
        let space: DecisionSpace | null = null;

        // If we have an initial space ID from URL, try to load it
        if (initialSpaceId) {
          space = await getDecisionSpace(initialSpaceId);
          if (!space) {
            console.warn(`Space ${initialSpaceId} not found, creating default`);
          }
        }

        // If no space yet, get or create default
        if (!space) {
          space = await getOrCreateDefaultSpace();
        }

        setCurrentSpace(space);
      } catch (err) {
        console.error('Failed to initialize space:', err);
        setSpaceError(err instanceof Error ? err.message : 'Failed to load space');
      } finally {
        setIsLoadingSpace(false);
      }
    };

    initializeSpace();
  }, [authState.isAuthenticated, authState.isLoading, initialSpaceId]);

  // ==========================================================================
  // SPACE ACTIONS
  // ==========================================================================

  const refreshSpaces = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    setIsLoadingSpaces(true);
    try {
      const allSpaces = await listDecisionSpaces();
      setSpaces(allSpaces);
    } catch (err) {
      console.error('Failed to refresh spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [authState.isAuthenticated]);

  const createSpace = useCallback(async (input?: CreateDecisionSpaceInput): Promise<DecisionSpace> => {
    const newSpace = await createDecisionSpace(input);
    setCurrentSpace(newSpace);
    // Add to local list
    setSpaces(prev => [newSpace, ...prev]);
    return newSpace;
  }, []);

  const updateSpace = useCallback(async (input: UpdateDecisionSpaceInput): Promise<DecisionSpace> => {
    if (!currentSpace) {
      // Silently skip if no current space (demo/unauthenticated mode)
      console.log('⏭️ Skipping space update - no current space (demo mode)');
      throw new Error('No current space to update');
    }

    try {
      const updated = await updateDecisionSpace(currentSpace.id, input);
      setCurrentSpace(updated);
      // Update in local list
      setSpaces(prev => prev.map(s => s.id === updated.id ? updated : s));
      return updated;
    } catch (error) {
      // Log but don't throw - allows app to work in demo/offline mode
      console.warn('⚠️ Space sync failed (demo mode or offline):', error instanceof Error ? error.message : error);
      // Return current space to allow local-only operation
      return currentSpace;
    }
  }, [currentSpace]);

  const deleteSpaceAction = useCallback(async (id: string): Promise<void> => {
    await deleteDecisionSpace(id);

    // Remove from local list
    setSpaces(prev => prev.filter(s => s.id !== id));

    // If we deleted the current space, switch to another or create new
    if (currentSpace?.id === id) {
      const remaining = spaces.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSpace(remaining[0]);
      } else {
        // Create a new default space
        const newSpace = await createDecisionSpace();
        setCurrentSpace(newSpace);
        setSpaces([newSpace]);
      }
    }
  }, [currentSpace, spaces]);

  const switchSpace = useCallback(async (id: string): Promise<void> => {
    if (currentSpace?.id === id) return;

    setIsLoadingSpace(true);
    setSpaceError(null);

    try {
      const space = await getDecisionSpace(id);
      if (!space) {
        throw new Error('Space not found');
      }
      setCurrentSpace(space);
    } catch (err) {
      console.error('Failed to switch space:', err);
      setSpaceError(err instanceof Error ? err.message : 'Failed to switch space');
    } finally {
      setIsLoadingSpace(false);
    }
  }, [currentSpace?.id]);

  // ==========================================================================
  // AUTH ACTIONS
  // ==========================================================================

  const convertToPermament = useCallback(async (email: string): Promise<void> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Update user with email - this triggers magic link flow
    const { error } = await supabase!.auth.updateUser({ email });

    if (error) {
      throw new Error(`Failed to send magic link: ${error.message}`);
    }

    // Note: User will receive magic link email
    // Auth state will update when they click the link
    console.info('Magic link sent to:', email);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase!.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }

    // Clear local state
    setCurrentSpace(null);
    setSpaces([]);
  }, []);

  // ==========================================================================
  // DECISION STATE MACHINE
  // ==========================================================================

  const setDecisionState = useCallback(async (state: DecisionState): Promise<void> => {
    if (!currentSpace) {
      console.warn('[SpaceContext] Cannot set decision state - no current space');
      return;
    }

    try {
      const updated = await updateDecisionSpace(currentSpace.id, { decision_state: state });
      setCurrentSpace(updated);
      // Update in local list
      setSpaces(prev => prev.map(s => s.id === updated.id ? updated : s));
      console.log('[SpaceContext] Decision state updated to:', state);
    } catch (error) {
      console.warn('[SpaceContext] Failed to update decision state:', error);
      // Update locally anyway for responsiveness
      setCurrentSpace(prev => prev ? { ...prev, decision_state: state } : prev);
    }
  }, [currentSpace]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const value: SpaceContextType = {
    authState,
    currentSpace,
    isLoadingSpace,
    spaceError,
    spaces,
    isLoadingSpaces,
    createSpace,
    updateSpace,
    deleteSpace: deleteSpaceAction,
    switchSpace,
    refreshSpaces,
    setDecisionState,
    convertToPermament,
    signOut,
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useSpace() {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook for just auth state (lighter weight)
 */
export function useAuthState(): UserAuthState {
  const { authState } = useSpace();
  return authState;
}

/**
 * Hook for current space with loading state
 */
export function useCurrentSpace() {
  const { currentSpace, isLoadingSpace, spaceError, updateSpace, setDecisionState } = useSpace();
  return { space: currentSpace, isLoading: isLoadingSpace, error: spaceError, updateSpace, setDecisionState };
}
