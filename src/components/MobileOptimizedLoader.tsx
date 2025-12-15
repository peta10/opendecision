'use client';

import React, { useState, useEffect } from 'react';

interface MobileOptimizedLoaderProps {
  isHydrated?: boolean;
  children: React.ReactNode;
}

/**
 * Mobile-optimized loader that prevents flashing during hydration
 * Shows a minimal loader until hydration is complete
 */
export function MobileOptimizedLoader({ isHydrated = false, children }: MobileOptimizedLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render children to prevent hydration mismatch
  // The loader logic is disabled to ensure SSR/client consistency
  return <>{children}</>;
}

export default MobileOptimizedLoader;
