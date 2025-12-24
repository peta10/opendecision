'use client';

/**
 * React hook for managing products in a decision space
 *
 * Provides CRUD operations with optimistic updates for a smooth UX.
 * Works with the decision_space_products junction table.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DecisionSpaceProduct,
  ProductSource,
  addProductToDecisionSpace,
  removeProductFromDecisionSpace,
  getDecisionSpaceProducts,
} from '../services/decisionSpaceProductsService';

interface UseDecisionSpaceProductsReturn {
  /** Products currently in the decision space */
  products: DecisionSpaceProduct[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Add a product to the decision space */
  addProduct: (productId: string, source?: ProductSource) => Promise<void>;
  /** Remove a product from the decision space */
  removeProduct: (productId: string) => Promise<void>;
  /** Check if a product is already added */
  isProductAdded: (productId: string) => boolean;
  /** Refresh the products list */
  refresh: () => Promise<void>;
  /** Count of products by source */
  counts: {
    total: number;
    added: number;
    recommended: number;
    imported: number;
  };
  /** Product IDs for quick lookup */
  productIds: Set<string>;
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
      console.error('[useDecisionSpaceProducts] Fetch error:', err);
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
    source: ProductSource = 'added'
  ) => {
    if (!decisionSpaceId) return;

    // Create optimistic product
    const tempProduct: DecisionSpaceProduct = {
      id: `temp-${productId}-${Date.now()}`,
      decision_space_id: decisionSpaceId,
      product_id: productId,
      source,
      added_by: null,
      added_at: new Date().toISOString(),
      is_active: true,
    };

    // Optimistic update
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
      const message = err instanceof Error ? err.message : 'Failed to add product';
      setError(message);
      console.error('[useDecisionSpaceProducts] Add error:', err);
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
      const message = err instanceof Error ? err.message : 'Failed to remove product';
      setError(message);
      console.error('[useDecisionSpaceProducts] Remove error:', err);
      throw err;
    }
  }, [decisionSpaceId, products]);

  // Quick lookup for product IDs
  const productIds = useMemo(() => {
    return new Set(products.map(p => p.product_id));
  }, [products]);

  // Check if product is added
  const isProductAdded = useCallback((productId: string): boolean => {
    return productIds.has(productId);
  }, [productIds]);

  // Counts by source
  const counts = useMemo(() => {
    return {
      total: products.length,
      added: products.filter(p => p.source === 'added').length,
      recommended: products.filter(p => p.source === 'recommended').length,
      imported: products.filter(p => p.source === 'imported').length,
    };
  }, [products]);

  return {
    products,
    isLoading,
    error,
    addProduct,
    removeProduct,
    isProductAdded,
    refresh: fetchProducts,
    counts,
    productIds,
  };
}
