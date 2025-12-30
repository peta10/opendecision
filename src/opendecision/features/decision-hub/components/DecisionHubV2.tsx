'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Tool, Criterion } from '@/opendecision/shared/types';
import {
  Plus,
  ChevronDown,
  MoreHorizontal,
  Star,
  Trash2,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { ScoutCompassIcon } from '@/opendecision/shared/components/scout/ScoutCompass';

// =============================================================================
// TYPES
// =============================================================================

interface DecisionHubV2Props {
  tools: Tool[];
  criteria: Criterion[];
  onRemoveProduct?: (toolId: string) => void;
  onAddProduct?: () => void;
  onRatingClick?: (tool: Tool, criterionId: string, rating: number) => void;
  onRatingOverride?: (toolId: string, criterionId: string, newRating: number) => void;
  onNotesChange?: (toolId: string, notes: string) => void;
  className?: string;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

// Simple rating display (Google-style minimal)
const SimpleRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center gap-1.5">
      <Star className="w-4 h-4 fill-current text-gray-400" />
      <span className="text-sm text-gray-600 font-medium">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

// Simple rank badge (Google-style)
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  // First place gets emerald highlight, others are gray
  const isFirst = rank === 1;

  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
        isFirst ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
      )}
    >
      {rank}
    </div>
  );
};

// Simple score pill (Google-style flat design)
const ScorePill: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({ score, size = 'md' }) => {
  // Simple color based on score - using our emerald palette
  const getColors = (s: number) => {
    if (s >= 80) return { bg: '#10B981', text: '#FFF' }; // Emerald
    if (s >= 60) return { bg: '#6EE7B7', text: '#065F46' }; // Light emerald
    return { bg: '#E5E7EB', text: '#374151' }; // Gray
  };

  const colors = getColors(score);
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      className="inline-flex items-center rounded-full font-medium"
      style={{
        background: colors.bg,
        color: colors.text,
        padding,
        fontSize,
      }}
    >
      {score}%
    </span>
  );
};

// Criteria rating cell with visual bar (Google-style minimal)
const CriteriaCell: React.FC<{
  rating: number;
  criterionName: string;
  onClick?: () => void;
}> = ({ rating, criterionName, onClick }) => {
  // Simple emerald gradient based on rating
  const getBarColor = (r: number) => {
    if (r >= 4) return '#10B981'; // Dark emerald
    if (r >= 3) return '#6EE7B7'; // Light emerald
    return '#D1D5DB'; // Gray for low ratings
  };

  const percentage = (rating / 5) * 100;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
      title={`${criterionName}: ${rating.toFixed(1)}/5`}
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-[60px]">
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                background: getBarColor(rating),
              }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 tabular-nums w-6 text-right">
          {rating.toFixed(1)}
        </span>
      </div>
    </button>
  );
};

// =============================================================================
// PRODUCT ROW
// =============================================================================

interface ProductRowProps {
  tool: Tool;
  criteria: Criterion[];
  rank: number;
  score: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  onRatingClick?: (criterionId: string, rating: number) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  tool,
  criteria,
  rank,
  score,
  isExpanded,
  onToggle,
  onRemove,
  onRatingClick,
}) => {
  const [showActions, setShowActions] = useState(false);

  // Simple muted avatar colors (Google-style)
  const avatarColors = [
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
  ];

  const avatarBg = avatarColors[rank % avatarColors.length];

  const getRating = (criterionId: string): number => {
    return (
      tool.ratings?.[criterionId] ||
      tool.ratings?.[criteria.find(c => c.id === criterionId)?.name || ''] ||
      tool.criteria?.find((c) => c.id === criterionId)?.ranking ||
      3
    );
  };

  return (
    <>
      <tr
        className={cn(
          'group transition-colors cursor-pointer',
          isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/50'
        )}
        onClick={onToggle}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Rank */}
        <td className="py-3 pl-4 pr-2 w-10">
          <RankBadge rank={rank} />
        </td>

        {/* Product Info */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-3">
            {/* Expand chevron */}
            <div className="w-4 flex-shrink-0">
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  !isExpanded && "-rotate-90"
                )}
              />
            </div>

            {/* Avatar - simple rounded square */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ background: avatarBg }}
            >
              {tool.name.charAt(0).toUpperCase()}
            </div>

            {/* Name & Type */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {tool.name}
                </span>
                {rank === 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Top Pick
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {tool.type || 'application'}
              </span>
            </div>
          </div>
        </td>

        {/* Match Score */}
        <td className="py-3 px-3">
          <ScorePill score={score} />
        </td>

        {/* Simple Rating */}
        <td className="py-3 px-3">
          <SimpleRating rating={score / 20} />
        </td>

        {/* Criteria Ratings */}
        {criteria.slice(0, 4).map((criterion) => {
          const rating = getRating(criterion.id);
          return (
            <td key={criterion.id} className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
              <CriteriaCell
                rating={rating}
                criterionName={criterion.name}
                onClick={() => onRatingClick?.(criterion.id, rating)}
              />
            </td>
          );
        })}

        {/* Actions */}
        <td className="py-4 pr-5 pl-2 w-20">
          <div
            className={cn(
              'flex items-center gap-1 transition-opacity',
              showActions ? 'opacity-100' : 'opacity-0'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={7 + Math.min(criteria.length, 4)} className="py-4 px-4">
            <div className="ml-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* All Criteria Scores */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  All Criteria Scores
                </h4>
                <div className="space-y-2">
                  {criteria.map((criterion) => {
                    const rating = getRating(criterion.id);
                    const barColor = rating >= 4 ? '#10B981' : rating >= 3 ? '#6EE7B7' : '#D1D5DB';
                    return (
                      <div key={criterion.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate flex-1 mr-3">
                          {criterion.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(rating / 5) * 100}%`,
                                background: barColor,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right">
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Use Cases */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Use Cases
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(tool.useCases || []).slice(0, 5).map((useCase, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600"
                    >
                      {useCase}
                    </span>
                  ))}
                  {(!tool.useCases || tool.useCases.length === 0) && (
                    <span className="text-xs text-gray-400">No use cases listed</span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Quick Actions
                </h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => onRatingClick?.('overall', score)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <ScoutCompassIcon size={14} color="#10B981" />
                    Ask Scout about this
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    Add Notes
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const DecisionHubV2: React.FC<DecisionHubV2Props> = ({
  tools,
  criteria,
  onRemoveProduct,
  onAddProduct,
  onRatingClick,
  onRatingOverride,
  onNotesChange,
  className,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculate scores and sort
  const rankedTools = useMemo(() => {
    const withScores = tools.map((tool) => {
      let total = 0;
      let count = 0;
      criteria.forEach((criterion) => {
        const rating =
          tool.ratings?.[criterion.id] ||
          tool.ratings?.[criterion.name] ||
          tool.criteria?.find((c) => c.id === criterion.id)?.ranking ||
          3;
        total += rating;
        count++;
      });
      const avg = count > 0 ? total / count : 3;
      const score = Math.round((avg / 5) * 100);
      return { tool, score };
    });
    return withScores.sort((a, b) => b.score - a.score);
  }, [tools, criteria]);

  // Empty state
  if (tools.length === 0) {
    return (
      <div
        className={cn('od-v2', className)}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '80px 40px',
          textAlign: 'center',
        }}
      >
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)' }}
        >
          <Plus className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No products to compare yet
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Add products from Decision Framing to start comparing them against your criteria.
        </p>
        {onAddProduct && (
          <button
            onClick={onAddProduct}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #4BBEB3 0%, #38A89D 100%)' }}
          >
            <Plus className="w-5 h-5" />
            Add Products
          </button>
        )}
      </div>
    );
  }

  const displayCriteria = criteria.slice(0, 4);

  return (
    <div
      className={cn('od-v2', className)}
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #F3F4F6' }}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Decision Hub
          </h2>
          <p className="text-sm text-gray-500">
            {tools.length} product{tools.length !== 1 ? 's' : ''} • {criteria.length} criteria
          </p>
        </div>
        {onAddProduct && (
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
            style={{ background: '#111827' }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <th className="py-3 pl-5 pr-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                Product
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Match
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              {displayCriteria.map((criterion) => (
                <th
                  key={criterion.id}
                  className="py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  title={criterion.description}
                >
                  {criterion.name.length > 12 ? criterion.name.substring(0, 12) + '...' : criterion.name}
                </th>
              ))}
              <th className="py-3 pr-5 pl-2 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rankedTools.map(({ tool, score }, index) => (
              <ProductRow
                key={tool.id}
                tool={tool}
                criteria={criteria}
                rank={index + 1}
                score={score}
                isExpanded={expandedId === tool.id}
                onToggle={() => setExpandedId(expandedId === tool.id ? null : tool.id)}
                onRemove={onRemoveProduct ? () => onRemoveProduct(tool.id) : undefined}
                onRatingClick={(criterionId, rating) => onRatingClick?.(tool, criterionId, rating)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with legend */}
      <div
        className="flex items-center justify-between px-4 py-2.5 text-xs text-gray-400"
        style={{ borderTop: '1px solid #F3F4F6' }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Excellent (4+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            Good (3-4)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            Needs Improvement
          </span>
        </div>
        <span>Click any rating for AI insights</span>
      </div>
    </div>
  );
};

export default DecisionHubV2;
