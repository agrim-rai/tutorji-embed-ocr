"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft, FaMoon, FaSun, FaSpinner, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";

// Logo paths for different theme modes
const PRODIJEE_LOGO_DARK = "/logo-ct.png";
const PRODIJEE_LOGO_LIGHT = "/logo-ct.png";

/**
 * Navbar Component for Share Page
 */
const Navbar: React.FC<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}> = ({ darkMode, toggleDarkMode }) => {
  return (
    <nav
      className={`${
        darkMode ? "bg-gray-900" : "bg-indigo-700"
      } text-white shadow-lg fixed top-0 left-0 right-0 z-50`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/ask"
            className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
          >
            <FaArrowLeft className="text-lg" />
            <span className="text-sm">Back to Ask</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8">
              <img
                src={darkMode ? PRODIJEE_LOGO_DARK : PRODIJEE_LOGO_LIGHT}
                alt="TutorJi Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">TutorJi</h1>
              <p className="text-xs opacity-80">Shared Solution</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <FaSun className="text-yellow-300" />
            ) : (
              <FaMoon className="text-white" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

/**
 * Footer Component
 */
const Footer: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  return (
    <footer className={`${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-600'} py-6`}>
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex justify-center mb-3">
          <img 
            src={darkMode ? PRODIJEE_LOGO_DARK : PRODIJEE_LOGO_LIGHT} 
            alt="ProdiJEE Logo" 
            className="w-8 h-8 object-contain"
          />
        </div>
        <p className="text-sm">TutorJi.in • Powered by AI • © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

/**
 * ImageModal Component
 * Displays a full-size image with zoom functionality and close button
 */
const ImageModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string; 
  darkMode: boolean;
}> = ({ isOpen, onClose, imageUrl, darkMode }) => {
  const [zoom, setZoom] = useState(1);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
        >
          <FaTimes size={24} />
        </button>

        {/* Zoom controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
          >
            <span className="text-lg font-bold">−</span>
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors text-xs"
          >
            Reset
          </button>
        </div>

        {/* Image */}
        <div
          className="relative overflow-hidden cursor-move"
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Full size question"
            className="max-w-none transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              maxHeight: '90vh',
              maxWidth: '90vw'
            }}
            draggable={false}
          />
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 left-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded text-sm">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

/**
 * ShareAskPage Component
 * Main component for displaying shared questions and solutions
 */
export default function ShareAskPage() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("imageUrl") || "";

  // UI state
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(!!imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<{
    question: string;
    answer: string;
    imageUrl: string;
    heading?: string;
  } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string>('');

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Fetch response data if imageUrl is provided
  useEffect(() => {
    const fetchResponseData = async () => {
      if (!imageUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching response data for imageUrl:", imageUrl);

        const response = await fetch(
          `/api/get-response?imageUrl=${encodeURIComponent(imageUrl)}&from=shareask`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Question not found with the provided URL");
          }
          throw new Error("Failed to fetch response data");
        }

        const data = await response.json();

        if (data.success) {
          setResponseData({
            question: data.data.question,
            answer: data.data.answer,
            imageUrl: data.data.imageUrl,
            heading: data.data.heading,
          });
          console.log("Response data loaded successfully");
        } else {
          throw new Error(data.error || "Failed to load response data");
        }
      } catch (error) {
        console.error("Error fetching response data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load question context"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResponseData();
  }, [imageUrl]);

  // Load MathJax script when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.MathJax) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      
      // Configure MathJax
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
        },
        svg: {
          fontCache: 'global'
        },
        options: {
          enableMenu: false,
          processHtmlClass: 'math'
        }
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  /**
   * Render the question section with image and context
   */
  const renderQuestionSection = () => {
    if (!responseData) return null;

    return (
      <div className={`mb-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-5`}>
        <h3 className={`text-lg font-bold mb-4`}>Question</h3>
        
        {/* Display image with fixed size */}
        {responseData.imageUrl && (
          <div className="mb-4">
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
              {/* Mobile: Fixed height container */}
              <div className="md:hidden relative h-48 w-full">
                <Image
                  src={responseData.imageUrl}
                  alt="Question image"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg"
                />
              </div>
              
              {/* Desktop: Fixed height container */}
              <div className="hidden md:block relative w-full h-64">
                <Image
                  src={responseData.imageUrl}
                  alt="Question image"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg"
                />
              </div>
              
              {/* Full screen button */}
              <button 
                onClick={() => {
                  setFullImageUrl(responseData.imageUrl);
                  setShowImageModal(true);
                }}
                className={`absolute bottom-2 right-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-gray-900 bg-opacity-80 text-white hover:bg-opacity-90' 
                    : 'bg-white bg-opacity-90 text-gray-800 hover:bg-opacity-100'
                } shadow-lg transition-all backdrop-blur-sm z-10`}
              >
                <FaExternalLinkAlt size={12} />
                <span className="hidden sm:inline">Full Screen</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Display question text */}
        {responseData.question && (
          <div className={`p-4 rounded-lg text-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Question Context:</h4>
            <p>{responseData.question}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} transition-colors duration-200`}>
      {/* Navigation */}
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main content area */}
      <main className="flex-grow py-6 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Loading state */}
          {loading && (
            <div className="text-center py-12">
              <FaSpinner
                className={`w-8 h-8 mx-auto mb-4 animate-spin ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <p
                className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Loading shared solution...
              </p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="text-center py-12">
              <FaTimes
                className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? "text-red-400" : "text-red-500"
                }`}
              />
              <h2
                className={`text-xl font-semibold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Solution Not Found
              </h2>
              <p
                className={`${
                  darkMode ? "text-gray-400" : "text-gray-600"
                } mb-6 max-w-md mx-auto`}
              >
                {error.includes("not found")
                  ? "The shared solution you are looking for could not be found. It may have been removed or the link may be invalid."
                  : error}
              </p>
              <Link
                href="/ask"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FaArrowLeft />
                <span>Go to Ask Page</span>
              </Link>
            </div>
          )}

          {/* No imageUrl provided */}
          {!loading && !error && !imageUrl && (
            <div className="text-center py-12">
              <FaTimes
                className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? "text-yellow-400" : "text-yellow-500"
                }`}
              />
              <h2
                className={`text-xl font-semibold mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                No Solution Specified
              </h2>
              <p
                className={`${
                  darkMode ? "text-gray-400" : "text-gray-600"
                } mb-6 max-w-md mx-auto`}
              >
                No shared solution was specified. Please make sure you have the correct link.
              </p>
              <Link
                href="/ask"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FaArrowLeft />
                <span>Go to Ask Page</span>
              </Link>
            </div>
          )}

          {/* Solution display */}
          {!loading && !error && responseData && (
            <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}>
              <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className="text-xl font-bold">Shared Solution</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                  View this shared solution from TutorJi
                </p>
              </div>
              
              <div className="p-5">
                {/* Question section */}
                {renderQuestionSection()}
                
                {/* Solution display */}
                <div className="p-5">
                  <h3 className={`text-lg font-bold mb-4 pb-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    Solution
                  </h3>
                  <div className="prose prose-sm max-w-none overflow-x-auto">
                    <SimpleMathRenderer content={responseData.answer} className={darkMode ? 'text-white' : 'text-gray-800'} />
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className={`mt-6 pt-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-wrap justify-center gap-4`}>
                  <Link
                    href="/ask"
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    <FaArrowLeft />
                    <span>Ask Your Own Question</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <Footer darkMode={darkMode} />
      
      {/* Image modal */}
      <ImageModal 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)} 
        imageUrl={fullImageUrl} 
        darkMode={darkMode} 
      />
    </div>
  );
}

// Define MathJax on window object
declare global {
  interface Window {
    MathJax: any;
  }
}
