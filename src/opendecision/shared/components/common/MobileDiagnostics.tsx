'use client';

import React, { useState, useEffect } from 'react';

interface MobileDiagnosticsProps {
  isVisible?: boolean;
}

const getBrowserName = (): string => {
  try {
    if (typeof navigator === 'undefined') return 'SSR';
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  } catch (e) {
    return 'Error detecting browser';
  }
};

export const MobileDiagnostics: React.FC<MobileDiagnosticsProps> = ({ 
  isVisible = process.env.NODE_ENV === 'development' 
}) => {
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateDiagnostics = () => {
      try {
        const data = {
          // Device info
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'SSR',
          cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
          language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
          
          // Screen info
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
          pixelDepth: window.screen.pixelDepth,
          
          // Window info
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
          
          // Viewport info
          documentWidth: document.documentElement.clientWidth,
          documentHeight: document.documentElement.clientHeight,
          devicePixelRatio: window.devicePixelRatio,
          
          // CSS properties
          visualViewportWidth: window.visualViewport?.width,
          visualViewportHeight: window.visualViewport?.height,
          
          // Touch support
          touchSupport: 'ontouchstart' in window,
          maxTouchPoints: typeof navigator !== 'undefined' ? (navigator.maxTouchPoints || 0) : 0,
          
          // Orientation
          orientation: screen.orientation?.type || 'unknown',
          orientationAngle: screen.orientation?.angle || 0,
          
          // CSS units
          vhInPx: window.innerHeight / 100,
          dvhSupported: CSS.supports('height', '100dvh'),
          webkitFillAvailableSupported: CSS.supports('height', '-webkit-fill-available'),
          
          // Performance
          connectionType: typeof navigator !== 'undefined' ? ((navigator as any).connection?.effectiveType || 'unknown') : 'unknown',
          
          // Errors and debugging
          lastError: window.localStorage?.getItem('lastPPMError') || 'none',
          
          // Browser info
          browserName: getBrowserName(),
          isStandalone: window.matchMedia('(display-mode: standalone)').matches,
          isInFrame: window !== window.top,
          
          // Viewport debugging
          documentReadyState: document.readyState,
          hasTouch: 'ontouchstart' in document.documentElement,
          
          // Performance
          memoryInfo: (performance as any).memory ? {
            used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
          } : 'not available',
          
          timestamp: new Date().toISOString()
        };
        
        setDiagnostics(data);
      } catch (error) {
        console.error('Error gathering diagnostics:', error);
        setDiagnostics({ error: error?.toString() || 'Unknown error' });
      }
    };

    updateDiagnostics();
    
    // Update on resize
    const handleResize = () => updateDiagnostics();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isMobileDevice = diagnostics.windowWidth <= 768 || diagnostics.touchSupport;
  const hasViewportIssues = diagnostics.windowHeight < 400 || diagnostics.windowWidth < 300;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-colors ${
          hasViewportIssues ? 'bg-red-500 hover:bg-red-600' : 
          isMobileDevice ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
        }`}
        title="Mobile Diagnostics"
      >
        📱
      </button>
      
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">Mobile Diagnostics</h3>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined') {
                  navigator.clipboard?.writeText(JSON.stringify(diagnostics, null, 2));
                  alert('Diagnostics copied to clipboard!');
                } else {
                  alert('Clipboard API not available');
                }
              }}
              className="text-blue-500 hover:text-blue-700"
              title="Copy diagnostics"
            >
              📋
            </button>
          </div>
          
          {hasViewportIssues && (
            <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
              <strong className="text-red-700">⚠️ Viewport Issues Detected</strong>
              <p className="text-red-600 text-xs">Small screen or unusual dimensions detected</p>
            </div>
          )}
          
          <div className="space-y-2">
            <div>
              <strong>Device Type:</strong> {isMobileDevice ? 'Mobile' : 'Desktop'}
            </div>
            <div>
              <strong>Screen:</strong> {diagnostics.screenWidth}×{diagnostics.screenHeight}
            </div>
            <div>
              <strong>Window:</strong> {diagnostics.windowWidth}×{diagnostics.windowHeight}
            </div>
            <div>
              <strong>Touch:</strong> {diagnostics.touchSupport ? 'Yes' : 'No'} ({diagnostics.maxTouchPoints} points)
            </div>
            <div>
              <strong>Orientation:</strong> {diagnostics.orientation}
            </div>
            <div>
              <strong>CSS Support:</strong>
              <br />- dvh: {diagnostics.dvhSupported ? '✅' : '❌'}
              <br />- webkit-fill: {diagnostics.webkitFillAvailableSupported ? '✅' : '❌'}
            </div>
            <div>
              <strong>Connection:</strong> {diagnostics.connectionType}
            </div>
            {diagnostics.lastError !== 'none' && (
              <div>
                <strong className="text-red-600">Last Error:</strong>
                <p className="text-red-500 break-words">{diagnostics.lastError}</p>
              </div>
            )}
          </div>
          
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">Raw Data</summary>
            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
