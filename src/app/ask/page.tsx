/**
 * ProdiJEE Ask Page
 * 
 * This page provides an AI-powered interface for JEE students to get answers to their questions.
 * Features include:
 * - Image upload for questions with diagrams or complex mathematical notation
 * - Text input for providing additional context
 * - AI-generated responses with detailed analysis and step-by-step solutions
 * - User session management with credits system
 * - History tracking of previous questions
 * - Dark mode support
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { FaCamera, FaCloudUploadAlt, FaTimes, FaInfoCircle, FaSpinner, FaMoon, FaSun, FaShare, FaDownload, FaCheck, FaLink, FaChevronLeft, FaChevronRight, FaBars, FaDiscord, FaReddit, FaExternalLinkAlt, FaSyncAlt, FaClipboard, FaRedo, FaUndo, FaCrop,FaRobot } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';
import { FaUser, FaCrown, FaHistory, FaTrash, FaStar, FaQuestionCircle, FaBell, FaEllipsisV } from "react-icons/fa";
import Link from "next/link";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";
import { StreamingLoadingText } from "@/components/ai-stylish-text";

// Utility function to share solutions (mock implementation for demo)
// In production, this would be handled by a server-side API
const mockShareSolution = (data: {
  image: string | null;
  context: string;
  finalAnswer: string;
}) => {
  const id = uuidv4().substring(0, 8);
  const shareableData = {
    ...data,
    createdAt: new Date().toISOString()
  };
  
  try {
    // In a real app, this would be sent to a backend API
    // For demo purposes, we'll store it in localStorage
    if (typeof window !== 'undefined') {
      const existingShared = JSON.parse(localStorage.getItem('sharedSolutions') || '{}');
      existingShared[id] = shareableData;
      localStorage.setItem('sharedSolutions', JSON.stringify(existingShared));
    }
    
    // Create a URL to the shareask page with the image URL (without extension)
    const imageUrl = data.image ? data.image.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') : '';
    
    return {
      success: true,
      id,
      url: `${window.location.origin}/shareask?imageUrl=${encodeURIComponent(imageUrl)}`
    };
  } catch (error) {
    console.error('Error sharing solution:', error);
    return {
      success: false,
      error: 'Failed to share solution'
    };
  }
};

// Logo paths for different theme modes
const PRODIJEE_LOGO_DARK = "/logo-ct.png";      // For dark mode
const PRODIJEE_LOGO_LIGHT = "/logo-ct.png"; // For light mode

/**
 * API function to submit questions to the AI backend
 * 
 * @param imageId - The ID of the uploaded image (if any)
 * @param context - The text question or additional context
 * @returns Promise with the AI response or error
 */
const submitToLLM = async (imageId: string | null, context: string): Promise<{
  finalAnswer: string;
  creditsRemaining?: number;
  error?: string;
}> => {
  try {
    // Prepare request data
    const requestData = {
      question: context,
      imageId: imageId // Send the imageId for server to locate the file
    };

    // Call our API
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    // Handle non-JSON responses (like HTML error pages)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', await response.text());
      return {
        finalAnswer: '',
        error: `Server returned non-JSON response (${response.status} ${response.statusText}). API key may be missing.`
      };
    }

    // Parse response
    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      console.error('API error:', data.error);
      return {
        finalAnswer: '',
        error: data.error || 'Failed to get response from AI'
      };
    }

    // Development fallback when OpenAI API is not configured
    if (data.devFallback) {
      console.log('Using development fallback response');
      return {
        finalAnswer: data.finalAnswer,
        creditsRemaining: data.creditsRemaining
      };
    }

    // Return the AI response with structured data
    return {
      finalAnswer: data.finalAnswer,
      creditsRemaining: data.creditsRemaining
    };
  } catch (error) {
    console.error('Error calling AI API:', error);
    return {
      finalAnswer: '',
      error: 'Network error or API configuration issue. Please check the console for details.'
    };
  }
};

/**
 * Mock PDF generation function
 * Creates and downloads an HTML file with the question and answer
 * In production, this would use a proper PDF library
 */
const generatePDF = async (data: {
  image: string | null;
  context: string;
  finalAnswer: string;
}) => {
  // In a real implementation, we would use a proper PDF library like jsPDF
  // For this mock version, we'll create a simple blob and trigger download
  
  try {
    // Create a blob with HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TutorJi AI Solution</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { width: 50px; height: 50px; }
          .question-section { margin-bottom: 20px; }
          .solution-section { margin-bottom: 20px; }
          .footer { text-align: center; font-size: 12px; color: #666; }
          img { max-width: 100%; }
        </style>


        // remove this meta tag when the website is live
        // remove to make the website indexable by search engines


        <meta name="robots" content="noindex, nofollow">
      


        
      
      
        </head>
      <body>
        <div class="header">
          
          <h1>TutorJi AI Solution</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="question-section">
          <h2>Question</h2>
          ${data.image ? `<img src="${data.image}" alt="Question Image" />` : ''}
          ${data.context ? `<p><strong>Context:</strong> ${data.context}</p>` : ''}
        </div>
        
        <div class="solution-section">
          <h2>Solution</h2>
          <div>${data.finalAnswer.replace(/\n/g, '<br/>')}</div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} TutorJi | AI-Powered Solutions for JEE Aspirants</p>
        </div>
      </body>
      </html>
    `;
    
    // Create blob
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prodijee-solution-${new Date().getTime()}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: 'Failed to generate PDF' };
  }
};

// ThemeContext with Provider Component
type Theme = 'light' | 'dark';

/**
 * Navbar Component
 * Displays the application header with logo, dark mode toggle, share button, and help button
 */
const Navbar: React.FC<{ 
  onHowToUse: () => void; 
  darkMode: boolean; 
  toggleDarkMode: () => void;
  onShare: () => void;
  showShareButton: boolean;
  shareStatus: { shared: boolean; url?: string };
  hasResponse: boolean;
  imageUrl?: string | null;
}> = ({ 
  onHowToUse, 
  darkMode,
  toggleDarkMode,
  onShare,
  showShareButton,
  shareStatus,
  hasResponse,
  imageUrl
}) => {
  return (
    <nav className={`${darkMode ? 'bg-gray-900' : 'bg-indigo-700'} text-white shadow-lg fixed top-0 left-0 right-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10">
            <img 
              src={darkMode ? PRODIJEE_LOGO_DARK : PRODIJEE_LOGO_LIGHT} 
              alt="ProdiJEE Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">TutorJi</h1>
            <p className="text-xs opacity-80">AI Doubt Solver</p>
          </div>
        </Link>
        <div className="flex space-x-3 items-center">
          {showShareButton && (
            <button
              onClick={onShare}
              className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                shareStatus.shared 
                  ? `${darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-600 text-white hover:bg-green-700'}`
                  : `${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`
              }`}
            >
              {shareStatus.shared ? <FaCheck /> : <FaShare />}
              <span className="hidden sm:inline">{shareStatus.shared ? 'Shared' : 'Share'}</span>
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-white" />}
          </button>
          
          {hasResponse ? (
            <Link 
              href={{
                pathname: '/bot',
                query: {
                  imageUrl: imageUrl ? imageUrl.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') : undefined
                }
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              } font-medium flex items-center space-x-2 transition-colors`}
            >
              <FaRobot />
              <span className="hidden sm:inline">Ask TutorJi Bot</span>
            </Link>
          ) : (
            <button
              onClick={onHowToUse}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              } font-medium flex items-center space-x-2 transition-colors`}
            >
              <FaInfoCircle />
              <span className="hidden sm:inline">How to Use?</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

/**
 * Footer Component
 * Displays the application footer with branding and links
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
        {/* Social Media Icons */}
        <div className="mt-3 flex justify-center items-center space-x-6">
          <a 
            href="https://discord.gg/uKYFCXHvYg" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-xl ${darkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}
            aria-label="Join our Discord"
          >
            <FaDiscord />
          </a>
          <a 
            href="https://reddit.com/u/morrisbishnoi29" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-xl ${darkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}
            aria-label="Join our Reddit community"
          >
            <FaReddit />
          </a>
        </div>
        
        <div className="mt-4 flex justify-center space-x-6">
          <span className={`text-xs cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-800'}`}>Privacy Policy</span>
          <span className={`text-xs cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-800'}`}>Terms of Service</span>
          <span className={`text-xs cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-gray-800'}`}>Contact Us</span>
        </div>
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
 * ShareModal Component
 * Displays a modal for sharing solutions with copy functionality
 */
const ShareModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  darkMode: boolean;
  shareStatus: { shared: boolean; url?: string };
  onShare: () => void;
}> = ({ 
  isOpen, 
  onClose,
  darkMode,
  shareStatus,
  onShare
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (shareStatus.url) {
      try {
        await navigator.clipboard.writeText(shareStatus.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const handleShare = () => {
    onShare();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-2xl max-w-md w-full`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h2 className="text-xl font-bold">Share Solution</h2>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {!shareStatus.shared ? (
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-indigo-900' : 'bg-indigo-100'
              }`}>
                <FaShare className={`w-8 h-8 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Share this solution</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                Generate a shareable link for this question and solution
              </p>
              <button
                onClick={handleShare}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Generate Share Link
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center mb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-green-900' : 'bg-green-100'
                }`}>
                  <FaCheck className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Share link ready!</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Anyone with this link can view the solution
                </p>
              </div>
              
              {shareStatus.url && (
                <div className={`flex items-center p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                } mb-4`}>
                  <input 
                    type="text"
                    readOnly
                    value={shareStatus.url}
                    className={`flex-grow bg-transparent text-sm border-none focus:outline-none ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`ml-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                      copied 
                        ? darkMode ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'
                        : darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              
              <button
                onClick={onClose}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * How To Use Modal Component
 * Displays a comprehensive guide on how to use the application
 * Shows information about uploading questions, providing context, and understanding results
 */
const HowToUseModal: React.FC<{ isOpen: boolean; onClose: () => void; darkMode: boolean }> = ({ 
  isOpen, 
  onClose,
  darkMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-20">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} z-10 flex justify-between items-center`}>
          <h2 className="text-2xl font-bold">How to Use the AI Doubt Solver</h2>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
          >
            <FaTimes size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <section>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Uploading a Question</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              You can either upload an image of your question or capture it directly using your device's camera:
            </p>
            <ul className={`list-disc pl-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
              <li>Click on <strong>Upload Image</strong> to select an image file from your device.</li>
              <li>Click on <strong>Take Photo</strong> to use your camera to capture the question.</li>
              <li>Make sure the image is clear, well-lit, and the question text is legible.</li>
              <li>For best results, crop the image to include only the question and relevant diagrams.</li>
            </ul>
          </section>
          
          <section>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Providing Context</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              Adding context helps our AI better understand your doubt:
            </p>
            <ul className={`list-disc pl-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
              <li>Specify the chapter or topic the question belongs to.</li>
              <li>Mention what part of the question is confusing you.</li>
              <li>Include any specific methods or approaches you'd like explained.</li>
              <li>Add any previous attempts or partial solutions you've worked out.</li>
            </ul>
          </section>
          
          <section>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Types of Doubts We Can Solve</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              Our AI can help with a wide range of JEE questions:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`border ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-white'} rounded-lg p-4`}>
                <h4 className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Physics</h4>
                <ul className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                  <li>Mechanics</li>
                  <li>Thermodynamics</li>
                  <li>Electricity & Magnetism</li>
                  <li>Optics</li>
                  <li>Modern Physics</li>
                </ul>
              </div>
              <div className={`border ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-white'} rounded-lg p-4`}>
                <h4 className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Chemistry</h4>
                <ul className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                  <li>Physical Chemistry</li>
                  <li>Organic Chemistry</li>
                  <li>Inorganic Chemistry</li>
                  <li>Chemical Bonding</li>
                  <li>Chemical Kinetics</li>
                </ul>
              </div>
              <div className={`border ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-white'} rounded-lg p-4`}>
                <h4 className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Mathematics</h4>
                <ul className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                  <li>Calculus</li>
                  <li>Algebra</li>
                  <li>Coordinate Geometry</li>
                  <li>Trigonometry</li>
                  <li>Probability & Statistics</li>
                </ul>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Understanding the Output</h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              Our AI provides a comprehensive solution in two parts:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} rounded-lg p-4`}>
                <h4 className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Question Analysis</h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  This section breaks down the key concepts, methodology, and theoretical background needed to understand the question. It helps you connect the question to the relevant topics in your syllabus.
                </p>
              </div>
              <div className={`border ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} rounded-lg p-4`}>
                <h4 className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>Final Answer</h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  This section provides a step-by-step solution to the problem, clearly showing each calculation, formula application, and reasoning process to reach the final answer.
                </p>
              </div>
            </div>
          </section>
          
          <section>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Limitations & Tips</h3>
            <ul className={`list-disc pl-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
              <li>The AI works best with clearly legible text. Handwritten questions may have lower accuracy.</li>
              <li>For complex diagrams or graphs, providing additional context is highly recommended.</li>
              <li>Very advanced topics or specialized questions may have less comprehensive solutions.</li>
              <li>When possible, transcribe the question text in your context for better results.</li>
              <li>Our AI is constantly learning and improving, so please provide feedback if a solution is incorrect or incomplete.</li>
            </ul>
          </section>
        </div>
        
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Got it, Let's Solve!
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * TypeWriter Component
 * Creates a typing effect for displaying AI responses
 * Formats markdown-style text with proper styling and renders LaTeX expressions
 */
const TypeWriter: React.FC<{ text: string; speed?: number; darkMode: boolean }> = ({ 
  text, 
  speed = 2, // Controls typing speed (lower = faster)
  darkMode 
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Advance the displayed text one character at a time
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && !typingComplete) {
      // Mark typing as complete when finished
      setTypingComplete(true);
    }
  }, [currentIndex, text, speed, typingComplete]);
  
  // Reset when the input text changes
  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
    setTypingComplete(false);
  }, [text]);
  
  // Only process LaTeX after typing is complete to improve performance
  useEffect(() => {
    if (typingComplete && contentRef.current && typeof window !== 'undefined' && window.MathJax) {
      try {
        window.MathJax.typesetPromise([contentRef.current])
          .catch(() => {
            console.error('MathJax typesetting failed');
          });
      } catch (error) {
        console.error('MathJax typesetting error:', error);
      }
    }
  }, [typingComplete]);
  
  /**
   * Process text for inline LaTeX expressions
   */
  const processInlineLatex = (text: string) => {
    const inlineLatexPattern = /\$(.*?)\$/g;
    let parts = text.split(inlineLatexPattern);
    
    if (parts.length === 1) {
      // No inline LaTeX
      return text;
    }
    
    let result: (string | React.JSX.Element)[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Even indices are regular text
        result.push(parts[i]);
      } else {
        // Odd indices contain inline LaTeX
        result.push(
          <span key={`inline-latex-${i}`} className="math math-inline">{`\\(${parts[i]}\\)`}</span>
        );
      }
    }
    
    return <>{result}</>;
  };
  
  /**
   * Parse text to identify LaTeX code and wrap it in appropriate elements
   * This handles both inline and block LaTeX syntax
   */
  const parseLatexInText = (text: string) => {
    if (!text) return null;
    
    // Pattern for inline LaTeX: $...$
    const inlineLatexPattern = /\$(.*?)\$/g;
    
    // Pattern for block LaTeX: $$...$$
    const blockLatexPattern = /\$\$(.*?)\$\$/g;
    
    // First, separate block LaTeX from the rest of the text
    let blockParts = text.split(blockLatexPattern);
    
    if (blockParts.length === 1) {
      // No block LaTeX, just process for inline LaTeX
      return processInlineLatex(text);
    }
    
    // Process parts containing block LaTeX
    let result: React.JSX.Element[] = [];
    for (let i = 0; i < blockParts.length; i++) {
      if (i % 2 === 0) {
        // Even indices are regular text or text with inline LaTeX
        if (blockParts[i].trim()) {
          result.push(<span key={`block-${i}`}>{processInlineLatex(blockParts[i])}</span>);
        }
      } else {
        // Odd indices contain block LaTeX
        result.push(
          <div key={`block-latex-${i}`} className="py-2 overflow-auto">
            <span className="math math-display">{`\\[${blockParts[i]}\\]`}</span>
          </div>
        );
      }
    }
    
    return <>{result}</>;
  };
  
  // Format text with Markdown-style formatting and identify LaTeX code
  const formatText = (text: string) => {
    // Split by newlines and apply formatting to each line
    return text.split('\n').map((line, i) => {
      // Apply different formatting based on line content
      if (line.startsWith('## ')) {
        return <h2 key={i} className={`text-xl font-bold mt-4 mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-800'}`}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ') || line.startsWith('- **')) {
        return <h3 key={i} className={`text-lg font-semibold mt-3 mb-1 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{line.replace('### ', '').replace('- **', '').replace('**', '')}</h3>;
      }
      // List items
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{parseLatexInText(line.replace('- ', ''))}</li>;
      }
      // Step items with bold
      if (line.startsWith('Step ')) {
        return <p key={i} className={`font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-800'} mt-3`}>{parseLatexInText(line)}</p>;
      }
      // Regular lines with an empty line creating paragraph breaks
      if (line.trim() === '') {
        return <div key={i} className="h-2"></div>;
      }
      
      return <p key={i}>{parseLatexInText(line)}</p>;
    });
  };

  return (
    <div className="whitespace-pre-wrap overflow-x-auto" ref={contentRef}>
      {formatText(displayText)}
    </div>
  );
};

// Ensure MathJax is defined on the window object
declare global {
  interface Window {
    MathJax: any;
  }
}

// Sample suggested questions for UI demonstration
const SUGGESTED_QUESTIONS = [
  "How do I solve systems of linear equations?",
  "Explain the concept of electromagnetism",
  "How to balance redox reactions?",
  "Derive the equations of motion"
];

/**
 * SidebarHistory Component
 * 
 * Displays the user's question history organized by date
 * Fetches history data from the server and allows users to select previous questions
 */
const SidebarHistory: React.FC<{ 
  darkMode: boolean;
  onSelectQuestion: (question: string, answer: string, imageUrl?: string) => void;
  isAuthenticated: boolean;
}> = ({ darkMode, onSelectQuestion, isAuthenticated }) => {
  
  // State for loading, error handling, and history data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Array<{
    question: string;
    answer: string;
    heading?: string;
    createdAt: string;
    imageUrl?: string;
    displayDate?: string;
  }>>([]);
  
  /**
   * Formats a date string into a human-readable format
   * Returns "Today", "Yesterday", "N days ago", or the actual date
   * Time format is 12:00 AM
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      // Use a stable date format that doesn't depend on locale
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    }
  };
  
  // State for grouped history items
  const [groupedHistory, setGroupedHistory] = useState<{[key: string]: Array<{
    question: string;
    answer: string;
    heading?: string;
    createdAt: string;
    imageUrl?: string;
    displayDate?: string;
  }>}>({});
  
  // Fetch history data from the API only if user is authenticated
  useEffect(() => {
    // Don't fetch history if the user is not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/history');
        
        if (response.status === 404) {
          // User not found in database but is authenticated
          // Try to create the user via our check-user endpoint
          console.log('User not found in database - attempting to create user');
          try {
            const createResponse = await fetch('/api/check-user');
            if (createResponse.ok) {
              console.log('User created or verified successfully');
              // Retry fetching history after user creation
              const retryResponse = await fetch('/api/history');
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                setHistoryData(data.history || []);
                setError(null);
              } else {
                // Still no history after user creation, but that's ok for new users
                setHistoryData([]);
                setError(null);
              }
            } else {
              console.error('Failed to create user');
              setHistoryData([]);
              setError(null);
            }
          } catch (createError) {
            console.error('Error creating user:', createError);
            setHistoryData([]);
            setError(null);
          }
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
        }
        
        // Try to parse the response as JSON, catching any parsing errors
        try {
          const data = await response.json();
          setHistoryData(data.history || []);
          setError(null);
        } catch (parseError) {
          console.error('Error parsing history response:', parseError);
          throw new Error('Failed to parse server response');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [isAuthenticated]);
  
  // Group history items by date for display
  useEffect(() => {
    const grouped: {[key: string]: typeof historyData} = {};
    
    historyData.forEach(item => {
      // Group by formatted date
      const dateKey = formatDate(item.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push({
        ...item,
        displayDate: dateKey
      });
    });
    
    setGroupedHistory(grouped);
  }, [historyData]);

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col justify-center p-6">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-6`}>
          <h3 className={`text-lg font-medium mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            TutorJi AI Assistant
          </h3>
          <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Powered by GPT-o4-mini, our AI can solve complex JEE problems with high accuracy.
          </p>
          <ul className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} space-y-2`}>
            <li>• 95% accuracy on JEE questions</li>
            <li>• Step-by-step explanations</li>
            <li>• Handles Physics, Chemistry & Math</li>
          </ul>
        </div>
        
        <div className={`rounded-lg p-4 ${darkMode ? 'bg-indigo-900 bg-opacity-30' : 'bg-indigo-50'}`}>
          <p className={`text-sm mb-3 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
            Login to access your history and save all your question-answer sessions.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex justify-center items-center p-4">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="h-full flex justify-center items-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  // Empty history state
  if (historyData.length === 0) {
    return (
      <div className="h-full flex justify-center items-center p-4 text-center">
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No history found</p>
          <p className="text-sm mt-2">Questions you ask will appear here</p>
        </div>
      </div>
    );
  }

  // Render history items grouped by date
  return (
    <div className="h-full overflow-y-auto pb-16">
      {Object.keys(groupedHistory).length > 0 ? (
        Object.entries(groupedHistory).map(([dateKey, items]) => (
          <div key={dateKey} className="mb-4">
            <div className="px-4 py-2">
              <h4 className={`text-xs uppercase font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {dateKey}
              </h4>
            </div>
            
            {items.map((item, index) => (
              <div 
                key={index}
                onClick={() => onSelectQuestion(item.question, item.answer, item.imageUrl)}
                className={`px-4 py-3 hover:bg-opacity-10 cursor-pointer ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${item.imageUrl ? 'overflow-hidden' : 'bg-indigo-500 flex items-center justify-center text-white'}`}>
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt="Question" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaQuestionCircle />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {item.heading || item.question.substring(0, 50)}{!item.heading && item.question.length > 50 ? '...' : ''}
                    </h3>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-gray-500">
          <p>No history available</p>
        </div>
      )}
    </div>
  );
};

/**
 * UserProfile Component
 * 
 * Displays the current user's information and credits status
 * Shows upgrade option for free users and authentication status
 */
const UserProfile: React.FC<{ 
  darkMode: boolean; 
  session: any; 
  userCredits: number | null;
  creditsLoading: boolean;
  onRefreshCredits: () => void;
}> = ({ darkMode, session, userCredits, creditsLoading, onRefreshCredits }) => {
  // Check if user is authenticated
  const isAuthenticated = !!session?.user;
  
  // Handle user logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };
  
  // If not authenticated, show simplified content
  if (!isAuthenticated) {
    return (
      <div className={`p-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg`}>
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          } text-gray-400`}>
            <FaUser />
          </div>
          
          <div className="flex-grow">
            <h3 className="text-sm font-medium">Guest User</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Not signed in</p>
          </div>
        </div>
        
        <Link 
          href="/auth/signin"
          className={`mt-4 w-full py-2 rounded-lg text-sm font-medium ${
            darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
          } text-white transition-colors flex items-center justify-center`}
        >
          <FaUser className="mr-2" size={12} />
          Login
        </Link>
      </div>
    );
  }
  
  // For authenticated users, show full profile with credits
  const user = session.user;
  // Use userCredits from state if available, fallback to session credits
  const creditsRemaining = userCredits !== null ? userCredits : (user.credits !== undefined ? user.credits : 0);
  const totalCredits = 25; // This could be made dynamic in the future
  
  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg`}>
      {/* User profile header with avatar and name */}
      <div className="flex items-center space-x-3">
        {user.image ? (
          // Display the user's image from Google if available
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500">
            <img 
              src={user.image} 
              alt={user.name || 'User'} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          // Fallback to initial if no image is available
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
            darkMode ? 'bg-indigo-600' : 'bg-indigo-500'
          } text-white`}>
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
        
        <div className="flex-grow">
          <div className="flex items-center">
            <h3 className="text-sm font-medium">{user.name || 'User'}</h3>
            {/* PRO badge if user has pro account */}
            {user.accountType === "pro" && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                darkMode ? 'bg-yellow-800 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
              } flex items-center space-x-1`}>
                <FaCrown size={10} />
                <span>PRO</span>
              </span>
            )}
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
        </div>
      </div>
      
      {/* Credits display and progress bar */}
      <div className={`mt-4 p-3 rounded-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Credits Remaining
          </span>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-medium ${
              (creditsRemaining <= 1)
                ? 'text-red-500' 
                : darkMode ? 'text-indigo-400' : 'text-indigo-600'
            }`}>
              {creditsLoading ? '...' : `${creditsRemaining}/${totalCredits}`}
            </span>
            <button
              onClick={onRefreshCredits}
              disabled={creditsLoading}
              className={`text-xs p-1 rounded transition-colors ${
                creditsLoading 
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Refresh credits"
            >
              <FaSyncAlt className={creditsLoading ? 'animate-spin' : ''} size={10} />
            </button>
          </div>
        </div>
        
        {/* Credits progress bar */}
        <div className={`w-full h-2 rounded-full overflow-hidden ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div 
            style={{ width: `${(creditsRemaining / totalCredits) * 100}%` }}
            className={`h-full ${
              (creditsRemaining <= 1) 
                ? 'bg-red-500' 
                : 'bg-indigo-500'
            }`}
          ></div>
        </div>
        
        {/* Upgrade button for free users */}
        {/* {isAuthenticated && (!user.accountType || user.accountType === "free") && (
          <Link 
            href="/features/premium" 
            className={`mt-3 w-full py-1.5 rounded-lg text-sm font-medium ${
              darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
            } text-white transition-colors flex items-center justify-center`}
          >
            <FaCrown className="mr-2" size={12} />
            Upgrade to Pro
          </Link>
        )} */}
        
        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className={`mt-3 w-full py-1.5 rounded-lg text-sm font-medium ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          } transition-colors flex items-center justify-center`}
        >
          <FaUser className="mr-2" size={12} />
          Logout
        </button>
        
        {/* Credits reset notice for free users with no credits */}
        {user.accountType === "free" && creditsRemaining === 0 && (
          <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
            Credits reset in 24 hours
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main AskPage Component
 * 
 * This is the primary component that handles the question-answering interface
 * It manages file uploads, AI interactions, user state, and response display
 */
export default function AskPage() {
  // Session management with NextAuth
  const { data: session, status } = useSession();
  
  // State for image handling
  const [image, setImage] = useState<string | null>(null); // Base64 preview
  const [imageFile, setImageFile] = useState<File | null>(null); // Actual file for upload
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [imageId, setImageId] = useState<string | null>(null); // Identifier for uploaded image
  
  // State for question, loading, and responses
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreamingText, setIsStreamingText] = useState(false);
  const [response, setResponse] = useState<{ finalAnswer: string } | null>(null);
  
  // UI state
  const [showHowTo, setShowHowTo] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string>('');
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [shareStatus, setShareStatus] = useState<{ shared: boolean; url?: string }>({ shared: false });
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  
  // References for file input elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Add a new state to track the warning message
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // State for managing user credits independently from session
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Additional state variables for crop and paste functionality
  const [isMobile, setIsMobile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadAreaFocused, setIsUploadAreaFocused] = useState(false);
  const [clipboardFocused, setClipboardFocused] = useState(false);
  
  // Crop modal states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  
  // Additional refs for crop functionality
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Fetch fresh credits from the API
   * Updates userCredits state with the latest value from the server
   */
  const fetchUserCredits = async () => {
    if (!session?.user) return;
    
    try {
      setCreditsLoading(true);
      const response = await fetch('/api/user/credits');
      
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }
      
      const data = await response.json();
      if (data.success) {
        setUserCredits(data.credits);
        // Also update the session credits for consistency
        if (session.user) {
          session.user.credits = data.credits;
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setCreditsLoading(false);
    }
  };

  /**
   * Handle sidebar state and mobile detection based on screen size
   * Closes sidebar on mobile, keeps open on desktop
   */
  useEffect(() => {
    const handleResize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);
      if (isMobileSize) {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Fetch user credits when session is available
   */
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      fetchUserCredits();
    }
  }, [session, status]);



  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  /**
   * Handle file selection for image upload
   * Validates file type and size, creates preview
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5MB.");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Only image files are allowed.");
        return;
      }
      
      // For mobile, show crop modal first
      if (isMobile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string;
          setCropImageSrc(imageSrc);
          setRotationAngle(0);
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
      } else {
        // For desktop, process directly
        handleImageUpload(file);
      }
    }
  };

  /**
   * Handle image upload processing
   * Creates preview and stores file
   */
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setWarningMessage("Please select a valid image file");
      return;
    }

    setImageFile(file);
    setImageId(null);
    setWarningMessage(null);

    // Create preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle camera capture for mobile devices
   */
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        setCropImageSrc(imageSrc);
        setRotationAngle(0);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setWarningMessage("Please capture a valid image file");
    }
  };

  /**
   * Drag and drop handlers
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Handle clipboard paste functionality
   */
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!isUploadAreaFocused && !clipboardFocused) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
            event.preventDefault();
            break;
          }
        }
      }
    },
    [isUploadAreaFocused, clipboardFocused]
  );

  const handleUploadAreaClick = () => {
    setIsUploadAreaFocused(true);
    uploadAreaRef.current?.focus();
  };

  const handleUploadAreaBlur = () => {
    setIsUploadAreaFocused(false);
  };

  const handleClipboardAreaClick = () => {
    setClipboardFocused(true);
    setIsUploadAreaFocused(false);
    if (uploadAreaRef.current) {
      uploadAreaRef.current.focus();
    }
  };

  const handleClipboardAreaBlur = () => {
    setClipboardFocused(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  /**
   * Add global paste event listener
   */
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      handlePaste(event);
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => {
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [handlePaste]);

  /**
   * Generate canvas from crop with rotation
   */
  const generateCroppedImage = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      return new Promise((resolve, reject) => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) {
            reject(new Error("Canvas not available"));
            return;
          }

          const scaleX = image.naturalWidth / image.width;
          const scaleY = image.naturalHeight / image.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // Set canvas dimensions based on crop
          const cropWidth = crop.width * scaleX;
          const cropHeight = crop.height * scaleY;

          // When rotating by 90 or 270 degrees, swap width and height
          const isRotated90or270 = rotationAngle === 90 || rotationAngle === 270;
          canvas.width = isRotated90or270 ? cropHeight : cropWidth;
          canvas.height = isRotated90or270 ? cropWidth : cropHeight;

          // Clear canvas and translate to center for rotation
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotationAngle * Math.PI) / 180);

          // Draw the image with correct position adjustment for rotation
          ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            cropWidth,
            cropHeight,
            -cropWidth / 2,
            -cropHeight / 2,
            cropWidth,
            cropHeight
          );

          ctx.restore();

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const file = new File([blob], "cropped-image.jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(file);
              } else {
                reject(new Error("Failed to generate blob from canvas"));
              }
            },
            "image/jpeg",
            0.9
          );
        } catch (error) {
          reject(error);
        }
      });
    },
    [rotationAngle]
  );

  /**
   * Handle crop completion and image processing
   */
  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const croppedFile = await generateCroppedImage(imgRef.current, completedCrop);
      await handleImageUpload(croppedFile);
      setShowCropModal(false);
      setCropImageSrc(null);
    } catch (error) {
      console.error("Crop operation failed:", error);
      setWarningMessage("Failed to crop image. Please try again.");
    }
  };

  /**
   * Cancel crop operation
   */
  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
    // Reset camera input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  /**
   * Handle rotation of the image
   */
  const rotateImage = () => {
    setRotationAngle((prevAngle) => (prevAngle + 90) % 360);
  };

  /**
   * Reset rotation angle
   */
  const resetRotation = () => {
    setRotationAngle(0);
  };

  /**
   * Upload image to server
   * Handles progress tracking and returns image ID on success
   */
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      setImageUploading(true);
      setImageUploadProgress(0);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Upload the image to server
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      
      // Store the image ID from the response
      const data = await uploadResponse.json();
      // Store both the imageId (public_id) and the secure_url from Cloudinary
      setImageId(data.imageId);
      // If the response includes a URL, update the image preview with it
      if (data.imageUrl) {
        setImage(data.imageUrl);
      }
      setImageUploading(false);
      setImageUploadProgress(100);
      
      return data.imageId;
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageUploading(false);
      setImageUploadProgress(0);
      alert('Failed to upload image. Please try again.');
      return null;
    }
  };

  // Trigger file input click to open file picker
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Trigger camera input click to open camera
  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  // Remove selected image and reset related state
  const removeImage = () => {
    setImage(null);
    setImageFile(null);
    setImageId(null);
    setImageUploadProgress(0);
    setShowCropModal(false);
    setCropImageSrc(null);
    setCompletedCrop(null);
    setRotationAngle(0);
    setWarningMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  /**
   * Handle question submission to AI
   * Uploads image if present, sends request to AI, manages states
   */
  const handleSubmit = async () => {
    // Form validation
    if (!image && !context.trim()) {
      setWarningMessage("Please upload an image or provide additional context before submitting.");
      return;
    }

    setLoading(true);
    setIsStreamingText(true); // Start streaming text immediately
    setWarningMessage(null);

    try {
      // Upload image to server first if present
      let imageId = null;
      if (imageFile) {
        console.log('Uploading image...');
        setImageUploading(true);
        imageId = await uploadImage();
        setImageUploading(false);
        console.log('Image uploaded with ID:', imageId);
      }

      // Submit to AI for processing (this runs concurrently with streaming text)
      const result = await submitToLLM(imageId, context);

      // Stop streaming text immediately when API returns
      setIsStreamingText(false);

      if (result.error) {
        console.error('AI Error:', result.error);
        setWarningMessage(result.error);
        return;
      }

      // Get the final answer from result
      let finalAnswer = result.finalAnswer || '';

      // If finalAnswer is empty, show error
      if (!finalAnswer.trim()) {
        setWarningMessage("No answer received from AI. Please try again.");
        return;
      }

      // Set response with only finalAnswer
      setResponse({
        finalAnswer
      });

      // Refresh credits after successful submission
      await fetchUserCredits();

    } catch (error) {
      console.error('Submission error:', error);
      setWarningMessage("An unexpected error occurred. Please try again.");
      setIsStreamingText(false); // Stop streaming on error too
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  /**
   * Handle opening share modal
   */
  const handleShareSolution = () => {
    if (!response) return;
    setShowShareModal(true);
  };

  /**
   * Handle actual sharing solution via mock function
   * In production, this would use a proper sharing API
   */
  const handleActualShare = () => {
    if (!response) return;

    const result = mockShareSolution({
      image: image,
      context: context,
      finalAnswer: response.finalAnswer
    });

    if (result.success) {
      setShareStatus({
        shared: true,
        url: result.url
      });
    } else {
      setWarningMessage(result.error || 'Failed to share solution');
    }
  };

  /**
   * Handle downloading solution as HTML/PDF
   */
  const handleDownloadSolution = () => {
    if (!response) return;

    generatePDF({
      image: image,
      context: context,
      finalAnswer: response.finalAnswer
    }).then(result => {
      if (!result.success) {
        setWarningMessage(result.error || 'Failed to download solution');
      }
    });
  };

  /**
   * Reset form to initial state for a new question
   */
  const resetForm = () => {
    setImage(null);
    setImageFile(null);
    setImageId(null);
    setContext("");
    setResponse(null);
    setLoading(false);
    setIsStreamingText(false);
    setShareStatus({ shared: false });
    setShowImageModal(false);
    setShowShareModal(false);
    setFullImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  /**
   * Render the question section with image and context
   */
  const renderQuestionSection = () => {
    return (
      <div className={`mb-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-5`}>
        <h3 className={`text-lg font-bold mb-4`}>Your Question</h3>
        
        {/* Display uploaded image with fixed size */}
        {image && (
          <div className="mb-4">
            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
              {/* Mobile: Fixed height container */}
              <div className="md:hidden relative h-48 w-full">
                <Image
                  src={image}
                  alt="Question image"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg"
                />
              </div>
              
              {/* Desktop: Fixed height container matching upload boxes */}
              <div className="hidden md:block relative w-full h-64">
                <Image
                  src={image}
                  alt="Question image"
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-lg"
                />
              </div>
              
              {imageUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${imageUploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Full screen button */}
              <button 
                onClick={() => {
                  setFullImageUrl(image);
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
        
        {/* Display context/question text */}
        {context && (
          <div className={`p-4 rounded-lg text-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Additional Context:</h4>
            <p>{context}</p>
          </div>
        )}

        {/* TutorJi Bot Button */}
        {/* <div className="mt-4 flex justify-center">
          <Link 
            href={{
              pathname: '/bot',
              query: {
                imageUrl: image ? image.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') : undefined
              }
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg ${
              darkMode 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            } transition-colors`}
          >
            <FaRobot className="mr-2" />
            <span>Launch TutorJi Bot</span>
          </Link>
        </div> */}
      </div>
    );
  };

  /**
   * Handle selection of a question from history
   * Sets up the question and response for review
   */
  const handleSelectHistoryQuestion = (question: string, answer: string, imageUrl?: string) => {
    // Set the question from history
    setContext(question);
    
    // Set the image if available
    if (imageUrl) {
      setImage(imageUrl);
      // We no longer need to extract imageId since we're passing the full URL
    } else {
      setImage(null);
      setImageId(null);
    }
    setImageFile(null);
    
    // If we have an answer, set the response
    if (answer) {
      setResponse({
        finalAnswer: answer
      });
    }
    
    // Reset share status so the share button can be used for history items
    setShareStatus({ shared: false });
    setShowShareModal(false);
    
    // Close the sidebar on mobile
    setSidebarOpen(false);
  };

  // Add code to clear warning when image or context changes
  useEffect(() => {
    if (image || context) {
      setWarningMessage(null);
    }
  }, [image, context]);

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
          enableMenu: false,  // disable the MathJax menu
          processHtmlClass: 'math'
        }
      };
      
      document.head.appendChild(script);
      
      return () => {
        // Clean up
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  // Render the main page layout
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} transition-colors duration-200`}>
              {/* Navigation bar */}
        <Navbar onHowToUse={() => setShowHowTo(true)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onShare={handleShareSolution} showShareButton={!!response} shareStatus={shareStatus} hasResponse={!!response} imageUrl={image ? image.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') : null} />
      
      <div className="flex flex-grow relative pt-16">
        {/* Mobile backdrop overlay when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar with history and user profile */}
        <div 
          className={`fixed top-0 left-0 h-full ${
            darkMode ? 'bg-gray-900' : 'bg-white'
          } shadow-xl z-40 transition-transform duration-300 ease-in-out transform ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-[-100%]'
          } pt-16 flex flex-col w-[280px] md:w-80`}
        >
          {/* Close button for mobile */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className={`md:hidden absolute top-4 right-4 p-2 rounded-full ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaChevronLeft />
          </button>

          
          {/* User profile section */}
          <div className="px-4 py-4 flex-shrink-0">
            <UserProfile 
              darkMode={darkMode} 
              session={session} 
              userCredits={userCredits}
              creditsLoading={creditsLoading}
              onRefreshCredits={fetchUserCredits}
            />
          </div>

                    
          {/* History heading */}
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold">History</h3>
          </div>
          
          
          {/* History component */}
          <div className="flex-grow overflow-y-auto">
            <SidebarHistory 
              darkMode={darkMode}
              onSelectQuestion={handleSelectHistoryQuestion}
              isAuthenticated={!!session?.user}
            />
          </div>
        </div>
        
        {/* Sidebar toggle button (desktop only) */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`hidden md:flex fixed z-40 top-1/2 transform -translate-y-1/2 ${
            sidebarOpen ? 'left-80' : 'left-0'
          } w-8 h-36 items-center justify-center ${
            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } rounded-r-md transition-all duration-300`}
        >
          {sidebarOpen ? <FaChevronLeft size={18} /> : <FaChevronRight size={18} />}
        </button>
      
        {/* Main content area */}
        <main className={`flex-grow py-6 transition-all duration-300 ease-in-out w-full ${
          sidebarOpen ? 'md:ml-80' : 'ml-0'
        }`}>
          <div className="max-w-4xl mx-auto px-4">
            {/* Mobile sidebar toggle */}
            <div className="md:hidden mb-4 flex justify-start">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <FaBars />
              </button>
            </div>
          
            {/* Conditionally render form or response */}
            {!response ? (
              // Question input form
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}>
                {/* Form header */}
                <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-xl font-bold">Get Instant Solutions to Your Questions</h2>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>Upload a question image and our AI will provide a step-by-step solution with explanations</p>
                </div>
                
                {/* Warning message */}
                {warningMessage && (
                  <div className={`mx-5 mt-5 p-4 rounded-lg text-sm flex items-center ${
                    darkMode ? 'bg-red-900 bg-opacity-30 text-red-200' : 'bg-red-50 text-red-800'
                  }`}>
                    <FaInfoCircle className={`mr-2 ${darkMode ? 'text-red-300' : 'text-red-500'}`} />
                    <span>{warningMessage}</span>
                  </div>
                )}
                
                {/* Credit usage information */}
                <div className={`mx-5 mt-5 p-3 rounded-lg text-sm flex items-center space-x-3 ${
                  darkMode ? 'bg-indigo-900 bg-opacity-30 text-indigo-200' : 'bg-indigo-50 text-indigo-800'
                }`}>
                  <FaInfoCircle className={darkMode ? 'text-indigo-300' : 'text-indigo-500'} />
                  <div>
                    <span className="font-medium">1 credit will be used</span> for each question. You have {userCredits !== null ? userCredits : (session?.user?.credits ?? 0)} credits remaining.
                  </div>
                </div>
                
                {/* Form inputs */}
                <div className="p-5">
                  {/* Image upload section */}
                  <div className="mb-5">
                    <h3 className="text-md font-semibold mb-3">Upload Question Image</h3>
                    
                    {image ? (
                      // Display selected image with remove button - Fixed size to match upload boxes
                      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                        {/* Mobile: Fixed height container matching mobile upload layout */}
                        <div className="md:hidden relative h-48 w-full">
                          <Image
                            src={image}
                            alt="Uploaded question"
                            fill
                            style={{ objectFit: "contain" }}
                            className="rounded-lg"
                          />
                        </div>
                        
                        {/* Desktop: Fixed height container matching upload boxes height */}
                        <div className="hidden md:block relative w-full h-64">
                          <Image
                            src={image}
                            alt="Uploaded question"
                            fill
                            style={{ objectFit: "contain" }}
                            className="rounded-lg"
                          />
                        </div>
                        
                        <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                        >
                          <FaTimes size={14} />
                        </button>
                        
                        {/* Add full screen button for preview */}
                        <button 
                          onClick={() => {
                            setFullImageUrl(image);
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
                    ) : (
                      <>
                        {isMobile ? (
                          /* Mobile: Two buttons layout with crop support */
                          <div className="flex flex-col gap-4">
                            {/* Take Photo Button - Larger */}
                            <button
                              onClick={triggerCameraInput}
                              className={`flex flex-col items-center gap-3 p-8 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} border-2 rounded-xl transition-all`}
                            >
                              <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-full`}>
                                <FaCamera className={`w-8 h-8 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                              </div>
                              <div className="text-center">
                                <h4 className="text-lg font-semibold">Take Photo</h4>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capture, crop & rotate question</p>
                              </div>
                            </button>

                            {/* Upload Button - Smaller */}
                            <button
                              onClick={triggerFileInput}
                              className={`flex items-center justify-center gap-3 p-4 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} border-2 border-dashed rounded-lg transition-all`}
                            >
                              <FaCloudUploadAlt className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <div className="text-left">
                                <p className="text-sm font-medium">Upload Image</p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select, crop & rotate</p>
                              </div>
                            </button>

                            {/* Hidden inputs */}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <input
                              ref={cameraInputRef}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleCameraCapture}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          /* Desktop: Split upload and paste areas */
                          <div className="grid grid-cols-2 gap-4">
                            {/* Upload Area with Drag & Drop */}
                            <div
                              onClick={triggerFileInput}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              className={`border-2 border-dashed rounded-lg p-6 h-48 text-center transition-all cursor-pointer ${
                                isDragOver
                                  ? darkMode ? 'border-indigo-400 bg-indigo-900/20' : 'border-indigo-500 bg-indigo-50'
                                  : darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-indigo-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-indigo-500'
                              } flex flex-col justify-center`}
                              role="button"
                              aria-label="Upload image area - click to select file or drag and drop"
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />

                              <div className="space-y-4">
                                <FaCloudUploadAlt className={`w-12 h-12 mx-auto ${isDragOver ? 'text-indigo-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                <div>
                                  <p className="text-lg font-medium">Upload Image</p>
                                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Click to browse or drag & drop
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Paste Area */}
                            <div
                              ref={uploadAreaRef}
                              onClick={handleClipboardAreaClick}
                              onBlur={handleClipboardAreaBlur}
                              onKeyDown={handleKeyDown}
                              className={`border-2 border-dashed rounded-lg p-6 h-48 text-center transition-all cursor-pointer outline-none flex flex-col justify-center ${
                                clipboardFocused
                                  ? darkMode ? 'border-indigo-400 bg-indigo-900/20 ring-2 ring-indigo-500/20' : 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                                  : darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-indigo-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-indigo-500'
                              }`}
                              tabIndex={0}
                              role="button"
                              aria-label="Paste image area - click and paste from clipboard"
                            >
                              <div className="space-y-4">
                                <FaClipboard className={`w-12 h-12 mx-auto ${clipboardFocused ? 'text-indigo-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                <div>
                                  <p className="text-lg font-medium">Paste from Clipboard</p>
                                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Click here and press{" "}
                                    <kbd className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                      {navigator.platform?.indexOf("Mac") > -1 ? "Cmd+V" : "Ctrl+V"}
                                    </kbd>
                                  </p>
                                  {clipboardFocused && (
                                    <p className="text-xs text-indigo-500 font-medium mt-2">
                                      Ready for paste! Press{" "}
                                      {navigator.platform?.indexOf("Mac") > -1 ? "Cmd+V" : "Ctrl+V"}{" "}
                                      now
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Context input textarea */}
                  <div className="mb-5">
                    <label htmlFor="context" className="block text-md font-semibold mb-2">
                      Additional Context (Optional)
                    </label>
                    <textarea
                      id="context"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Describe your doubt or provide additional information to help our AI understand your question better."
                      className={`w-full h-24 p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 focus:ring-indigo-500 text-white placeholder:text-gray-500' 
                          : 'bg-white border-gray-300 focus:ring-indigo-500 text-gray-800 placeholder:text-gray-400'
                      }`}
                    ></textarea>
                  </div>
                  
                  {/* Submit button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSubmit}
                      disabled={loading || (!session && status !== 'loading') || ((userCredits !== null ? userCredits : (session?.user?.credits ?? 0)) <= 0) || imageUploading}
                      className={`py-2.5 px-6 rounded-lg text-white font-medium transition-colors ${
                        loading || imageUploading
                          ? "bg-indigo-400 cursor-not-allowed"
                          : (!session && status !== 'loading')
                            ? "bg-indigo-400 hover:bg-indigo-500"
                            : ((userCredits !== null ? userCredits : (session?.user?.credits ?? 0)) <= 0)
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center space-x-2">
                          <FaSpinner className="animate-spin" />
                          <span>Solving...</span>
                        </span>
                      ) : imageUploading ? (
                        <span className="flex items-center space-x-2">
                          <FaSpinner className="animate-spin" />
                          <span>Uploading image...</span>
                        </span>
                      ) : (!session && status !== 'loading') ? (
                        "Sign In to Continue"
                      ) : ((userCredits !== null ? userCredits : (session?.user?.credits ?? 0)) <= 0) ? (
                        "No Credits Remaining"
                      ) : (
                        "Solve This Question"
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Streaming Loading Text - shown when API is processing */}
                {isStreamingText && (
                  <div className="mt-6">
                    <StreamingLoadingText 
                      isStreaming={isStreamingText}
                      darkMode={darkMode}
                      className="mx-auto"
                    />
                  </div>
                )}
              </div>
            ) : (
              // Response display section
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}>
                {/* Response header with back button */}
                <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                  <h2 className="text-xl font-bold">Solution and Explanation</h2>
                  <button
                    onClick={resetForm}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-indigo-400 hover:bg-gray-700' 
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    Solve Another Question
                  </button>
                </div>
                
                <div className="p-5">
                  {/* Question review section */}
                  {renderQuestionSection()}
                  
                  {/* Solution display - only show Final Answer */}
                  <div className="p-5">
                    <h3 className={`text-lg font-bold mb-4 pb-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      Solution
                    </h3>
                    <div className="prose prose-sm max-w-none overflow-x-auto">
                      <SimpleMathRenderer content={response?.finalAnswer || ''} className={darkMode ? 'text-white' : 'text-gray-800'} />
                    </div>
                  </div>
                  
                  {/* Share and download buttons */}
                  <div className={`mt-6 pt-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col items-center gap-4`}>
                    <div className="text-center mb-2">
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                        Still need help with this question?
                      </p>
                      <Link
                        href={{
                          pathname: '/bot',
                          query: {
                            imageUrl: image ? image.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') : undefined
                          }
                        }}
                        className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg ${
                          darkMode 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        } transition-colors`}
                      >
                        <FaRobot className="mr-2" />
                        <span>Ask TutorJi Bot</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Footer and modal components */}
      <Footer darkMode={darkMode} />
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        darkMode={darkMode}
        shareStatus={shareStatus}
        onShare={handleActualShare}
      />
      <HowToUseModal isOpen={showHowTo} onClose={() => setShowHowTo(false)} darkMode={darkMode} />
      <ImageModal 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)} 
        imageUrl={fullImageUrl} 
        darkMode={darkMode} 
      />
      
      {/* Crop Modal with Rotation */}
      {showCropModal && cropImageSrc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl p-6 max-w-4xl max-h-[90vh] w-full overflow-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaCrop className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  <h3 className="text-xl font-semibold">Crop & Rotate Image</h3>
                </div>
                <button
                  onClick={handleCropCancel}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              {/* Instructions */}
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag the corners to select the area you want to keep. Use rotation controls if needed. Focus on the question content for best results.
              </p>

              {/* Rotation Controls */}
              <div className={`flex items-center justify-center gap-4 p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button
                  onClick={resetRotation}
                  disabled={rotationAngle === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    rotationAngle === 0 
                      ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <FaUndo className="h-4 w-4" />
                  Reset
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rotationAngle}°</span>
                </div>

                <button 
                  onClick={rotateImage} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <FaRedo className="h-4 w-4" />
                  Rotate 90°
                </button>
              </div>

              {/* Crop Area */}
              <div className="flex justify-center">
                <div className="max-w-full max-h-[60vh] overflow-auto">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                    minWidth={50}
                    minHeight={50}
                  >
                    <img
                      ref={imgRef}
                      src={cropImageSrc || ""}
                      alt="Crop preview"
                      className="max-w-full h-auto"
                      style={{ transform: `rotate(${rotationAngle}deg)` }}
                      onLoad={() => {
                        // Auto-select most of the image initially
                        if (imgRef.current) {
                          const { width, height } = imgRef.current;
                          setCrop({
                            unit: "px",
                            width: width * 0.9,
                            height: height * 0.9,
                            x: width * 0.05,
                            y: height * 0.05,
                          });
                        }
                      }}
                    />
                  </ReactCrop>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCropCancel}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropComplete}
                  disabled={!completedCrop}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    !completedCrop
                      ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  <FaCrop className="h-4 w-4" />
                  Crop & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
