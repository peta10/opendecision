import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ToolsList } from './ToolsList';
import { EditToolForm } from './EditToolForm';
import { AdminToolForm } from './AdminToolForm';
import { Tool, Criterion } from '@/ppm-tool/shared/types';
import { useAuth } from '@/ppm-tool/shared/hooks/useAuth';
import { LoginModal } from '@/ppm-tool/components/auth/LoginModal';
import { useLenis } from '@/ppm-tool/shared/hooks/useLenis';
import { EnvironmentDebug } from '@/ppm-tool/components/common/EnvironmentDebug';

export const AdminDashboard: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  
  // Disable Lenis for admin dashboard to prevent interference with native scrolling
  useLenis({
    disabled: true
  });
  
  useEffect(() => {
    if (user) {
      fetchTools();
      fetchCriteria();
    }
  }, [user]);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use admin_tools_view to get all tools regardless of status
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { data, error } = await supabase
        .from('admin_tools_view')
        .select('*')
        .order('created_on', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        console.log('Fetched tools:', data);
        
        // Add updated_at field if it doesn't exist
        const toolsWithUpdated = data.map((tool: Tool) => ({
          ...tool,
          updated_at: tool.updated_at || tool.submitted_at || tool.approved_at || tool.created_on
        }));
        
        setTools(toolsWithUpdated as Tool[]);
      }
    } catch (err: unknown) {
      console.error('Error fetching tools:', err);
      setError(`Failed to load tools: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCriteria = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      if (data) {
        // Transform database criteria to match Criterion type
        const formattedCriteria: Criterion[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || 'No description available',
          userRating: 3,
          ratingDescriptions: {
            low: 'Basic functionality',
            high: 'Advanced features'
          }
        }));
        
        setCriteria(formattedCriteria);
      }
    } catch (err: unknown) {
      console.error('Error fetching criteria:', err);
      setError(`Failed to load criteria: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool);
    setIsEditing(true);
    setIsAddingTool(false);
  };
  
  const handleAddNewTool = () => {
    setIsAddingTool(true);
    setIsEditing(false);
    setSelectedTool(null);
  };
  
  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId);
        
      if (error) throw error;
      
      // Refresh the tools list
      fetchTools();
    } catch (err: unknown) {
      console.error('Error deleting tool:', err);
      setError(`Failed to delete tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleApproveRejectTool = async (toolId: string, status: 'approved' | 'rejected' | 'submitted') => {
    try {
      setError(null);
      
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }
      
      // Use the update_tool_status RPC function instead of direct update
      const { error } = await supabase.rpc('update_tool_status', {
        p_tool_id: toolId,
        p_status: status
      });
      
      if (error) throw error;
      
      // Refresh the tools list
      fetchTools();
    } catch (err: unknown) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} tool:`, err);
      setError(`Failed to ${status === 'approved' ? 'approve' : 'reject'} tool: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleApproveAll = async () => {
    try {
      setError(null);
      
      const submittedTools = tools.filter(tool => tool.submission_status === 'submitted');
      
      if (submittedTools.length === 0) {
        return;
      }
      
      // Process each tool individually using the RPC function
      const promises = submittedTools.map(tool => {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }
        return supabase.rpc('update_tool_status', {
          p_tool_id: tool.id,
          p_status: 'approved'
        });
      });
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error).map(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errors approving tools:', errors);
        throw new Error(`Failed to approve ${errors.length} tools`);
      }
      
      // Refresh the tools list
      fetchTools();
    } catch (err: unknown) {
      console.error('Error approving all tools:', err);
      setError(`Failed to approve all tools: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-alpine-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login modal if no user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <LoginModal
          onClose={() => window.history.back()}
          onSuccess={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  // Show access denied if user is not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access the admin dashboard. Please contact your administrator.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden" data-lenis-prevent>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                Tool Management Dashboard
              </h1>
            </div>
            
            {/* Add New Tool button */}
            <button 
              onClick={handleAddNewTool}
              className="flex items-center px-4 py-2 bg-alpine-blue-500 text-white rounded-lg hover:bg-alpine-blue-600 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Tool
            </button>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 admin-dashboard-scroll overflow-y-auto" data-lenis-prevent>
        <div className="container mx-auto px-4 py-4 md:py-6 pb-8">
          {error && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base">{error}</p>
            </div>
          )}
          
          {isAddingTool && (
            <div className="bg-white rounded-lg shadow-lg mb-6 md:mb-8">
              <AdminToolForm 
                onClose={() => setIsAddingTool(false)}
                onSuccess={() => {
                  setIsAddingTool(false);
                  fetchTools();
                }}
                selectedCriteria={criteria}
              />
            </div>
          )}
          
          {isEditing && selectedTool ? (
            <div className="bg-white rounded-lg shadow-lg mb-6 md:mb-8">
              <EditToolForm 
                tool={selectedTool}
                onClose={() => {
                  setIsEditing(false);
                  setSelectedTool(null);
                }}
                onSuccess={() => {
                  setIsEditing(false);
                  setSelectedTool(null);
                  fetchTools();
                }}
              />
            </div>
          ) : (
            !isAddingTool && (
              <ToolsList 
                tools={tools} 
                isLoading={isLoading}
                onEdit={handleEditTool}
                onDelete={handleDeleteTool}
                onApproveReject={handleApproveRejectTool}
                onApproveAll={handleApproveAll}
                onAddNewTool={handleAddNewTool}
              />
            )
          )}
        </div>
      </div>
      <EnvironmentDebug />
    </div>
  );
};