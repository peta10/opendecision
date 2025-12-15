/**
 * Debug utility to track React hooks order
 * Use this in development to identify hook order issues
 */

let hookCallOrder: string[] = [];
let renderCount = 0;

export function debugHook(componentName: string, hookName: string, details?: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const hookId = `${componentName}.${hookName}${details ? `-${JSON.stringify(details)}` : ''}`;
  hookCallOrder.push(hookId);
  
  // Log if we detect a change in hook order
  if (window.__previousHookOrder) {
    const prevOrder = window.__previousHookOrder;
    if (prevOrder.length > 0 && hookCallOrder.length <= prevOrder.length) {
      const currentIndex = hookCallOrder.length - 1;
      if (prevOrder[currentIndex] !== hookId) {
        console.error('❌ HOOK ORDER MISMATCH DETECTED!');
        console.error('Previous:', prevOrder[currentIndex]);
        console.error('Current:', hookId);
        console.error('Full previous order:', prevOrder);
        console.error('Full current order:', hookCallOrder);
        console.trace('Stack trace');
      }
    }
  }
}

export function resetHookDebug() {
  if (process.env.NODE_ENV !== 'development') return;
  
  window.__previousHookOrder = [...hookCallOrder];
  hookCallOrder = [];
  renderCount++;
  
  if (renderCount % 10 === 0) {
    console.log(`✅ ${renderCount} renders completed without hook order issues`);
  }
}

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__debugHooks = {
    getOrder: () => hookCallOrder,
    getPreviousOrder: () => window.__previousHookOrder,
    reset: resetHookDebug,
    getRenderCount: () => renderCount
  };
}

// TypeScript declarations
declare global {
  interface Window {
    __previousHookOrder?: string[];
    __debugHooks?: {
      getOrder: () => string[];
      getPreviousOrder: () => string[] | undefined;
      reset: () => void;
      getRenderCount: () => number;
    };
  }
}
