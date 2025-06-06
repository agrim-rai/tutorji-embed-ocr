'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import { 
  Star, TrendingUp, Users, Image, Calendar, 
  Filter, Download, Search, Eye, BarChart3, ArrowLeft 
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLoading } from '@/components/admin/AdminLoading';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Rating {
  id: string;
  userEmail?: string;
  imageUrl: string;
  sessionId?: string;
  rating: number;
  ratingType: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
  ratingLabel: string;
}

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  ratingsByType: { type: string; count: number; averageRating: number }[];
  dailyRatings: { date: string; count: number; averageRating: number }[];
  topRatedImages: { imageUrl: string; averageRating: number; totalRatings: number }[];
  recentRatings: Rating[];
}

export default function RatingsAdminPage() {
  // ALL HOOKS MUST BE CALLED AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { isLoading: authLoading, isAdmin } = useAdminAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    ratingType: '',
    minRating: '',
    maxRating: '',
    imageUrl: '',
    userEmail: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Define all functions that use state
  const fetchRatings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/admin/ratings?${queryParams}`);
      const data = await response.json();
      
      setRatings(data.ratings);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/ratings/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ratings-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // useEffect hook
  useEffect(() => {
    // Only fetch ratings if user is admin and not loading
    if (isAdmin && !authLoading) {
      fetchRatings();
    }
  }, [filters, currentPage, isAdmin, authLoading]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  // Show loading screen while authenticating
  if (authLoading) {
    return <AdminLoading message="Loading ratings dashboard..." />;
  }

  // This should not render if not admin due to the hook redirect
  if (!isAdmin) {
    return null;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading ratings data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <style jsx global>{`
        :root {
          --tooltip-bg: #f9fafb;
          --tooltip-border: #e5e7eb;
          --chart-text: #6b7280;
          --chart-grid: #e5e7eb;
        }
        
        [data-theme="dark"] {
          --tooltip-bg: #374151;
          --tooltip-border: #4b5563;
          --chart-text: #9ca3af;
          --chart-grid: #4b5563;
        }
        
        .dark {
          --tooltip-bg: #374151;
          --tooltip-border: #4b5563;
          --chart-text: #9ca3af;
          --chart-grid: #4b5563;
        }
      `}</style>
      <Navbar />
      
      <main className="flex-1 px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link 
                  href="/admin" 
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    Ratings Analytics Dashboard
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Comprehensive analysis of user ratings and feedback
                  </p>
                </div>
              </div>
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </motion.div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Ratings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRatings.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(2)}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ 5.0</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unique Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(ratings.filter(r => r.userEmail).map(r => r.userEmail)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Image className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Rated Images</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(ratings.map(r => r.imageUrl)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Rating Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Distribution</h3>
              {stats.ratingDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis 
                      dataKey="rating" 
                      tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--chart-grid)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--chart-grid)' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        value.toLocaleString(), 
                        name === 'count' ? 'Ratings' : 'Percentage'
                      ]}
                      labelFormatter={(label) => `${label} Star${label !== 1 ? 's' : ''}`}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg)',
                        border: '1px solid var(--tooltip-border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">No rating data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rating Types */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ratings by Type</h3>
              {stats.ratingsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.ratingsByType.map(item => ({
                        ...item,
                        name: item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count, percent }: any) => 
                        `${name}: ${count} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.ratingsByType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [value, 'Count']}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg)',
                        border: '1px solid var(--tooltip-border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-200 dark:bg-blue-900/30 mx-auto mb-4 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">No rating type data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Ratings Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Ratings Trend</h3>
              {stats.dailyRatings.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyRatings.map(item => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--chart-grid)' }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--chart-grid)' }}
                      label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--chart-text)' } }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--chart-grid)' }}
                      domain={[0, 5]}
                      label={{ value: 'Rating', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: 'var(--chart-text)' } }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg)',
                        border: '1px solid var(--tooltip-border)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value: any, name: any) => [
                        typeof value === 'number' ? value.toLocaleString() : value, 
                        name
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Daily Count"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="averageRating"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Average Rating"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">No daily trend data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating Type</label>
                <select
                  value={filters.ratingType}
                  onChange={(e) => setFilters({...filters, ratingType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="breakdown_experience">Breakdown Experience</option>
                  <option value="interactive_learning">Interactive Learning</option>
                  <option value="overall">Overall</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Rating</label>
                <select
                  value={filters.maxRating}
                  onChange={(e) => setFilters({...filters, maxRating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="Filter by image URL..."
                  value={filters.imageUrl}
                  onChange={(e) => setFilters({...filters, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email</label>
                <input
                  type="email"
                  placeholder="Filter by user email..."
                  value={filters.userEmail}
                  onChange={(e) => setFilters({...filters, userEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setFilters({
                    dateFrom: '', dateTo: '', ratingType: '', minRating: '', 
                    maxRating: '', imageUrl: '', userEmail: ''
                  });
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Top Rated Images */}
        {stats && stats.topRatedImages.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Rated Images</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stats.topRatedImages.slice(0, 6).map((image, index) => (
                  <div key={index} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <img
                      src={image.imageUrl}
                      alt="Rated content"
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {image.imageUrl}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(image.averageRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          {image.averageRating.toFixed(1)} ({image.totalRatings} ratings)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ratings Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Ratings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {ratings.map((rating) => (
                  <tr key={rating.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {rating.userEmail || 'Anonymous'}
                      </div>
                      {rating.sessionId && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Session: {rating.sessionId.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          {rating.rating}/5 ({rating.ratingLabel})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {rating.ratingType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={rating.imageUrl}
                          alt="Rated content"
                          className="w-10 h-10 object-cover rounded-lg mr-3"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                          }}
                        />
                        <div className="text-sm text-gray-900 dark:text-white truncate max-w-xs">
                          {rating.imageUrl}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(rating.createdAt).toLocaleDateString()} <br />
                      {new Date(rating.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.open(rating.imageUrl, '_blank')}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={ratings.length < itemsPerPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{currentPage}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={ratings.length < itemsPerPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
