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
  FileText,
  Hash,
  Layers,
  User2,
  Clock3,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLoading } from "@/components/admin/AdminLoading";

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
  stepBreakdowns: {
    total: number;
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    growthRate: number;
    uniqueUsers: number;
    daily: Array<{ _id: string; count: number }>;
    weekly: Array<{ _id: { year: number; week: number }; count: number; uniqueUserCount: number; startDate: string }>;
    hourlyPattern: Array<{ _id: number; count: number }>;
    topUsers: Array<{ _id: string; totalUsage: number; lastUsed: string; firstUsed: string }>;
    userDistribution: Array<{ _id: string | number; userCount: number; avgUsage: number }>;
    recent: Array<{ useremail: string; createdAt: string; imageurl: string }>;
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
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{title}</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
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

const TopUsersChart: React.FC<{
  data: Array<{ _id: string; totalUsage: number; lastUsed: string; firstUsed: string }>;
}> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Step Breakdown Users</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxUsage = Math.max(...data.map(d => d.totalUsage));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Step Breakdown Users</h3>
      <div className="space-y-4">
        {data.map((user, index) => (
          <div key={user._id} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user._id}
                </p>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {user.totalUsage} uses
                </span>
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(user.totalUsage / maxUsage) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Last: {new Date(user.lastUsed).toLocaleDateString()}</span>
                <span>Since: {new Date(user.firstUsed).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const HourlyPatternChart: React.FC<{
  data: Array<{ _id: number; count: number }>;
}> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Hourly Usage Pattern</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Fill missing hours with 0 count
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const existingData = data.find(d => d._id === hour);
    return {
      hour,
      count: existingData ? existingData.count : 0
    };
  });

  const maxCount = Math.max(...hourlyData.map(d => d.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Hourly Usage Pattern (Last 7 Days)
      </h3>
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
        {hourlyData.map((item) => (
          <div key={item.hour} className="flex flex-col items-center">
            <div className="h-20 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%' }}
                transition={{ duration: 1, delay: item.hour * 0.05 }}
                className="w-4 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                title={`${item.hour}:00 - ${item.count} uses`}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.hour}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Hours (24-hour format)
      </div>
    </motion.div>
  );
};

const StepBreakdownUserDistribution: React.FC<{
  data: Array<{ _id: string | number; userCount: number; avgUsage: number }>;
}> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">User Engagement Distribution</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const maxUsers = Math.max(...data.map(d => d.userCount));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Step Breakdown Usage Distribution
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item._id} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-600 dark:text-gray-300 font-medium">
              {item._id === "50+" ? "50+" : `${item._id} use${item._id === 1 ? '' : 's'}`}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.userCount / maxUsers) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-600"
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                {item.userCount} users
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const CreditUsageInsights: React.FC<{
  stepBreakdowns: any;
  totalCredits: number;
  averageCredits: string;
}> = ({ stepBreakdowns, totalCredits, averageCredits }) => {
  const creditsUsedOnStepBreakdowns = stepBreakdowns.total;
  const creditUsagePercentage = totalCredits > 0 ? ((creditsUsedOnStepBreakdowns / totalCredits) * 100).toFixed(1) : 0;
  const avgCreditsPerUser = stepBreakdowns.uniqueUsers > 0 ? (creditsUsedOnStepBreakdowns / stepBreakdowns.uniqueUsers).toFixed(1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-orange-500" />
        Credit Usage Analysis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Credits Used on Step Breakdowns
              </h4>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {creditsUsedOnStepBreakdowns.toLocaleString()}
            </p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
              {creditUsagePercentage}% of total credit pool
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Avg Credits per Step User
              </h4>
              <User2 className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {avgCreditsPerUser}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Credits spent per active user
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300">
                Credits Spent This Week
              </h4>
              <Calendar className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stepBreakdowns.thisWeek.toLocaleString()}
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              On step breakdown feature
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Credits Spent This Month
              </h4>
              <Clock3 className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stepBreakdowns.thisMonth.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
              30-day step breakdown usage
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            Credit Utilization Rate
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {creditUsagePercentage}% of {totalCredits.toLocaleString()} total credits
          </span>
        </div>
        <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${creditUsagePercentage}%` }}
            transition={{ duration: 2 }}
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

const RecentActivity: React.FC<{
  title: string;
  users?: Array<{ name: string; email: string; createdAt: string; credits: number }>;
  sessions?: Array<{ sessionId: string; createdAt: string }>;
  stepBreakdowns?: Array<{ useremail: string; createdAt: string; imageurl: string }>;
}> = ({ title, users, sessions, stepBreakdowns }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
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

        {stepBreakdowns && stepBreakdowns.map((breakdown, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{breakdown.useremail}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Step breakdown generated
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(breakdown.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(breakdown.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {(!users || users.length === 0) && (!sessions || sessions.length === 0) && (!stepBreakdowns || stepBreakdowns.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
        )}
      </div>
    </motion.div>
  );
};

export default function AnalyticsPage() {
  const { isLoading: authLoading, isAdmin } = useAdminAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Move fetchAnalytics function BEFORE useEffect
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

  // Move useEffect BEFORE early returns
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Show loading screen while authenticating
  if (authLoading) {
    return <AdminLoading message="Loading analytics dashboard..." />;
  }

  // This should not render if not admin due to the hook redirect
  if (!isAdmin) {
    return null;
  }

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
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Internal monitoring and insights • Last updated: {new Date(analyticsData.meta.lastUpdated).toLocaleString()}
              </p>
            </div>
            
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </Button>
          </motion.div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
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
              title="Step Breakdowns"
              value={analyticsData.stepBreakdowns.total}
              subtitle="All time step analyses"
              icon={<FileText size={20} />}
              color="purple"
            />
            
            <StatCard
              title="Average Credits"
              value={parseFloat(analyticsData.credits.average)}
              subtitle="Per user average"
              icon={<Coins size={20} />}
              color="orange"
            />
            
            <StatCard
              title="Active Step Users"
              value={analyticsData.stepBreakdowns.uniqueUsers}
              subtitle="Users using step feature"
              icon={<User2 size={20} />}
              color="red"
            />
          </div>

          {/* Today's Activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
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
              title="Step Breakdowns Today"
              value={analyticsData.stepBreakdowns.today}
              subtitle="Today's step analyses"
              icon={<Layers size={20} />}
              trend={analyticsData.stepBreakdowns.growthRate}
              color="purple"
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

            <StatCard
              title="Step Breakdowns This Week"
              value={analyticsData.stepBreakdowns.thisWeek}
              subtitle="Last 7 days"
              icon={<Hash size={20} />}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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

            <SimpleChart
              title="Daily Step Breakdowns (Last 7 Days)"
              data={analyticsData.stepBreakdowns.daily}
              color="purple"
            />
          </div>

          {/* Credit Usage Insights */}
          <CreditUsageInsights
            stepBreakdowns={analyticsData.stepBreakdowns}
            totalCredits={analyticsData.credits.total}
            averageCredits={analyticsData.credits.average}
          />

          {/* Step Breakdown Advanced Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <TopUsersChart data={analyticsData.stepBreakdowns.topUsers} />
            <HourlyPatternChart data={analyticsData.stepBreakdowns.hourlyPattern} />
          </div>

          {/* User Distributions */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <CreditDistributionChart data={analyticsData.credits.distribution} />
            <StepBreakdownUserDistribution data={analyticsData.stepBreakdowns.userDistribution} />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            <RecentActivity
              title="Recent User Registrations"
              users={analyticsData.users.recent}
            />
            
            <RecentActivity
              title="Recent Chatbot Sessions"
              sessions={analyticsData.sessions.recent}
            />

            <RecentActivity
              title="Recent Step Breakdowns"
              stepBreakdowns={analyticsData.stepBreakdowns.recent}
            />
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
              title="Step Breakdowns This Month"
              value={analyticsData.stepBreakdowns.thisMonth}
              subtitle="Last 30 days"
              icon={<Clock3 size={20} />}
              color="purple"
            />
            
            <StatCard
              title="Total Credits Pool"
              value={analyticsData.credits.total}
              subtitle={`Avg: ${analyticsData.credits.average} per user`}
              icon={<Database size={20} />}
              color="orange"
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
