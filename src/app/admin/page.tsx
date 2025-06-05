"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  MessageSquare,
  Crown,
  Shield,
  ArrowRight,
  Activity,
  Database,
  Settings,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLoading } from '@/components/admin/AdminLoading';
import Link from 'next/link';

interface AdminCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  stats?: string;
}

export default function AdminDashboard() {
  const { isLoading, isAdmin, session } = useAdminAuth();

  // Show loading screen while authenticating
  if (isLoading) {
    return <AdminLoading message="Loading admin dashboard..." />;
  }

  // This should not render if not admin due to the hook redirect
  if (!isAdmin) {
    return null;
  }

  const adminCards: AdminCard[] = [
    {
      title: 'Analytics Dashboard',
      description: 'View comprehensive analytics including user stats, session data, and usage patterns',
      href: '/admin/analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'blue',
      stats: 'Real-time data'
    },
    {
      title: 'Contact Management',
      description: 'Manage user inquiries, feedback, and support requests',
      href: '/admin/contacts',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'green',
      stats: 'User feedback'
    },
    {
      title: 'Suggestions Review',
      description: 'Review and manage user suggestions and feature requests',
      href: '/admin/suggestions',
      icon: <FileText className="w-6 h-6" />,
      color: 'purple',
      stats: 'Feature requests'
    },
    {
      title: 'Admin Management',
      description: 'Promote users to admin, manage admin permissions and access control',
      href: '/admin/manage',
      icon: <Crown className="w-6 h-6" />,
      color: 'orange',
      stats: 'User roles'
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      button: 'bg-green-600 hover:bg-green-700'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      button: 'bg-orange-600 hover:bg-orange-700'
    }
  };

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                  Welcome back, {session?.user?.name}
                </p>
              </div>
            </div>
            
            {/* Admin Badge */}
            <div className="flex justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium">
                <Crown className="w-4 h-4" />
                Administrator Access
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Total Access</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Full Control</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">System Status</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">Online</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">Role</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">Admin</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Admin Modules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center sm:text-left">
              Administrative Modules
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {adminCards.map((card, index) => {
                const colors = colorClasses[card.color as keyof typeof colorClasses];
                
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`${colors.bg} ${colors.border} border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 sm:p-3 ${colors.iconBg} rounded-lg group-hover:scale-105 transition-transform`}>
                        <div className={colors.icon}>
                          {card.icon}
                        </div>
                      </div>
                      {card.stats && (
                        <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {card.stats}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    
                    <Link href={card.href}>
                      <Button className={`w-full ${colors.button} text-white group-hover:scale-[1.02] transition-transform text-sm sm:text-base`}>
                        Access Module
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-amber-800 dark:text-amber-400 mb-2">
                  Security & Responsibility
                </h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  As an administrator, you have access to sensitive user data and system functions. 
                  Please use these privileges responsibly and in accordance with privacy policies. 
                  All administrative actions are logged for security purposes.
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