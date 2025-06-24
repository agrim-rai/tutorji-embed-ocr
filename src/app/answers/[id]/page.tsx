'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';
import Image from 'next/image';
import Link from 'next/link';

interface PluginAnswer {
  _id: string;
  imageUrl: string;
  imageId: string;
  question?: string;
  answer: string;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  metadata?: {
    processing_time?: number;
    model_used?: string;
    confidence?: number;
    image_analysis?: {
      file_size?: number;
      dimensions?: string;
      format?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export default function AnswerPage() {
  const params = useParams();
  const answerId = params.id as string;
  
  const [pluginAnswer, setPluginAnswer] = useState<PluginAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        const response = await fetch(`/api/plugin/answer/${answerId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch answer: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPluginAnswer(data.answer);
      } catch (err) {
        console.error('Error fetching answer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load answer');
      } finally {
        setLoading(false);
      }
    };

    if (answerId) {
      fetchAnswer();
    }
  }, [answerId]);

  // Auto-refresh when status is processing
  useEffect(() => {
    if (pluginAnswer?.status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/plugin/answer/${answerId}`);
          if (response.ok) {
            const data = await response.json();
            setPluginAnswer(data.answer);
            
            // Stop polling if status is no longer processing
            if (data.answer?.status !== 'processing') {
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error('Error refreshing answer:', err);
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [pluginAnswer?.status, answerId]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Error Loading Answer
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pluginAnswer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Answer Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The answer you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          {/* <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Question & Answer
          </h1> */}
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered solution for your question
          </p>
        </div>

        <div className="space-y-8">
          {/* Status Banner */}
          {pluginAnswer.status === 'processing' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                  <div>
                    <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                      AI is analyzing your question...
                    </span>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                      This usually takes 10-30 seconds. This page will auto-update when complete.
                    </p>
                  </div>
                </div>
                <div className="text-yellow-600 dark:text-yellow-400 text-sm">
                  🤖 Working...
                </div>
              </div>
            </div>
          )}

          {pluginAnswer.status === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-600 text-xl mr-3">⚠️</span>
                <div>
                  <span className="text-red-800 dark:text-red-300 font-medium">
                    Processing failed
                  </span>
                  {pluginAnswer.error_message && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {pluginAnswer.error_message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Image Section */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Uploaded Question
            </h2>
            <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              {imageError ? (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p>Failed to load image</p>
                  </div>
                </div>
              ) : (
                <Image
                  src={pluginAnswer.imageUrl}
                  alt="Uploaded question"
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-96 object-contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  priority
                />
              )}
            </div>
          </div> */}

          {/* Question Section */}
          {/* {pluginAnswer.question && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Extracted Question
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200">{pluginAnswer.question}</p>
              </div>
            </div>
          )} */}

          {/* Answer Section */}
          {pluginAnswer.status === 'completed' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Solution
              </h2> */}
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <SimpleMathRenderer 
                  content={pluginAnswer.answer} 
                  className="text-gray-800 dark:text-gray-200 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {pluginAnswer.metadata && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Processing Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {pluginAnswer.metadata.processing_time ? 
                      `${(pluginAnswer.metadata.processing_time / 1000).toFixed(2)}s` : 
                      'Unknown'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">AI Model:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {pluginAnswer.metadata.model_used || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {formatFileSize(pluginAnswer.metadata.image_analysis?.file_size)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {pluginAnswer.metadata.image_analysis?.dimensions || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Format:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {pluginAnswer.metadata.image_analysis?.format?.toUpperCase() || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {formatDate(pluginAnswer.createdAt)}
                  </span>
                </div>
              </div> */}
            </div>
          )}
        </div>

        {/* Footer */}
        {/* <div className="mt-12 text-center">
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
          >
            Upload Another Question
            <span className="ml-2">→</span>
          </Link>
        </div> */}
      </div>
    </div>
  );
} 