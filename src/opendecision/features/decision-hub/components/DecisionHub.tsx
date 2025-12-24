'use client';

import React, { useMemo } from 'react';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { calculateWeightedScore } from '@/opendecision/shared/utils/toolRating';
import { Trash2, ExternalLink } from 'lucide-react';

interface DecisionHubProps {
  tools: Tool[];
  criteria: Criterion[];
  onAddProduct: () => void;
  onRemoveProduct?: (toolId: string) => void;
  onViewTool?: (toolId: string) => void;
}

// Mock data for fields not yet in database
const mockProductData: Record<string, {
  category: string;
  userCount: string;
  startingPrice: string;
  easeOfUse: number;
  customerRating: number;
  integrations: { name: string; color: string; icon: string }[];
}> = {
  'microsoft-project': {
    category: 'Enterprise Resource Planning',
    userCount: '500+',
    startingPrice: '$30/user/mo',
    easeOfUse: 3.9,
    customerRating: 4.4,
    integrations: [
      { name: 'Teams', color: '#6264A7', icon: 'T' },
      { name: 'Office', color: '#D83B01', icon: 'O' },
      { name: 'Power BI', color: '#F2C811', icon: 'P' },
    ],
  },
  'smartsheet': {
    category: 'Work Execution Platform',
    userCount: '10-1000',
    startingPrice: '$7/user/mo',
    easeOfUse: 4.5,
    customerRating: 4.5,
    integrations: [
      { name: 'Google', color: '#EA4335', icon: 'G' },
      { name: 'Slack', color: '#4A154B', icon: 'S' },
      { name: 'Salesforce', color: '#00A1E0', icon: 'S' },
    ],
  },
  'asana': {
    category: 'Work Management',
    userCount: '1-500',
    startingPrice: '$10.99/user/mo',
    easeOfUse: 4.6,
    customerRating: 4.3,
    integrations: [
      { name: 'Slack', color: '#4A154B', icon: 'S' },
      { name: 'Google', color: '#EA4335', icon: 'G' },
      { name: 'Zoom', color: '#2D8CFF', icon: 'Z' },
    ],
  },
  'monday': {
    category: 'Work OS',
    userCount: '10-500',
    startingPrice: '$9/user/mo',
    easeOfUse: 4.7,
    customerRating: 4.6,
    integrations: [
      { name: 'Slack', color: '#4A154B', icon: 'S' },
      { name: 'Zoom', color: '#2D8CFF', icon: 'Z' },
      { name: 'Gmail', color: '#EA4335', icon: 'G' },
    ],
  },
  'clickup': {
    category: 'Productivity Platform',
    userCount: '1-1000',
    startingPrice: '$7/user/mo',
    easeOfUse: 4.2,
    customerRating: 4.7,
    integrations: [
      { name: 'Slack', color: '#4A154B', icon: 'S' },
      { name: 'GitHub', color: '#181717', icon: 'G' },
      { name: 'Figma', color: '#F24E1E', icon: 'F' },
    ],
  },
  'jira': {
    category: 'Issue Tracking',
    userCount: '10-10000',
    startingPrice: '$8.15/user/mo',
    easeOfUse: 3.8,
    customerRating: 4.2,
    integrations: [
      { name: 'Confluence', color: '#172B4D', icon: 'C' },
      { name: 'Bitbucket', color: '#0052CC', icon: 'B' },
      { name: 'Slack', color: '#4A154B', icon: 'S' },
    ],
  },
};

// Default mock data for tools not in the map
const defaultMockData = {
  category: 'Project Management',
  userCount: '1-500',
  startingPrice: '$10/user/mo',
  easeOfUse: 4.0,
  customerRating: 4.0,
  integrations: [
    { name: 'Slack', color: '#4A154B', icon: 'S' },
    { name: 'Google', color: '#EA4335', icon: 'G' },
    { name: 'Zoom', color: '#2D8CFF', icon: 'Z' },
  ],
};

function getProductData(toolId: string) {
  return mockProductData[toolId] || defaultMockData;
}

function getToolInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getToolColor(index: number): string {
  const colors = ['#374151', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
  return colors[index % colors.length];
}

export function DecisionHub({ tools, criteria, onAddProduct, onRemoveProduct, onViewTool }: DecisionHubProps) {
  // Deduplicate tools by ID (safety net)
  const uniqueTools = useMemo(() => {
    const seen = new Set<string>();
    return tools.filter(tool => {
      if (seen.has(tool.id)) {
        return false;
      }
      seen.add(tool.id);
      return true;
    });
  }, [tools]);

  return (
    <div className="bg-white rounded-lg">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider w-[280px]">
                Product
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Your Match
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                User Count
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Starting Price
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Ease of Use
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Customer Rating
              </th>
              <th className="text-left py-4 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Integrations
              </th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {uniqueTools.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-500">
                  No products added to compare yet. Add products from the Setup tab.
                </td>
              </tr>
            ) : (
              uniqueTools.map((tool, index) => {
                const mockData = getProductData(tool.id);
                const matchScore = Math.round(calculateWeightedScore(tool, criteria) * 10);

                return (
                  <tr key={tool.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors group">
                    {/* Product Cell */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: getToolColor(index) }}
                        >
                          {getToolInitial(tool.name)}
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <button
                              onClick={() => onViewTool?.(tool.id)}
                              className="text-sm font-medium text-neutral-900 underline hover:text-neutral-700 flex items-center gap-1"
                            >
                              {tool.name}
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </button>
                            <p className="text-xs text-neutral-500">{mockData.category}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Your Match Cell */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0D9488] rounded-full"
                            style={{ width: `${matchScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{matchScore}%</span>
                      </div>
                    </td>

                    {/* User Count Cell */}
                    <td className="py-4 px-4">
                      <span className="text-sm text-neutral-600">{mockData.userCount}</span>
                    </td>

                    {/* Starting Price Cell */}
                    <td className="py-4 px-4">
                      <span className="text-sm text-neutral-600">{mockData.startingPrice}</span>
                    </td>

                    {/* Ease of Use Cell */}
                    <td className="py-4 px-4">
                      <span className="text-sm text-neutral-600">{mockData.easeOfUse} / 5</span>
                    </td>

                    {/* Customer Rating Cell */}
                    <td className="py-4 px-4">
                      <span className="text-sm text-neutral-600">{mockData.customerRating} / 5</span>
                    </td>

                    {/* Integrations Cell */}
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {mockData.integrations.map((integration, i) => (
                          <div
                            key={integration.name}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                            style={{
                              backgroundColor: integration.color,
                              marginLeft: i > 0 ? '-4px' : '0',
                              zIndex: mockData.integrations.length - i,
                            }}
                            title={integration.name}
                          >
                            {integration.icon}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Actions Cell */}
                    <td className="py-4 px-2">
                      {onRemoveProduct && (
                        <button
                          onClick={() => onRemoveProduct(tool.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Button */}
      <div className="flex justify-center py-8">
        <button
          onClick={onAddProduct}
          className="px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Another Product to Compare
        </button>
      </div>
    </div>
  );
}
