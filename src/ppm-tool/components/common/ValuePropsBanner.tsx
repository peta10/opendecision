import React from 'react';
import { Target, Zap, Award, Rocket } from 'lucide-react';

export const ValuePropsBanner: React.FC = () => {
  const valueProps = [
    {
      icon: Zap,
      title: "Instant Intelligence",
      description: "Get smart recommendations in minutes, not months of research."
    },
    {
      icon: Target,
      title: "Tailored Results", 
      description: "Customized analysis based on your specific organizational needs."
    },
    {
      icon: Award,
      title: "Proven Methodology",
      description: "Research-backed framework used by leading organizations."
    },
    {
      icon: Rocket,
      title: "Start on Course",
      description: "Begin with confidence knowing you've made the right choice."
    }
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {valueProps.map((prop, index) => {
            const IconComponent = prop.icon;
            return (
              <div key={index} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{prop.title}</h3>
                  <p className="text-xs text-gray-600 truncate hidden lg:block">{prop.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 