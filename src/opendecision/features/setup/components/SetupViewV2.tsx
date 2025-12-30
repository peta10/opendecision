'use client';

import React, { useState } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { DecisionProfilePanel } from './DecisionProfilePanel';
import { ProductsPanelV2 } from './ProductsPanelV2';
import { ScoutFABV2 } from '@/opendecision/shared/components/scout/ScoutFABV2';
import { Tool } from '@/opendecision/shared/types';

// Import design system CSS
import '@/app/design-system-v2.css';

interface SetupViewV2Props {
  tools?: Tool[];
  addedTools?: Tool[];
  onAddTool?: (tool: Tool) => void;
  onRemoveTool?: (toolId: string) => void;
  onGuidedProfile?: () => void;
  onOpenAIChat?: (context?: { tool?: Tool; matchScore?: number; type?: 'match-score' | 'general' }) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * SetupViewV2 - Redesigned Setup view (V2)
 *
 * New layout: 320px Decision Profile (left) | Fluid Products (right)
 *
 * Key changes:
 * - Fixed 320px sidebar for Decision Profile
 * - Fluid width products area
 * - Flat neutral background (no gradient mesh)
 * - Floating AI button bottom-right
 * - Clean gray color scheme
 *
 * Layout Structure:
 * ┌─────────────┬─────────────────────────────────────────┐
 * │  DECISION   │                                         │
 * │  PROFILE    │            PRODUCTS PANEL               │
 * │  (320px)    │           (fluid width)                 │
 * │             │                                         │
 * │  • Objective│  [Added chips]                         │
 * │  • Context  │  ─────────────────────────────────────  │
 * │  • Criteria │  [Search]                              │
 * │  • Attach   │                                         │
 * │             │  ┌─────────────────────────────────┐   │
 * │  [Guided]   │  │  Product Card (full width)      │   │
 * │             │  └─────────────────────────────────┘   │
 * │             │  ┌─────────────────────────────────┐   │
 * │             │  │  Product Card (full width)      │   │
 * │             │  └─────────────────────────────────┘   │
 * │             │                                         │
 * └─────────────┴─────────────────────────────────────────┘
 *                                              [Scout FAB]
 */
export const SetupViewV2: React.FC<SetupViewV2Props> = ({
  tools,
  addedTools,
  onAddTool,
  onRemoveTool,
  onGuidedProfile,
  onOpenAIChat,
  isLoading = false,
  error = null,
  className,
}) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const handleOpenAIChat = () => {
    setIsAIChatOpen(true);
    onOpenAIChat?.({ type: 'general' });
  };

  // Handler for when user clicks on a match score to get AI explanation
  const handleMatchScoreClick = (tool: Tool, matchScore: number) => {
    setIsAIChatOpen(true);
    onOpenAIChat?.({ tool, matchScore, type: 'match-score' });
  };

  return (
    <div
      className={cn(
        'od-v2',
        // Responsive grid layout
        'grid gap-6 min-h-[calc(100vh-var(--od-header-height,56px))] p-4 md:p-6',
        // Mobile: single column, Tablet: narrower sidebar, Desktop: full width
        'grid-cols-1 lg:grid-cols-[400px_1fr] md:grid-cols-[320px_1fr]',
        className
      )}
      style={{
        background: 'var(--od-bg-base, #F7F7F8)',
      }}
    >
      {/* =================================================================
          LEFT: Decision Profile Panel (responsive width)
          ================================================================= */}
      <DecisionProfilePanel
        onGuidedProfile={onGuidedProfile}
        className="lg:sticky lg:top-6 h-fit"
      />

      {/* =================================================================
          RIGHT: Products Panel (fluid width)
          ================================================================= */}
      <ProductsPanelV2
        tools={tools}
        addedTools={addedTools}
        onAddTool={onAddTool}
        onRemoveTool={onRemoveTool}
        onMatchScoreClick={handleMatchScoreClick}
        isLoading={isLoading}
        error={error}
      />

      {/* =================================================================
          FLOATING: Scout AI Button (bottom-right)
          ================================================================= */}
      <ScoutFABV2
        onClick={handleOpenAIChat}
        isOpen={isAIChatOpen}
      />
    </div>
  );
};

export default SetupViewV2;
