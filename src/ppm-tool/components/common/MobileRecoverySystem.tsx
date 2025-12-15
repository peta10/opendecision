'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Monitor, Smartphone } from 'lucide-react';

interface MobileRecoverySystemProps {
  onRecovery?: () => void;
}

export const MobileRecoverySystem: React.FC<MobileRecoverySystemProps> = ({ onRecovery }) => {
  const [showRecovery, setShowRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  useEffect(() => {
    // Check if we need to show recovery system
    const checkForErrors = () => {
      try {
        const lastError = localStorage.getItem('lastPPMError');
        const errorCount = parseInt(localStorage.getItem('ppmErrorCount') || '0');
        const lastRecovery = localStorage.getItem('lastRecoveryAttempt');
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        // Show recovery if:
        // 1. There's a recent error
        // 2. Multiple errors have occurred
        // 3. Last recovery was more than 5 minutes ago
        if (lastError && (errorCount > 2 || (lastRecovery && parseInt(lastRecovery) < fiveMinutesAgo))) {
          setShowRecovery(true);
          setRecoveryAttempts(errorCount);
        }
      } catch (e) {
        console.error('Error checking for recovery needs:', e);
      }
    };

    checkForErrors();
  }, []);

  const handleFullRecovery = async () => {
    setIsRecovering(true);
    
    try {
      console.log('🔧 Starting full mobile recovery...');
      
      // Step 1: Clear all PPM tool related data
      const keysToRemove = [
        'guidedRankingAnswers',
        'personalizationData',
        'lastPPMError',
        'ppmErrorCount',
        'lastRecoveryAttempt',
        '__ppm_tool_test__'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });
      
      // Step 2: Record recovery attempt
      localStorage.setItem('lastRecoveryAttempt', Date.now().toString());
      
      // Step 3: Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Trigger recovery callback
      onRecovery?.();
      
      // Step 5: Force reload
      setTimeout(() => {
        try {
          window.location.href = '/ppm-tool?recovered=1';
        } catch (e) {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Recovery failed:', error);
      // Fallback: just reload
      window.location.reload();
    }
  };

  const handleDesktopRedirect = () => {
    try {
      const currentUrl = window.location.href;
      const desktopUrl = currentUrl.includes('?') 
        ? currentUrl + '&mobile=0&force=desktop' 
        : currentUrl + '?mobile=0&force=desktop';
      
      window.location.href = desktopUrl;
    } catch (e) {
      console.error('Desktop redirect failed:', e);
      window.location.href = '/';
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('recoveryDismissed', Date.now().toString());
      setShowRecovery(false);
    } catch (e) {
      setShowRecovery(false);
    }
  };

  if (!showRecovery) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mobile Recovery Mode</h2>
            <p className="text-sm text-gray-500">
              {recoveryAttempts} error{recoveryAttempts !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          The PPM Tool has encountered multiple issues on your mobile device. 
          Would you like to try recovering or switch to the desktop version?
        </p>

        <div className="space-y-3">
          <button
            onClick={handleFullRecovery}
            disabled={isRecovering}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Recover Mobile Version
              </>
            )}
          </button>
          
          <button
            onClick={handleDesktopRedirect}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Switch to Desktop Version
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Dismiss (Continue with Issues)
          </button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> Recovery will clear your current progress but should resolve loading issues.
          </p>
        </div>
      </div>
    </div>
  );
};
