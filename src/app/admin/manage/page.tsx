"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  UserPlus,
  UserMinus,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLoading } from '@/components/admin/AdminLoading';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminManagePage() {
  const { isLoading: authLoading, isAdmin, session } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // Move fetchAdmins function BEFORE useEffect
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/manage');
      const data = await response.json();
      
      if (data.success) {
        setAdmins(data.admins);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch admins' });
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      setMessage({ type: 'error', text: 'Failed to fetch admins' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchAdmins();
    }
  }, [session]);

  // Show loading screen while authenticating
  if (authLoading) {
    return <AdminLoading message="Loading admin management..." />;
  }

  // This should not render if not admin due to the hook redirect
  if (!isAdmin) {
    return null;
  }

  const promoteUser = async (email: string) => {
    try {
      setActionLoading(`promote-${email}`);
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'promote',
          email: email
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setNewAdminEmail('');
        fetchAdmins(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to promote user' });
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      setMessage({ type: 'error', text: 'Failed to promote user' });
    } finally {
      setActionLoading(null);
    }
  };

  const revokeAdmin = async (email: string) => {
    if (email === session?.user?.email) {
      setMessage({ type: 'error', text: 'You cannot revoke your own admin access' });
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
      return;
    }

    try {
      setActionLoading(`revoke-${email}`);
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke',
          email: email
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchAdmins(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to revoke admin access' });
      }
    } catch (error) {
      console.error('Error revoking admin:', error);
      setMessage({ type: 'error', text: 'Failed to revoke admin access' });
    } finally {
      setActionLoading(null);
    }
  };

  const bulkPromote = async () => {
    const emails = bulkEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      setMessage({ type: 'error', text: 'Please enter valid email addresses' });
      return;
    }

    try {
      setActionLoading('bulk-promote');
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'promote',
          emails: emails
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setBulkEmails('');
        setShowBulkAdd(false);
        fetchAdmins(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to promote users' });
      }
    } catch (error) {
      console.error('Error bulk promoting users:', error);
      setMessage({ type: 'error', text: 'Failed to promote users' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-300">Loading...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="flex-1 px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Admin Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  Manage administrator access and permissions
                </p>
              </div>
            </div>
          </motion.div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="text-sm sm:text-base">{message.text}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessage(null)}
                  className="ml-auto p-1"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Add New Admin */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Promote to Admin
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      />
                    </div>
                    <Button
                      onClick={() => promoteUser(newAdminEmail)}
                      disabled={!newAdminEmail || actionLoading === `promote-${newAdminEmail}`}
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-sm sm:text-base"
                    >
                      {actionLoading === `promote-${newAdminEmail}` ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => setShowBulkAdd(!showBulkAdd)}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Bulk Add Admins
                  </Button>
                  
                  {showBulkAdd && (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Addresses (one per line)
                      </label>
                      <textarea
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={bulkPromote}
                          disabled={!bulkEmails.trim() || actionLoading === 'bulk-promote'}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                        >
                          {actionLoading === 'bulk-promote' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Promote All'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowBulkAdd(false);
                            setBulkEmails('');
                          }}
                          variant="outline"
                          className="text-sm sm:text-base"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Current Admins */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Current Admins ({admins.length})
                  </h2>
                </div>
                <Button
                  onClick={fetchAdmins}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {admins.map((admin, index) => (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {admin.name}
                        </h3>
                        {admin.email === session?.user?.email && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {admin.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Admin since {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {admin.email !== session?.user?.email && (
                      <Button
                        onClick={() => revokeAdmin(admin.email)}
                        disabled={actionLoading === `revoke-${admin.email}`}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        {actionLoading === `revoke-${admin.email}` ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </motion.div>
                ))}
                
                {admins.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No admins found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-1">
                  Important Security Notice
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Admin users have full access to all administrative functions including analytics, 
                  user management, and system settings. Only promote trusted users to admin status.
                  You cannot revoke your own admin access.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 