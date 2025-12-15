'use client';

import React, { useState } from 'react';
import { EmbeddableComparisonChart } from './charts/EmbeddableComparisonChart';
import { Tool, Criterion } from '@/ppm-tool/shared/types';

// Sample data for demo
const sampleCriteria: Criterion[] = [
  { 
    id: 'scalability', 
    name: 'Scalability', 
    description: 'How well the tool scales with team size',
    userRating: 4,
    ratingDescriptions: { low: 'Limited scalability', high: 'Excellent scalability' }
  },
  { 
    id: 'easeOfUse', 
    name: 'Ease of Use', 
    description: 'User interface and learning curve',
    userRating: 5,
    ratingDescriptions: { low: 'Complex interface', high: 'Very intuitive' }
  },
  { 
    id: 'integrations', 
    name: 'Integrations', 
    description: 'Third-party integrations and APIs',
    userRating: 3,
    ratingDescriptions: { low: 'Few integrations', high: 'Extensive integrations' }
  },
  { 
    id: 'reporting', 
    name: 'Reporting', 
    description: 'Analytics and reporting capabilities',
    userRating: 4,
    ratingDescriptions: { low: 'Basic reporting', high: 'Advanced analytics' }
  },
  { 
    id: 'security', 
    name: 'Security', 
    description: 'Security features and compliance',
    userRating: 5,
    ratingDescriptions: { low: 'Basic security', high: 'Enterprise-grade security' }
  },
];

const sampleTools: Tool[] = [
  {
    id: 'tool1',
    name: 'Microsoft Project',
    logo: '',
    useCases: ['Enterprise'],
    methodologies: ['Waterfall'],
    functions: ['Planning'],
    type: 'enterprise',
    created_by: null,
    tags: [],
    created_on: '2024-01-01',
    submission_status: 'approved',
    criteria: [
      { id: 'scalability', name: 'Scalability', ranking: 3, description: 'Good for large teams' },
      { id: 'easeOfUse', name: 'Ease of Use', ranking: 2, description: 'Complex interface' },
      { id: 'integrations', name: 'Integrations', ranking: 4, description: 'Microsoft ecosystem' },
      { id: 'reporting', name: 'Reporting', ranking: 4, description: 'Advanced reporting' },
      { id: 'security', name: 'Security', ranking: 5, description: 'Enterprise security' },
    ],
    ratings: {},
    ratingExplanations: {},
  },
  {
    id: 'tool2',
    name: 'Asana',
    logo: '',
    useCases: ['Small Team'],
    methodologies: ['Agile'],
    functions: ['Task Management'],
    type: 'saas',
    created_by: null,
    tags: [],
    created_on: '2024-01-01',
    submission_status: 'approved',
    criteria: [
      { id: 'scalability', name: 'Scalability', ranking: 4, description: 'Scales well' },
      { id: 'easeOfUse', name: 'Ease of Use', ranking: 5, description: 'Very intuitive' },
      { id: 'integrations', name: 'Integrations', ranking: 4, description: 'Good integrations' },
      { id: 'reporting', name: 'Reporting', ranking: 3, description: 'Basic reporting' },
      { id: 'security', name: 'Security', ranking: 4, description: 'Good security' },
    ],
    ratings: {},
    ratingExplanations: {},
  },
  {
    id: 'tool3',
    name: 'Monday.com',
    logo: '',
    useCases: ['Medium Team'],
    methodologies: ['Hybrid'],
    functions: ['Project Management'],
    type: 'saas',
    created_by: null,
    tags: [],
    created_on: '2024-01-01',
    submission_status: 'approved',
    criteria: [
      { id: 'scalability', name: 'Scalability', ranking: 4, description: 'Good scalability' },
      { id: 'easeOfUse', name: 'Ease of Use', ranking: 4, description: 'User-friendly' },
      { id: 'integrations', name: 'Integrations', ranking: 5, description: 'Excellent integrations' },
      { id: 'reporting', name: 'Reporting', ranking: 4, description: 'Good reporting' },
      { id: 'security', name: 'Security', ranking: 4, description: 'Solid security' },
    ],
    ratings: {},
    ratingExplanations: {},
  },
  {
    id: 'tool4',
    name: 'Smartsheet',
    logo: '',
    useCases: ['Enterprise'],
    methodologies: ['Waterfall', 'Agile'],
    functions: ['Planning', 'Resource Management'],
    type: 'enterprise',
    created_by: null,
    tags: [],
    created_on: '2024-01-01',
    submission_status: 'approved',
    criteria: [
      { id: 'scalability', name: 'Scalability', ranking: 5, description: 'Excellent scalability' },
      { id: 'easeOfUse', name: 'Ease of Use', ranking: 3, description: 'Moderate complexity' },
      { id: 'integrations', name: 'Integrations', ranking: 4, description: 'Good integrations' },
      { id: 'reporting', name: 'Reporting', ranking: 5, description: 'Advanced analytics' },
      { id: 'security', name: 'Security', ranking: 5, description: 'Enterprise-grade' },
    ],
    ratings: {},
    ratingExplanations: {},
  },
];

export const EmbeddableChartDemo: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<'compact' | 'standard' | 'large'>('compact');
  const [showHeader, setShowHeader] = useState(true);
  const [heightValue, setHeightValue] = useState(300);

  const getHeightForVariant = (variant: string) => {
    switch (variant) {
      case 'compact': return 250;
      case 'standard': return 350;
      case 'large': return 450;
      default: return 300;
    }
  };

  const currentHeight = selectedVariant === 'compact' ? heightValue : getHeightForVariant(selectedVariant);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Embeddable Comparison Chart Demo
          </h1>
          <p className="text-lg text-gray-600">
            Compact, responsive chart component designed for embedding
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Size Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Variant
              </label>
              <div className="space-y-2">
                {['compact', 'standard', 'large'].map((variant) => (
                  <label key={variant} className="flex items-center">
                    <input
                      type="radio"
                      name="variant"
                      value={variant}
                      checked={selectedVariant === variant}
                      onChange={(e) => setSelectedVariant(e.target.value as 'compact' | 'standard' | 'large')}
                      className="mr-2"
                    />
                    <span className="capitalize">{variant}</span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({getHeightForVariant(variant)}px)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Header Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Options
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showHeader}
                  onChange={(e) => setShowHeader(e.target.checked)}
                  className="mr-2"
                />
                Show Header
              </label>
            </div>

            {/* Custom Height (for compact mode) */}
            {selectedVariant === 'compact' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Height (px)
                </label>
                <input
                  type="range"
                  min="200"
                  max="400"
                  value={heightValue}
                  onChange={(e) => setHeightValue(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{heightValue}px</div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Chart */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Live Preview</h2>
          
          <div className="max-w-4xl">
            <EmbeddableComparisonChart
              selectedTools={sampleTools}
              selectedCriteria={sampleCriteria}
              height={currentHeight}
              showHeader={showHeader}
              compactMode={selectedVariant === 'compact'}
            />
          </div>
        </div>

        {/* Embedding Code Examples */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Embedding Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Compact Embedded Version</h3>
              <div className="bg-gray-100 rounded p-4 text-sm font-mono overflow-x-auto">
                <pre>{`<EmbeddableComparisonChart
  selectedTools={tools}
  selectedCriteria={criteria}
  height={250}
  showHeader={true}
  compactMode={true}
/>`}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Widget-Style (No Header)</h3>
              <div className="bg-gray-100 rounded p-4 text-sm font-mono overflow-x-auto">
                <pre>{`<EmbeddableComparisonChart
  selectedTools={tools}
  selectedCriteria={criteria}
  height={300}
  showHeader={false}
  compactMode={true}
/>`}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Full-Featured Embedded</h3>
              <div className="bg-gray-100 rounded p-4 text-sm font-mono overflow-x-auto">
                <pre>{`<EmbeddableComparisonChart
  selectedTools={tools}
  selectedCriteria={criteria}
  height={400}
  showHeader={true}
  compactMode={false}
/>`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-alpine-blue-800 mb-2">📱 Mobile Optimized</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Touch-friendly controls</li>
                <li>• Responsive design</li>
                <li>• Optimized text wrapping</li>
                <li>• Gesture support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-alpine-blue-800 mb-2">🎛️ Compact Controls</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Horizontal tool toggles</li>
                <li>• Collapsible settings panel</li>
                <li>• Space-efficient layout</li>
                <li>• Quick access buttons</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-alpine-blue-800 mb-2">🔧 Configurable</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Adjustable height</li>
                <li>• Optional header</li>
                <li>• Compact/standard modes</li>
                <li>• Customizable styling</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-alpine-blue-800 mb-2">⚡ Performance</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lazy-loaded chart</li>
                <li>• Optimized rendering</li>
                <li>• Minimal bundle size</li>
                <li>• Smooth interactions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sample Embedding Contexts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Embedding Contexts</h2>
          
          <div className="space-y-6">
            {/* Blog Post Context */}
            <div className="border-l-4 border-alpine-blue-500 pl-4">
              <h3 className="font-medium mb-2">Blog Post Integration</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-3">
                  &ldquo;After evaluating several project management tools, here&apos;s how they compare against our key criteria:&rdquo;
                </p>
                <div className="max-w-lg">
                  <EmbeddableComparisonChart
                    selectedTools={sampleTools.slice(0, 3)}
                    selectedCriteria={sampleCriteria.slice(0, 4)}
                    height={280}
                    showHeader={false}
                    compactMode={true}
                  />
                </div>
              </div>
            </div>

            {/* Dashboard Widget Context */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium mb-2">Dashboard Widget</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="max-w-md">
                  <EmbeddableComparisonChart
                    selectedTools={sampleTools.slice(0, 2)}
                    selectedCriteria={sampleCriteria.slice(0, 3)}
                    height={250}
                    showHeader={true}
                    compactMode={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddableChartDemo; 