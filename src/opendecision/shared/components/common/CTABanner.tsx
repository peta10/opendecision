import React from 'react';
import Image from 'next/image';

export const CTABanner: React.FC = () => {
  const handleGetAdvice = () => {
    window.open('https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt', '_blank');
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 py-3 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Profile image and text */}
          <div className="flex items-center gap-3 flex-1">
            {/* Profile Image */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center flex-shrink-0">
              <Image 
                src="https://images.unsplash.com/photo-1494790108755-2616b612b890?w=48&h=48&fit=crop&crop=face"
                alt="Software Advisor"
                width={48}
                height={48}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            
            {/* Text Content */}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                Want software advice from the experts?
              </h3>
              <p className="text-gray-600 text-xs">
                Get free help from our project management software advisors to find your match.
              </p>
            </div>
          </div>
          
          {/* Right side - CTA Button */}
          <div className="flex-shrink-0">
            <button 
              onClick={handleGetAdvice}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm whitespace-nowrap shadow-sm hover:shadow-md"
            >
              Get Free Advice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 