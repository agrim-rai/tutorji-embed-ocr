"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageSquare,
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Database,
  UserCheck,
  Zap,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

interface AnalyticsData {
  users: {
    total: number;
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    growthRate: number;
    daily: Array<{ _id: string; count: number }>;
    recent: Array<{ name: string; email: string; createdAt: string; credits: number }>;
  };
  sessions: {
    total: number;
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    growthRate: number;
    daily: Array<{ _id: string; count: number }>;
    weekly: Array<{ _id: { year: number; week: number }; count: number; startDate: string }>;
    recent: Array<{ sessionId: string; createdAt: string }>;
  };
  credits: {
    average: string;
    total: number;
    max: number;
    min: number;
    distribution: Array<{ _id: string | number; count: number; avgCredits: number }>;
  };
  meta: {
    lastUpdated: string;
    dateRange: {
      today: string;
      weekStart: string;
      monthStart: string;
    };
  };
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}> = ({ title, value, subtitle, icon, trend, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend >= 0 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {trend >= 0 ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SimpleChart: React.FC<{
  title: string;
  data: Array<{ _id: string; count: number }>;
  color?: string;
}> = ({ title, data, color = "blue" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item._id} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-600 dark:text-gray-300 font-medium">
              {new Date(item._id).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / maxValue) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full ${
                    color === 'blue' ? 'bg-blue-500 dark:bg-blue-400' :
                    color === 'green' ? 'bg-green-500 dark:bg-green-400' :
                    color === 'purple' ? 'bg-purple-500 dark:bg-purple-400' :
                    'bg-blue-500 dark:bg-blue-400'
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const CreditDistributionChart: React.FC<{
  data: Array<{ _id: string | number; count: number; avgCredits: number }>;
}> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Credit Distribution</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Users by Credit Range</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item._id} className="flex items-center gap-3">
            <div className="w-16 text-xs text-gray-600 dark:text-gray-300 font-medium">
              {item._id === "30+" ? "30+" : `${item._id}`}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / maxCount) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-400"
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                {item.count} users
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const RecentActivity: React.FC<{
  title: string;
  users?: Array<{ name: string; email: string; createdAt: string; credits: number }>;
  sessions?: Array<{ sessionId: string; createdAt: string }>;
}> = ({ title, users, sessions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {users && users.map((user, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                {user.credits} credits
              </p>
            </div>
          </div>
        ))}
        
        {sessions && sessions.map((session, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                {session.sessionId.substring(0, 8)}...
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(session.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(session.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {(!users || users.length === 0) && (!sessions || sessions.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
        )}
      </div>
    </motion.div>
  );
};

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 dark:text-red-400 text-6xl">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground">Error Loading Analytics</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => fetchAnalytics()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No analytics data available</p>
            <Button onClick={() => fetchAnalytics()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-16">
        <div className="container mx-auto max-w-7xl p-6 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Internal monitoring and insights • Last updated: {new Date(analyticsData.meta.lastUpdated).toLocaleString()}
              </p>
            </div>
            
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </motion.div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={analyticsData.users.total}
              subtitle="All time registrations"
              icon={<Users size={20} />}
              color="blue"
            />
            
            <StatCard
              title="Total Sessions"
              value={analyticsData.sessions.total}
              subtitle="All time chatbot sessions"
              icon={<MessageSquare size={20} />}
              color="green"
            />
            
            <StatCard
              title="Average Credits"
              value={parseFloat(analyticsData.credits.average)}
              subtitle="Per user average"
              icon={<Coins size={20} />}
              color="orange"
            />
            
            <StatCard
              title="Total Credits Pool"
              value={analyticsData.credits.total}
              subtitle="Sum of all user credits"
              icon={<Database size={20} />}
              color="purple"
            />
          </div>

          {/* Today's Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Users Today"
              value={analyticsData.users.today}
              subtitle="New registrations"
              icon={<UserCheck size={20} />}
              trend={analyticsData.users.growthRate}
              color="blue"
            />
            
            <StatCard
              title="Sessions Today"
              value={analyticsData.sessions.today}
              subtitle="New chatbot sessions"
              icon={<Activity size={20} />}
              trend={analyticsData.sessions.growthRate}
              color="green"
            />
            
            <StatCard
              title="Users This Week"
              value={analyticsData.users.thisWeek}
              subtitle="Last 7 days"
              icon={<Calendar size={20} />}
              color="blue"
            />
            
            <StatCard
              title="Sessions This Week"
              value={analyticsData.sessions.thisWeek}
              subtitle="Last 7 days"
              icon={<Zap size={20} />}
              color="green"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              title="Daily User Registrations (Last 7 Days)"
              data={analyticsData.users.daily}
              color="blue"
            />
            
            <SimpleChart
              title="Daily Chatbot Sessions (Last 7 Days)"
              data={analyticsData.sessions.daily}
              color="green"
            />
          </div>

          {/* Credit Distribution and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreditDistributionChart data={analyticsData.credits.distribution} />
            
            <RecentActivity
              title="Recent User Registrations"
              users={analyticsData.users.recent}
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Users This Month"
              value={analyticsData.users.thisMonth}
              subtitle="Last 30 days"
              icon={<TrendingUp size={20} />}
              color="blue"
            />
            
            <StatCard
              title="Sessions This Month"
              value={analyticsData.sessions.thisMonth}
              subtitle="Last 30 days"
              icon={<BarChart3 size={20} />}
              color="green"
            />
            
            <StatCard
              title="Max User Credits"
              value={analyticsData.credits.max}
              subtitle={`Min: ${analyticsData.credits.min}`}
              icon={<Award size={20} />}
              color="orange"
            />
          </div>

          {/* Recent Sessions */}
          <RecentActivity
            title="Recent Chatbot Sessions"
            sessions={analyticsData.sessions.recent}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
