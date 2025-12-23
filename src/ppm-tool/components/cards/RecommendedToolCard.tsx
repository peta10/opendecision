'use client';

import React from 'react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { cn } from '@/ppm-tool/shared/lib/utils';

interface RecommendedToolCardProps {
  tool: Tool;
  selectedCriteria: Criterion[];
  matchScore: number;
  onSelect?: () => void;
  onViewDetails?: () => void;
  onBookmark?: () => void;
  isSelected?: boolean;
  isBookmarked?: boolean;
}

// Helper to get tool info (simulated - would come from tool data)
const getToolInfo = (tool: Tool) => {
  const toolData: Record<string, { company: string; rating: number; reviews: string; minUsers: string; maxUsers: string; price: string }> = {
    'Jira Software': { company: 'Atlassian', rating: 4.4, reviews: '2.1k', minUsers: '10', maxUsers: '5000', price: '$7/user/month' },
    'Asana': { company: 'Asana Inc.', rating: 4.5, reviews: '1.8k', minUsers: '1', maxUsers: '1000', price: '$10.99/user/month' },
    'Monday.com': { company: 'monday.com', rating: 4.6, reviews: '3.2k', minUsers: '3', maxUsers: '5000', price: '$9/user/month' },
    'ClickUp': { company: 'ClickUp', rating: 4.7, reviews: '2.5k', minUsers: '1', maxUsers: '1000', price: '$7/user/month' },
    'Smartsheet': { company: 'Smartsheet Inc.', rating: 4.4, reviews: '1.5k', minUsers: '1', maxUsers: '10000', price: '$9/user/month' },
    'Airtable': { company: 'Airtable', rating: 4.6, reviews: '2.0k', minUsers: '1', maxUsers: '500', price: '$20/user/month' },
    'Wrike': { company: 'Wrike Inc.', rating: 4.3, reviews: '1.2k', minUsers: '5', maxUsers: '5000', price: '$9.80/user/month' },
    'Basecamp': { company: 'Basecamp LLC', rating: 4.3, reviews: '900', minUsers: '1', maxUsers: '500', price: '$99/month flat' },
    'Notion': { company: 'Notion Labs', rating: 4.7, reviews: '3.0k', minUsers: '1', maxUsers: '1000', price: '$8/user/month' },
    'Trello': { company: 'Atlassian', rating: 4.4, reviews: '2.8k', minUsers: '1', maxUsers: '500', price: '$5/user/month' },
    'Azure DevOps': { company: 'Microsoft', rating: 4.3, reviews: '1.1k', minUsers: '5', maxUsers: '10000', price: '$6/user/month' },
  };

  return toolData[tool.name] || {
    company: 'Unknown',
    rating: 4.0,
    reviews: '0',
    minUsers: '1',
    maxUsers: '100',
    price: 'Contact for pricing'
  };
};

// Get tool description (simulated)
const getToolDescription = (tool: Tool): string => {
  const descriptions: Record<string, string> = {
    'Jira Software': 'Agile project management tool designed for software teams with sprint planning, backlog management, and real-time reporting.',
    'Asana': 'Work management platform for organizing tasks, projects, and workflows with timeline views and team collaboration features.',
    'Monday.com': 'Visual project management with customizable workflows, automations, and integrations for teams of all sizes.',
    'ClickUp': 'All-in-one productivity platform combining tasks, docs, goals, and chat with powerful customization options.',
    'Smartsheet': 'Enterprise work management with spreadsheet-like interface, automation, and resource management capabilities.',
    'Airtable': 'Flexible database and spreadsheet hybrid for building custom applications and workflows.',
    'Wrike': 'Versatile project management with real-time collaboration, Gantt charts, and workload management.',
    'Basecamp': 'Simple project management and team communication tool focused on reducing complexity.',
    'Notion': 'All-in-one workspace for notes, docs, wikis, and project management with flexible building blocks.',
    'Trello': 'Visual Kanban-style boards for simple task and project organization with easy drag-and-drop.',
    'Azure DevOps': 'Comprehensive DevOps platform with CI/CD pipelines, repos, and agile planning tools.',
  };

  return descriptions[tool.name] || 'Project management and collaboration tool for teams.';
};

// Get methodology tags from tool data
const getMethodologyTags = (tool: Tool): string[] => {
  if (tool.methodologies && tool.methodologies.length > 0) {
    return tool.methodologies.slice(0, 3);
  }
  return ['Project Management'];
};

export const RecommendedToolCard: React.FC<RecommendedToolCardProps> = ({
  tool,
  selectedCriteria,
  matchScore,
  onSelect,
  onViewDetails,
  onBookmark,
  isSelected = false,
  isBookmarked = false,
}) => {
  const toolInfo = getToolInfo(tool);
  const description = getToolDescription(tool);
  const tags = getMethodologyTags(tool);

  return (
    <div className="bg-white border border-neutral-300 rounded-lg p-4 hover:border-neutral-400 transition-colors">
      <div className="flex gap-3">
        {/* Tool Icon - Compact */}
        <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>

        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-medium text-neutral-900">{tool.name}</h3>
              <p className="text-xs text-neutral-500">by {toolInfo.company}</p>
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-neutral-900 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-neutral-900">{toolInfo.rating}</span>
              <span className="text-xs text-neutral-400">({toolInfo.reviews})</span>
            </div>
          </div>

          {/* Description - Single line with ellipsis */}
          <p className="text-xs text-neutral-600 mb-2 line-clamp-2">
            {description}
          </p>

          {/* Tags and View Details Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1.5">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={onViewDetails}
              className="text-xs text-neutral-900 hover:underline flex items-center gap-0.5"
            >
              View details
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Footer Row - Compact */}
          <div className="flex items-center gap-3 pt-2 border-t border-neutral-200">
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {toolInfo.minUsers}-{toolInfo.maxUsers} users
            </div>
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {toolInfo.price}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={onBookmark}
                className={cn(
                  'w-7 h-7 flex items-center justify-center border border-neutral-300 rounded hover:bg-neutral-50 transition-colors',
                  isBookmarked && 'bg-neutral-100'
                )}
              >
                <svg className={cn('w-3.5 h-3.5 text-neutral-500', isBookmarked && 'fill-current')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </button>
              <button
                onClick={onSelect}
                className={cn(
                  'px-3 py-1 text-xs rounded transition-colors',
                  isSelected
                    ? 'bg-neutral-200 text-neutral-700'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                )}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendedToolCard;
