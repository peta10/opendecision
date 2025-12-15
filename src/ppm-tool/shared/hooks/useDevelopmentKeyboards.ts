import { useEffect } from 'react';
import { resetToHomeState } from '@/ppm-tool/shared/utils/homeState';
import { printBumperDebugReport } from '@/ppm-tool/shared/utils/bumperDebugger';

interface DevelopmentKeyboardsConfig {
  onTriggerProductBumper?: () => void;
  onTriggerExitIntentBumper?: () => void;
  onResetState?: () => void;
  enabled?: boolean;
}

/**
 * Development hook for keyboard shortcuts to test bumpers
 * Ctrl+Shift+Q - Trigger ProductBumper
 * Ctrl+Shift+X - Trigger ExitIntentBumper (changed from E to avoid browser conflicts)
 * Ctrl+Shift+R - Reset All States (Home + Bumper)
 * 
 * Note: Home state shortcuts are separate (Ctrl+Shift+H/T/O)
 */
export const useDevelopmentKeyboards = ({
  onTriggerProductBumper,
  onTriggerExitIntentBumper,
  onResetState,
  enabled = true
}: DevelopmentKeyboardsConfig) => {
  useEffect(() => {
    // Enable in all environments for bumper testing
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift combinations
      if (event.ctrlKey && event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'q':
            event.preventDefault();
            console.log('🔥 Development Keyboard: Triggering ProductBumper (Ctrl+Shift+Q)');
            onTriggerProductBumper?.();
            break;
          
          case 'x':
            event.preventDefault();
            console.log('🔥 Development Keyboard: Triggering ExitIntentBumper (Ctrl+Shift+X)');
            onTriggerExitIntentBumper?.();
            break;
          
          case 'r':
            event.preventDefault();
            console.log('🔥 Development Keyboard: Resetting All States (Ctrl+Shift+R)');
            // Reset home state first
            resetToHomeState();
            // Then reset bumper states
            onResetState?.();
            console.log('✅ Reset Complete: Home state and bumper states reset');
            break;
            
          case 'd':
            event.preventDefault();
            console.log('🔥 Development Keyboard: Debug Report (Ctrl+Shift+D)');
            printBumperDebugReport();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Log available shortcuts (only once)
    if (!(window as any).__keyboardShortcutsLogged) {
      console.log('🎹 Bumper Keyboard Shortcuts Enabled:');
      console.log('  Ctrl+Shift+Q - Trigger ProductBumper');
      console.log('  Ctrl+Shift+X - Trigger ExitIntentBumper (X for eXit)');
      console.log('  Ctrl+Shift+R - Reset All States (Home + Bumper)');
      console.log('  Ctrl+Shift+D - Debug Report (comprehensive status)');
      (window as any).__keyboardShortcutsLogged = true;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTriggerProductBumper, onTriggerExitIntentBumper, onResetState, enabled]);
};
