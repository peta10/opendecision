'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAIChat, UseAIChatReturn, UseAIChatOptions } from '../hooks/useAIChat';
import { AIChatContext as AIChatContextType, Tool, Criterion, DecisionState } from '../types';

/**
 * Shared AI Chat Context
 *
 * Provides a single shared chat state for both AIChatPanel and ScoutOverlay.
 * This ensures conversations are mirrored - start in one, continue in the other.
 */

interface AIChatProviderProps {
  children: ReactNode;
  initialContext?: AIChatContextType;
  decisionSpaceId?: string;
  /** Current decision state for state-aware Scout behavior */
  decisionState?: DecisionState;
  /** Candidates being compared (for state-aware context) */
  candidates?: Tool[];
  /** User's criteria with weights (for state-aware context) */
  criteria?: Criterion[];
  onCriteriaUpdate?: (updates: Record<string, number>) => void;
}

const AIChatSharedContext = createContext<UseAIChatReturn | null>(null);

export const AIChatProvider: React.FC<AIChatProviderProps> = ({
  children,
  initialContext,
  decisionSpaceId,
  decisionState,
  candidates,
  criteria,
  onCriteriaUpdate,
}) => {
  const chatState = useAIChat({
    initialContext,
    decisionSpaceId,
    decisionState,
    candidates,
    criteria,
    onCriteriaUpdate,
  });

  return (
    <AIChatSharedContext.Provider value={chatState}>
      {children}
    </AIChatSharedContext.Provider>
  );
};

/**
 * Hook to access shared AI chat state
 * Must be used within an AIChatProvider
 */
export const useSharedAIChat = (): UseAIChatReturn => {
  const context = useContext(AIChatSharedContext);
  if (!context) {
    throw new Error('useSharedAIChat must be used within an AIChatProvider');
  }
  return context;
};

/**
 * Optional hook that returns null if not in provider (for gradual migration)
 */
export const useSharedAIChatOptional = (): UseAIChatReturn | null => {
  return useContext(AIChatSharedContext);
};

export default AIChatProvider;
