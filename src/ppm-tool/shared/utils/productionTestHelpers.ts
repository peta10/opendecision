'use client';

/**
 * Production Test Helpers
 * Safe commands for testing bumpers in production
 * Now uses UniversalBumperEngine (consolidated system)
 */

import { universalBumperEngine } from '../engines/UniversalBumperEngine';
import { stateManager } from '../state/UniversalBumperStateManager';
import { printBumperDebugReport, resetAllBumperState, forceTriggerConditions } from './bumperDebugger';

// Only expose in browser
if (typeof window !== 'undefined') {
  
  // Production test suite
  (window as any).bumperTest = {
    /**
     * Quick status check
     */
    status: () => {
      console.log('🔍 Bumper System Status');
      console.log('Engine:', universalBumperEngine.getStatus());
      console.log('State:', stateManager.getState());
      printBumperDebugReport();
    },
    
    /**
     * Reset and reload
     */
    reset: () => {
      console.log('🔄 Resetting bumper system...');
      localStorage.clear();
      location.reload();
    },
    
    /**
     * Force conditions (skip waiting)
     */
    force: () => {
      console.log('⚡ Forcing trigger conditions...');
      forceTriggerConditions();
      console.log('✅ Conditions forced. Use Ctrl+Shift+Q or X to test bumpers');
    },
    
    /**
     * Test Product Bumper
     */
    product: () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Q',
        code: 'KeyQ',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    },
    
    /**
     * Test Exit Intent Bumper
     */
    exit: () => {
      const event = new KeyboardEvent('keydown', {
        key: 'X',
        code: 'KeyX',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    },
    
    /**
     * Full test sequence
     */
    runAll: async () => {
      console.log('🧪 Running full bumper test sequence...');
      
      // 1. Reset
      console.log('Step 1: Resetting...');
      resetAllBumperState();
      
      // 2. Wait for init
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Force conditions
      console.log('Step 2: Forcing conditions...');
      forceTriggerConditions();
      
      // 4. Show status
      console.log('Step 3: Current status:');
      printBumperDebugReport();
      
      console.log('✅ Test ready. Use keyboard shortcuts or bumperTest.product() / bumperTest.exit()');
    },
    
    /**
     * Monitor performance
     */
    monitor: () => {
      let count = 0;
      const interval = setInterval(() => {
        const start = performance.now();
        const status = universalBumperEngine.getStatus();
        const duration = performance.now() - start;
        
        console.log(`Monitor #${++count}: ${duration.toFixed(2)}ms`, status);
        
        if (count >= 10) {
          clearInterval(interval);
          console.log('✅ Monitoring complete');
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  };
  
  // Log availability
  console.log(`
🚀 Bumper Test Suite Loaded
Commands:
  bumperTest.status()  - Check current status
  bumperTest.reset()   - Clear and reload
  bumperTest.force()   - Skip timers
  bumperTest.product() - Show Product Bumper
  bumperTest.exit()    - Show Exit Intent
  bumperTest.runAll()  - Full test sequence
  bumperTest.monitor() - Performance monitoring
  
Keyboard shortcuts (always available):
  Ctrl+Shift+Q - Product Bumper
  Ctrl+Shift+X - Exit Intent
  Ctrl+Shift+D - Debug info
  Ctrl+Shift+R - Reset all
  `);
}
