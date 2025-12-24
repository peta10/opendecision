/**
 * Decision Space Products Service
 *
 * Handles adding/removing products to/from decision spaces
 * via the decision_space_products junction table.
 *
 * This replaces the deprecated selected_tools UUID array approach
 * with a proper junction table that tracks source, who added, and when.
 */

import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export type ProductSource = 'recommended' | 'added' | 'imported';

/** Tool data returned from the join */
export interface ToolSummary {
  id: string;
  name: string;
  type: string;
  created_on: string;
  submission_status: string;
}

/** A product entry in a decision space */
export interface DecisionSpaceProduct {
  id: string;
  decision_space_id: string;
  product_id: string;
  source: ProductSource;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  /** Joined tool data */
  tool?: ToolSummary;
}

export interface AddProductInput {
  decisionSpaceId: string;
  productId: string;
  source?: ProductSource;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TABLE_NAME = 'decision_space_products';

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class DecisionSpaceProductError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DecisionSpaceProductError';
  }
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Add a product to a decision space
 * Uses upsert to handle re-adding a previously removed product
 */
export async function addProductToDecisionSpace({
  decisionSpaceId,
  productId,
  source = 'added',
}: AddProductInput): Promise<DecisionSpaceProduct> {
  if (!supabase) {
    throw new DecisionSpaceProductError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert({
      decision_space_id: decisionSpaceId,
      product_id: productId,
      source,
      added_by: user?.id || null,
      is_active: true,
      added_at: new Date().toISOString(),
    }, {
      onConflict: 'decision_space_id,product_id',
    })
    .select(`
      *,
      tool:tools(id, name, type, created_on, submission_status)
    `)
    .single();

  if (error) {
    throw new DecisionSpaceProductError(
      'Failed to add product to decision space',
      'ADD_FAILED',
      error
    );
  }

  return data as DecisionSpaceProduct;
}

/**
 * Remove a product from a decision space (soft delete)
 */
export async function removeProductFromDecisionSpace(
  decisionSpaceId: string,
  productId: string
): Promise<void> {
  if (!supabase) {
    throw new DecisionSpaceProductError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ is_active: false })
    .eq('decision_space_id', decisionSpaceId)
    .eq('product_id', productId);

  if (error) {
    throw new DecisionSpaceProductError(
      'Failed to remove product from decision space',
      'REMOVE_FAILED',
      error
    );
  }
}

/**
 * Get all active products in a decision space
 */
export async function getDecisionSpaceProducts(
  decisionSpaceId: string
): Promise<DecisionSpaceProduct[]> {
  if (!supabase) {
    throw new DecisionSpaceProductError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      tool:tools(id, name, type, created_on, submission_status)
    `)
    .eq('decision_space_id', decisionSpaceId)
    .eq('is_active', true)
    .order('added_at', { ascending: true });

  if (error) {
    throw new DecisionSpaceProductError(
      'Failed to fetch decision space products',
      'FETCH_FAILED',
      error
    );
  }

  return (data || []) as DecisionSpaceProduct[];
}

/**
 * Check if a product is already in a decision space
 */
export async function isProductInDecisionSpace(
  decisionSpaceId: string,
  productId: string
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('decision_space_id', decisionSpaceId)
    .eq('product_id', productId)
    .eq('is_active', true)
    .maybeSingle();

  return !!data;
}

/**
 * Get count of active products in a decision space
 */
export async function getDecisionSpaceProductCount(
  decisionSpaceId: string
): Promise<number> {
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('decision_space_id', decisionSpaceId)
    .eq('is_active', true);

  return count || 0;
}

/**
 * Get products by source (e.g., all recommended products)
 */
export async function getProductsBySource(
  decisionSpaceId: string,
  source: ProductSource
): Promise<DecisionSpaceProduct[]> {
  if (!supabase) {
    throw new DecisionSpaceProductError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      tool:tools(id, name, type, created_on, submission_status)
    `)
    .eq('decision_space_id', decisionSpaceId)
    .eq('source', source)
    .eq('is_active', true)
    .order('added_at', { ascending: true });

  if (error) {
    throw new DecisionSpaceProductError(
      'Failed to fetch products by source',
      'FETCH_FAILED',
      error
    );
  }

  return (data || []) as DecisionSpaceProduct[];
}

/**
 * Bulk add multiple products at once
 */
export async function addMultipleProducts(
  decisionSpaceId: string,
  productIds: string[],
  source: ProductSource = 'added'
): Promise<DecisionSpaceProduct[]> {
  if (!supabase) {
    throw new DecisionSpaceProductError(
      'Supabase client not configured',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  const inserts = productIds.map(productId => ({
    decision_space_id: decisionSpaceId,
    product_id: productId,
    source,
    added_by: user?.id || null,
    is_active: true,
    added_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(inserts, {
      onConflict: 'decision_space_id,product_id',
    })
    .select(`
      *,
      tool:tools(id, name, type, created_on, submission_status)
    `);

  if (error) {
    throw new DecisionSpaceProductError(
      'Failed to add multiple products',
      'BULK_ADD_FAILED',
      error
    );
  }

  return (data || []) as DecisionSpaceProduct[];
}
