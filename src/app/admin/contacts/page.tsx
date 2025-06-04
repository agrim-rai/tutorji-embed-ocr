'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { RefreshCw, User, Mail, MessageSquare, Tag, Calendar, BarChart3, Users, Clock, Phone, Building, Zap, AlertCircle, Trash2, Check, X, Star, StarOff, Archive, Eye, EyeOff, ChevronDown } from 'lucide-react';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  company?: string;
  isUrgent: boolean;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  isStarred: boolean;
  isArchived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const SUBJECT_COLORS = {
  'General Inquiry': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Technical Support': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Account Issue': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Billing Question': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Feature Request': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Bug Report': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Partnership': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Press & Media': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const SUBJECT_ICONS = {
  'General Inquiry': '💬',
  'Technical Support': '🔧',
  'Account Issue': '👤',
  'Billing Question': '💳',
  'Feature Request': '🚀',
  'Bug Report': '🐛',
  'Partnership': '🤝',
  'Press & Media': '📰',
  'Other': '📝',
};

const STATUS_COLORS = {
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [showArchived, setShowArchived] = useState(false);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/contact');
      const data = await response.json();

      if (response.ok) {
        // Add default admin fields if they don't exist
        const contactsWithDefaults = data.contacts.map((contact: any) => ({
          ...contact,
          priority: contact.priority || 'medium',
          isStarred: contact.isStarred || false,
          isArchived: contact.isArchived || false,
          notes: contact.notes || '',
        }));
        setContacts(contactsWithDefaults);
      } else {
        setError(data.error || 'Failed to fetch contacts');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const response = await fetch(`/api/contact/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setContacts(prev => prev.map(contact => 
          contact._id === contactId 
            ? { ...contact, ...updates, updatedAt: new Date().toISOString() }
            : contact
        ));
      } else {
        throw new Error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      // You might want to show a toast notification here
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/contact/${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContacts(prev => prev.filter(contact => contact._id !== contactId));
        setSelectedContacts(prev => {
          const newSet = new Set(prev);
          newSet.delete(contactId);
          return newSet;
        });
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      // You might want to show a toast notification here
    }
  };

  const bulkUpdateContacts = async (contactIds: string[], updates: Partial<Contact>) => {
    try {
      const promises = contactIds.map(id => updateContact(id, updates));
      await Promise.all(promises);
      setSelectedContacts(new Set());
      setBulkSelectMode(false);
    } catch (error) {
      console.error('Error bulk updating contacts:', error);
    }
  };

  const bulkDeleteContacts = async (contactIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${contactIds.length} contacts? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = contactIds.map(id => 
        fetch(`/api/contact/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      
      setContacts(prev => prev.filter(contact => !contactIds.includes(contact._id)));
      setSelectedContacts(new Set());
      setBulkSelectMode(false);
    } catch (error) {
      console.error('Error bulk deleting contacts:', error);
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

  const filteredContacts = contacts.filter(contact => {
    const subjectMatch = selectedSubject === 'All' || contact.subject === selectedSubject;
    const statusMatch = selectedStatus === 'All' || contact.status === selectedStatus;
    const priorityMatch = selectedPriority === 'All' || contact.priority === selectedPriority;
    const archivedMatch = showArchived ? contact.isArchived : !contact.isArchived;
    const starredMatch = showOnlyStarred ? contact.isStarred : true;
    
    return subjectMatch && statusMatch && priorityMatch && archivedMatch && starredMatch;
  });

  const subjectCounts = contacts.filter(c => !c.isArchived).reduce((acc, contact) => {
    acc[contact.subject] = (acc[contact.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = contacts.filter(c => !c.isArchived).reduce((acc, contact) => {
    acc[contact.status] = (acc[contact.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const urgentContacts = contacts.filter(c => c.isUrgent && !c.isArchived).length;
  const starredContacts = contacts.filter(c => c.isStarred && !c.isArchived).length;
  const archivedContacts = contacts.filter(c => c.isArchived).length;
  const uniqueSubjects = Object.keys(subjectCounts).sort();
  const statuses = ['pending', 'in-progress', 'resolved'];
  const priorities = ['low', 'medium', 'high'];

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const selectAllFilteredContacts = () => {
    const filteredIds = filteredContacts.map(c => c._id);
    setSelectedContacts(new Set(filteredIds));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading contacts...</p>
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
                  <h3 className="font-semibold text-destructive mb-1">Error Loading Contacts</h3>
                  <p className="text-sm text-destructive/80 mb-3">{error}</p>
                  <button
                    onClick={fetchContacts}
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
              Contact{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Manage contact submissions and support requests ({contacts.filter(c => !c.isArchived).length} active)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={fetchContacts}
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
                    {selectedContacts.size} of {filteredContacts.length} selected
                  </span>
                  <button
                    onClick={selectAllFilteredContacts}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Select All Visible
                  </button>
                  <button
                    onClick={() => setSelectedContacts(new Set())}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Clear Selection
                  </button>
                </div>
                
                {selectedContacts.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          bulkUpdateContacts(Array.from(selectedContacts), { status: e.target.value as any });
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-1 text-sm border rounded bg-background"
                    >
                      <option value="">Change Status</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          bulkUpdateContacts(Array.from(selectedContacts), { priority: e.target.value as any });
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
                      onClick={() => bulkUpdateContacts(Array.from(selectedContacts), { isStarred: true })}
                      className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                    >
                      ⭐ Star
                    </button>
                    
                    <button
                      onClick={() => bulkUpdateContacts(Array.from(selectedContacts), { isArchived: true })}
                      className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded"
                    >
                      📦 Archive
                    </button>
                    
                    <button
                      onClick={() => bulkDeleteContacts(Array.from(selectedContacts))}
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
            {/* Subject Filter */}
            {uniqueSubjects.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Filter by Subject</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSubject('All')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSubject === 'All'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    All ({contacts.filter(c => !c.isArchived).length})
                  </button>
                  {uniqueSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedSubject === subject
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span>{SUBJECT_ICONS[subject as keyof typeof SUBJECT_ICONS]}</span>
                      {subject} ({subjectCounts[subject]})
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
                  All ({contacts.filter(c => !c.isArchived).length})
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
                    {status.replace('-', ' ')} ({statusCounts[status] || 0})
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
          {contacts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{contacts.filter(c => !c.isArchived).length}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{urgentContacts}</div>
                    <div className="text-sm text-muted-foreground">Urgent</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{starredContacts}</div>
                    <div className="text-sm text-muted-foreground">Starred</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{new Set(contacts.filter(c => !c.isArchived).map(c => c.email)).size}</div>
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
                    <div className="text-2xl font-bold">{archivedContacts}</div>
                    <div className="text-sm text-muted-foreground">Archived</div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{uniqueSubjects.length}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Grid */}
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {contacts.length === 0 ? 'No contacts yet' : 'No matching contacts found'}
              </h3>
              <p className="text-muted-foreground">
                {contacts.length === 0 
                  ? 'When users submit contact forms, they will appear here.'
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  className={`bg-card border rounded-lg hover:shadow-lg transition-all duration-200 p-6 ${
                    contact.isUrgent ? 'ring-2 ring-orange-500/50' : ''
                  } ${
                    contact.isStarred ? 'ring-2 ring-yellow-400/50' : ''
                  } ${
                    contact.isArchived ? 'opacity-60' : ''
                  } ${
                    selectedContacts.has(contact._id) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Header with Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {bulkSelectMode && (
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact._id)}
                          onChange={() => toggleContactSelection(contact._id)}
                          className="rounded border-gray-300"
                        />
                      )}
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(contact.name)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate flex items-center gap-2">
                          {contact.name}
                          {contact.isUrgent && <Zap className="w-4 h-4 text-orange-500" />}
                          {contact.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {contact.isArchived && <Archive className="w-4 h-4 text-gray-500" />}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateContact(contact._id, { isStarred: !contact.isStarred })}
                        className={`p-1 rounded hover:bg-muted ${
                          contact.isStarred ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                      >
                        {contact.isStarred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => setExpandedContact(expandedContact === contact._id ? null : contact._id)}
                        className="p-1 rounded hover:bg-muted text-gray-400"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          expandedContact === contact._id ? 'rotate-180' : ''
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {contact.phone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {contact.phone}
                      </p>
                    )}
                    {contact.company && (
                      <p className="text-sm flex items-center gap-2">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        {contact.company}
                      </p>
                    )}
                  </div>

                  {/* Subject, Status, and Priority Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      SUBJECT_COLORS[contact.subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.Other
                    }`}>
                      <span>{SUBJECT_ICONS[contact.subject as keyof typeof SUBJECT_ICONS] || '📝'}</span>
                      {contact.subject}
                    </span>
                    
                    <select
                      value={contact.status}
                      onChange={(e) => updateContact(contact._id, { status: e.target.value as any })}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${STATUS_COLORS[contact.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    <select
                      value={contact.priority}
                      onChange={(e) => updateContact(contact._id, { priority: e.target.value as any })}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${PRIORITY_COLORS[contact.priority]}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {contact.message}
                    </p>
                  </div>

                  {/* Expanded Content */}
                  {expandedContact === contact._id && (
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Admin Notes</label>
                        <textarea
                          value={contact.notes || ''}
                          onChange={(e) => updateContact(contact._id, { notes: e.target.value })}
                          placeholder="Add internal notes..."
                          className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateContact(contact._id, { isArchived: !contact.isArchived })}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                            contact.isArchived
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                          }`}
                        >
                          {contact.isArchived ? '📤 Unarchive' : '📦 Archive'}
                        </button>
                        
                        <button
                          onClick={() => deleteContact(contact._id)}
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
                    <span>{formatDate(contact.createdAt)}</span>
                  </div>
                  
                  {contact.updatedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Updated: {formatDate(contact.updatedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Analytics */}
          {contacts.length > 0 && (
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              {/* Subject Distribution */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-6">Subject Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(subjectCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([subject, count]) => {
                      const percentage = Math.round((count / contacts.filter(c => !c.isArchived).length) * 100);
                      return (
                        <div key={subject} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{SUBJECT_ICONS[subject as keyof typeof SUBJECT_ICONS] || '📝'}</span>
                            <span className="text-sm font-medium">{subject}</span>
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
                    const percentage = contacts.filter(c => !c.isArchived).length > 0 ? Math.round((count / contacts.filter(c => !c.isArchived).length) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'pending' ? 'bg-orange-500' :
                            status === 'in-progress' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}></div>
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