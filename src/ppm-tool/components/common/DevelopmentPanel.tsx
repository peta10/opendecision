'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Eye, EyeOff, Bug, Zap } from 'lucide-react';
import { 
  forceResetProductBumper, 
  getProductBumperState,
  ProductBumperState 
} from '@/ppm-tool/shared/utils/productBumperState';

interface DevelopmentPanelProps {
  isVisible?: boolean;
  guidedButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const DevelopmentPanel: React.FC<DevelopmentPanelProps> = ({ 
  isVisible = true,
  guidedButtonRef
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [productBumperState, setProductBumperState] = useState<ProductBumperState | null>(null);

  // Only show in development
  const isDev = process.env.NODE_ENV === 'development';
  
  // Define handler functions with useCallback
  const handleResetProductBumper = useCallback(() => {
    try {
      forceResetProductBumper();
      setProductBumperState(getProductBumperState());
      
      // Reset session state in App component
      window.dispatchEvent(new CustomEvent('productBumperReset'));
      
      // Show success notification
      console.log('🎉 ProductBumper reset successfully via dev panel!');
    } catch (error) {
      console.error('❌ Failed to reset ProductBumper:', error);
    }
  }, []);
  
  // ALWAYS call all hooks before any conditional returns
  useEffect(() => {
    // Only run if visible and in dev
    if (!isDev || !isVisible) return;
    
    // Update state periodically
    const updateState = () => {
      setProductBumperState(getProductBumperState());
    };
    
    updateState();
    const interval = setInterval(updateState, 2000);
    
    return () => clearInterval(interval);
  }, [isDev, isVisible]);

  useEffect(() => {
    // Only run if visible and in dev
    if (!isDev || !isVisible) return;
    
    // Add keyboard shortcut: Ctrl+Shift+R
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleResetProductBumper();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isDev, isVisible, handleResetProductBumper]);

  const handleTogglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusColor = () => {
    if (!productBumperState) return 'bg-gray-500';
    return productBumperState.dismissed ? 'bg-red-500' : 'bg-green-500';
  };

  const getStatusText = () => {
    if (!productBumperState) return 'Unknown';
    return productBumperState.dismissed ? 'Dismissed' : 'Active';
  };

  // Early return AFTER all hooks
  if (!isDev || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-gray-900 text-white p-4 rounded-lg shadow-xl mb-2 min-w-[280px]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Bug className="w-4 h-4 text-blue-400" />
              <span className="font-semibold">Development Panel</span>
            </div>
            
            {/* ProductBumper Status */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">ProductBumper:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                  <span className="text-white">{getStatusText()}</span>
                </div>
              </div>
              
              {productBumperState && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Show Count:</span>
                    <span className="text-white">{productBumperState.showCount}</span>
                  </div>
                  {productBumperState.dismissedAt && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Dismissed:</span>
                      <span className="text-white">
                        {new Date(productBumperState.dismissedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {/* Guided Button Debug Info */}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Guided Button:</span>
                <span className={`text-white ${guidedButtonRef?.current ? 'text-green-400' : 'text-red-400'}`}>
                  {guidedButtonRef?.current ? '✓ Found' : '✗ Missing'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <motion.button
                onClick={handleResetProductBumper}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset ProductBumper
              </motion.button>
              
              <motion.button
                onClick={() => {
                  console.log('🔧 FORCE TRIGGER ProductBumper for testing...');
                  // Force trigger ProductBumper (for debugging)
                  const event = new CustomEvent('forceShowProductBumper');
                  window.dispatchEvent(event);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-3 h-3" />
                Force Show (Debug)
              </motion.button>
              
              <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
                <div>Keyboard: <kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+R</kbd></div>
                <div>Console: <code className="bg-gray-800 px-1 rounded">forceResetProductBumper()</code></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={handleTogglePanel}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-colors flex items-center gap-2"
      >
        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      </motion.button>
    </div>
  );
};