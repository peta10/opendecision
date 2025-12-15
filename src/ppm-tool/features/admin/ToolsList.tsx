import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Check, X, Filter, ChevronDown, ChevronUp, Search, Calendar, Plus } from 'lucide-react';
import { Tool } from '@/ppm-tool/shared/types';
import { StatusDropdown } from './StatusDropdown';
import { supabase } from '@/lib/supabase';

interface ToolsListProps {
  tools: Tool[];
  isLoading: boolean;
  onEdit: (tool: Tool) => void;
  onDelete: (toolId: string) => void;
  onApproveReject: (toolId: string, status: 'approved' | 'rejected' | 'submitted') => void;
  onApproveAll: () => void;
  onAddNewTool: () => void;
}

export const ToolsList: React.FC<ToolsListProps> = ({
  tools,
  isLoading,
  onEdit,
  onDelete,
  onApproveReject,
  onApproveAll,
  onAddNewTool
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'created_on' | 'updated_at'>('created_on');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [mobileStatusDropdownId, setMobileStatusDropdownId] = useState<string | null>(null);

  // Debug tools data when it changes
  useEffect(() => {
    console.log('🔍 ToolsList received tools:', tools.length);
    const asanaTool = tools.find(tool => tool.name === 'Asana');
    if (asanaTool) {
      console.log('🎯 Asana tool data in ToolsList:', {
        name: asanaTool.name,
        status: asanaTool.submission_status,
        criteriaCount: asanaTool.criteria?.length || 0,
        criteriaData: asanaTool.criteria,
        tagsCount: asanaTool.tags?.length || 0,
        tagsData: asanaTool.tags
      });
    }
  }, [tools]);

  const toggleSort = (field: 'name' | 'created_on' | 'updated_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTools = tools.filter(tool => {
    // Filter by status
    if (statusFilter !== 'all' && tool.submission_status !== statusFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !tool.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort tools
  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'updated_at') {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_on).getTime();
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_on).getTime();
      return sortDirection === 'asc'
        ? dateA - dateB
        : dateB - dateA;
    } else {
      const dateA = new Date(a.created_on).getTime();
      const dateB = new Date(b.created_on).getTime();
      return sortDirection === 'asc'
        ? dateA - dateB
        : dateB - dateA;
    }
  });

  // Get badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-alpine-blue-100 text-alpine-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle status change - delegate to parent for proper state management
  const handleStatusChange = async (toolId: string, newStatus: string) => {
    try {
      console.log('🔧 ToolsList: Delegating status change to parent:', { toolId, newStatus });
      
      // Close the dropdown immediately for better UX
      setEditingStatusId(null);
      setMobileStatusDropdownId(null);
      
      // Delegate to parent component which has the proper state management
      if (newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'submitted') {
        onApproveReject(toolId, newStatus as 'approved' | 'rejected' | 'submitted');
      }
    } catch (err: any) {
      console.error('❌ ToolsList: Failed to update status:', err);
      alert(`Error updating tool status: ${err.message || 'Please try again'}`);
    }
  };

  // Count tools with submitted status
  const submittedToolsCount = tools.filter(tool => tool.submission_status === 'submitted').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tools...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">All Tools</h2>
              <p className="text-sm text-gray-500">{filteredTools.length} tools</p>
            </div>
            
            {/* Approve All Button - Mobile */}
            {submittedToolsCount > 0 && (
              <button
                onClick={onApproveAll}
                className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                Approve All ({submittedToolsCount})
              </button>
            )}
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            
            {/* Add New Tool Button */}
            <button 
              onClick={onAddNewTool}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
              title="Create a new tool with complete details and submit for approval"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Tool
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden">
        {sortedTools.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No tools found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedTools.map(tool => (
              <div 
                key={tool.id} 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900 break-words">{tool.name}</h3>
                      <div className="relative">
                        {mobileStatusDropdownId === tool.id ? (
                          <StatusDropdown 
                            currentStatus={tool.submission_status}
                            onStatusChange={(status) => handleStatusChange(tool.id, status)}
                            onClose={() => setMobileStatusDropdownId(null)}
                          />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileStatusDropdownId(tool.id);
                            }}
                            className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center justify-center ${getStatusBadgeClass(tool.submission_status)} hover:opacity-80 transition-opacity cursor-pointer`}
                          >
                            {tool.submission_status.charAt(0).toUpperCase() + tool.submission_status.slice(1)}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">{tool.type}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Array.isArray(tool.tags) && tool.tags.slice(0, 2).map((tag: any, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-alpine-blue-100 text-alpine-blue-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {Array.isArray(tool.tags) && tool.tags.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{tool.tags.length - 2} more
                        </span>
                      )}
                      {/* Debug info for missing tags */}
                      {(!Array.isArray(tool.tags) || tool.tags.length === 0) && (
                        <span className="text-xs text-red-500">No tags (Debug: {JSON.stringify(tool.tags)})</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile Action Buttons - Inline */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(tool);
                      }}
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-alpine-blue-500 bg-alpine-blue-50 rounded-md hover:bg-alpine-blue-100 transition-colors"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(tool.id);
                      }}
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </div>
                  
                  {/* Expand indicator */}
                  <div className="flex items-center text-xs text-gray-500">
                    {expandedToolId === tool.id ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-1" />
                        Expanded
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Tap to expand
                      </>
                    )}
                  </div>
                </div>
                
                {/* Expanded Criteria View */}
                {expandedToolId === tool.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Criteria Ratings 
                      <span className="text-xs text-gray-500 ml-2">
                        ({Array.isArray(tool.criteria) ? tool.criteria.length : 0} criteria)
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {Array.isArray(tool.criteria) && tool.criteria.length > 0 ? (
                        tool.criteria.map((criterion: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{criterion.name || 'Unnamed Criterion'}</span>
                              <span className={`text-sm font-semibold ${
                                criterion.ranking >= 4 ? 'text-green-600' :
                                criterion.ranking >= 3 ? 'text-alpine-blue-500' :
                                'text-gray-600'
                              }`}>{criterion.ranking || 0}/5</span>
                            </div>
                            <p className="text-xs text-gray-500">{criterion.description || 'No description'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="text-sm text-red-700">
                            No criteria data found. 
                            <br />
                            <span className="text-xs">Debug: {JSON.stringify(tool.criteria)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center">
                  <span>Tool Name</span>
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 ml-1" /> : 
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('created_on')}
              >
                <div className="flex items-center">
                  <span>Created Date</span>
                  {sortField === 'created_on' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 ml-1" /> : 
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('updated_at')}
              >
                <div className="flex items-center">
                  <span>Last Modified</span>
                  {sortField === 'updated_at' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 ml-1" /> : 
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTools.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No tools found matching your criteria.
                </td>
              </tr>
            ) : (
              sortedTools.map(tool => (
                <React.Fragment key={tool.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-sm text-gray-500">{tool.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(tool.tags) && tool.tags.length > 0 ? (
                          <>
                            {tool.tags.slice(0, 3).map((tag: any, index: number) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-alpine-blue-100 text-alpine-blue-800"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {tool.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                +{tool.tags.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tool.created_on)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.updated_at ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(tool.updated_at)}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(tool.created_on)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingStatusId === tool.id ? (
                        <StatusDropdown 
                          currentStatus={tool.submission_status}
                          onStatusChange={(status) => handleStatusChange(tool.id, status)}
                          onClose={() => setEditingStatusId(null)}
                        />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStatusId(tool.id);
                          }}
                          className={`px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tool.submission_status)} hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          {tool.submission_status.charAt(0).toUpperCase() + tool.submission_status.slice(1)}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {tool.submission_status === 'submitted' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🟢 Approve button clicked for:', tool.name, tool.id);
                                onApproveReject(tool.id, 'approved');
                              }}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🔴 Reject button clicked for:', tool.name, tool.id);
                                onApproveReject(tool.id, 'rejected');
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(tool);
                          }}
                          className="text-alpine-blue-500 hover:text-alpine-blue-700 p-1 rounded hover:bg-alpine-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(tool.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="text-gray-400" title={expandedToolId === tool.id ? "Expanded" : "Click row to expand"}>
                          {expandedToolId === tool.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expandedToolId === tool.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Criteria Ratings 
                            <span className="text-xs text-gray-500 ml-2">
                              ({Array.isArray(tool.criteria) ? tool.criteria.length : 0} criteria found)
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.isArray(tool.criteria) && tool.criteria.length > 0 ? (
                              tool.criteria.map((criterion: any, index: number) => (
                                <div key={index} className="bg-white p-3 rounded border">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">{criterion.name || 'Unnamed Criterion'}</span>
                                    <span className={`font-semibold ${
                                      criterion.ranking >= 4 ? 'text-green-600' :
                                      criterion.ranking >= 3 ? 'text-alpine-blue-500' :
                                      'text-gray-600'
                                    }`}>{criterion.ranking || 0}/5</span>
                                  </div>
                                  <p className="text-xs text-gray-500">{criterion.description || 'No description'}</p>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-sm text-red-700">
                                  No criteria data found for {tool.name}
                                  <br />
                                  <span className="text-xs">Debug: {JSON.stringify(tool.criteria)}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};