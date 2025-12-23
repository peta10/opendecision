'use client';

import React, { useState, useMemo } from 'react';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { cn } from '@/opendecision/shared/lib/utils';

interface RecommendedToolsSectionProps {
  tools: Tool[];
  selectedCriteria: Criterion[];
  selectedToolIds: Set<string>;
  bookmarkedToolIds: Set<string>;
  onToolSelect: (tool: Tool) => void;
  onToolBookmark: (tool: Tool) => void;
  onToolViewDetails: (tool: Tool) => void;
}

// Helper to get match score for a tool
const getMatchScore = (toolName: string): number => {
  const scores: Record<string, number> = {
    'Jira Software': 92,
    'Monday.com': 89,
    'Asana': 87,
    'ClickUp': 85,
    'Smartsheet': 82,
    'Notion': 80,
    'Airtable': 78,
    'Wrike': 76,
    'Trello': 74,
    'Basecamp': 72,
    'Azure DevOps': 70,
  };
  return scores[toolName] || Math.floor(Math.random() * 30) + 60;
};

// Get tool company info
const getToolCompany = (toolName: string): string => {
  const companies: Record<string, string> = {
    'Jira Software': 'Atlassian',
    'Monday.com': 'monday.com',
    'Asana': 'Asana Inc.',
    'ClickUp': 'ClickUp',
    'Smartsheet': 'Smartsheet Inc.',
    'Notion': 'Notion Labs',
    'Airtable': 'Airtable',
    'Wrike': 'Wrike Inc.',
    'Trello': 'Atlassian',
    'Basecamp': 'Basecamp LLC',
    'Azure DevOps': 'Microsoft',
  };
  return companies[toolName] || 'Unknown';
};

export const RecommendedToolsSection: React.FC<RecommendedToolsSectionProps> = ({
  tools,
  selectedCriteria,
  selectedToolIds,
  bookmarkedToolIds,
  onToolSelect,
  onToolBookmark,
  onToolViewDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get added tools (selected ones)
  const addedTools = useMemo(() => {
    return tools.filter(tool => selectedToolIds.has(tool.id));
  }, [tools, selectedToolIds]);

  // Filter recommended tools based on search query (excluding added ones)
  const recommendedTools = useMemo(() => {
    let result = tools.filter(tool => !selectedToolIds.has(tool.id));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tool =>
        tool.name.toLowerCase().includes(query)
      );
    }

    // Sort by match score
    return result.sort((a, b) => getMatchScore(b.name) - getMatchScore(a.name));
  }, [tools, searchQuery, selectedToolIds]);

  const removeAddedTool = (tool: Tool) => {
    onToolSelect(tool); // Toggle selection off
  };

  return (
    <section className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-900">Products</h2>
          <button className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Ask about products
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5BDFC2]/30 focus:border-[#5BDFC2] placeholder:text-neutral-400 transition-all"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Added Section */}
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">Added</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
                {addedTools.length}
              </span>
            </div>
            {addedTools.length > 0 && (
              <a href="#" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors">
                Go to DecisionHub
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            )}
          </div>

          {addedTools.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">No products added yet</p>
          ) : (
            <div className="space-y-2">
              {addedTools.map(tool => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{tool.name}</p>
                      <p className="text-xs text-neutral-500">{getToolCompany(tool.name)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAddedTool(tool)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Products Section */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">Recommended Products</span>
              <span className="px-2 py-0.5 bg-[#5BDFC2]/10 text-[#0D9488] text-xs font-medium rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Strong match
              </span>
            </div>
          </div>

          {recommendedTools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400 text-sm">No products match your search.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-neutral-700 font-medium hover:text-neutral-900 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedTools.slice(0, 6).map(tool => {
                const matchScore = getMatchScore(tool.name);
                return (
                  <div
                    key={tool.id}
                    className="bg-white border border-neutral-100 rounded-xl p-4 hover:shadow-md hover:border-neutral-200 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="text-sm font-medium text-neutral-900">{tool.name}</h3>
                            <p className="text-xs text-neutral-500">{getToolCompany(tool.name)}</p>
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#5BDFC2]/10 rounded-lg">
                            <span className="text-xs font-medium text-[#0D9488]">Match</span>
                            <span className="text-xs font-bold text-[#0D9488]">{matchScore}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => onToolViewDetails(tool)}
                            className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                          >
                            View details
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onToolSelect(tool)}
                            className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add to DecisionHub
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecommendedToolsSection;
