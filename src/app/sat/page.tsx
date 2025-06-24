"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Search, 
  FileText, 
  Target, 
  MessageCircle, 
  BookOpen,
  ChevronRight,
  Sparkles,
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bot,
  Upload
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

interface SATQuestion {
  questionId: string;
  imageUrl: string;
  aiResponse?: string;
}

export default function SatPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [questionId, setQuestionId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SATQuestion | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'ask' | 'breakdown'>('ask');

  // Search for SAT question
  const handleSearch = async () => {
    if (!questionId.trim()) {
      setSearchError('Please enter a question ID');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const response = await fetch(`/api/sat?id=${encodeURIComponent(questionId.trim())}`);
      const data = await response.json();

      if (data.success && data.question) {
        setSearchResult(data.question);
      } else {
        setSearchError(data.error || 'Question not found');
      }
    } catch (error) {
      setSearchError('Failed to search for question. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Navigate to selected page
  const handleNavigate = () => {
    if (!searchResult) return;
    
    const route = selectedAction === 'ask' ? '/satask' : '/satbreakdown';
    router.push(`${route}?id=${encodeURIComponent(searchResult.questionId)}`);
  };

  // Handle Enter key in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/3 to-blue-500/5 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-blue-500/10" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
                  <BookOpen className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-30" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              SAT
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Portal</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Access comprehensive SAT question analysis with AI-powered step-by-step solutions, 
              detailed breakdowns, and interactive learning experiences.
            </p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg">
                    <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Find SAT Question
                  </h3>
                </div>

                {/* Search Input */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="questionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="questionId"
                        value={questionId}
                        onChange={(e) => setQuestionId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter SAT question ID (e.g., SAT-2024-Q1)"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                        disabled={isSearching}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Action Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedAction('ask')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        selectedAction === 'ask'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <MessageCircle className={`w-5 h-5 ${
                          selectedAction === 'ask' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'
                        }`} />
                        <div className="text-left">
                          <div className={`font-medium ${
                            selectedAction === 'ask' ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            Interactive Study
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            View solution & chat with AI
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedAction('breakdown')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        selectedAction === 'breakdown'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Target className={`w-5 h-5 ${
                          selectedAction === 'breakdown' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'
                        }`} />
                        <div className="text-left">
                          <div className={`font-medium ${
                            selectedAction === 'breakdown' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            Detailed Breakdown
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Step-by-step analysis
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !questionId.trim()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Search className="w-5 h-5" />
                        <span>Find Question</span>
                      </div>
                    )}
                  </button>

                  {/* Error Message */}
                  {searchError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-300">{searchError}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Search Result */}
                  {searchResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                            Question Found: {searchResult.questionId}
          </div>

                          {/* Question Preview */}
                          <div className="mb-3">
                            <Image
                              src={searchResult.imageUrl}
                              alt="SAT Question Preview"
                              width={300}
                              height={200}
                              className="rounded-lg border border-gray-200 dark:border-gray-600"
                              style={{ objectFit: 'contain' }}
                            />
                          </div>

                          <button
                            onClick={handleNavigate}
                            className={`w-full py-2 px-4 text-white font-medium rounded-lg transition-all duration-300 ${
                              selectedAction === 'ask'
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                            }`}
                          >
                            {selectedAction === 'ask' ? 'Start Interactive Study' : 'View Detailed Breakdown'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-20 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Interactive Learning
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  View complete solutions and engage with our AI tutor through interactive chat sessions 
                  to deepen your understanding of complex SAT problems.
                </p>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detailed Analysis
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get comprehensive step-by-step breakdowns with theory explanations, 
                  formula derivations, and interactive sub-step exploration.
                </p>
              </div>
            </motion.div>

            {/* Quick Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-16 text-center"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Quick Access</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/satanalysis')}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Upload & Analyze
                </button>
            </div>
            </motion.div>

            {/* Interactive Learning Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-blue-500/20 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
                      <Bot className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Interactive SAT Learning
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Transform any SAT question into an interactive learning experience with AI-guided practice sessions.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200/50 dark:border-green-800/30">
                      <Upload className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Upload & Learn</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Upload a SAT question image and get an interactive learning session with step-by-step guidance.
                      </p>
                      <button
                        onClick={() => router.push('/satanalysis')}
                        className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300"
                      >
                        Start Interactive Learning
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                      <Search className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Find & Practice</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Find specific SAT questions by ID and practice with our interactive AI learning system.
                      </p>
                      <button
                        onClick={() => {
                          // Scroll to search section
                          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                          input?.scrollIntoView({ behavior: 'smooth' });
                          input?.focus();
                        }}
                        className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300"
                      >
                        Find Question Above
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

