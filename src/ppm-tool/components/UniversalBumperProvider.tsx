'use client';

/**
 * Universal Bumper Provider
 * Client-only wrapper that ensures bumpers work consistently across all environments
 * Includes SSR protection and hydration safety
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { universalBumperEngine } from '../shared/engines/UniversalBumperEngine';
import { stateManager } from '../shared/state/UniversalBumperStateManager';
import { capabilityDetector, BrowserCapabilities } from '../shared/state/BrowserCapabilityDetector';
import { productionMonitor } from '../shared/monitoring/ProductionMonitor';

interface UniversalBumperContextType {
  initialized: boolean;
  hydrated: boolean;
  capabilities: BrowserCapabilities | null;
  triggerProductBumper: (bypassRules?: boolean) => void;
  triggerExitIntentBumper: (triggerType?: 'mouse-leave' | 'tab-switch', bypassRules?: boolean) => void;
  getStatus: () => any;
}

const UniversalBumperContext = createContext<UniversalBumperContextType>({
  initialized: false,
  hydrated: false,
  capabilities: null,
  triggerProductBumper: () => {},
  triggerExitIntentBumper: () => {},
  getStatus: () => ({})
});

export const useUniversalBumper = () => useContext(UniversalBumperContext);

interface UniversalBumperProviderProps {
  children: ReactNode;
  onProductBumperTrigger?: () => void;
  onExitIntentBumperTrigger?: (triggerType: 'mouse-leave' | 'tab-switch') => void;
}

export function UniversalBumperProvider({ 
  children, 
  onProductBumperTrigger, 
  onExitIntentBumperTrigger 
}: UniversalBumperProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  
  useEffect(() => {
    // Ensure we're client-side
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    const initializeEngine = async () => {
      try {
        // Mark as hydrated
        setHydrated(true);
        productionMonitor.hydrationComplete();
        
        // Get capabilities first
        const caps = await capabilityDetector.detect();
        productionMonitor.storageTest({
          localStorage: caps.localStorage,
          sessionStorage: caps.sessionStorage,
          overallScore: caps.overallScore
        });
        
        // Initialize the engine with monitoring
        await universalBumperEngine.initialize({
          onProductBumperTrigger: () => {
            productionMonitor.bumperTriggered('product', 'automatic');
            onProductBumperTrigger?.();
          },
          onExitIntentBumperTrigger: (triggerType) => {
            productionMonitor.bumperTriggered('exit-intent', 'automatic');
            onExitIntentBumperTrigger?.(triggerType);
          }
        });
        
        if (mounted) {
          setCapabilities(caps);
          setInitialized(true);
          productionMonitor.systemInitialized(caps);
          console.log('✅ Universal Bumper Provider initialized');
        }
      } catch (error) {
        productionMonitor.systemFailed(error);
        console.error('Failed to initialize Universal Bumper Provider:', error);
      }
    };
    
    // Small delay to ensure React has fully hydrated
    const timer = setTimeout(initializeEngine, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [onProductBumperTrigger, onExitIntentBumperTrigger]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      universalBumperEngine.destroy();
    };
  }, []);
  
  const contextValue: UniversalBumperContextType = {
    initialized,
    hydrated,
    capabilities,
    triggerProductBumper: (bypassRules = false) => {
      universalBumperEngine.triggerProductBumper(bypassRules);
    },
    triggerExitIntentBumper: (triggerType = 'mouse-leave', bypassRules = false) => {
      universalBumperEngine.triggerExitIntentBumper(triggerType, bypassRules);
    },
    getStatus: () => universalBumperEngine.getStatus()
  };
  
  return (
    <UniversalBumperContext.Provider value={contextValue}>
      {children}
    </UniversalBumperContext.Provider>
  );
}

// Production-safe testing helpers (only available in browser)
if (typeof window !== 'undefined') {
  (window as any).universalBumperTest = {
    status: () => {
      console.log('🔍 Universal Bumper System Status');
      console.log(universalBumperEngine.getStatus());
    },
    
    reset: () => {
      console.log('🔄 Resetting universal bumper system...');
      stateManager.clearState();
      location.reload();
    },
    
    force: () => {
      console.log('⚡ Forcing trigger conditions...');
      stateManager.setState({
        initialTimerComplete: true,
        mouseMovementTimerComplete: true,
        mouseStoppedAt: new Date(Date.now() - 5000).toISOString()
      });
    },
    
    product: (bypass = true) => {
      console.log('🎯 Testing Product Bumper...');
      productionMonitor.bumperTriggered('product', 'manual');
      universalBumperEngine.triggerProductBumper(bypass);
    },
    
    exit: (bypass = true) => {
      console.log('🚪 Testing Exit Intent Bumper...');
      productionMonitor.bumperTriggered('exit-intent', 'manual');
      universalBumperEngine.triggerExitIntentBumper('mouse-leave', bypass);
    },
    
    capabilities: async () => {
      const caps = await capabilityDetector.detect();
      console.log('🔍 Browser Capabilities:', caps);
      return caps;
    },
    
    diagnose: async () => {
      return await (window as any).productionMonitor.diagnose();
    }
  };
  
  console.log('🔧 Universal Bumper Test Functions Available:');
  console.log('  universalBumperTest.status() - Show system status');
  console.log('  universalBumperTest.reset() - Reset and reload');
  console.log('  universalBumperTest.force() - Skip timing conditions');
  console.log('  universalBumperTest.product() - Test Product Bumper');
  console.log('  universalBumperTest.exit() - Test Exit Intent Bumper');
  console.log('  universalBumperTest.capabilities() - Check browser capabilities');
  console.log('  universalBumperTest.diagnose() - Full diagnostic report');
  console.log('  productionMonitor.diagnose() - Production monitoring report');
}
