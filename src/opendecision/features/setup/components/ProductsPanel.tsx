'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/opendecision/shared/lib/utils';
import { Tool } from '@/opendecision/shared/types';
import { MatchScoreRing } from '@/opendecision/shared/components/ui/match-score-ring';
import { ChevronDown, Search, Plus, X, Check } from 'lucide-react';

interface ProductsPanelProps {
  tools?: Tool[];
  addedTools?: Tool[];
  onAddTool?: (tool: Tool) => void;
  onRemoveTool?: (toolId: string) => void;
  onAskAboutProducts?: () => void;
  className?: string;
}

// Extended tool type with brand color
interface ToolWithBrand extends Tool {
  brandColor?: string;
}

// Calculate match score from tool ratings
const calculateMatchScore = (tool: Tool): number => {
  const ratings = tool.ratings;
  if (!ratings) return 50; // Default if no ratings

  // Get all numeric rating values
  const ratingValues = Object.values(ratings).filter(
    (v): v is number => typeof v === 'number'
  );

  if (ratingValues.length === 0) return 50;

  // Average of ratings (assuming 1-5 scale) converted to percentage
  const avg = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
  return Math.round((avg / 5) * 100);
};

// Demo product data with brand colors
const demoProducts: Array<{
  id: string;
  name: string;
  matchScore: number;
  brandColor: string;
}> = [
  {
    id: 'monday',
    name: 'Monday.com',
    matchScore: 92,
    brandColor: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
  },
  {
    id: 'asana',
    name: 'Asana',
    matchScore: 87,
    brandColor: 'linear-gradient(135deg, #F06A6A 0%, #FFB7B7 100%)',
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    matchScore: 85,
    brandColor: 'linear-gradient(135deg, #7B68EE 0%, #9B8FFF 100%)',
  },
  {
    id: 'jira',
    name: 'Jira',
    matchScore: 78,
    brandColor: 'linear-gradient(135deg, #0052CC 0%, #4C9AFF 100%)',
  },
  {
    id: 'smartsheet',
    name: 'Smartsheet',
    matchScore: 72,
    brandColor: 'linear-gradient(135deg, #1D6F42 0%, #26A96C 100%)',
  },
];

/**
 * ProductsPanel - Premium glassmorphism right sidebar
 *
 * Features:
 * - Glass panel styling with depth
 * - Collapsible Added section
 * - Match score rings with color coding
 * - Brand color logos
 * - Hover animations
 */
export const ProductsPanel: React.FC<ProductsPanelProps> = ({
  tools = [],
  addedTools = [],
  onAddTool,
  onRemoveTool,
  onAskAboutProducts,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddedExpanded, setIsAddedExpanded] = useState(true);
  // Track items that are currently being "pinned" (animating)
  const [pinningItems, setPinningItems] = useState<Set<string>>(new Set());

  // Handle pinning with animation
  const handlePin = useCallback((tool: Tool) => {
    // Add to pinning set to trigger animation
    setPinningItems(prev => new Set(prev).add(tool.id));

    // Call the actual add function
    onAddTool?.(tool);

    // Remove from pinning set after animation completes
    setTimeout(() => {
      setPinningItems(prev => {
        const next = new Set(prev);
        next.delete(tool.id);
        return next;
      });
    }, 600); // Match animation duration
  }, [onAddTool]);

  // Filter products based on search
  const filterProducts = <T extends { name: string }>(products: T[]) => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredDemoProducts = filterProducts(demoProducts);
  const filteredTools = filterProducts(tools as ToolWithBrand[]);

  return (
    <div
      className={cn(
        'glass-panel p-6 animate-slide-up animate-delay-100 flex flex-col h-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-[#0B1E2D]">Products</h2>
        <button
          onClick={onAskAboutProducts}
          className="btn-press px-4 py-2 bg-transparent text-[#4BBEB3] border border-[#6EDCD1] rounded-xl text-sm font-medium hover:bg-[#6EDCD1] hover:text-[#0B1E2D] transition-all hover:shadow-md"
        >
          Ask about products
        </button>
      </div>

      {/* Search with icon */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8D9C]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="focus-ring w-full bg-[#f5f7f7] border border-[rgba(11,30,45,0.12)] rounded-xl pl-11 pr-4 py-3 text-sm text-[#0B1E2D] outline-none transition-all placeholder:text-[#7A8D9C] hover:border-[#6EDCD1] focus:border-[#6EDCD1] focus:bg-white focus:shadow-sm"
        />
      </div>

      {/* Added Section - Collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setIsAddedExpanded(!isAddedExpanded)}
          className="flex items-center justify-between w-full text-left mb-3 group"
        >
          <span className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide">
            Added ({addedTools.length})
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#7A8D9C] transition-transform group-hover:text-[#4BBEB3]',
              isAddedExpanded && 'rotate-180'
            )}
          />
        </button>

        {isAddedExpanded && (
          <div className="space-y-2">
            {addedTools.length === 0 ? (
              <div className="text-sm text-[#7A8D9C] italic py-2 px-3 bg-[#f5f7f7] rounded-lg border border-dashed border-[rgba(11,30,45,0.12)]">
                No products added yet
              </div>
            ) : (
              addedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between bg-[#6EDCD1]/10 border border-[#6EDCD1]/30 rounded-lg px-3 py-2 group"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md"
                      style={{
                        background:
                          (tool as ToolWithBrand).brandColor ||
                          'linear-gradient(135deg, #6EDCD1, #4BBEB3)',
                      }}
                    />
                    <span className="text-sm font-medium text-[#0B1E2D]">
                      {tool.name}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveTool?.(tool.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(11,30,45,0.08)] to-transparent mb-6" />

      {/* Recommended Products */}
      <div className="text-[11px] font-semibold text-[#7A8D9C] uppercase tracking-wide mb-4">
        Recommended Products
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin">
        {/* Show demo products if no tools provided */}
        {tools.length === 0
          ? filteredDemoProducts.map((product, index) => (
              <div
                key={product.id}
                className="glass-product-card p-4 animate-slide-up"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl shadow-sm"
                      style={{ background: product.brandColor }}
                    />
                    <span className="text-[15px] font-semibold text-[#0B1E2D]">
                      {product.name}
                    </span>
                  </div>
                  <MatchScoreRing score={product.matchScore} size="sm" />
                </div>
                <button className="btn-press w-full flex items-center justify-center gap-2 bg-transparent border border-dashed border-[rgba(11,30,45,0.15)] rounded-lg py-2.5 text-sm text-[#7A8D9C] hover:border-[#6EDCD1] hover:border-solid hover:text-[#4BBEB3] hover:bg-[#6EDCD1]/5 transition-all group">
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Add to DecisionHub
                </button>
              </div>
            ))
          : filteredTools.map((tool, index) => (
              <div
                key={tool.id}
                className="glass-product-card p-4 animate-slide-up"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl shadow-sm"
                      style={{
                        background:
                          (tool as ToolWithBrand).brandColor ||
                          'linear-gradient(135deg, #6EDCD1, #4BBEB3)',
                      }}
                    />
                    <span className="text-[15px] font-semibold text-[#0B1E2D]">
                      {tool.name}
                    </span>
                  </div>
                  <MatchScoreRing score={calculateMatchScore(tool)} size="sm" />
                </div>
                {pinningItems.has(tool.id) ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-[#6EDCD1] border border-[#6EDCD1] rounded-lg py-2.5 text-sm text-[#0B1E2D] font-medium animate-pin-success">
                    <Check className="w-4 h-4 animate-pin-check" />
                    Pinned!
                  </div>
                ) : (
                  <button
                    onClick={() => handlePin(tool)}
                    className="btn-press w-full flex items-center justify-center gap-2 bg-transparent border border-dashed border-[rgba(11,30,45,0.15)] rounded-lg py-2.5 text-sm text-[#7A8D9C] hover:border-[#6EDCD1] hover:border-solid hover:text-[#4BBEB3] hover:bg-[#6EDCD1]/5 transition-all group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Add to DecisionHub
                  </button>
                )}
              </div>
            ))}
      </div>
    </div>
  );
};

export default ProductsPanel;
