import React from 'react';
import { Tool, Criterion } from '@/opendecision/shared/types';
import { Settings, EyeOff, X } from 'lucide-react';
import { useClickOutside } from '@/opendecision/shared/hooks/useClickOutside';

interface ChartControlsProps {
  tools: Tool[];
  criteria: Criterion[];
  visibleTools: Set<string>;
  visibleCriteria: Set<string>;
  onToggleTool: (toolId: string) => void;
  onToggleCriterion: (criterionId: string) => void;
  onToggleAllTools: (visible: boolean) => void;
  onToggleAllCriteria: (visible: boolean) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  tools,
  criteria,
  visibleTools,
  visibleCriteria,
  onToggleTool,
  onToggleCriterion,
  onToggleAllTools,
  onToggleAllCriteria,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tools' | 'criteria'>('tools');
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  });

  // Handle scroll wheel events for the dropdown
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent the event from bubbling up to Lenis
      e.stopPropagation();
      
      // Enable native scrolling for this element
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;
      
      // Allow default scroll behavior within the container
      if (
        (isScrollingDown && scrollTop < scrollHeight - clientHeight) ||
        (isScrollingUp && scrollTop > 0)
      ) {
        // Let the browser handle the scroll naturally
        return;
      }
      
      // Prevent scrolling if we're at the boundary
      if (
        (isScrollingDown && scrollTop >= scrollHeight - clientHeight) ||
        (isScrollingUp && scrollTop <= 0)
      ) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isSettingsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg"
        aria-label="Chart settings"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {isSettingsOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 mx-4 md:mx-0">
          <div className="flex items-center justify-between p-3 md:p-4 border-b">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm md:text-base text-gray-900 truncate">Chart Settings</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                Toggle visibility of tools and criteria
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm font-medium transition-colors ${
                activeTab === 'tools'
                  ? 'text-alpine-blue-600 bg-white border-b-2 border-alpine-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Tools ({tools.length + 1})
            </button>
            <button
              onClick={() => setActiveTab('criteria')}
              className={`flex-1 py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm font-medium transition-colors ${
                activeTab === 'criteria'
                  ? 'text-alpine-blue-600 bg-white border-b-2 border-alpine-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Criteria ({criteria.length})
            </button>
          </div>

          <div 
            ref={scrollContainerRef}
            className="p-3 md:p-4 max-h-[60vh] overflow-y-auto"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Tools Section */}
            {activeTab === 'tools' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button
                      onClick={() => onToggleAllTools(true)}
                      className="text-xs text-alpine-blue-600 hover:text-alpine-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded hover:bg-alpine-blue-50 font-medium"
                    >
                      Show All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => onToggleAllTools(false)}
                      className="text-xs text-alpine-blue-600 hover:text-alpine-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded hover:bg-alpine-blue-50 font-medium"
                    >
                      Hide All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <button
                    onClick={() => onToggleTool('requirements')}
                    className="flex items-center w-full px-2 md:px-3 py-1.5 md:py-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center flex-1">
                      <div
                        className={`w-3 h-3 md:w-4 md:h-4 border-2 border-dashed border-green-500 ${
                          visibleTools.has('requirements')
                            ? 'bg-green-100'
                            : 'bg-transparent'
                        }`}
                      />
                      <span className="ml-2 text-xs md:text-sm text-gray-600 truncate">Your Tool</span>
                    </div>
                    {!visibleTools.has('requirements') && (
                      <EyeOff className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => onToggleTool(tool.id)}
                      className="flex items-center w-full px-2 md:px-3 py-1.5 md:py-2 rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div
                          className={`w-3 h-3 md:w-4 md:h-4 border flex-shrink-0 ${
                            visibleTools.has(tool.id)
                              ? 'bg-alpine-blue-100 border-alpine-blue-500'
                              : 'border-gray-300'
                          }`}
                        />
                        <span className="ml-2 text-xs md:text-sm text-gray-600 truncate">
                          {tool.name}
                        </span>
                      </div>
                      {!visibleTools.has(tool.id) && (
                        <EyeOff className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Criteria Section */}
            {activeTab === 'criteria' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button
                      onClick={() => onToggleAllCriteria(true)}
                      className="text-xs text-alpine-blue-600 hover:text-alpine-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded hover:bg-alpine-blue-50 font-medium"
                    >
                      Show All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => onToggleAllCriteria(false)}
                      className="text-xs text-alpine-blue-600 hover:text-alpine-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded hover:bg-alpine-blue-50 font-medium"
                      disabled={visibleCriteria.size <= 1}
                    >
                      Hide All
                    </button>
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-gray-500">
                    Minimum 1 criterion required ({visibleCriteria.size}/{criteria.length} visible)
                  </p>
                </div>
                <div className="space-y-1 md:space-y-2">
                  {criteria.map((criterion) => {
                    const isVisible = visibleCriteria.has(criterion.id);
                    const canToggleOff = visibleCriteria.size > 1;
                    const isDisabled = isVisible && !canToggleOff;
                    
                    return (
                      <button
                        key={criterion.id}
                        onClick={() => onToggleCriterion(criterion.id)}
                        disabled={isDisabled}
                        className={`flex items-center w-full px-2 md:px-3 py-1.5 md:py-2 rounded transition-colors ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div
                            className={`w-3 h-3 md:w-4 md:h-4 border flex-shrink-0 ${
                              isVisible
                                ? 'bg-alpine-blue-100 border-alpine-blue-500'
                                : 'border-gray-300'
                            }`}
                          />
                          <span className={`ml-2 text-xs md:text-sm truncate ${
                            isDisabled ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {criterion.name}
                          </span>
                        </div>
                        {!isVisible && (
                          <EyeOff className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                        )}
                        {isDisabled && (
                          <span className="text-xs text-gray-400 ml-2">Required</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};