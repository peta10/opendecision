'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tool, CriteriaRating, Tag } from '@/opendecision/shared/types';
import { defaultTools } from '@/opendecision/data/tools';

// =============================================================================
// TYPES
// =============================================================================

interface DbCriterion {
  id: string;
  ranking: number;
  description?: string;
}

interface DbTag {
  name: string;
  type: string;
}

interface DbTool {
  id: string;
  name: string;
  type: string;
  created_by: string;
  criteria: DbCriterion[];
  tags: DbTag[];
  created_on: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  submission_status?: string;
  // Analytics fields from tools_complete view
  unique_try_free_clicks?: number;
  unique_compare_clicks?: number;
  unique_view_details_clicks?: number;
  unique_impressions?: number;
  total_actions?: number;
  last_action_at?: string;
  // Intel summary
  intel_chunk_count?: number;
  avg_intel_quality?: number;
  total_intel_retrievals?: number;
}

interface UseToolsOptions {
  /** Filter by tool type (default: 'application') */
  type?: string;
  /** Filter by submission status (default: 'approved') */
  submissionStatus?: string;
  /** Whether to use fallback tools on error (default: true) */
  useFallback?: boolean;
}

interface UseToolsReturn {
  /** Array of tools (from database or fallback) */
  tools: Tool[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether currently using fallback tools */
  isUsingFallback: boolean;
  /** Refetch tools from database */
  refetch: () => Promise<void>;
  /** Get a specific tool by ID */
  getToolById: (id: string) => Tool | undefined;
}

// =============================================================================
// TRANSFORM FUNCTION
// =============================================================================

/**
 * Transform database tool to match the frontend Tool type.
 * Extracts ratings from criteria and categorizes tags.
 */
function transformDatabaseTool(dbTool: DbTool): Tool {
  const ratings: Record<string, number> = {};
  const ratingExplanations: Record<string, string> = {};
  const methodologies: string[] = [];
  const functions: string[] = [];

  try {
    // Process criteria ratings and explanations
    if (Array.isArray(dbTool.criteria)) {
      dbTool.criteria.forEach((criterion: DbCriterion) => {
        if (criterion && criterion.id && typeof criterion.ranking === 'number') {
          ratings[criterion.id] = criterion.ranking;
          if (criterion.description) {
            ratingExplanations[criterion.id] = criterion.description;
          }
        }
      });
    }

    // Process tags for methodologies and functions
    if (Array.isArray(dbTool.tags)) {
      dbTool.tags.forEach((tag: DbTag) => {
        if (tag && tag.name && tag.type) {
          if (tag.type === 'Methodology') {
            methodologies.push(tag.name);
          } else if (tag.type === 'Function') {
            functions.push(tag.name);
          }
        }
      });
    }
  } catch (error) {
    console.error('[useTools] Error processing tool data:', error);
  }

  return {
    id: dbTool.id,
    name: dbTool.name,
    logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=64&h=64&fit=crop',
    useCases: Array.from(new Set([...methodologies, ...functions])),
    methodologies,
    functions,
    ratings,
    ratingExplanations,
    type: dbTool.type,
    created_by: dbTool.created_by,
    criteria: (dbTool.criteria || []) as unknown as CriteriaRating[],
    tags: (dbTool.tags || []) as unknown as Tag[],
    created_on: dbTool.created_on,
    updated_at: dbTool.updated_at,
    submitted_at: dbTool.submitted_at,
    approved_at: dbTool.approved_at,
    submission_status: dbTool.submission_status || 'approved',
    // Analytics fields
    unique_try_free_clicks: dbTool.unique_try_free_clicks ?? 0,
    unique_compare_clicks: dbTool.unique_compare_clicks ?? 0,
    unique_view_details_clicks: dbTool.unique_view_details_clicks ?? 0,
    unique_impressions: dbTool.unique_impressions ?? 0,
    total_actions: dbTool.total_actions ?? 0,
    last_action_at: dbTool.last_action_at,
    // Intel summary
    intel_chunk_count: dbTool.intel_chunk_count ?? 0,
    avg_intel_quality: dbTool.avg_intel_quality ?? 0,
    total_intel_retrievals: dbTool.total_intel_retrievals ?? 0,
  };
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching tools from Supabase with automatic fallback.
 *
 * @example
 * ```tsx
 * const { tools, isLoading, error, getToolById } = useTools();
 *
 * // Get a specific tool by ID
 * const tool = getToolById('beaee6ec-5fb5-4b63-a0db-f8f2cdd793e8');
 *
 * // Filter by different type
 * const { tools: templates } = useTools({ type: 'template' });
 * ```
 */
export function useTools(options: UseToolsOptions = {}): UseToolsReturn {
  const {
    type = 'application',
    submissionStatus = 'approved',
    useFallback = true,
  } = options;

  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const fetchTools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if supabase is available
      if (!supabase) {
        console.warn('[useTools] Supabase not available, using fallback tools');
        if (useFallback) {
          setTools(defaultTools);
          setIsUsingFallback(true);
        } else {
          setError('Database connection not available');
        }
        return;
      }

      // Build query - use tools_complete for full data with analytics
      let query = supabase.from('tools_complete').select('*');

      if (type) {
        query = query.eq('type', type);
      }

      // Note: tools_complete already filters by submission_status='approved'
      // Only apply filter if a different status is explicitly requested
      if (submissionStatus && submissionStatus !== 'approved') {
        query = query.eq('submission_status', submissionStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const transformedTools = data
          .map(transformDatabaseTool)
          .filter(tool => tool && tool.id);

        // Deduplicate tools by ID (view might return duplicates due to JOINs)
        const uniqueToolsMap = new Map<string, Tool>();
        transformedTools.forEach(tool => {
          if (!uniqueToolsMap.has(tool.id)) {
            uniqueToolsMap.set(tool.id, tool);
          }
        });
        const uniqueTools = Array.from(uniqueToolsMap.values());

        if (uniqueTools.length > 0) {
          console.log('[useTools] ✅ Loaded', uniqueTools.length, 'unique tools from database');
          setTools(uniqueTools);
          setIsUsingFallback(false);
        } else {
          throw new Error('No valid tools after transformation');
        }
      } else {
        console.warn('[useTools] No tools found in database');
        if (useFallback) {
          setTools(defaultTools);
          setIsUsingFallback(true);
        } else {
          setError('No tools found in database');
        }
      }
    } catch (err) {
      console.error('[useTools] Error fetching tools:', err);

      if (useFallback && defaultTools.length > 0) {
        console.log('[useTools] Using fallback tools');
        setTools(defaultTools);
        setIsUsingFallback(true);
        setError(null); // Clear error since we have fallback
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch tools');
      }
    } finally {
      setIsLoading(false);
    }
  }, [type, submissionStatus, useFallback]);

  // Fetch on mount and when options change
  useEffect(() => {
    // Small delay for mobile browser stability
    const timeoutId = setTimeout(fetchTools, 100);
    return () => clearTimeout(timeoutId);
  }, [fetchTools]);

  // Helper to get a tool by ID
  const getToolById = useCallback((id: string): Tool | undefined => {
    return tools.find(tool => tool.id === id);
  }, [tools]);

  return {
    tools,
    isLoading,
    error,
    isUsingFallback,
    refetch: fetchTools,
    getToolById,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Fetch tools directly (non-hook version for server components or one-off fetches)
 */
export async function fetchToolsFromDatabase(options: UseToolsOptions = {}): Promise<{
  tools: Tool[];
  error: string | null;
  isUsingFallback: boolean;
}> {
  const {
    type = 'application',
    submissionStatus = 'approved',
    useFallback = true,
  } = options;

  if (!supabase) {
    if (useFallback) {
      return { tools: defaultTools, error: null, isUsingFallback: true };
    }
    return { tools: [], error: 'Database connection not available', isUsingFallback: false };
  }

  try {
    // Use tools_complete for full data with analytics
    let query = supabase.from('tools_complete').select('*');

    if (type) {
      query = query.eq('type', type);
    }

    // Note: tools_complete already filters by submission_status='approved'
    // Only apply filter if a different status is requested
    if (submissionStatus && submissionStatus !== 'approved') {
      query = query.eq('submission_status', submissionStatus);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      const tools = data.map(transformDatabaseTool).filter(t => t && t.id);
      return { tools, error: null, isUsingFallback: false };
    }

    if (useFallback) {
      return { tools: defaultTools, error: null, isUsingFallback: true };
    }

    return { tools: [], error: 'No tools found', isUsingFallback: false };
  } catch (err) {
    if (useFallback) {
      return { tools: defaultTools, error: null, isUsingFallback: true };
    }
    return {
      tools: [],
      error: err instanceof Error ? err.message : 'Failed to fetch tools',
      isUsingFallback: false
    };
  }
}
