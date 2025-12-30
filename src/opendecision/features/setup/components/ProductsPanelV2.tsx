'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Tool } from '@/opendecision/shared/types';
import { Search, Plus, X, ChevronDown, AlertCircle, RefreshCw, Package, Check } from 'lucide-react';
import { ScoutCompassIcon } from '@/opendecision/shared/components/scout/ScoutCompass';

interface ProductsPanelV2Props {
  tools?: Tool[];
  addedTools?: Tool[];
  onAddTool?: (tool: Tool) => void;
  onRemoveTool?: (toolId: string) => void;
  onAskAboutProducts?: () => void;
  onMatchScoreClick?: (tool: Tool, matchScore: number) => void;
  onRetry?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// =============================================================================
// SKELETON COMPONENTS
// =============================================================================

const ProductCardSkeleton: React.FC = () => (
  <div
    className="animate-pulse"
    style={{
      padding: '16px 20px',
      background: 'var(--od-bg-surface)',
      borderRadius: 'var(--od-radius-lg)',
      boxShadow: 'var(--od-shadow-md)',
    }}
  >
    <div className="flex items-center gap-4">
      {/* Circular score skeleton */}
      <div
        className="rounded-full"
        style={{
          width: 48,
          height: 48,
          background: 'var(--od-bg-sunken)',
          flexShrink: 0,
        }}
      />
      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div
          style={{
            height: 16,
            width: '60%',
            background: 'var(--od-bg-sunken)',
            borderRadius: 'var(--od-radius-sm)',
          }}
        />
        <div
          style={{
            height: 12,
            width: '40%',
            background: 'var(--od-bg-sunken)',
            borderRadius: 'var(--od-radius-sm)',
          }}
        />
      </div>
      {/* Button skeletons */}
      <div className="flex gap-2">
        <div
          style={{
            width: 64,
            height: 32,
            background: 'var(--od-bg-sunken)',
            borderRadius: 'var(--od-radius-md)',
          }}
        />
        <div
          style={{
            width: 80,
            height: 32,
            background: 'var(--od-bg-sunken)',
            borderRadius: 'var(--od-radius-md)',
          }}
        />
      </div>
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// =============================================================================
// ERROR STATE
// =============================================================================

const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div
    style={{
      padding: '40px 20px',
      textAlign: 'center',
      background: 'var(--od-error-bg)',
      borderRadius: 'var(--od-radius-lg)',
      border: '1px solid var(--od-error)',
    }}
  >
    <AlertCircle
      className="w-12 h-12 mx-auto mb-3"
      style={{ color: 'var(--od-error)' }}
    />
    <h3
      style={{
        fontSize: 'var(--od-text-lg)',
        fontWeight: 'var(--od-font-semibold)',
        color: 'var(--od-text-primary)',
        marginBottom: '8px',
      }}
    >
      Failed to load products
    </h3>
    <p
      style={{
        fontSize: 'var(--od-text-sm)',
        color: 'var(--od-text-secondary)',
        marginBottom: '16px',
      }}
    >
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2"
        style={{
          padding: '8px 16px',
          background: 'var(--od-text-primary)',
          color: 'white',
          borderRadius: 'var(--od-radius-md)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--od-text-sm)',
          fontWeight: 'var(--od-font-medium)',
        }}
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    )}
  </div>
);

// =============================================================================
// EMPTY STATES
// =============================================================================

const EmptyStateNoTools: React.FC = () => (
  <div
    style={{
      padding: '60px 20px',
      textAlign: 'center',
    }}
  >
    <Package
      className="w-16 h-16 mx-auto mb-4"
      style={{ color: 'var(--od-text-muted)', strokeWidth: 1 }}
    />
    <h3
      style={{
        fontSize: 'var(--od-text-lg)',
        fontWeight: 'var(--od-font-semibold)',
        color: 'var(--od-text-primary)',
        marginBottom: '8px',
      }}
    >
      No products available
    </h3>
    <p
      style={{
        fontSize: 'var(--od-text-sm)',
        color: 'var(--od-text-muted)',
        maxWidth: '300px',
        margin: '0 auto',
      }}
    >
      Products will appear here once they&apos;re added to the database.
    </p>
  </div>
);

const EmptyStateNoMatches: React.FC<{ searchQuery: string; onClear: () => void }> = ({
  searchQuery,
  onClear,
}) => (
  <div
    style={{
      padding: '60px 20px',
      textAlign: 'center',
    }}
  >
    <Search
      className="w-16 h-16 mx-auto mb-4"
      style={{ color: 'var(--od-text-muted)', strokeWidth: 1 }}
    />
    <h3
      style={{
        fontSize: 'var(--od-text-lg)',
        fontWeight: 'var(--od-font-semibold)',
        color: 'var(--od-text-primary)',
        marginBottom: '8px',
      }}
    >
      No matches found
    </h3>
    <p
      style={{
        fontSize: 'var(--od-text-sm)',
        color: 'var(--od-text-muted)',
        marginBottom: '16px',
      }}
    >
      No products match &ldquo;<strong style={{ color: 'var(--od-text-secondary)' }}>{searchQuery}</strong>&rdquo;
    </p>
    <button
      onClick={onClear}
      style={{
        padding: '8px 16px',
        background: 'transparent',
        color: 'var(--od-scout)',
        borderRadius: 'var(--od-radius-md)',
        border: '1px solid var(--od-scout)',
        cursor: 'pointer',
        fontSize: 'var(--od-text-sm)',
        fontWeight: 'var(--od-font-medium)',
      }}
    >
      Clear search
    </button>
  </div>
);

// Calculate match score from tool ratings
const calculateMatchScore = (tool: Tool): number => {
  const ratings = tool.ratings;
  if (!ratings) return 50;
  const ratingValues = Object.values(ratings).filter(
    (v): v is number => typeof v === 'number'
  );
  if (ratingValues.length === 0) return 50;
  const avg = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
  return Math.round((avg / 5) * 100);
};

// Circular progress indicator component - clickable to explain match score
const CircularProgress: React.FC<{
  score: number;
  size?: number;
  onClick?: () => void;
  isClickable?: boolean;
}> = ({ score, size = 48, onClick, isClickable = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 80) return '#4BBEB3'; // Scout teal/mint
    if (s >= 70) return '#22C55E'; // Green
    if (s >= 60) return '#F59E0B'; // Amber
    return '#6B7280'; // Gray
  };

  const color = getColor(score);

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!isClickable}
      title={isClickable ? 'Click to see why this score' : undefined}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: isClickable ? 'pointer' : 'default',
        transform: isClickable && isHovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 150ms ease',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--od-bg-sunken, #F3F4F6)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Score text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size > 40 ? '13px' : '11px',
          fontWeight: 600,
          color: color,
        }}
      >
        {score}%
      </div>
      {/* Hover indicator for clickable state */}
      {isClickable && isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: 'var(--od-scout)',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          Why?
        </div>
      )}
    </button>
  );
};

/**
 * ProductsPanelV2 - Redesigned products area (V2)
 *
 * Features:
 * - Products header with "Ask about products" button
 * - Added section (collapsible, max 2 visible with scroll)
 * - Recommended Products section with match scores
 * - Show more tools button
 */
export const ProductsPanelV2: React.FC<ProductsPanelV2Props> = ({
  tools = [],
  addedTools = [],
  onAddTool,
  onRemoveTool,
  onAskAboutProducts,
  onMatchScoreClick,
  onRetry,
  isLoading = false,
  error = null,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pinningItems, setPinningItems] = useState<Set<string>>(new Set());
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  // Handle pinning with animation
  const handlePin = useCallback(
    (tool: Tool) => {
      setPinningItems((prev) => new Set(prev).add(tool.id));
      onAddTool?.(tool);
      setTimeout(() => {
        setPinningItems((prev) => {
          const next = new Set(prev);
          next.delete(tool.id);
          return next;
        });
      }, 600);
    },
    [onAddTool]
  );

  const addedToolIds = new Set(addedTools.map((t) => t.id));
  const isToolAdded = (toolId: string) => addedToolIds.has(toolId);

  // Sort tools by match score (highest first) - keep all tools visible
  type ToolWithScore = Tool & { matchScore: number };
  const availableTools: ToolWithScore[] = tools
    .map((t) => ({ ...t, matchScore: calculateMatchScore(t) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const filteredTools = availableTools.filter((t) =>
    !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn('od-v2 flex flex-col h-full', className)}
      style={{ background: 'transparent' }}
    >
      {/* =================================================================
          HEADER: Products + Ask about products + Search
          ================================================================= */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2
          style={{
            fontSize: 'var(--od-text-lg)',
            fontWeight: 'var(--od-font-semibold)',
            color: 'var(--od-text-primary)',
            margin: 0,
          }}
        >
          Products
        </h2>
        <button
          onClick={onAskAboutProducts}
          className="hidden sm:flex"
          style={{
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: 'var(--od-text-primary)',
            color: 'white',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'var(--od-font-medium)',
          }}
        >
          <ScoutCompassIcon size={14} color="white" />
          Ask about products
        </button>
        {/* Mobile: icon-only button */}
        <button
          onClick={onAskAboutProducts}
          className="flex sm:hidden"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: 'var(--od-text-primary)',
            color: 'white',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Ask about products"
        >
          <ScoutCompassIcon size={16} color="white" />
        </button>
        <div className="relative flex-1 min-w-[150px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--od-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            disabled={isLoading}
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              background: 'var(--od-bg-sunken)',
              border: '1px solid transparent',
              borderRadius: 'var(--od-radius-md)',
              fontSize: '13px',
              color: 'var(--od-text-primary)',
              outline: 'none',
              opacity: isLoading ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      {/* =================================================================
          ADDED SECTION - Minimal horizontal list
          ================================================================= */}
      {addedTools.length > 0 && (
        <div
          className="mb-4 pb-4"
          style={{ borderBottom: '1px solid var(--od-border-divider)' }}
        >
          {/* Added header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 'var(--od-font-medium)',
                  color: 'var(--od-text-secondary)',
                }}
              >
                Added to Decision Hub
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--od-text-muted)',
                }}
              >
                ({addedTools.length})
              </span>
            </div>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--od-scout)',
                fontWeight: 'var(--od-font-medium)',
              }}
            >
              Go to Decision Hub →
            </button>
          </div>

          {/* Added products - simple inline chips */}
          <div className="flex flex-wrap gap-2">
            {addedTools.map((tool) => (
              <div
                key={tool.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'var(--od-bg-surface)',
                  border: '1px solid var(--od-border-default)',
                  borderRadius: 'var(--od-radius-md)',
                  fontSize: '13px',
                  color: 'var(--od-text-primary)',
                }}
              >
                <span style={{ fontWeight: 'var(--od-font-medium)' }}>{tool.name}</span>
                <button
                  onClick={() => onRemoveTool?.(tool.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--od-text-muted)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================
          PRODUCT CARDS - Floating style with circular match scores
          ================================================================= */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Product cards - scrollable container showing exactly 5 at a time */}
        <div
          className="space-y-3 overflow-y-auto products-scroll-container"
          style={{
            maxHeight: '460px', // Fixed height for exactly 5 cards (5 * ~80px card + 4 * 12px gap)
            paddingRight: '4px', // Space for scrollbar
          }}
        >
          {/* Loading State */}
          {isLoading && <LoadingState />}

          {/* Error State */}
          {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}

          {/* Empty State - No tools available */}
          {!isLoading && !error && tools.length === 0 && <EmptyStateNoTools />}

          {/* Empty State - No search matches */}
          {!isLoading && !error && tools.length > 0 && filteredTools.length === 0 && searchQuery && (
            <EmptyStateNoMatches searchQuery={searchQuery} onClear={clearSearch} />
          )}

          {/* Product Cards */}
          {!isLoading && !error && filteredTools.map((tool) => {
            // Use methodologies from tool, limit to 2-3 tags
            const methodologyTags = tool.methodologies?.slice(0, 2) || [];
            const useCaseTags = tool.useCases?.slice(0, 1) || [];
            const displayTags = [...methodologyTags, ...useCaseTags];
            const isHovered = hoveredToolId === tool.id;

            // Get use cases for expanded view
            const expandedUseCases = tool.useCases?.slice(0, 3) || [];
            const expandedFunctions = tool.functions?.slice(0, 2) || [];

            return (
              <article
                key={tool.id}
                onMouseEnter={() => setHoveredToolId(tool.id)}
                onMouseLeave={() => setHoveredToolId(null)}
                style={{
                  padding: '16px 20px',
                  background: 'var(--od-bg-surface)',
                  borderRadius: 'var(--od-radius-lg)',
                  boxShadow: isHovered ? 'var(--od-shadow-lg)' : 'var(--od-shadow-md)',
                  transition: 'box-shadow 200ms ease, transform 200ms ease',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                }}
              >
                {/* Single row: Circle Score, Name + info, buttons */}
                <div className="flex items-center gap-4">
                  {/* Circular Match Score - Clickable to explain */}
                  <CircularProgress
                    score={tool.matchScore}
                    size={48}
                    isClickable={!!onMatchScoreClick}
                    onClick={() => onMatchScoreClick?.(tool, tool.matchScore)}
                  />

                  {/* Name and meta info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 'var(--od-font-semibold)',
                          color: 'var(--od-text-primary)',
                        }}
                      >
                        {tool.name}
                      </span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--od-text-muted)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--od-text-muted)' }}>
                        {tool.type || 'application'}
                      </span>
                      {displayTags.length > 0 && (
                        <>
                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--od-text-muted)' }} />
                          <span style={{ fontSize: '13px', color: 'var(--od-text-muted)' }}>
                            {displayTags.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isToolAdded(tool.id) ? (
                      <button
                        onClick={() => onRemoveTool?.(tool.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#10B981',
                          border: '1px solid #10B981',
                          borderRadius: 'var(--od-radius-md)',
                          fontSize: '13px',
                          color: 'white',
                          fontWeight: 'var(--od-font-medium)',
                          cursor: 'pointer',
                        }}
                      >
                        <Check className="w-4 h-4" />
                        Added
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePin(tool)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'transparent',
                          border: '1px solid var(--od-border-strong)',
                          borderRadius: 'var(--od-radius-md)',
                          fontSize: '13px',
                          color: 'var(--od-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    )}
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: 'var(--od-scout)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--od-radius-md)',
                        fontSize: '13px',
                        fontWeight: 'var(--od-font-medium)',
                        cursor: 'pointer',
                      }}
                    >
                      Try Free
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded details on hover */}
                <div
                  style={{
                    maxHeight: isHovered ? '100px' : '0',
                    opacity: isHovered ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 200ms ease, opacity 200ms ease',
                    marginTop: isHovered ? '12px' : '0',
                    paddingTop: isHovered ? '12px' : '0',
                    borderTop: isHovered ? '1px solid var(--od-border-divider)' : 'none',
                  }}
                >
                  {(expandedUseCases.length > 0 || expandedFunctions.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {expandedUseCases.map((useCase, idx) => (
                        <span
                          key={`uc-${idx}`}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--od-bg-sunken)',
                            borderRadius: 'var(--od-radius-sm)',
                            fontSize: '12px',
                            color: 'var(--od-text-secondary)',
                          }}
                        >
                          {useCase}
                        </span>
                      ))}
                      {expandedFunctions.map((func, idx) => (
                        <span
                          key={`fn-${idx}`}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--od-scout-bg)',
                            borderRadius: 'var(--od-radius-sm)',
                            fontSize: '12px',
                            color: 'var(--od-scout)',
                          }}
                        >
                          {func}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default ProductsPanelV2;
