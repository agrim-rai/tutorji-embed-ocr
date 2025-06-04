'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { RefreshCw, User, Mail, MessageSquare, Tag, Calendar, BarChart3, Users, Clock, Trash2, Check, Star, StarOff, Archive, ChevronDown, Lightbulb, CheckCircle, XCircle, PlayCircle } from 'lucide-react';

interface Suggestion {
  _id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'new' | 'under-review' | 'planned' | 'in-progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  isStarred: boolean;
  isArchived: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

const TOPIC_COLORS = {
  'Feature Request': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Bug Report': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'User Experience': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Performance': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Content Quality': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Mobile App': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Accessibility': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'Integration': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'General Feedback': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'Other': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

const TOPIC_ICONS = {
  'Feature Request': '🚀',
  'Bug Report': '🐛',
  'User Experience': '✨',
  'Performance': '⚡',
  'Content Quality': '📚',
  'Mobile App': '📱',
  'Accessibility': '♿',
  'Integration': '🔗',
  'General Feedback': '💭',
  'Other': '📝',
};

const STATUS_COLORS = {
  'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'under-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'planned': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'in-progress': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_ICONS = {
  'new': '🆕',
  'under-review': '👀',
  'planned': '📋',
  'in-progress': '🔄',
  'completed': '✅',
  'rejected': '❌',
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [showArchived, setShowArchived] = useState(false);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/suggestions');
      const data = await response.json();

      if (response.ok) {
        // Add default admin fields if they don't exist
        const suggestionsWithDefaults = data.suggestions.map((suggestion: any) => ({
          ...suggestion,
          status: suggestion.status || 'new',
          priority: suggestion.priority || 'medium',
          isStarred: suggestion.isStarred || false,
          isArchived: suggestion.isArchived || false,
          adminNotes: suggestion.adminNotes || '',
        }));
        setSuggestions(suggestionsWithDefaults);
      } else {
        setError(data.error || 'Failed to fetch suggestions');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSuggestion = async (suggestionId: string, updates: Partial<Suggestion>) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setSuggestions(prev => prev.map(suggestion => 
          suggestion._id === suggestionId 
            ? { ...suggestion, ...updates, updatedAt: new Date().toISOString() }
            : suggestion
        ));
      } else {
        throw new Error('Failed to update suggestion');
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const deleteSuggestion = async (suggestionId: string) => {
    if (!confirm('Are you sure you want to delete this suggestion? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuggestions(prev => prev.filter(suggestion => suggestion._id !== suggestionId));
        setSelectedSuggestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      } else {
        throw new Error('Failed to delete suggestion');
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
    }
  };

  const bulkUpdateSuggestions = async (suggestionIds: string[], updates: Partial<Suggestion>) => {
    try {
      const promises = suggestionIds.map(id => updateSuggestion(id, updates));
      await Promise.all(promises);
      setSelectedSuggestions(new Set());
      setBulkSelectMode(false);
    } catch (error) {
      console.error('Error bulk updating suggestions:', error);
    }
  };

  const bulkDeleteSuggestions = async (suggestionIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${suggestionIds.length} suggestions? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = suggestionIds.map(id => 
        fetch(`/api/suggestions/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      
      setSuggestions(prev => prev.filter(suggestion => !suggestionIds.includes(suggestion._id)));
      setSelectedSuggestions(new Set());
      setBulkSelectMode(false);
    } catch (error) {
      console.error('Error bulk deleting suggestions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const topicMatch = selectedTopic === 'All' || suggestion.topic === selectedTopic;
    const statusMatch = selectedStatus === 'All' || suggestion.status === selectedStatus;
    const priorityMatch = selectedPriority === 'All' || suggestion.priority === selectedPriority;
    const archivedMatch = showArchived ? suggestion.isArchived : !suggestion.isArchived;
    const starredMatch = showOnlyStarred ? suggestion.isStarred : true;
    
    return topicMatch && statusMatch && priorityMatch && archivedMatch && starredMatch;
  });

  const topicCounts = suggestions.filter(s => !s.isArchived).reduce((acc, suggestion) => {
    acc[suggestion.topic] = (acc[suggestion.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = suggestions.filter(s => !s.isArchived).reduce((acc, suggestion) => {
    acc[suggestion.status] = (acc[suggestion.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const starredSuggestions = suggestions.filter(s => s.isStarred && !s.isArchived).length;
  const archivedSuggestions = suggestions.filter(s => s.isArchived).length;
  const completedSuggestions = suggestions.filter(s => s.status === 'completed' && !s.isArchived).length;
  const uniqueTopics = Object.keys(topicCounts).sort();
  const statuses = ['new', 'under-review', 'planned', 'in-progress', 'completed', 'rejected'];
  const priorities = ['low', 'medium', 'high'];

  const toggleSuggestionSelection = (suggestionId: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const selectAllFilteredSuggestions = () => {
    const filteredIds = filteredSuggestions.map(s => s._id);
    setSelectedSuggestions(new Set(filteredIds));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading suggestions...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="text-destructive">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive mb-1">Error Loading Suggestions</h3>
                  <p className="text-sm text-destructive/80 mb-3">{error}</p>
                  <button
                    onClick={fetchSuggestions}
                    className="inline-flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 underline"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Suggestion{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Manage community feedback and feature requests ({suggestions.filter(s => !s.isArchived).length} active)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={fetchSuggestions}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button
                onClick={() => setBulkSelectMode(!bulkSelectMode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  bulkSelectMode 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Check className="w-4 h-4" />
                {bulkSelectMode ? 'Exit Bulk Mode' : 'Bulk Select'}
              </button>
              <button
                onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showOnlyStarred 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Star className="w-4 h-4" />
                {showOnlyStarred ? 'Show All' : 'Starred Only'}
              </button>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showArchived 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Archive className="w-4 h-4" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {bulkSelectMode && (
            <div className="bg-card border rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedSuggestions.size} of {filteredSuggestions.length} selected
                  </span>
                  <button
                    onClick={selectAllFilteredSuggestions}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Select All Visible
                  </button>
                  <button
                    onClick={() => setSelectedSuggestions(new Set())}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Clear Selection
                  </button>
                </div>
                
                {selectedSuggestions.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          bulkUpdateSuggestions(Array.from(selectedSuggestions), { status: e.target.value as any });
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-1 text-sm border rounded bg-background"
                    >
                      <option value="">Change Status</option>
                      <option value="new">New</option>
                      <option value="under-review">Under Review</option>
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          bulkUpdateSuggestions(Array.from(selectedSuggestions), { priority: e.target.value as any });
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-1 text-sm border rounded bg-background"
                    >
                      <option value="">Change Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    
                    <button
                      onClick={() => bulkUpdateSuggestions(Array.from(selectedSuggestions), { isStarred: true })}
                      className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                    >
                      ⭐ Star
                    </button>
                    
                    <button
                      onClick={() => bulkUpdateSuggestions(Array.from(selectedSuggestions), { isArchived: true })}
                      className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded"
                    >
                      📦 Archive
                    </button>
                    
                    <button
                      onClick={() => bulkDeleteSuggestions(Array.from(selectedSuggestions))}
                      className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Topic Filter */}
            {uniqueTopics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Filter by Topic</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTopic('All')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTopic === 'All'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    All ({suggestions.filter(s => !s.isArchived).length})
                  </button>
                  {uniqueTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedTopic === topic
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span>{TOPIC_ICONS[topic as keyof typeof TOPIC_ICONS]}</span>
                      {topic} ({topicCounts[topic]})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Filter by Status</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('All')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === 'All'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  All ({suggestions.filter(s => !s.isArchived).length})
                </button>
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      selectedStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {STATUS_ICONS[status as keyof typeof STATUS_ICONS]} {status.replace('-', ' ')} ({statusCounts[status] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Filter by Priority</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPriority('All')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriority === 'All'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  All
                </button>
                {priorities.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setSelectedPriority(priority)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      selectedPriority === priority
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics */}
          {suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{suggestions.filter(s => !s.isArchived).length}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{starredSuggestions}</div>
                    <div className="text-sm text-muted-foreground">Starred</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{completedSuggestions}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{new Set(suggestions.filter(s => !s.isArchived).map(s => s.email)).size}</div>
                    <div className="text-sm text-muted-foreground">Unique Users</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                    <Archive className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{archivedSuggestions}</div>
                    <div className="text-sm text-muted-foreground">Archived</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{uniqueTopics.length}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Grid */}
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedTopic === 'All' && selectedStatus === 'All' && !showOnlyStarred ? 'No suggestions yet' : 'No matching suggestions found'}
              </h3>
              <p className="text-muted-foreground">
                {selectedTopic === 'All' && selectedStatus === 'All' && !showOnlyStarred
                  ? 'When users submit suggestions, they will appear here.'
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion._id}
                  className={`bg-card border rounded-lg hover:shadow-lg transition-all duration-200 p-6 ${
                    suggestion.isStarred ? 'ring-2 ring-yellow-400/50' : ''
                  } ${
                    suggestion.isArchived ? 'opacity-60' : ''
                  } ${
                    selectedSuggestions.has(suggestion._id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Header with Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {bulkSelectMode && (
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(suggestion._id)}
                          onChange={() => toggleSuggestionSelection(suggestion._id)}
                          className="rounded border-gray-300"
                        />
                      )}
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(suggestion.name)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate flex items-center gap-2">
                          {suggestion.name}
                          {suggestion.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {suggestion.isArchived && <Archive className="w-4 h-4 text-gray-500" />}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {suggestion.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSuggestion(suggestion._id, { isStarred: !suggestion.isStarred })}
                        className={`p-1 rounded hover:bg-muted ${
                          suggestion.isStarred ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                      >
                        {suggestion.isStarred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => setExpandedSuggestion(expandedSuggestion === suggestion._id ? null : suggestion._id)}
                        className="p-1 rounded hover:bg-muted text-gray-400"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          expandedSuggestion === suggestion._id ? 'rotate-180' : ''
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Topic, Status, and Priority Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      TOPIC_COLORS[suggestion.topic as keyof typeof TOPIC_COLORS] || TOPIC_COLORS.Other
                    }`}>
                      <span>{TOPIC_ICONS[suggestion.topic as keyof typeof TOPIC_ICONS] || '📝'}</span>
                      {suggestion.topic}
                    </span>
                    
                    <select
                      value={suggestion.status}
                      onChange={(e) => updateSuggestion(suggestion._id, { status: e.target.value as any })}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${STATUS_COLORS[suggestion.status]}`}
                    >
                      <option value="new">🆕 New</option>
                      <option value="under-review">👀 Under Review</option>
                      <option value="planned">📋 Planned</option>
                      <option value="in-progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                    
                    <select
                      value={suggestion.priority}
                      onChange={(e) => updateSuggestion(suggestion._id, { priority: e.target.value as any })}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${PRIORITY_COLORS[suggestion.priority]}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {suggestion.message}
                    </p>
                  </div>

                  {/* Expanded Content */}
                  {expandedSuggestion === suggestion._id && (
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Admin Notes</label>
                        <textarea
                          value={suggestion.adminNotes || ''}
                          onChange={(e) => updateSuggestion(suggestion._id, { adminNotes: e.target.value })}
                          placeholder="Add internal notes about this suggestion..."
                          className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSuggestion(suggestion._id, { status: 'completed' })}
                          className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          ✅ Mark Complete
                        </button>
                        
                        <button
                          onClick={() => updateSuggestion(suggestion._id, { isArchived: !suggestion.isArchived })}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            suggestion.isArchived
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                          }`}
                        >
                          {suggestion.isArchived ? '📤 Unarchive' : '📦 Archive'}
                        </button>
                        
                        <button
                          onClick={() => deleteSuggestion(suggestion._id)}
                          className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Submitted</span>
                    </div>
                    <span>{formatDate(suggestion.createdAt)}</span>
                  </div>
                  
                  {suggestion.updatedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Updated: {formatDate(suggestion.updatedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Analytics */}
          {suggestions.length > 0 && (
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              {/* Topic Distribution */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Topic Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(topicCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([topic, count]) => {
                      const percentage = Math.round((count / suggestions.filter(s => !s.isArchived).length) * 100);
                      return (
                        <div key={topic} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{TOPIC_ICONS[topic as keyof typeof TOPIC_ICONS] || '📝'}</span>
                            <span className="text-sm font-medium">{topic}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{count}</div>
                            <div className="text-xs text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Status Distribution</h3>
                <div className="space-y-3">
                  {statuses.map((status) => {
                    const count = statusCounts[status] || 0;
                    const percentage = suggestions.filter(s => !s.isArchived).length > 0 ? Math.round((count / suggestions.filter(s => !s.isArchived).length) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{STATUS_ICONS[status as keyof typeof STATUS_ICONS]}</span>
                          <span className="text-sm font-medium capitalize">{status.replace('-', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{count}</div>
                          <div className="text-xs text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
} 