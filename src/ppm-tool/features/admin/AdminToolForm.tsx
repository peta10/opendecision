import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Criterion } from '@/ppm-tool/shared/types';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';
import { supabase } from '@/lib/supabase';
import { LoginModal } from '@/ppm-tool/components/auth/LoginModal';
import { Slider } from '@/ppm-tool/components/ui/slider';

interface AdminToolFormProps {
  onClose: () => void;
  onSuccess: () => void;
  selectedCriteria: Criterion[];
}

// Database criterion has a different structure
interface DbCriterion {
  id: string;
  name: string;
  active_on: string;
  created_on: string;
}

// Database tag structure
interface DbTag {
  id: string;
  name: string;
  tag_type_id: string;
}

// Database tag type structure
interface DbTagType {
  id: string;
  name: string;
}

export const AdminToolForm: React.FC<AdminToolFormProps> = ({
  onClose,
  onSuccess,
  selectedCriteria
}) => {
  const [name, setName] = useState('');
  const [methodologies, setMethodologies] = useState<Set<string>>(new Set());
  const [functions, setFunctions] = useState<Set<string>>(new Set());
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  const [criteriaDescriptions, setCriteriaDescriptions] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbCriteria, setDbCriteria] = useState<DbCriterion[]>([]);
  const [dbTags, setDbTags] = useState<DbTag[]>([]);
  const [tagTypes, setTagTypes] = useState<DbTagType[]>([]);
  const [methodologyTagType, setMethodologyTagType] = useState<string | null>(null);
  const [functionTagType, setFunctionTagType] = useState<string | null>(null);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const formRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(formRef, onClose);

  // Fetch actual criteria from database
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        setIsLoadingCriteria(true);
        
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }
        
        const { data, error } = await supabase
          .from('criteria')
          .select('*')
          .order('name');
          
        if (error) {
          console.error('Error fetching criteria:', error);
          throw error;
        }
        
        if (data) {
          console.log('Fetched criteria from database:', data);
          setDbCriteria(data);
          
          // Initialize all criteria with default ratings
          const initialRatings: Record<string, number> = {};
          const initialDescriptions: Record<string, string> = {};
          
          data.forEach((criterion: any) => {
            initialRatings[criterion.id] = 1;
            initialDescriptions[criterion.id] = '';
          });
          
          setCriteriaRatings(initialRatings);
          setCriteriaDescriptions(initialDescriptions);
        }
      } catch (err) {
        console.error('Failed to load criteria:', err);
      } finally {
        setIsLoadingCriteria(false);
      }
    };
    
    fetchCriteria();
  }, []);

  // Fetch tag types first, then tags
  useEffect(() => {
    const fetchTagData = async () => {
      try {
        setIsLoadingTags(true);
        
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }
        
        // First fetch tag types
        const { data: tagTypeData, error: tagTypeError } = await supabase
          .from('tag_type')
          .select('*');
          
        if (tagTypeError) {
          console.error('Error fetching tag types:', tagTypeError);
          throw tagTypeError;
        }
        
        if (tagTypeData) {
          console.log('Fetched tag types from database:', tagTypeData);
          setTagTypes(tagTypeData);
          
          // Find methodology and function tag types
          const methodologyType = tagTypeData.find((t: any) => t.name === 'Methodology');
          const functionType = tagTypeData.find((t: any) => t.name === 'Function');
          
          if (methodologyType) setMethodologyTagType(methodologyType.id);
          if (functionType) setFunctionTagType(functionType.id);
          
          // Now fetch all tags
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('*')
            .order('name');
            
          if (tagError) {
            console.error('Error fetching tags:', tagError);
            throw tagError;
          }
          
          if (tagData) {
            console.log('Fetched tags from database:', tagData);
            setDbTags(tagData);
          }
        }
      } catch (err) {
        console.error('Failed to load tags:', err);
      } finally {
        setIsLoadingTags(false);
      }
    };
    
    fetchTagData();
  }, []);

  // Function to get tag IDs from names with proper tag type
  const getTagIds = (): string[] => {
    const methodologyIds = methodologyTagType 
      ? dbTags
          .filter(tag => 
            tag.tag_type_id === methodologyTagType && 
            methodologies.has(tag.name)
          )
          .map(tag => tag.id)
      : [];
      
    const functionIds = functionTagType 
      ? dbTags
          .filter(tag => 
            tag.tag_type_id === functionTagType && 
            functions.has(tag.name)
          )
          .map(tag => tag.id)
      : [];
      
    return [...methodologyIds, ...functionIds];
  };

  const steps = [
    {
      title: 'Basic Information',
      fields: ['name']
    },
    {
      title: 'Methodologies',
      fields: ['methodologies']
    },
    {
      title: 'Functions',
      fields: ['functions']
    },
    {
      title: 'Criteria Ratings',
      fields: ['criteria']
    }
  ];

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return name.length > 0;
      case 1:
        return methodologies.size > 0;
      case 2:
        return functions.size > 0;
      case 3:
        return dbCriteria.every(criterion => {
          return criteriaRatings[criterion.id] > 0 && 
                 criteriaDescriptions[criterion.id]?.trim() !== '';
        });
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLoadingCriteria || isLoadingTags) {
      setError('Still loading data from the database. Please wait...');
      return;
    }

    // Validate criteria
    const missingCriteria = dbCriteria.some(criterion => {
      return !criteriaRatings[criterion.id] || !criteriaDescriptions[criterion.id];
    });

    if (missingCriteria) {
      setError('Please provide ratings and descriptions for all criteria');
      return;
    }

    // Get current session
    if (!supabase) {
      setError('Supabase client not configured');
      return;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setShowLoginModal(true);
      return;
    }

    // Proceed with submission
    try {
      setIsSubmitting(true);
      console.log('Starting tool submission...');
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      // Create the tool submission
      const { data: toolId, error: submissionError } = await supabase
        .rpc('create_tool_submission', {
          p_name: name,
          p_type: 'application'
        });

      if (submissionError) {
        console.error('Error creating tool:', submissionError);
        throw submissionError;
      }

      // Handle different return shapes from RPC (uuid string or object)
      const newToolId: string =
        (typeof toolId === 'string' && toolId) ||
        (toolId && (toolId.id || toolId.tool_id)) ||
        '';

      if (!newToolId) {
        console.error('❌ create_tool_submission returned unexpected payload:', toolId);
        throw new Error('Failed to create tool: invalid ID returned from database');
      }

      console.log('✅ Tool created with ID:', newToolId);

      // Update criteria
      const criteriaPromises = dbCriteria.map(async (criterion) => {
        const rating = criteriaRatings[criterion.id];
        const description = criteriaDescriptions[criterion.id];
        
        if (!rating || !description) {
          console.error(`Missing rating or description for criterion: ${criterion.name}`);
          return false;
        }
        
        console.log(`Updating criterion ${criterion.name} (${criterion.id}) with rating ${rating}`);
        
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }
        
        const { error: criteriaError } = await supabase
          .rpc('update_tool_criteria', {
            p_tool_id: newToolId,
            p_criteria_id: criterion.id,
            p_ranking: rating,
            p_description: description
          });

        if (criteriaError) {
          console.error(`Error updating criterion ${criterion.name}:`, criteriaError);
          throw criteriaError;
        }
        
        return true;
      });
      
      // Wait for all criteria to be updated
      const criteriaResults = await Promise.all(criteriaPromises);
      if (criteriaResults.includes(false)) {
        throw new Error('Failed to update some criteria');
      }

      // Get tag IDs
      const tagIds = getTagIds();
      
      if (tagIds.length === 0) {
        throw new Error('No valid tags found. Please select at least one methodology and function.');
      }

      console.log('Adding tags:', tagIds);

      const { error: tagsError } = await supabase
        .rpc('update_tool_tags', {
          p_tool_id: newToolId,
          p_tag_ids: tagIds
        });

      if (tagsError) {
        console.error('Error updating tags:', tagsError);
        throw tagsError;
      }

      // Submit the tool
      console.log('Submitting tool...');
      const { error: submitError } = await supabase
        .rpc('submit_tool', {
          p_tool_id: newToolId
        });

      if (submitError) {
        console.error('Error submitting tool:', submitError);
        throw submitError;
      }

      console.log('Tool submitted successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting tool:', error);
      setError(`Failed to submit tool: ${error.message || 'Please try again later'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div ref={formRef} className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0 || isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Tool</h3>
                <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 flex-shrink-0">
            <div
              className="h-full bg-alpine-blue-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {(isLoadingCriteria || isLoadingTags) && (
              <div className="mb-4 p-3 bg-alpine-blue-50 border border-alpine-blue-200 text-alpine-blue-700 rounded-lg text-sm">
                Loading data from database...
              </div>
            )}
            
            {currentStep === 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">What&apos;s the name of the tool?</h4>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tool name"
                  className="w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 text-base"
                  autoFocus
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Which methodologies does it support?</h4>
                <div className="space-y-3">
                  {['Waterfall', 'Agile', 'Continuous Improvement'].map(methodology => (
                    <button
                      key={methodology}
                      type="button"
                      onClick={() => {
                        const newMethodologies = new Set(methodologies);
                        if (newMethodologies.has(methodology)) {
                          newMethodologies.delete(methodology);
                        } else {
                          newMethodologies.add(methodology);
                        }
                        setMethodologies(newMethodologies);
                      }}
                      className={`w-full text-left px-4 py-4 rounded-lg border transition-colors text-base ${
                        methodologies.has(methodology)
                          ? 'border-alpine-blue-500 bg-alpine-blue-50 text-alpine-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {methodology}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Which functions does it serve?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Marketing',
                    'Engineering',
                    'Product & Design',
                    'IT & Support',
                    'Sales & Account Management',
                    'Customer Service',
                    'Manufacturing',
                    'Operations'
                  ].map(func => (
                    <button
                      key={func}
                      type="button"
                      onClick={() => {
                        const newFunctions = new Set(functions);
                        if (newFunctions.has(func)) {
                          newFunctions.delete(func);
                        } else {
                          newFunctions.add(func);
                        }
                        setFunctions(newFunctions);
                      }}
                      className={`px-4 py-4 rounded-lg border text-left transition-colors text-sm ${
                        functions.has(func)
                          ? 'border-alpine-blue-500 bg-alpine-blue-50 text-alpine-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {func}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && !isLoadingCriteria && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Rate the tool&apos;s capabilities</h4>
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {dbCriteria.map(criterion => (
                    <div key={criterion.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                          {criterion.name}
                        </label>
                        <span className="text-sm text-gray-500">
                          {criteriaRatings[criterion.id] || 0}/5
                        </span>
                      </div>
                      <Slider
                        value={[criteriaRatings[criterion.id] || 1]}
                        onValueChange={(values) => {
                          setCriteriaRatings(prev => ({
                            ...prev,
                            [criterion.id]: values[0]
                          }));
                        }}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full mb-3"
                      />
                      <textarea
                        value={criteriaDescriptions[criterion.id] || ''}
                        onChange={(e) => {
                          setCriteriaDescriptions(prev => ({
                            ...prev,
                            [criterion.id]: e.target.value
                          }));
                        }}
                        placeholder="Explain the rating..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 text-sm"
                        rows={3}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-between flex-shrink-0">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  if (isStepComplete(currentStep)) {
                    setCurrentStep(prev => prev + 1);
                  }
                } else {
                  handleSubmit(new Event('submit') as any);
                }
              }}
              disabled={!isStepComplete(currentStep) || isSubmitting || (currentStep === 3 && (isLoadingCriteria || isLoadingTags))}
              className="px-6 py-2 text-sm font-medium text-white bg-alpine-blue-500 rounded-lg hover:bg-alpine-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting 
                ? 'Submitting...' 
                : (currentStep < steps.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  ) : 'Submit Tool')}
            </button>
          </div>
        </div>
      </div>
      
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            handleSubmit(new Event('submit') as any);
          }}
        />
      )}
    </div>
  );
};