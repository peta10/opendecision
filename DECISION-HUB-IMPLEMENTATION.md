# Decision Hub Implementation Plan

> Making the "Add to DecisionHub" button functional and connecting products to the comparison table.

**Project:** vfqxzqhitumrxshrcqwr
**Last Updated:** 2025-12-23
**Status:** Planning Complete - Ready for Implementation

---

## Executive Summary

This plan creates a `decision_space_products` junction table to replace the current `selected_tools` UUID array. This enables tracking:
- **Source**: How a product was added (recommended by AI, user-added, imported)
- **Who**: Which user added the product
- **When**: Timestamp of addition
- **Soft deletes**: Remove from comparison without losing history

---

## Current Database Analysis (Supabase Project: vfqxzqhitumrxshrcqwr)

### Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMAS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  public          │  Core business: tools, criteria, decision_spaces         │
│  ai              │  RAG/Chat: chat_sessions, chat_messages, chunks          │
│  analytics       │  User tracking: users, responses, actions                │
│  auth            │  Supabase Auth: users, sessions                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Existing Tables (Relevant)

| Schema | Table | Rows | Purpose |
|--------|-------|------|---------|
| public | `decision_spaces` | 17 | User decision projects |
| public | `tools` | 11 | Products/tools to evaluate |
| public | `criteria` | 7 | Evaluation criteria |
| public | `criteria_tools` | 77 | Tool ↔ Criteria ratings (junction) |
| ai | `chat_sessions` | 17 | AI chat sessions (linked to decision_spaces) |
| ai | `chat_messages` | 34 | Individual chat messages |
| ai | `tool_intel_chunks` | 101 | Vectorized tool documentation |
| analytics | `users` | 742 | Analytics user tracking |

### `tools` Table Structure (Actual)

```sql
tools
├── id                       UUID (PK, uuid_generate_v4())
├── name                     TEXT NOT NULL
├── type                     USER-DEFINED (enum)
├── created_by               UUID → auth.users(id)
├── created_on               TIMESTAMPTZ DEFAULT now()
├── submission_status        USER-DEFINED (enum: draft, pending, approved)
├── submitted_at             TIMESTAMPTZ
├── approved_at              TIMESTAMPTZ
├── updated_at               TIMESTAMPTZ
├── unique_try_free_clicks   INTEGER DEFAULT 0
├── unique_compare_clicks    INTEGER DEFAULT 0
├── unique_view_details_clicks INTEGER DEFAULT 0
├── unique_impressions       INTEGER DEFAULT 0
├── total_actions            INTEGER DEFAULT 0
└── last_action_at           TIMESTAMPTZ
```

### Migration Naming Convention

The project uses **158 migrations** with format: `YYYYMMDDHHMMSS_descriptive_name`

Recent relevant migrations:
- `20251216213615_create_decision_spaces_table`
- `20251216213623_add_decision_space_id_to_chat_sessions`

### Extensions Installed

| Extension | Version | Purpose |
|-----------|---------|---------|
| `vector` | 0.8.0 | AI embeddings (pgvector) |
| `pg_cron` | 1.6 | Scheduled jobs |
| `pgmq` | 1.4.4 | Message queue |
| `pg_net` | 0.14.0 | Async HTTP requests |
| `pg_graphql` | 1.5.11 | GraphQL support |
| `pgsodium` | 3.1.8 | Encryption |

### Edge Functions Deployed

| Function | Purpose |
|----------|---------|
| `ai-chat` | Main AI chat with RAG |
| `embed-chunks` | Generate embeddings for tool intel |
| `weekly-summary` | Email summary generation |

### Current `decision_spaces` RLS Policies

```sql
-- Already implemented, follow this pattern for new table
"Users can view their own spaces"   → SELECT WHERE auth.uid() = owner_id
"Users can create their own spaces" → INSERT WITH CHECK auth.uid() = owner_id
"Users can update their own spaces" → UPDATE WHERE/WITH CHECK auth.uid() = owner_id
"Users can delete their own spaces" → DELETE WHERE auth.uid() = owner_id
```

### Data Migration Status

**Current state:** All 17 decision_spaces have `selected_tools = []` (empty arrays)
**Implication:** No data migration needed - can start fresh with junction table

### Current `decision_spaces` Structure

```sql
decision_spaces
├── id                 UUID (PK)
├── name               TEXT (default: 'New Decision')
├── status             TEXT (draft | evaluating | decided | archived)
├── owner_id           UUID → auth.users(id)
├── decision_profile   JSONB {category, subcategory, criteria[], context{}}
├── selected_tools     UUID[] ← CURRENT: Array approach (to be replaced)
├── created_at         TIMESTAMPTZ
└── updated_at         TIMESTAMPTZ
```

### What's Missing

**❌ No `decision_space_products` junction table** - Currently using `selected_tools` UUID array which:
- Cannot track HOW a product was added (recommended vs user-added)
- Cannot track WHO added it
- Cannot track WHEN it was added
- Cannot soft-delete individual products

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   Setup Tab         │     │  decision_space_products │     │  Decision Hub   │
│   (Products Panel)  │────▶│  (Junction Table)        │────▶│  (Comparison)   │
│   [+ Add to Hub]    │     │  source: 'added'         │     │  [Table View]   │
└─────────────────────┘     └──────────────────────────┘     └─────────────────┘
```

### AI Schema Connections (Already Established)

```
┌─────────────────────┐         ┌────────────────────┐
│  decision_spaces    │◄────────│  ai.chat_sessions  │
│  (public)           │         │  decision_space_id │
└─────────────────────┘         └────────────────────┘
         │                               │
         │                               ▼
         │                      ┌────────────────────┐
         │                      │  ai.chat_messages  │
         │                      └────────────────────┘
         │                               │
         │                               ▼
         │                      ┌────────────────────┐
         │                      │  ai.tool_intel_    │
         ▼                      │     chunks         │
┌─────────────────────┐         └────────────────────┘
│  tools (public)     │◄─────────────────┘
│  = "products"       │         (RAG retrieval)
└─────────────────────┘
```

**Note:** The AI schema is well-organized. No changes needed there.

---

## Security Considerations

### Current Security Advisors (from Supabase Dashboard)

The project has some existing security warnings we should NOT replicate:

| Issue | Count | Our Approach |
|-------|-------|--------------|
| SECURITY DEFINER views | 9 in ai schema | Use SECURITY INVOKER (default) |
| Mutable search_path functions | 15 | Set explicit search_path |
| Tables without RLS | 8 in ai schema | Enable RLS on new table |
| Anonymous access policies | Many tables | Intentional - public app |

### Anonymous User Handling

This app allows anonymous users (no login required). The RLS policies must account for this:

```sql
-- Pattern: Match owner_id using COALESCE for anonymous sessions
-- Anonymous users get a session-based owner_id stored in decision_spaces
-- Our junction table inherits access through the decision_space ownership

-- The decision_space.owner_id may be:
-- 1. auth.uid() for authenticated users
-- 2. A generated UUID for anonymous sessions (stored in localStorage)
```

### Best Practices for New Migration

1. **Enable RLS immediately** after CREATE TABLE
2. **Set explicit search_path** on any functions: `SET search_path = public`
3. **Use SECURITY INVOKER** for views (default behavior)
4. **Add indexes** for foreign keys to avoid performance warnings
5. **Add CHECK constraints** for enum-like columns

---

## Phase 1: Database Setup

### 1.1 Create Junction Table Migration

**Migration name:** `YYYYMMDDHHMMSS_create_decision_space_products`

Apply via Supabase MCP: `mcp__supabase__apply_migration`

```sql
-- Migration: create_decision_space_products
-- Schema: public (connects two public tables)
-- Following existing patterns from decision_spaces table

CREATE TABLE public.decision_space_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys (tools table is called "tools" not "products")
  decision_space_id UUID NOT NULL REFERENCES public.decision_spaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,

  -- How the product entered the decision space
  source TEXT NOT NULL DEFAULT 'added'
    CHECK (source IN ('recommended', 'added', 'imported')),

  -- Who added it (null for anonymous users)
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete (never hard delete)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Prevent duplicates per decision space
  UNIQUE(decision_space_id, product_id)
);

-- Add comment for documentation
COMMENT ON TABLE public.decision_space_products IS
  'Junction table tracking which products/tools are in each decision space. Supports recommended vs user-added distinction via source column.';

COMMENT ON COLUMN public.decision_space_products.source IS
  'How product entered: recommended (AI suggested), added (user clicked Add), imported (CSV/bulk)';

-- Indexes for performance
CREATE INDEX idx_dsp_decision_space_active
  ON public.decision_space_products(decision_space_id)
  WHERE is_active = TRUE;

CREATE INDEX idx_dsp_product
  ON public.decision_space_products(product_id);

CREATE INDEX idx_dsp_added_at
  ON public.decision_space_products(added_at DESC);
```

### 1.2 RLS Policies

**Important:** This app supports anonymous users. The `decision_spaces.owner_id` contains either:
- `auth.uid()` for authenticated users
- A client-generated UUID for anonymous sessions

The RLS policies use a subquery to inherit access from the parent `decision_spaces` table.

```sql
-- Enable RLS immediately after table creation
ALTER TABLE public.decision_space_products ENABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_space_products TO anon, authenticated;

-- SELECT: Users can view products in their own decision spaces
-- Uses (SELECT auth.uid()) to prevent per-row re-evaluation (performance optimization)
CREATE POLICY "Users can view their decision space products"
  ON public.decision_space_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decision_spaces ds
      WHERE ds.id = decision_space_id
      AND ds.owner_id = (SELECT auth.uid())
    )
  );

-- INSERT: Users can add products to their own decision spaces
CREATE POLICY "Users can add products to their decision spaces"
  ON public.decision_space_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decision_spaces ds
      WHERE ds.id = decision_space_id
      AND ds.owner_id = (SELECT auth.uid())
    )
  );

-- UPDATE: Users can update (soft delete) products in their own spaces
CREATE POLICY "Users can update their decision space products"
  ON public.decision_space_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.decision_spaces ds
      WHERE ds.id = decision_space_id
      AND ds.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decision_spaces ds
      WHERE ds.id = decision_space_id
      AND ds.owner_id = (SELECT auth.uid())
    )
  );

-- DELETE: Allow hard deletes for cleanup (optional, can be removed)
CREATE POLICY "Users can delete their decision space products"
  ON public.decision_space_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decision_spaces ds
      WHERE ds.id = decision_space_id
      AND ds.owner_id = (SELECT auth.uid())
    )
  );
```

**Performance Notes:**
- Using `EXISTS` with subquery is more performant than `IN` for RLS policies
- Wrapping `auth.uid()` in `(SELECT ...)` prevents per-row re-evaluation
- The parent `decision_spaces` table has this issue - consider fixing in a separate migration

### 1.3 Data Migration (From selected_tools Array)

```sql
-- Migrate existing selected_tools arrays to junction table
-- Run ONCE after creating the table

INSERT INTO public.decision_space_products (
  decision_space_id,
  product_id,
  source,
  added_by,
  added_at,
  is_active
)
SELECT
  ds.id AS decision_space_id,
  unnest(ds.selected_tools) AS product_id,
  'added' AS source,  -- Assume existing were user-added
  ds.owner_id AS added_by,
  ds.created_at AS added_at,  -- Use space creation time
  TRUE AS is_active
FROM public.decision_spaces ds
WHERE ds.selected_tools IS NOT NULL
  AND array_length(ds.selected_tools, 1) > 0
ON CONFLICT (decision_space_id, product_id) DO NOTHING;

-- Verify migration
SELECT
  ds.name,
  array_length(ds.selected_tools, 1) AS array_count,
  COUNT(dsp.id) AS junction_count
FROM public.decision_spaces ds
LEFT JOIN public.decision_space_products dsp
  ON dsp.decision_space_id = ds.id AND dsp.is_active = TRUE
GROUP BY ds.id, ds.name
ORDER BY ds.created_at DESC;
```

### 1.4 Deprecate selected_tools Column (Future)

```sql
-- After confirming migration success, add deprecation comment
COMMENT ON COLUMN public.decision_spaces.selected_tools IS
  '⚠️ DEPRECATED: Use decision_space_products junction table instead. Kept for backwards compatibility during migration.';

-- Future migration (after all code updated):
-- ALTER TABLE public.decision_spaces DROP COLUMN selected_tools;
```

---

## Phase 2: Service Layer

### 2.1 Create `decisionSpaceProductsService.ts`

**Location:** `src/opendecision/shared/services/decisionSpaceProductsService.ts`

```typescript
/**
 * Decision Space Products Service
 *
 * Handles adding/removing products to/from decision spaces
 * via the decision_space_products junction table.
 */

import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export type ProductSource = 'recommended' | 'added' | 'imported';

export interface DecisionSpaceProduct {
  id: string;
  decision_space_id: string;
  product_id: string;
  source: ProductSource;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  // Joined tool data (FK references 'tools' table)
  tool?: Tool;
}

// Matches actual tools table structure from database
export interface Tool {
  id: string;
  name: string;
  type: string; // USER-DEFINED enum
  created_by: string | null;
  created_on: string;
  submission_status: 'draft' | 'pending' | 'approved';
  submitted_at: string | null;
  approved_at: string | null;
  updated_at: string | null;
  // Analytics rollup columns
  unique_try_free_clicks: number;
  unique_compare_clicks: number;
  unique_view_details_clicks: number;
  unique_impressions: number;
  total_actions: number;
  last_action_at: string | null;
}

export interface AddProductInput {
  decisionSpaceId: string;
  productId: string;
  source?: ProductSource;
}

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
    .from('decision_space_products')
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
      tool:tools(id, name, type, submission_status, created_on)
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
    .from('decision_space_products')
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
 * Get all products in a decision space
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
    .from('decision_space_products')
    .select(`
      *,
      tool:tools(*)
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
    .from('decision_space_products')
    .select('id')
    .eq('decision_space_id', decisionSpaceId)
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();

  return !!data;
}

/**
 * Get count of products in a decision space
 */
export async function getDecisionSpaceProductCount(
  decisionSpaceId: string
): Promise<number> {
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from('decision_space_products')
    .select('*', { count: 'exact', head: true })
    .eq('decision_space_id', decisionSpaceId)
    .eq('is_active', true);

  return count || 0;
}
```

---

## Phase 3: React Hook

### 3.1 Create `useDecisionSpaceProducts.ts`

**Location:** `src/opendecision/shared/hooks/useDecisionSpaceProducts.ts`

```typescript
/**
 * React hook for managing products in a decision space
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DecisionSpaceProduct,
  addProductToDecisionSpace,
  removeProductFromDecisionSpace,
  getDecisionSpaceProducts,
  isProductInDecisionSpace,
} from '../services/decisionSpaceProductsService';

interface UseDecisionSpaceProductsReturn {
  /** Products currently in the decision space */
  products: DecisionSpaceProduct[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Add a product to the decision space */
  addProduct: (productId: string, source?: 'recommended' | 'added') => Promise<void>;
  /** Remove a product from the decision space */
  removeProduct: (productId: string) => Promise<void>;
  /** Check if a product is already added */
  isProductAdded: (productId: string) => boolean;
  /** Refresh the products list */
  refresh: () => Promise<void>;
  /** Count of added products */
  addedCount: number;
}

export function useDecisionSpaceProducts(
  decisionSpaceId: string | null
): UseDecisionSpaceProductsReturn {
  const [products, setProducts] = useState<DecisionSpaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on mount and when decisionSpaceId changes
  const fetchProducts = useCallback(async () => {
    if (!decisionSpaceId) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getDecisionSpaceProducts(decisionSpaceId);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [decisionSpaceId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Add product with optimistic update
  const addProduct = useCallback(async (
    productId: string,
    source: 'recommended' | 'added' = 'added'
  ) => {
    if (!decisionSpaceId) return;

    // Optimistic update
    const tempProduct: DecisionSpaceProduct = {
      id: `temp-${productId}`,
      decision_space_id: decisionSpaceId,
      product_id: productId,
      source,
      added_by: null,
      added_at: new Date().toISOString(),
      is_active: true,
    };

    setProducts(prev => [...prev, tempProduct]);
    setError(null);

    try {
      const newProduct = await addProductToDecisionSpace({
        decisionSpaceId,
        productId,
        source,
      });

      // Replace temp with real data
      setProducts(prev =>
        prev.map(p => p.id === tempProduct.id ? newProduct : p)
      );
    } catch (err) {
      // Rollback on error
      setProducts(prev => prev.filter(p => p.id !== tempProduct.id));
      setError(err instanceof Error ? err.message : 'Failed to add product');
      throw err;
    }
  }, [decisionSpaceId]);

  // Remove product with optimistic update
  const removeProduct = useCallback(async (productId: string) => {
    if (!decisionSpaceId) return;

    // Store for rollback
    const productToRemove = products.find(p => p.product_id === productId);

    // Optimistic update
    setProducts(prev => prev.filter(p => p.product_id !== productId));
    setError(null);

    try {
      await removeProductFromDecisionSpace(decisionSpaceId, productId);
    } catch (err) {
      // Rollback on error
      if (productToRemove) {
        setProducts(prev => [...prev, productToRemove]);
      }
      setError(err instanceof Error ? err.message : 'Failed to remove product');
      throw err;
    }
  }, [decisionSpaceId, products]);

  // Check if product is added
  const isProductAdded = useCallback((productId: string): boolean => {
    return products.some(p => p.product_id === productId && p.is_active);
  }, [products]);

  return {
    products,
    isLoading,
    error,
    addProduct,
    removeProduct,
    isProductAdded,
    refresh: fetchProducts,
    addedCount: products.filter(p => p.source === 'added').length,
  };
}
```

---

## Phase 4: Component Updates

### 4.1 Update Products Panel (Setup Tab)

Add the hook and wire up the "Add to DecisionHub" button:

```tsx
// In the Products panel component
const { addProduct, isProductAdded, addedCount } = useDecisionSpaceProducts(decisionSpaceId);

// In the product card
<button
  onClick={() => addProduct(product.id, 'added')}
  disabled={isProductAdded(product.id)}
  className={cn(
    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
    isProductAdded(product.id)
      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
      : 'bg-neutral-900 text-white hover:bg-neutral-800'
  )}
>
  {isProductAdded(product.id) ? (
    <>
      <CheckIcon className="w-4 h-4 mr-2" />
      Added
    </>
  ) : (
    <>
      <PlusIcon className="w-4 h-4 mr-2" />
      Add to DecisionHub
    </>
  )}
</button>

// Show added count badge
<span className="text-sm text-neutral-500">Added {addedCount}</span>
```

### 4.2 Update Decision Hub Component

```tsx
// Pass products from hook to DecisionHub
const { products } = useDecisionSpaceProducts(decisionSpaceId);

// Map DecisionSpaceProduct[] to Tool[] for the table
const toolsForComparison = products
  .filter(p => p.product && p.is_active)
  .map(p => p.product as Tool);

<DecisionHub
  tools={toolsForComparison}
  criteria={criteria}
  onAddProduct={() => setActiveTab('setup')}
  onRemoveProduct={(productId) => removeProduct(productId)}
/>
```

---

## Phase 5: State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Decision Flow Page                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  useDecisionSpaceProducts(decisionSpaceId)                      │   │
│  │  ├── products: DecisionSpaceProduct[]                           │   │
│  │  ├── addProduct(productId, source)                              │   │
│  │  ├── removeProduct(productId)                                   │   │
│  │  └── isProductAdded(productId)                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│           ┌───────────────────────┴───────────────────────┐            │
│           ▼                                               ▼            │
│  ┌─────────────────────┐                     ┌─────────────────────┐   │
│  │     Setup Tab       │                     │   Decision Hub Tab  │   │
│  │  ┌───────────────┐  │                     │  ┌───────────────┐  │   │
│  │  │ Products List │  │                     │  │  Comparison   │  │   │
│  │  │               │  │                     │  │    Table      │  │   │
│  │  │ [+ Add to Hub]│──┼─── addProduct() ───▶│  │               │  │   │
│  │  │               │  │                     │  │ [Remove]      │──┼───┼── removeProduct()
│  │  └───────────────┘  │                     │  └───────────────┘  │   │
│  └─────────────────────┘                     └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Badge Indicators

### Added vs Recommended Visual Distinction

```tsx
// Source badge component
function SourceBadge({ source }: { source: 'added' | 'recommended' | 'imported' }) {
  const config = {
    added: {
      label: 'Added',
      className: 'bg-blue-100 text-blue-700',
    },
    recommended: {
      label: 'Recommended',
      className: 'bg-emerald-100 text-emerald-700',
    },
    imported: {
      label: 'Imported',
      className: 'bg-purple-100 text-purple-700',
    },
  };

  const { label, className } = config[source];

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', className)}>
      {label}
    </span>
  );
}
```

---

## Implementation Checklist

- [ ] **Database**
  - [ ] Create `decision_space_products` migration
  - [ ] Apply RLS policies
  - [ ] Test with Supabase MCP

- [ ] **Service Layer**
  - [ ] Create `decisionSpaceProductsService.ts`
  - [ ] Test CRUD operations

- [ ] **React Hook**
  - [ ] Create `useDecisionSpaceProducts.ts`
  - [ ] Implement optimistic updates
  - [ ] Handle errors gracefully

- [ ] **Components**
  - [ ] Update Products panel with add button
  - [ ] Update "Added" count display
  - [ ] Connect DecisionHub to real data
  - [ ] Add remove functionality
  - [ ] Add source badges

- [ ] **UX Polish**
  - [ ] Loading states
  - [ ] Error toasts
  - [ ] Success feedback
  - [ ] Empty states

---

## API Reference

### Supabase Queries Used

```typescript
// Add product (upsert to handle re-adding)
// Note: FK column is 'product_id' but references 'tools' table
supabase
  .from('decision_space_products')
  .upsert({
    decision_space_id: decisionSpaceId,
    product_id: productId,  // References tools.id
    source: 'added',
    added_by: userId,
    is_active: true,
  }, {
    onConflict: 'decision_space_id,product_id'
  })
  .select('*, tool:tools(*)')  // Alias 'tool' for the join
  .single()

// Get products with join to tools table
supabase
  .from('decision_space_products')
  .select(`
    id,
    decision_space_id,
    product_id,
    source,
    added_by,
    added_at,
    is_active,
    tool:tools(
      id,
      name,
      type,
      created_on,
      submission_status,
      unique_impressions,
      total_actions
    )
  `)
  .eq('decision_space_id', decisionSpaceId)
  .eq('is_active', true)
  .order('added_at', { ascending: true })

// Soft delete (remove from comparison)
supabase
  .from('decision_space_products')
  .update({ is_active: false })
  .eq('decision_space_id', decisionSpaceId)
  .eq('product_id', productId)

// Check if already added
supabase
  .from('decision_space_products')
  .select('id')
  .eq('decision_space_id', decisionSpaceId)
  .eq('product_id', productId)
  .eq('is_active', true)
  .maybeSingle()

// Count products in a decision space
supabase
  .from('decision_space_products')
  .select('*', { count: 'exact', head: true })
  .eq('decision_space_id', decisionSpaceId)
  .eq('is_active', true)
```

---

## Summary

### What We're Building

| Component | Description |
|-----------|-------------|
| **Junction Table** | `decision_space_products` links decision spaces to tools |
| **Service Layer** | CRUD functions with error handling |
| **React Hook** | `useDecisionSpaceProducts` with optimistic updates |
| **UI Components** | Add/remove buttons, source badges |

### Key Design Decisions

1. **Junction Table vs Array** - Chose junction table for metadata (source, added_by, added_at)
2. **Soft Deletes** - `is_active = false` instead of hard delete
3. **Source Tracking** - `recommended`, `added`, `imported` to distinguish how products entered
4. **RLS Policies** - Users can only access their own decision space products
5. **Optimistic Updates** - Immediate UI feedback while async operation completes

### Schema Relationships (Final)

```
                    ┌──────────────────┐
                    │   auth.users     │
                    │   (22 users)     │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────────┐   ┌──────────────┐
│decision_spaces│   │decision_space_    │   │analytics.    │
│  (17 spaces)  │◄──│   products (NEW)  │   │   users      │
└───────┬───────┘   └─────────┬─────────┘   │  (742 users) │
        │                     │             └──────────────┘
        │                     │
        │                     ▼
        │           ┌───────────────────┐
        │           │  public.tools     │
        │           │  (11 products)    │
        │           └─────────┬─────────┘
        │                     │
        ▼                     ▼
┌───────────────┐   ┌───────────────────┐
│ai.chat_       │   │ai.tool_intel_     │
│  sessions     │   │   chunks (RAG)    │
└───────────────┘   └───────────────────┘
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `create_decision_space_products.sql` | CREATE | Database migration |
| `decisionSpaceProductsService.ts` | CREATE | Service layer |
| `useDecisionSpaceProducts.ts` | CREATE | React hook |
| `types/index.ts` | MODIFY | Add new types |
| `DecisionFlow.tsx` | MODIFY | Wire up hook |
| `DecisionHub.tsx` | MODIFY | Accept real data |

---

*This plan follows Supabase best practices for junction tables, RLS policies, and the existing codebase patterns from `decisionSpaceService.ts`. Verified against project vfqxzqhitumrxshrcqwr schema on 2025-12-23.*

---

## Ready-to-Apply Migration

Copy this complete migration SQL to apply via Supabase MCP:

```sql
-- ============================================================================
-- Migration: create_decision_space_products
-- Description: Junction table for tracking products in decision spaces
-- ============================================================================

-- 1. Create the junction table
CREATE TABLE public.decision_space_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_space_id UUID NOT NULL REFERENCES public.decision_spaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'added' CHECK (source IN ('recommended', 'added', 'imported')),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(decision_space_id, product_id)
);

-- 2. Add documentation comments
COMMENT ON TABLE public.decision_space_products IS
  'Junction table tracking which products/tools are in each decision space';
COMMENT ON COLUMN public.decision_space_products.source IS
  'How product entered: recommended (AI), added (user), imported (CSV)';

-- 3. Create indexes for performance
CREATE INDEX idx_dsp_decision_space_active
  ON public.decision_space_products(decision_space_id)
  WHERE is_active = TRUE;
CREATE INDEX idx_dsp_product
  ON public.decision_space_products(product_id);
CREATE INDEX idx_dsp_added_at
  ON public.decision_space_products(added_at DESC);

-- 4. Enable RLS
ALTER TABLE public.decision_space_products ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_space_products TO anon, authenticated;

-- 6. Create RLS policies (using optimized (SELECT auth.uid()) pattern)
-- This prevents re-evaluation of auth.uid() for each row
CREATE POLICY "Users can view their decision space products"
  ON public.decision_space_products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.decision_spaces ds
    WHERE ds.id = decision_space_id AND ds.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can add products to their decision spaces"
  ON public.decision_space_products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.decision_spaces ds
    WHERE ds.id = decision_space_id AND ds.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update their decision space products"
  ON public.decision_space_products FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.decision_spaces ds
    WHERE ds.id = decision_space_id AND ds.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.decision_spaces ds
    WHERE ds.id = decision_space_id AND ds.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete their decision space products"
  ON public.decision_space_products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.decision_spaces ds
    WHERE ds.id = decision_space_id AND ds.owner_id = (SELECT auth.uid())
  ));

-- 7. Deprecate old column (comment only, don't drop yet)
COMMENT ON COLUMN public.decision_spaces.selected_tools IS
  '⚠️ DEPRECATED: Use decision_space_products junction table instead';
```

---

## Next Steps (Implementation Order)

1. **Apply Migration** → Use `mcp__supabase__apply_migration` with the SQL above
2. **Verify Table** → Query to confirm table created with correct structure
3. **Test RLS** → Insert/select with test user to verify policies work
4. **Create Service** → `src/opendecision/shared/services/decisionSpaceProductsService.ts`
5. **Create Hook** → `src/opendecision/shared/hooks/useDecisionSpaceProducts.ts`
6. **Wire Up UI** → Update DecisionFlow.tsx and Products panel
7. **Test E2E** → Add product, verify in Decision Hub, remove product
