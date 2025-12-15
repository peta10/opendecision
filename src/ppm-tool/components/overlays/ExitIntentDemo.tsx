'use client';

import React, { useState } from 'react';
import { ExitIntentBumper } from './ExitIntentBumper';
import { useExitIntent } from '@/ppm-tool/shared/hooks/useExitIntent';

export const ExitIntentDemo: React.FC = () => {
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [triggerType, setTriggerType] = useState<'mouse-leave' | 'tab-switch'>('mouse-leave');

  const { hasTriggered, timeOnPage, reset } = useExitIntent({
    onTrigger: (type) => {
      console.log('🎯 Exit intent triggered:', type);
      setTriggerType(type);
      setShowExitIntent(true);
    },
    enabled: true,
    minTimeOnPage: 5000 // 5 seconds for demo
  });

  // Removed handleGetReport since this is now purely informational

  const handleClose = () => {
    setShowExitIntent(false);
  };

  const handleReset = () => {
    // Reset both the hook state and localStorage state
    reset();
    setShowExitIntent(false);
    // Also reset the localStorage state for testing
    if (typeof window !== 'undefined') {
      localStorage.removeItem('exitIntentState');
      console.log('🧹 Exit intent state reset for testing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Exit Intent Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Move your mouse to the top of the browser window (toward the tabs)</li>
            <li>• Or switch to a different tab</li>
            <li>• Wait at least 5 seconds before trying</li>
            <li>• The exit intent popup should appear</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Time on page:</strong> {Math.round(timeOnPage / 1000)}s</p>
            <p><strong>Has triggered:</strong> {hasTriggered ? 'Yes' : 'No'}</p>
            <p><strong>Trigger type:</strong> {triggerType}</p>
          </div>
          
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reset Demo
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Content</h2>
          <p className="text-gray-600 mb-4">
            This is some test content to make the page feel more realistic. 
            Try moving your mouse to the top of the browser window to trigger the exit intent popup.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded">
                <h3 className="font-medium">Test Card {i + 1}</h3>
                <p className="text-sm text-gray-600">
                  This is a test card to add some content to the page.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exit Intent Bumper */}
      <ExitIntentBumper
        isVisible={showExitIntent}
        onClose={handleClose}
        triggerType={triggerType}
      />
    </div>
  );
};
