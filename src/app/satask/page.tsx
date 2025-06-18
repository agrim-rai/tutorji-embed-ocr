"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import Image from 'next/image';
import Link from 'next/link';
import TextareaAutosize from "react-textarea-autosize";
import { 
  FaSearch, 
  FaSpinner, 
  FaTimes, 
  FaExternalLinkAlt, 
  FaArrowLeft, 
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaCopy,
  FaCheck,
  FaTrash
} from 'react-icons/fa';
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';

/**
 * Optimized TypeWriter component for streaming with batched updates
 */
const OptimizedStreamingText: React.FC<{
  content: string;
  darkMode: boolean;
  isStreaming: boolean;
}> = ({ content, darkMode, isStreaming }) => {
  const [displayContent, setDisplayContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      // If not streaming, show content immediately
      setDisplayContent(content);
      setIsTyping(false);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsTyping(true);

    // Batch updates to improve performance - update every 100ms instead of per character
    timeoutRef.current = setTimeout(() => {
      setDisplayContent(content);
      if (content.length > 0) {
        setIsTyping(false);
      }
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, isStreaming]);

  return (
    <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
      <SimpleMathRenderer
        content={displayContent}
        className={darkMode ? "text-gray-200" : "text-gray-800"}
      />
      {isTyping && isStreaming && (
        <span
          className={`inline-block w-2 h-4 ml-1 ${
            darkMode ? "bg-gray-300" : "bg-gray-600"
          } animate-pulse`}
        />
      )}
    </div>
  );
};

/**
 * Message Component for displaying individual chat messages
 */
const MessageComponent: React.FC<{
  message: any;
  darkMode: boolean;
  isStreaming?: boolean;
}> = ({ message, darkMode, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const isUser = message.role === "user";
  const isInitial = message.isInitial;

  return (
    <div
      className={`flex gap-4 p-4 ${
        isUser
          ? darkMode
            ? "bg-gray-800"
            : "bg-blue-50"
          : darkMode
          ? "bg-gray-750"
          : "bg-gray-50"
      } ${isInitial ? "border-l-4 border-indigo-500" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? darkMode
              ? "bg-blue-600"
              : "bg-blue-500"
            : darkMode
            ? "bg-indigo-600"
            : "bg-indigo-500"
        } text-white`}
      >
        {isUser ? <FaUser size={14} /> : <FaRobot size={14} />}
      </div>

      {/* Message Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              {isUser ? "You" : "TutorJi SAT Assistant"}
            </span>
            {isInitial && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-indigo-900 text-indigo-300"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                Original Question
              </span>
            )}
          </div>

          {!isUser && !isStreaming && (
            <button
              onClick={handleCopy}
              className={`text-xs p-1 rounded transition-colors ${
                copied
                  ? darkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Copy message"
            >
              {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
            </button>
          )}
        </div>

        <div>
          {isUser ? (
            <p
              className={`whitespace-pre-wrap text-sm ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {message.content}
            </p>
          ) : (
            <OptimizedStreamingText
              content={message.content}
              darkMode={darkMode}
              isStreaming={isStreaming}
            />
          )}
        </div>

        {message.timestamp && (
          <div
            className={`text-xs mt-2 ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Initial Question Display Component for SAT questions
 */
const InitialQuestionDisplay: React.FC<{
  question: {
    questionId: string;
    imageUrl: string;
    aiResponse: string;
    questionText: string;
  };
  darkMode: boolean;
  onImageClick: () => void;
}> = ({ question, darkMode, onImageClick }) => {
  return (
    <div
      className={`border-b ${
        darkMode ? "border-gray-700" : "border-gray-200"
      } pb-4 mb-4`}
    >
      <div
        className={`p-3 rounded-lg ${
          darkMode ? "bg-gray-750" : "bg-indigo-50/80"
        } mb-3`}
      >
        <h3
          className={`text-lg font-semibold mb-3 ${
            darkMode ? "text-indigo-400" : "text-indigo-700"
          }`}
        >
          SAT Question: {question.questionId}
        </h3>

        {question.imageUrl && (
          <div className="mb-4 flex justify-center">
            <div className="relative group w-full max-w-md">
              {/* Mobile: Fixed height container */}
              <div className="md:hidden relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={question.imageUrl}
                  alt="SAT Question"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    console.error("Image failed to load:", question.imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Desktop: Auto height with max height */}
              <div className="hidden md:block relative w-full max-h-64">
                <img
                  src={question.imageUrl}
                  alt="SAT Question"
                  className="w-full h-auto max-h-64 object-contain bg-gray-100 rounded-lg"
                  onError={(e) => {
                    console.error("Image failed to load:", question.imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              <button
                onClick={onImageClick}
                className={`absolute bottom-2 right-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  darkMode
                    ? "bg-gray-900 bg-opacity-80 text-white hover:bg-opacity-90"
                    : "bg-white bg-opacity-90 text-gray-800 hover:bg-opacity-100"
                } shadow-lg transition-all backdrop-blur-sm`}
                title="View full screen"
              >
                <FaExternalLinkAlt size={12} />
                <span className="hidden sm:inline">Full Screen</span>
              </button>
            </div>
          </div>
        )}

        {/* Display question text if available */}
        {question.questionText && question.questionText.trim() && (
          <div className="mb-4">
            <h4
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Question Text:
            </h4>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {question.questionText}
            </p>
          </div>
        )}

        {/* Display initial answer */}
        {question.aiResponse && question.aiResponse.trim() && (
          <div>
            <h3
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Solution:
            </h3>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              <SimpleMathRenderer
                content={question.aiResponse}
                className={darkMode ? "text-gray-200" : "text-gray-800"}
              />
            </div>
          </div>
        )}
      </div>

      <p
        className={`text-sm ${
          darkMode ? "text-gray-400" : "text-gray-600"
        } text-center`}
      >
        💬 Continue the conversation below - ask follow-up questions, request
        clarifications, or explore related SAT topics!
      </p>
    </div>
  );
};

function SatAsk() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [questionId, setQuestionId] = useState(initialId);
  const [searchId, setSearchId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<{
    questionId: string;
    imageUrl: string;
    aiResponse: string;
    questionText: string;
  } | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Memoize chat configuration to prevent infinite re-renders
  const chatConfig = useMemo(() => ({
    api: "/api/chat",
    body: {
      chatId,
      initialQuestion: question?.questionText || `SAT Question ${question?.questionId}`,
      initialAnswer: question?.aiResponse || undefined,
      initialImage: question?.imageUrl || undefined,
    },
    onResponse: (response: Response) => {
      // Extract chat ID from response headers
      const responseChatId = response.headers.get("X-Chat-ID");
      if (responseChatId) {
        setChatId(prev => prev || responseChatId);
      }
    },
    onError: (error: Error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message: any) => {
      console.log("Message finished:", message);
    },
  }), [chatId, question?.questionText, question?.questionId, question?.aiResponse, question?.imageUrl]);

  // Initialize chat with Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading: isChatLoading,
    error: chatError,
    reload,
    stop,
    setMessages,
  } = useChat(chatConfig);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (showChat && messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isChatLoading, showChat]);

  // Fetch question data when page loads with an ID
  useEffect(() => {
    if (initialId) {
      fetchQuestion(initialId);
    }
  }, [initialId]); // fetchQuestion is stable since it doesn't depend on state

  // Focus on input when chat opens
  useEffect(() => {
    if (showChat && !loading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showChat, loading]);

  // Reset chat when question changes
  useEffect(() => {
    if (question) {
      setMessages([]);
      setChatId(null);
    }
  }, [question?.questionId, setMessages]);

  // Fetch question from API
  const fetchQuestion = async (id: string) => {
    if (!id.trim()) {
      setError("Please enter a valid question ID");
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
        setSearchId(id.trim());
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

  // Handle form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestion(questionId);
  }, [questionId]);
  
  // Toggle full image view
  const toggleFullImage = useCallback(() => {
    setShowFullImage(prev => !prev);
  }, []);

  // Toggle chat view
  const toggleChat = useCallback(() => {
    setShowChat(prev => {
      const newState = !prev;
      if (newState) {
        // Reset chat when opening
        setMessages([]);
        setChatId(null);
        
        // Scroll to top when opening chat
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
      return newState;
    });
  }, [setMessages]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setChatId(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [setMessages]);

  // Handle chat form submission
  const onChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    handleChatSubmit(e);
  }, [input, isChatLoading, handleChatSubmit]);

  // Check if user is authenticated for chat
  const canUseChat = !!session && question && question.aiResponse;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} py-12 transition-colors duration-200`}>
      <div className="max-w-4xl w-full mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>SAT Question Lookup</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>View AI-powered solutions for SAT questions</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              } transition-colors`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          <Link 
            href="/sat"
              className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition-colors flex items-center space-x-2`}
          >
            <FaArrowLeft size={14} />
            <span>Back to SAT Portal</span>
          </Link>
        </div>
        </div>

        {/* Chat with Bot Link */}
        {canUseChat && question && (
          <div className="mb-8 flex justify-center">
            <Link
              href={`/satbot?id=${encodeURIComponent(question.questionId)}`}
              className={`px-8 py-4 rounded-lg font-medium text-lg flex items-center space-x-3 transition-colors shadow-lg ${
                darkMode
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white"
              }`}
            >
              <FaRobot size={20} />
              <span>Chat with TutorJi Bot</span>
            </Link>
          </div>
        )}

        {/* Chat Interface */}
        {showChat && canUseChat && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden mb-8 flex flex-col`} style={{ height: '70vh', maxHeight: '70vh' }}>
            {/* Chat Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-indigo-50'} flex justify-between items-center flex-shrink-0`}>
              <div className="flex items-center space-x-2">
                <FaRobot className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  TutorJi SAT Assistant
                </h3>
              </div>
              <button
                onClick={clearChat}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                } transition-colors`}
                title="Clear chat"
              >
                <FaTrash size={14} />
              </button>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-grow overflow-y-auto min-h-0">
              {/* Initial Question Display */}
              {question && (
                <InitialQuestionDisplay
                  question={question}
                  darkMode={darkMode}
                  onImageClick={() => setShowFullImage(true)}
                />
              )}

              {/* Chat Messages */}
              {messages.map((message, index) => (
                <MessageComponent
                  key={message.id || index}
                  message={message}
                  darkMode={darkMode}
                  isStreaming={
                    isChatLoading &&
                    index === messages.length - 1 &&
                    message.role === "assistant"
                  }
                />
              ))}

              {/* Loading indicator for new messages */}
              {isChatLoading && messages[messages.length - 1]?.role === "user" && (
                <div
                  className={`flex gap-4 p-4 ${
                    darkMode ? "bg-gray-750" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      darkMode ? "bg-indigo-600" : "bg-indigo-500"
                    } text-white`}
                  >
                    <FaRobot size={14} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        TutorJi SAT Assistant
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaSpinner className="animate-spin" size={16} />
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {chatError && (
                <div
                  className={`p-4 rounded-lg ${
                    darkMode
                      ? "bg-red-900 bg-opacity-30 text-red-200"
                      : "bg-red-50 text-red-800"
                  } mx-4 mb-4`}
                >
                  <p className="text-sm">
                    <strong>Error:</strong> {chatError.message}
                  </p>
                  <button
                    onClick={() => reload()}
                    className={`mt-2 px-3 py-1 rounded text-sm ${
                      darkMode
                        ? "bg-red-800 hover:bg-red-700"
                        : "bg-red-200 hover:bg-red-300"
                    } transition-colors`}
                  >
                    Retry
                  </button>
                </div>
              )}

              {messages.length === 0 && !isChatLoading && (
                <div className={`flex items-center justify-center h-64 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-center">
                    <FaRobot className="mx-auto mb-3 w-10 h-10 opacity-50" />
                    <p>Ask a question about this SAT problem</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Form */}
            <div
              className={`border-t ${
                darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              } p-4 flex-shrink-0`}
            >
              <form onSubmit={onChatSubmit} className="flex gap-3 items-end">
                <div className="flex-grow">
                  <TextareaAutosize
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a follow-up question about this SAT problem..."
                    className={`w-full resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                    }`}
                    maxRows={4}
                    minRows={1}
                    disabled={isChatLoading || loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onChatSubmit(e);
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isChatLoading || loading}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    !input.trim() || isChatLoading || loading
                      ? darkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : darkMode
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                >
                  {isChatLoading ? (
                    <FaSpinner className="animate-spin w-4 h-4" />
                  ) : (
                    <FaPaperPlane className="w-4 h-4" />
                  )}
                </button>

                {isChatLoading && (
                  <button
                    type="button"
                    onClick={stop}
                    className={`px-3 py-3 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Stop
                  </button>
                )}
              </form>

              <div
                className={`mt-2 text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                } text-center`}
              >
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </div>
        )}

        {/* Search form - only show when chat is hidden */}
        {!showChat && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden mb-8`}>
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-grow">
                <label 
                  htmlFor="questionId" 
                    className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}
                >
                  Question ID
                </label>
                <input
                  type="text"
                  id="questionId"
                  value={questionId}
                  onChange={(e) => setQuestionId(e.target.value)}
                    className={`w-full px-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Enter the SAT question ID"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading || !questionId.trim()}
                  className={`px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2 transition-colors h-10 ${
                    loading || !questionId.trim() 
                      ? "bg-indigo-400 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {loading ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <FaSearch className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>
            
            {/* Error message */}
            {error && (
                <div className={`mt-4 ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                      <FaTimes className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-3">
                      <p className={`text-sm font-medium ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Result display - only show when chat is hidden */}
        {!showChat && question && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Question: {question.questionId}
              </h2>
            </div>

            <div className="p-6">
              {/* Question Image */}
              <div className="mb-8">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Question Image</h3>
                
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
                  <div className={`relative w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
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

              {/* AI Solution */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>AI Solution</h3>
                  
                  <Link
                    href={`/satbreakdown?id=${encodeURIComponent(question.questionId)}`}
                    className={`text-sm ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} hover:underline flex items-center gap-1`}
                  >
                    <span>View Detailed Breakdown</span>
                    <FaExternalLinkAlt size={10} />
                  </Link>
                </div>
                
                {question.aiResponse ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <SimpleMathRenderer 
                      content={question.aiResponse} 
                      className={darkMode ? 'text-gray-200' : 'text-gray-800'}
                    />
                  </div>
                ) : (
                  <div className={`p-4 border ${darkMode ? 'border-yellow-800 bg-yellow-900/30' : 'border-yellow-200 bg-yellow-50'} rounded-lg`}>
                    <p className={darkMode ? 'text-yellow-300' : 'text-yellow-700'}>
                      This question is still being processed. Please check back later.
                    </p>
                  </div>
                )}
              </div>

              {/* Chat with Bot Button */}
              {canUseChat && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                    Need more help with this question?
                  </p>
                  <Link
                    href={`/satbot?id=${encodeURIComponent(question.questionId)}`}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors mx-auto ${
                      darkMode
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    }`}
                  >
                    <FaRobot />
                    <span>Chat with TutorJi Bot</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Authentication notice for chat */}
        {!session && question && question.aiResponse && (
          <div className={`mt-6 p-4 ${darkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200'} border rounded-lg text-center`}>
            <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'} mb-3`}>
              Sign in to chat with our AI assistant about this question
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In to Chat
            </Link>
          </div>
        )}

        {/* Empty state when no question is displayed and chat is hidden */}
        {!showChat && !loading && !question && !error && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8 text-center`}>
            <div className={`w-16 h-16 ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <FaSearch className={`h-8 w-8 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <h3 className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
              Search for a Question
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto`}>
              Enter a question ID in the search box above to view the question and its AI-generated solution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SatAskPage() {
  return (
    <Suspense>
      <SatAsk />
    </Suspense>
  );
}
