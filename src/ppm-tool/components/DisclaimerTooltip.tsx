import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useUnifiedMobileDetection } from '../shared/hooks/useUnifiedMobileDetection';

export const DisclaimerTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isTouchDevice, hasTouch } = useUnifiedMobileDetection();

  const disclaimerContent = (
    <div className="space-y-2">
      <p>
        <strong>Disclaimer:</strong> The recommendations and match scores provided are:
      </p>
      <ul className="space-y-1 text-gray-300">
        <li>• Based on user-provided criteria and publicly available information</li>
        <li>• Generated through an automated scoring system</li>
        <li>• Not a guarantee of product performance or suitability</li>
        <li>• Subject to change without notice</li>
      </ul>
      <p className="text-gray-300">
        Tool rankings and features may vary based on version, implementation, and specific use cases. Users should:
      </p>
      <ul className="space-y-1 text-gray-300">
        <li>• Conduct their own due diligence</li>
        <li>• Test tools in their specific environment</li>
        <li>• Consult with vendors for current specifications</li>
        <li>• Consider professional advice for critical decisions</li>
      </ul>
    </div>
  );

  const handleInteraction = () => {
    if (isTouchDevice || hasTouch) {
      setIsVisible(!isVisible);
      
      // Auto-hide after 4 seconds on mobile (but not touch-enabled laptops)
      if (!isVisible && isTouchDevice) {
        setTimeout(() => setIsVisible(false), 4000);
      }
    }
  };

  React.useEffect(() => {
    if (!isTouchDevice && !hasTouch) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-disclaimer-tooltip]')) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, isTouchDevice, hasTouch]);

  return (
    <div 
      className="relative"
      data-disclaimer-tooltip
      onMouseEnter={() => !isTouchDevice && setIsVisible(true)}
      onMouseLeave={() => !isTouchDevice && setIsVisible(false)}
      onClick={(isTouchDevice || hasTouch) ? handleInteraction : undefined}
      style={{ touchAction: (isTouchDevice || hasTouch) ? 'manipulation' : undefined }}
    >
      {/* Invisible trigger area for better touch targets */}
      <div className={`absolute inset-0 ${isTouchDevice ? 'min-h-[44px] min-w-[44px]' : ''}`} />
      
      <div className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 
        bg-gray-800 text-white text-xs rounded-lg shadow-xl z-50
        transition-all duration-200 ease-in-out
        ${isVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}
        ${(isTouchDevice || hasTouch) ? 'pointer-events-auto' : 'pointer-events-none'}
      `}>
        {disclaimerContent}
        <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
};