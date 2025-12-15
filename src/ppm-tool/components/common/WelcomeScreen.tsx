import React from 'react';
import { ArrowRight, Target } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  onSkip?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSkip }) => {
  const howItWorksSteps = [
    {
      number: "01",
      title: "Rank Your Criteria",
      description: "Common criteria: Scalability, Integration, & extensibility. Ease of use & user experience. Implementation timeline & costs. Security & compliance."
    },
    {
      number: "02", 
      title: "Select & Evaluate Tools",
      description: "Evaluate current tech stack. Consider new options. Define your requirements and desired outcomes."
    },
    {
      number: "03",
      title: "Analyze Comparison Chart", 
      description: "Map your criteria rankings against tool criteria rankings. Compare each tool against the criteria. Review current state."
    },
    {
      number: "04",
      title: "Review Recommendations",
      description: "Score tools based on how well they meet your requirements. Define current business processes. Create your recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* How It Works Section - First thing users see */}
      <div className="w-full max-w-none bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">Discover tools that best match your business needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button 
              onClick={onGetStarted}
              className="bg-blue-400 hover:bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Complete assessment in 5 minutes or choose <button onClick={onSkip} className="text-blue-600 hover:text-blue-700 underline">Skip & use manual criteria</button>
          </p>
        </div>
      </div>

      {/* Persistent CTA Button */}
      <button
        onClick={onGetStarted}
        className="fixed bottom-8 left-8 z-50 bg-blue-400 hover:bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
      >
        Get Started
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}; 