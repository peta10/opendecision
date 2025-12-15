import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ppm-tool/components/ui/tooltip';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

export const LegalDisclaimer: React.FC = () => {
  const { isTouchDevice } = useUnifiedMobileDetection();
  const [showModal, setShowModal] = useState(false);
  
  const detailedDisclaimer = `The information is:

• Based on user-provided criteria, publicly available information & independent research
• Generated through an automated scoring system
• Not a guarantee of product performance or suitability
• Subject to change without notice

Tool rankings and features may vary based on version, implementation, and specific use cases. Users should:

• Conduct their own due diligence
• Test tools in their specific environment
• Consult with vendors for current specifications
• Consider professional advice for critical decisions`;

  // For mobile devices, use a modal approach
  if (isTouchDevice) {
    return (
      <>
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div 
                className="text-sm text-gray-700 cursor-pointer touch-manipulation"
                style={{ touchAction: 'manipulation' }}
                onClick={() => setShowModal(true)}
              >
                <span className="font-medium">Disclaimer:</span> The recommendations and match scores provided are for informational purposes only and do not constitute professional advice.{' '}
                <span className="underline decoration-dotted underline-offset-2 text-alpine-blue-600">
                  Tap for additional details
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Disclaimer</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {detailedDisclaimer}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // For desktop, use the original tooltip approach
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm">
      <div className="flex items-start space-x-2">
        <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`text-sm text-gray-700 cursor-help ${
                    isTouchDevice ? 'touch-manipulation' : ''
                  }`}
                  style={isTouchDevice ? { touchAction: 'manipulation' } : undefined}
                >
                  <span className="font-medium">Disclaimer:</span> The recommendations and match scores provided are for informational purposes only and do not constitute professional advice.{' '}
                  <span className="underline decoration-dotted underline-offset-2">
                    {isTouchDevice ? 'Tap' : 'Click or hover'} for additional details
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="start"
                className="max-w-md p-4 text-sm bg-gray-900 text-white rounded-lg shadow-lg"
                sideOffset={8}
                avoidCollisions={true}
                collisionPadding={isTouchDevice ? 16 : 8}
              >
                <div className="whitespace-pre-line">{detailedDisclaimer}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
