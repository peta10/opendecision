'use client';

import React, { useState } from 'react';
import { SetupViewV2 } from '@/opendecision/features/setup/components/SetupViewV2';
import { DecisionHubV2 } from '@/opendecision/features/decision-hub';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { useScrollAwareHeader } from '@/opendecision/shared/hooks/useScrollAwareHeader';
import { cn } from '@/opendecision/shared/lib/utils';

// Import design system
import '@/app/design-system-v2.css';

/**
 * Demo page for V2 UI redesign
 *
 * Access at: /demo-v2
 *
 * Features demonstrated:
 * - New neutral gray color system
 * - 320px Decision Profile sidebar
 * - niche.com style product cards
 * - Scout compass icon
 * - Scroll-aware header (Amazon style)
 * - Floating AI button
 */
export default function DemoV2Page() {
  const { isVisible, scrollY } = useScrollAwareHeader({ threshold: 60 });

  // Demo state
  const [activeView, setActiveView] = useState<'setup' | 'hub'>('setup');
  const [addedTools, setAddedTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo criteria data
  const demoCriteria: Criterion[] = [
    {
      id: 'ease-of-use',
      name: 'Ease of Use',
      description: 'How intuitive and easy the tool is to learn and use',
      userRating: 5,
      ratingDescriptions: { low: 'Complex to use', high: 'Very intuitive' },
    },
    {
      id: 'scalability',
      name: 'Scalability',
      description: 'Ability to grow with your organization',
      userRating: 4,
      ratingDescriptions: { low: 'Limited scale', high: 'Highly scalable' },
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Data protection and compliance features',
      userRating: 4,
      ratingDescriptions: { low: 'Basic security', high: 'Enterprise-grade' },
    },
    {
      id: 'cost-efficiency',
      name: 'Cost Efficiency',
      description: 'Value for money and ROI potential',
      userRating: 3,
      ratingDescriptions: { low: 'Expensive', high: 'Great value' },
    },
    {
      id: 'integrations',
      name: 'Integrations',
      description: 'Compatibility with other tools and systems',
      userRating: 4,
      ratingDescriptions: { low: 'Few integrations', high: 'Many integrations' },
    },
  ];

  // Demo tools data - ratings use criteria IDs for Decision Hub compatibility
  const demoTools: Tool[] = [
    {
      id: 'monday',
      name: 'Monday.com',
      logo: '',
      useCases: ['Project Management', 'Team Collaboration', 'Resource Planning'],
      methodologies: ['Agile', 'Waterfall'],
      functions: ['Task Management', 'Time Tracking', 'Reporting'],
      ratings: {
        'ease-of-use': 4.5,
        'scalability': 5.0,
        'security': 4.2,
        'cost-efficiency': 3.8,
        'integrations': 4.6,
      },
      ratingExplanations: {},
      type: 'Enterprise',
      created_by: null,
      criteria: [],
      tags: [],
      created_on: '2024-01-01',
      submission_status: 'approved',
    },
    {
      id: 'asana',
      name: 'Asana',
      logo: '',
      useCases: ['Task Management', 'Project Tracking', 'Team Coordination'],
      methodologies: ['Agile', 'Waterfall', 'Hybrid'],
      functions: ['Task Management', 'Timeline View', 'Workload Management'],
      ratings: {
        'ease-of-use': 4.7,
        'scalability': 4.2,
        'security': 4.0,
        'cost-efficiency': 4.2,
        'integrations': 4.0,
      },
      ratingExplanations: {},
      type: 'Mid-Market',
      created_by: null,
      criteria: [],
      tags: [],
      created_on: '2024-01-01',
      submission_status: 'approved',
    },
    {
      id: 'clickup',
      name: 'ClickUp',
      logo: '',
      useCases: ['All-in-one Productivity', 'Docs & Wikis', 'Goal Tracking'],
      methodologies: ['Agile'],
      functions: ['Task Management', 'Docs', 'Whiteboards', 'Goals'],
      ratings: {
        'ease-of-use': 4.3,
        'scalability': 4.0,
        'security': 3.8,
        'cost-efficiency': 4.5,
        'integrations': 4.2,
      },
      ratingExplanations: {},
      type: 'SMB',
      created_by: null,
      criteria: [],
      tags: [],
      created_on: '2024-01-01',
      submission_status: 'approved',
    },
    {
      id: 'jira',
      name: 'Jira',
      logo: '',
      useCases: ['Software Development', 'Bug Tracking', 'Sprint Planning'],
      methodologies: ['Agile', 'Scrum', 'Kanban'],
      functions: ['Issue Tracking', 'Boards', 'Roadmaps', 'Reports'],
      ratings: {
        'ease-of-use': 3.5,
        'scalability': 5.0,
        'security': 4.8,
        'cost-efficiency': 3.2,
        'integrations': 4.8,
      },
      ratingExplanations: {},
      type: 'Enterprise',
      created_by: null,
      criteria: [],
      tags: [],
      created_on: '2024-01-01',
      submission_status: 'approved',
    },
    {
      id: 'smartsheet',
      name: 'Smartsheet',
      logo: '',
      useCases: ['Work Management', 'Resource Planning', 'Portfolio Management'],
      methodologies: ['Waterfall', 'Hybrid'],
      functions: ['Sheets', 'Dashboards', 'Automation', 'Forms'],
      ratings: {
        'ease-of-use': 4.0,
        'scalability': 4.5,
        'security': 4.3,
        'cost-efficiency': 3.5,
        'integrations': 3.8,
      },
      ratingExplanations: {},
      type: 'Enterprise',
      created_by: null,
      criteria: [],
      tags: [],
      created_on: '2024-01-01',
      submission_status: 'approved',
    },
  ];

  const handleAddTool = (tool: Tool) => {
    if (!addedTools.find((t) => t.id === tool.id)) {
      setAddedTools([...addedTools, tool]);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setAddedTools(addedTools.filter((t) => t.id !== toolId));
  };

  const handleGuidedProfile = () => {
    alert('Guided Profile clicked - would open guided ranking flow');
  };

  const handleOpenAIChat = (context?: { tool?: Tool; matchScore?: number; type?: 'match-score' | 'general' }) => {
    if (context?.type === 'match-score' && context.tool) {
      alert(
        `Scout AI: Explaining match score for ${context.tool.name}\n\n` +
        `Match Score: ${context.matchScore}%\n\n` +
        `This would open the AI panel with context about why ${context.tool.name} ` +
        `has a ${context.matchScore}% match based on your decision profile criteria.`
      );
    } else {
      alert('AI Chat clicked - would open Scout AI panel');
    }
  };

  return (
    <div className="od-v2" style={{ minHeight: '100vh', background: 'var(--od-bg-base)' }}>
      {/* =================================================================
          SCROLL-AWARE HEADER (Amazon style)
          ================================================================= */}
      <header
        className={cn('od-header')}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--od-header-height, 56px)',
          background: 'var(--od-bg-surface)',
          borderBottom: '1px solid var(--od-border-subtle)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 200ms ease',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--od-scout)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            OD
          </div>
          <span
            style={{
              fontSize: 'var(--od-text-lg)',
              fontWeight: 'var(--od-font-semibold)',
              color: 'var(--od-text-primary)',
            }}
          >
            OpenDecision
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveView('setup')}
            style={{
              padding: '8px 16px',
              background: activeView === 'setup' ? 'var(--od-scout-bg)' : 'transparent',
              color: activeView === 'setup' ? 'var(--od-scout)' : 'var(--od-text-secondary)',
              border: 'none',
              borderRadius: 'var(--od-radius-md)',
              fontSize: 'var(--od-text-sm)',
              fontWeight: 'var(--od-font-medium)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Decision Framing
          </button>
          <button
            onClick={() => setActiveView('hub')}
            style={{
              padding: '8px 16px',
              background: activeView === 'hub' ? 'var(--od-scout-bg)' : 'transparent',
              color: activeView === 'hub' ? 'var(--od-scout)' : 'var(--od-text-secondary)',
              border: 'none',
              borderRadius: 'var(--od-radius-md)',
              fontSize: 'var(--od-text-sm)',
              fontWeight: 'var(--od-font-medium)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Decision Hub {addedTools.length > 0 && `(${addedTools.length})`}
          </button>
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: 'var(--od-text-xs)',
              color: 'var(--od-text-muted)',
            }}
          >
            Scroll: {scrollY}px | Header: {isVisible ? 'Visible' : 'Hidden'}
          </span>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--od-bg-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--od-text-tertiary)',
              fontSize: 'var(--od-text-sm)',
              fontWeight: 'var(--od-font-medium)',
            }}
          >
            PG
          </div>
        </div>
      </header>

      {/* =================================================================
          MAIN CONTENT
          ================================================================= */}
      <main
        style={{
          paddingTop: 'calc(var(--od-header-height, 56px) + 24px)',
          minHeight: '100vh',
        }}
      >
        {activeView === 'setup' ? (
          <SetupViewV2
            tools={error ? [] : demoTools}
            addedTools={addedTools}
            onAddTool={handleAddTool}
            onRemoveTool={handleRemoveTool}
            onGuidedProfile={handleGuidedProfile}
            onOpenAIChat={handleOpenAIChat}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <div className="od-v2 p-4 md:p-6" style={{ background: 'var(--od-bg-base)' }}>
            <DecisionHubV2
              tools={addedTools}
              criteria={demoCriteria}
              onRemoveProduct={handleRemoveTool}
              onAddProduct={() => setActiveView('setup')}
              onRatingClick={(tool, criterionId, rating) => {
                const criterionName = demoCriteria.find(c => c.id === criterionId)?.name || criterionId;
                alert(
                  `Scout AI: Explaining ${tool.name}'s ${criterionName} rating\n\n` +
                  `Rating: ${rating}/5\n\n` +
                  `This would open the AI panel with context about why ${tool.name} ` +
                  `has a ${rating}/5 rating for ${criterionName}.`
                );
              }}
            />
          </div>
        )}
      </main>

      {/* =================================================================
          DEBUG INFO (bottom left)
          ================================================================= */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          padding: '12px 16px',
          background: 'var(--od-bg-surface)',
          borderRadius: 'var(--od-radius-md)',
          boxShadow: 'var(--od-shadow-md)',
          fontSize: 'var(--od-text-xs)',
          color: 'var(--od-text-tertiary)',
          zIndex: 80,
          maxWidth: '200px',
        }}
      >
        <strong style={{ color: 'var(--od-text-primary)' }}>V2 Demo</strong>
        <br />
        Added: {addedTools.length} tools
        <br />
        <span style={{ color: 'var(--od-scout)' }}>Scroll down to test header</span>

        {/* State toggles */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => { setIsLoading(!isLoading); setError(null); }}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              background: isLoading ? 'var(--od-scout)' : 'var(--od-bg-sunken)',
              color: isLoading ? 'white' : 'var(--od-text-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isLoading ? '⏳ Loading ON' : 'Toggle Loading'}
          </button>
          <button
            onClick={() => { setError(error ? null : 'Network error: Failed to fetch tools'); setIsLoading(false); }}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              background: error ? 'var(--od-error)' : 'var(--od-bg-sunken)',
              color: error ? 'white' : 'var(--od-text-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {error ? '❌ Error ON' : 'Toggle Error'}
          </button>
        </div>
      </div>
    </div>
  );
}
