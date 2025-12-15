import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';
import { supabase } from '@/lib/supabase';
import { Slider } from '@/ppm-tool/components/ui/slider';

interface EditToolFormProps {
  tool: Tool;
  onClose: () => void;
  onSuccess: () => void;
}

interface DbCriterion {
  id: string;
  name: string;
  active_on: string;
  created_on: string;
}

interface DbTag {
  id: string;
  name: string;
  tag_type_id: string;
}

interface DbTagType {
  id: string;
  name: string;
}

export const EditToolForm: React.FC<EditToolFormProps> = ({
  tool,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState(tool.name || '');
  const [methodologies, setMethodologies] = useState<Set<string>>(new Set());
  const [functions, setFunctions] = useState<Set<string>>(new Set());
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  const [criteriaDescriptions, setCriteriaDescriptions] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbCriteria, setDbCriteria] = useState<DbCriterion[]>([]);
  const [dbTags, setDbTags] = useState<DbTag[]>([]);
  const [tagTypes, setTagTypes] = useState<DbTagType[]>([]);
  const [methodologyTypeId, setMethodologyTypeId] = useState<string | null>(null);
  const [functionTypeId, setFunctionTypeId] = useState<string | null>(null);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const formRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(formRef, onClose);

  // Fetch criteria from database
  const fetchCriteria = useCallback(async () => {
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
        
        // Initialize criteria ratings and descriptions from tool data
        const ratings: Record<string, number> = {};
        const descriptions: Record<string, string> = {};
        
        if (tool && Array.isArray(tool.criteria)) {
          console.log('🔍 EDIT FORM DEBUG - Tool criteria structure:', tool.criteria);
          tool.criteria.forEach((criterion: any) => {
            const criterionId = criterion.criteria_id || criterion.id;
            if (criterionId) {
              ratings[criterionId] = criterion.ranking ?? criterion.rating ?? 0;
              descriptions[criterionId] = criterion.description || '';
              console.log(`✅ Initial rating for ${criterion.name || criterionId}: ${ratings[criterionId]}`);
            }
          });
        }
        
        // Ensure all criteria have an initial value
        data.forEach((criterion: any) => {
          if (!ratings[criterion.id]) {
            ratings[criterion.id] = 1;
          }
          if (!descriptions[criterion.id]) {
            descriptions[criterion.id] = '';
          }
        });
        
        setCriteriaRatings(ratings);
        setCriteriaDescriptions(descriptions);
      }
    } catch (err) {
      console.error('Failed to load criteria:', err);
      setError('Failed to load criteria. Please try again.');
    } finally {
      setIsLoadingCriteria(false);
    }
  }, [tool]);

  // Fetch tags and tag types
  const fetchTagsAndTypes = useCallback(async () => {
    try {
      setIsLoadingTags(true);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      // First fetch tag types
      const { data: typeData, error: typeError } = await supabase
        .from('tag_type')
        .select('*');
      
      if (typeError) {
        console.error('Error fetching tag types:', typeError);
        throw typeError;
      }
      
      if (typeData) {
        setTagTypes(typeData);
        
        // Find the methodology and function type IDs
        const methodologyType = typeData.find((t: any) => t.name === 'Methodology');
        const functionType = typeData.find((t: any) => t.name === 'Function');
        
        if (methodologyType) setMethodologyTypeId(methodologyType.id);
        if (functionType) setFunctionTypeId(functionType.id);
        
        // Now fetch all tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .order('name');
        
        if (tagsError) {
          console.error('Error fetching tags:', tagsError);
          throw tagsError;
        }
        
        if (tagsData) {
          setDbTags(tagsData);
          
          // Initialize methodologies and functions from tool data
          if (tool && Array.isArray(tool.tags)) {
            console.log('🔍 EDIT FORM DEBUG - Tool tags:', tool.tags);
            const methodologySet = new Set<string>();
            const functionSet = new Set<string>();
            
            tool.tags.forEach((tag: any) => {
              const tagTypeName = tag.type || tag.tag_type || tag.tag_type_name;
              if (tagTypeName === 'Methodology') {
                methodologySet.add(tag.name);
                console.log(`✅ Methodology: ${tag.name}`);
              } else if (tagTypeName === 'Function') {
                functionSet.add(tag.name);
                console.log(`✅ Function: ${tag.name}`);
              }
            });
            
            setMethodologies(methodologySet);
            setFunctions(functionSet);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('Failed to load tags. Please try again.');
    } finally {
      setIsLoadingTags(false);
    }
  }, [tool]);

  // Fetch critical data on initial load
  useEffect(() => {
    console.log("Tool being edited:", tool);
    fetchCriteria();
    fetchTagsAndTypes();
  }, [tool.id, fetchCriteria, fetchTagsAndTypes, tool]);

  // Get tag IDs for update
  const getTagIds = (): string[] => {
    const tagIds: string[] = [];
    
    // Add methodology tags
    if (methodologyTypeId) {
      Array.from(methodologies).forEach(methodologyName => {
        const tag = dbTags.find(t => 
          t.tag_type_id === methodologyTypeId && 
          t.name === methodologyName
        );
        if (tag) tagIds.push(tag.id);
      });
    }
    
    // Add function tags
    if (functionTypeId) {
      Array.from(functions).forEach(functionName => {
        const tag = dbTags.find(t => 
          t.tag_type_id === functionTypeId && 
          t.name === functionName
        );
        if (tag) tagIds.push(tag.id);
      });
    }
    
    return tagIds;
  };

  const steps = [
    { title: 'Basic Information', fields: ['name'] },
    { title: 'Methodologies', fields: ['methodologies'] },
    { title: 'Functions', fields: ['functions'] },
    { title: 'Criteria Ratings', fields: ['criteria'] }
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
          const hasRating = criteriaRatings[criterion.id] > 0;
          const hasDescription = criteriaDescriptions[criterion.id]?.trim() !== '';
          return hasRating && hasDescription;
        });
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLoadingCriteria || isLoadingTags) {
      setError('Still loading data from the database. Please try again later.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Starting tool update...');
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      // 1. First update the tool name
      console.log(`Updating tool name to: ${name}`);
      const { error: nameError } = await supabase
        .from('tools')
        .update({ name })
        .eq('id', tool.id);

      if (nameError) {
        console.error('Error updating tool name:', nameError);
        throw new Error(`Failed to update tool name: ${nameError.message}`);
      }

      // 2. Update the criteria
      const criteriaPromises = dbCriteria.map(async (criterion) => {
        const rating = criteriaRatings[criterion.id];
        const description = criteriaDescriptions[criterion.id] || '';
        
        if (!rating) {
          console.warn(`Skipping criterion ${criterion.name} - no rating provided`);
          return true; // Not an error, just skipping
        }
        
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }
        
        console.log(`Updating criterion ${criterion.name} with rating ${rating}...`);
        const { error: criteriaError } = await supabase
          .rpc('update_tool_criteria', {
            p_tool_id: tool.id,
            p_criteria_id: criterion.id,
            p_ranking: rating,
            p_description: description
          });

        if (criteriaError) {
          console.error(`Error updating criterion ${criterion.name}:`, criteriaError);
          throw new Error(`Failed to update criterion ${criterion.name}: ${criteriaError.message}`);
        }
        
        return true;
      });
      
      // Wait for all criteria to be updated
      await Promise.all(criteriaPromises);

      // 3. Update the tags
      const tagIds = getTagIds();
      console.log('Tag IDs for update:', tagIds);
      
      if (tagIds.length === 0) {
        throw new Error('No valid tags selected. Please select at least one methodology and function.');
      }

      console.log(`Updating tags for tool ${tool.id}`);
      const { error: tagsError } = await supabase
        .rpc('update_tool_tags', {
          p_tool_id: tool.id,
          p_tag_ids: tagIds
        });

      if (tagsError) {
        console.error('Error updating tags:', tagsError);
        throw new Error(`Failed to update tags: ${tagsError.message}`);
      }

      console.log('Tool update completed successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error during tool update:', error);
      setError(error.message || 'Failed to update tool. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Edit Tool: {tool.name}</h3>
          <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-alpine-blue-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {(isLoadingCriteria || isLoadingTags) && (
          <div className="flex justify-center items-center py-8">
            <Loader className="w-8 h-8 text-alpine-blue-500 animate-spin" />
            <span className="ml-3 text-gray-600">Loading data from database...</span>
          </div>
        )}
        
        {!isLoadingCriteria && !isLoadingTags && (
          <>
            {currentStep === 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Tool Name</h4>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tool name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500"
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Which methodologies does it support?</h4>
                <div className="space-y-2">
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
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
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
                <div className="grid grid-cols-2 gap-2">
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
                      className={`px-4 py-3 rounded-lg border text-left transition-colors ${
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

            {currentStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Rate the tool&apos;s capabilities</h4>
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {dbCriteria.map(criterion => (
                    <div key={criterion.id}>
                      <div className="flex justify-between mb-1">
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
                          const newValue = values[0];
                          console.log(`Setting ${criterion.name} rating to ${newValue}`);
                          setCriteriaRatings(prev => ({
                            ...prev,
                            [criterion.id]: newValue
                          }));
                        }}
                        min={1}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                      <textarea
                        value={criteriaDescriptions[criterion.id] || ''}
                        onChange={(e) => {
                          console.log(`Setting ${criterion.name} description to: ${e.target.value.slice(0, 20)}...`);
                          setCriteriaDescriptions(prev => ({
                            ...prev,
                            [criterion.id]: e.target.value
                          }));
                        }}
                        placeholder="Explain the rating..."
                        className="mt-2 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-alpine-blue-500 focus:border-alpine-blue-500 text-sm"
                        rows={3}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0 || isSubmitting || isLoadingCriteria || isLoadingTags}
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
          disabled={
            !isStepComplete(currentStep) || 
            isSubmitting || 
            isLoadingCriteria || 
            isLoadingTags
          }
          className="px-4 py-2 text-sm font-medium text-white bg-alpine-blue-500 rounded-lg hover:bg-alpine-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting && <Loader className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting 
            ? 'Saving...' 
            : (currentStep < steps.length - 1 ? 'Next' : 'Save Changes')}
        </button>
      </div>
    </div>
  );
};