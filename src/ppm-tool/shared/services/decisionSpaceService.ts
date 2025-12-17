/**
 * Decision Space Service
 *
 * Handles CRUD operations for Decision Spaces via Supabase.
 * Supports both anonymous and authenticated users through Supabase's
 * Anonymous Sign-In feature.
 */

import { supabase } from '@/lib/supabase';
import {
  DecisionSpace,
  DecisionProfile,
  DecisionSpaceStatus,
  CreateDecisionSpaceInput,
  UpdateDecisionSpaceInput,
} from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

const TABLE_NAME = 'decision_spaces';

/** Default decision profile for new spaces */
const DEFAULT_DECISION_PROFILE: DecisionProfile = {
  category: 'Software',
  subcategory: 'PPM Tools',
  criteria: [],
  context: {},
};

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class DecisionSpaceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DecisionSpaceError';
  }
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Create a new Decision Space
 */
export async function createDecisionSpace(
  input: CreateDecisionSpaceInput = {}
): Promise<DecisionSpace> {
  if (!supabase) {
    throw new DecisionSpaceError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new DecisionSpaceError(
      'User not authenticated',
      'NOT_AUTHENTICATED',
      userError
    );
  }

  const newSpace = {
    name: input.name || 'New Decision',
    owner_id: user.id,
    decision_profile: {
      ...DEFAULT_DECISION_PROFILE,
      ...input.decision_profile,
    },
    selected_tools: input.selected_tools || [],
    status: 'draft' as DecisionSpaceStatus,
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(newSpace)
    .select()
    .single();

  if (error) {
    throw new DecisionSpaceError(
      'Failed to create decision space',
      'CREATE_FAILED',
      error
    );
  }

  return data as DecisionSpace;
}

/**
 * Get a Decision Space by ID
 */
export async function getDecisionSpace(id: string): Promise<DecisionSpace | null> {
  if (!supabase) {
    throw new DecisionSpaceError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new DecisionSpaceError(
      'Failed to fetch decision space',
      'FETCH_FAILED',
      error
    );
  }

  return data as DecisionSpace;
}

/**
 * List all Decision Spaces for the current user
 */
export async function listDecisionSpaces(options?: {
  status?: DecisionSpaceStatus;
  limit?: number;
  offset?: number;
}): Promise<DecisionSpace[]> {
  if (!supabase) {
    throw new DecisionSpaceError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('updated_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new DecisionSpaceError(
      'Failed to list decision spaces',
      'LIST_FAILED',
      error
    );
  }

  return (data || []) as DecisionSpace[];
}

/**
 * Update a Decision Space
 */
export async function updateDecisionSpace(
  id: string,
  input: UpdateDecisionSpaceInput
): Promise<DecisionSpace> {
  if (!supabase) {
    throw new DecisionSpaceError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  // Build update object, only including provided fields
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.selected_tools !== undefined) {
    updates.selected_tools = input.selected_tools;
  }

  // For decision_profile, we need to merge with existing
  if (input.decision_profile !== undefined) {
    // First fetch current profile
    const current = await getDecisionSpace(id);
    if (!current) {
      throw new DecisionSpaceError(
        'Decision space not found',
        'NOT_FOUND'
      );
    }

    updates.decision_profile = {
      ...current.decision_profile,
      ...input.decision_profile,
      // Deep merge context
      context: {
        ...current.decision_profile.context,
        ...input.decision_profile.context,
      },
    };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DecisionSpaceError(
      'Failed to update decision space',
      'UPDATE_FAILED',
      error
    );
  }

  return data as DecisionSpace;
}

/**
 * Delete a Decision Space
 */
export async function deleteDecisionSpace(id: string): Promise<void> {
  if (!supabase) {
    throw new DecisionSpaceError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    throw new DecisionSpaceError(
      'Failed to delete decision space',
      'DELETE_FAILED',
      error
    );
  }
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * Update the selected tools for a Decision Space
 */
export async function updateSelectedTools(
  id: string,
  toolIds: string[]
): Promise<DecisionSpace> {
  return updateDecisionSpace(id, { selected_tools: toolIds });
}

/**
 * Add a tool to a Decision Space
 */
export async function addToolToSpace(
  id: string,
  toolId: string
): Promise<DecisionSpace> {
  const space = await getDecisionSpace(id);
  if (!space) {
    throw new DecisionSpaceError('Decision space not found', 'NOT_FOUND');
  }

  const updatedTools = [...new Set([...space.selected_tools, toolId])];
  return updateDecisionSpace(id, { selected_tools: updatedTools });
}

/**
 * Remove a tool from a Decision Space
 */
export async function removeToolFromSpace(
  id: string,
  toolId: string
): Promise<DecisionSpace> {
  const space = await getDecisionSpace(id);
  if (!space) {
    throw new DecisionSpaceError('Decision space not found', 'NOT_FOUND');
  }

  const updatedTools = space.selected_tools.filter(t => t !== toolId);
  return updateDecisionSpace(id, { selected_tools: updatedTools });
}

/**
 * Update criteria ratings in a Decision Space
 */
export async function updateCriteriaRatings(
  id: string,
  criteria: Array<{ id: string; name: string; rating: number }>
): Promise<DecisionSpace> {
  return updateDecisionSpace(id, {
    decision_profile: { criteria } as Partial<DecisionProfile>,
  });
}

/**
 * Update the status of a Decision Space
 */
export async function updateSpaceStatus(
  id: string,
  status: DecisionSpaceStatus
): Promise<DecisionSpace> {
  return updateDecisionSpace(id, { status });
}

/**
 * Duplicate a Decision Space (creates a new draft copy)
 */
export async function duplicateDecisionSpace(
  id: string,
  newName?: string
): Promise<DecisionSpace> {
  const original = await getDecisionSpace(id);
  if (!original) {
    throw new DecisionSpaceError('Decision space not found', 'NOT_FOUND');
  }

  return createDecisionSpace({
    name: newName || `${original.name} (Copy)`,
    decision_profile: original.decision_profile,
    selected_tools: original.selected_tools,
  });
}

/**
 * Get the most recently updated Decision Space for the current user
 */
export async function getMostRecentSpace(): Promise<DecisionSpace | null> {
  const spaces = await listDecisionSpaces({ limit: 1 });
  return spaces[0] || null;
}

/**
 * Get or create a default Decision Space for new users
 */
export async function getOrCreateDefaultSpace(): Promise<DecisionSpace> {
  // Try to get the most recent space
  const recent = await getMostRecentSpace();
  if (recent) {
    return recent;
  }

  // No spaces exist, create a default one
  return createDecisionSpace({
    name: 'My First Decision',
  });
}
