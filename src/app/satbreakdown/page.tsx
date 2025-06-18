"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaSpinner, FaTimes, FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';

export default function SatBreakdownPage() {
  const searchParams = useSearchParams();
  const questionId = searchParams.get('id') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<{
    questionId: string;
    imageUrl: string;
    aiResponse: string;
    questionText: string;
  } | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    analysis: true,
    solution: true,
    answer: true
  });
  
  // Fetch question data when page loads with an ID
  useEffect(() => {
    if (questionId) {
      fetchQuestion(questionId);
    }
  }, [questionId]);
  
  // Fetch question from API
  const fetchQuestion = async (id: string) => {
    if (!id.trim()) {
      setError("Question ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sat?id=${encodeURIComponent(id.trim())}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.question) {
        setQuestion(data.question);
      } else {
        throw new Error("Failed to retrieve question data");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle expanded sections
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Toggle full image view
  const toggleFullImage = () => {
    setShowFullImage(!showFullImage);
  };

  // Format AI response into sections
  const formatResponse = (response: string) => {
    // Simple parsing of AI response into sections
    const sections = {
      analysis: "",
      solution: "",
      answer: ""
    };
    
    if (!response) return sections;
    
    // Try to identify sections based on common headers
    const analysisMatch = response.match(/(?:Question Analysis:|1\.\s*Question Analysis:)([\s\S]*?)(?=Step-by-step Solution:|2\.\s*Step-by-step Solution:|Final Answer:|3\.\s*Final Answer:|$)/i);
    const solutionMatch = response.match(/(?:Step-by-step Solution:|2\.\s*Step-by-step Solution:)([\s\S]*?)(?=Final Answer:|3\.\s*Final Answer:|$)/i);
    const answerMatch = response.match(/(?:Final Answer:|3\.\s*Final Answer:)([\s\S]*?)$/i);
    
    if (analysisMatch) sections.analysis = analysisMatch[1].trim();
    if (solutionMatch) sections.solution = solutionMatch[1].trim();
    if (answerMatch) sections.answer = answerMatch[1].trim();
    
    // If no sections were found, put everything in the solution
    if (!sections.analysis && !sections.solution && !sections.answer) {
      sections.solution = response;
    }
    
    return sections;
  };
  
  // If loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          <p className="text-gray-700 dark:text-gray-300">Loading question data...</p>
        </div>
      </div>
    );
  }
  
  // If no question ID provided
  if (!questionId) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimes className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
              No Question ID Provided
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              Please provide a question ID to view its detailed breakdown.
            </p>
            <Link 
              href="/satask"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <FaArrowLeft className="mr-2" size={12} />
              Go to Question Search
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // If error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimes className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
              Error Loading Question
            </h3>
            <p className="text-red-600 dark:text-red-400 max-w-md mx-auto mb-6">
              {error}
            </p>
            <Link 
              href="/satask"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
            >
              <FaArrowLeft className="mr-2" size={12} />
              Go Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Format the response if we have it
  const formattedSections = question?.aiResponse ? formatResponse(question.aiResponse) : {
    analysis: "",
    solution: "",
    answer: ""
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SAT Question Breakdown</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Detailed analysis and solution for question: {questionId}
            </p>
          </div>
          <div className="flex space-x-4">
            <Link 
              href={`/satask?id=${encodeURIComponent(questionId)}`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <FaArrowLeft size={14} />
              <span>Back to Question</span>
            </Link>
          </div>
        </div>

        {/* Question Display */}
        {question && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Question: {question.questionId}
                </h2>
              </div>
              
              <div className="p-6">
                {/* Question Image */}
                <div className="mb-8">
                  {showFullImage ? (
                    // Full image modal
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                      <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                          onClick={toggleFullImage}
                          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
                        >
                          <FaTimes size={20} />
                        </button>
                        
                        <img
                          src={question.imageUrl}
                          alt="SAT Question"
                          className="max-w-full max-h-[90vh] mx-auto"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Regular image preview
                    <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="relative h-64 w-full">
                        <Image
                          src={question.imageUrl}
                          alt="SAT Question"
                          fill
                          style={{ objectFit: "contain" }}
                          className="rounded-lg"
                        />
                      </div>
                      
                      <button
                        onClick={toggleFullImage}
                        className="absolute bottom-2 right-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-gray-900 bg-opacity-80 text-white hover:bg-opacity-90 shadow-lg transition-all backdrop-blur-sm"
                      >
                        <FaExternalLinkAlt size={12} />
                        <span>View Full Size</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sections */}
        {question && question.aiResponse ? (
          <div className="space-y-6">
            {/* Question Analysis Section */}
            {formattedSections.analysis && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('analysis')}
                  className="w-full p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
                >
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Question Analysis
                  </h2>
                  {expandedSections.analysis ? (
                    <FaChevronUp className="text-gray-400 dark:text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                
                {expandedSections.analysis && (
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <SimpleMathRenderer 
                        content={formattedSections.analysis} 
                        className="text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Solution Section */}
            {formattedSections.solution && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('solution')}
                  className="w-full p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
                >
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Step-by-Step Solution
                  </h2>
                  {expandedSections.solution ? (
                    <FaChevronUp className="text-gray-400 dark:text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                
                {expandedSections.solution && (
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <SimpleMathRenderer 
                        content={formattedSections.solution} 
                        className="text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Final Answer Section */}
            {formattedSections.answer && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('answer')}
                  className="w-full p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
                >
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Final Answer
                  </h2>
                  {expandedSections.answer ? (
                    <FaChevronUp className="text-gray-400 dark:text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-400 dark:text-gray-500" />
                  )}
                </button>
                
                {expandedSections.answer && (
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <SimpleMathRenderer 
                        content={formattedSections.answer} 
                        className="text-gray-800 dark:text-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaSpinner className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
              AI Solution Processing
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              The AI solution for this question is still being processed. Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
