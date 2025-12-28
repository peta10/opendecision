'use client';

import React from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { ProjectProfileCard } from './ProjectProfileCard';
import { ProductsPanel } from './ProductsPanel';
import { Tool } from '@/opendecision/shared/types';

interface SetupViewProps {
  tools?: Tool[];
  addedTools?: Tool[];
  onAddTool?: (tool: Tool) => void;
  onRemoveTool?: (toolId: string) => void;
  onGuidedProfile?: () => void;
  onAskAboutProducts?: () => void;
  className?: string;
}

/**
 * SetupView - Main content area for the Setup tab
 *
 * Premium glassmorphism design with:
 * - Gradient mesh background
 * - Glass panel cards
 * - Scout is now in the AI Panel sidebar
 */
export const SetupView: React.FC<SetupViewProps> = ({
  tools,
  addedTools,
  onAddTool,
  onRemoveTool,
  onGuidedProfile,
  onAskAboutProducts,
  className,
}) => {
  return (
    <div
      className={cn('gradient-mesh-bg rounded-2xl p-4', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        minHeight: 'calc(100vh - 80px)',
      }}
    >
      {/* Project Profile Card */}
      <ProjectProfileCard onGuidedProfile={onGuidedProfile} />

      {/* Products Panel */}
      <ProductsPanel
        tools={tools}
        addedTools={addedTools}
        onAddTool={onAddTool}
        onRemoveTool={onRemoveTool}
        onAskAboutProducts={onAskAboutProducts}
      />
    </div>
  );
};

export default SetupView;
