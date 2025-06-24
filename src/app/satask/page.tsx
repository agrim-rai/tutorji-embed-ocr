"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from "ai/react";
import { useSession, signIn } from "next-auth/react";
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
  FaTrash,
  FaBullseye
} from 'react-icons/fa';
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Target, 
  Sun, 
  Moon, 
  Sparkles,
  BookOpen,
  ChevronRight,
  Home,
  FileText,
  Brain,
  MessageCircle,
  Loader2
} from 'lucide-react';

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
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200"
        } border`}
      >
        <h4
          className={`text-sm font-medium mb-2 ${
            darkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          Original SAT Question ({question.questionId})
        </h4>
        
        {question.imageUrl && (
          <div className="mb-3">
            <div
              className="relative cursor-pointer rounded-lg overflow-hidden"
              onClick={onImageClick}
            >
              <Image
                src={question.imageUrl}
                alt="SAT Question"
                width={300}
                height={200}
                className="rounded-lg object-contain bg-white"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                <FaExternalLinkAlt className="text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        )}
        
        <div
          className={`text-sm ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          <SimpleMathRenderer content={question.aiResponse} />
        </div>
      </div>
    </div>
  );
};

function SatAsk() {
  const { data: session } = useSession();
  const router = useRouter();
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);

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
  }, [initialId]);

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

  // Start Interactive Learning function
  const startInteractiveLearning = async () => {
    if (!question) {
      setError("No question available for interactive learning");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Step 1: Process the existing question image for SAT interactive learning
      const response = await fetch("/api/sat/process-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: question.imageUrl,
          questionId: question.questionId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process question for interactive learning");
      }

      setProcessedData(result.data);

      // Step 2: Create SAT chatbot session
      const chatbotResponse = await fetch("/api/sat/upload-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const chatbotResult = await chatbotResponse.json();

      if (!chatbotResponse.ok) {
        throw new Error(chatbotResult.error || "Failed to create SAT learning session");
      }

      // Navigate to SAT learnbot for MCQ-style interactive learning
      const sessionId = chatbotResult.chatbotLink.split('id=')[1];
      router.push(`/satlearnbot?id=${sessionId}`);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start interactive learning"
      );
    } finally {
      setIsProcessing(false);
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
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <FaArrowLeft size={14} />
              <span>Back to SAT Portal</span>
            </Link>
          </div>
        </div>

        {/* Chat Interface - show when enabled */}
        {showChat && question && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden mb-8`}>
            {/* Chat Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
              <div className="flex items-center space-x-3">
                <FaRobot className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Chat about Question: {question.questionId}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearChat}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? "text-gray-400 hover:text-white hover:bg-gray-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                  }`}
                  title="Clear chat"
                >
                  <FaTrash size={14} />
                </button>
                <button
                  onClick={toggleChat}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? "text-gray-400 hover:text-white hover:bg-gray-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                  }`}
                  title="Close chat"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className={`h-96 overflow-y-auto ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Initial Question Display */}
              <div className="p-4">
                <InitialQuestionDisplay
                  question={question}
                  darkMode={darkMode}
                  onImageClick={toggleFullImage}
                />
              </div>

              {/* Chat Messages */}
              {messages.map((message, index) => (
                <MessageComponent
                  key={message.id || index}
                  message={message}
                  darkMode={darkMode}
                  isStreaming={isChatLoading && index === messages.length - 1}
                />
              ))}

              {isChatLoading && messages.length > 0 && (
                <div className={`flex justify-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center space-x-2">
                    <FaSpinner className="animate-spin w-4 h-4" />
                    <span className="text-sm">TutorJi is thinking...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className={`p-4 ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'} border-l-4 border-red-500`}>
                  <p className="text-sm">Error: {chatError.message}</p>
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

        {/* Enhanced Search form - only show when chat is hidden */}
        {!showChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`rounded-2xl shadow-2xl overflow-hidden mb-8 backdrop-blur-sm border ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-800/80 to-gray-800/80 border-white/10' 
                : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200'
            }`}
          >
            <div className={`p-6 border-b ${
              darkMode 
                ? 'border-gray-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10' 
                : 'border-gray-200 bg-gradient-to-r from-indigo-500/5 to-purple-500/5'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  darkMode ? 'bg-indigo-500/20' : 'bg-indigo-500/10'
                }`}>
                  <FaSearch className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Search for a SAT Question
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Enter a question ID to view detailed solutions and interactive learning
                  </p>
                </div>
              </div>
            </div>
            
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label 
                  htmlFor="questionId" 
                  className={`block text-sm font-medium mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Question ID
                </label>
                <div className="flex gap-4">
                  <div className="flex-grow relative">
                    <input
                      type="text"
                      id="questionId"
                      value={questionId}
                      onChange={(e) => setQuestionId(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        darkMode 
                          ? 'border-gray-600/50 bg-gray-700/50 text-white placeholder:text-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                      }`}
                      placeholder="Enter the SAT question ID (e.g., SAT-2024-Q1)"
                    />
                    <div className={`absolute inset-y-0 right-3 flex items-center pointer-events-none ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <FileText size={16} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !questionId.trim()}
                    className={`px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl ${
                      loading || !questionId.trim() 
                        ? "bg-gray-400 cursor-not-allowed text-gray-600" 
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin h-5 w-5" />
                        <span className="hidden sm:inline">Searching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span className="hidden sm:inline">Find Question</span>
                        <span className="sm:hidden">Search</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Quick Tips */}
              <div className={`flex flex-wrap gap-4 text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>AI Solutions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Brain className="w-3 h-3" />
                  <span>Step-by-step</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>Interactive Chat</span>
                </div>
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
        </motion.div>
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
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                        darkMode
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-purple-500 text-white hover:bg-purple-600"
                    } flex items-center gap-1`}
                  >
                    <FaBullseye size={12} />
                    <span>View Detailed Breakdown</span>
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

              {/* Action Buttons */}
              {canUseChat && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-3">
                      <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg">
                        <Bot className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready for More Learning?</h3>
                    <p className="text-gray-300 text-sm">
                      Chat with our AI or try interactive step-by-step learning
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/satbot?questionId=${question.questionId}&imageUrl=${encodeURIComponent(question.imageUrl)}&answer=${encodeURIComponent(question.aiResponse)}`)}
                      className="p-6 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 hover:from-blue-700/90 hover:to-indigo-700/90 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-lg font-semibold">
                          Chat with TutorJi
                        </span>
                      </div>
                      <p className="text-sm text-blue-100">
                        Ask questions and get instant AI responses about this problem
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startInteractiveLearning}
                      disabled={isProcessing}
                      className="p-6 bg-gradient-to-br from-green-600/90 to-emerald-600/90 hover:from-green-700/90 hover:to-emerald-700/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        {isProcessing ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Target className="w-6 h-6" />
                        )}
                        <span className="text-lg font-semibold">
                          {isProcessing ? 'Creating Session...' : 'Interactive Learning'}
                        </span>
                      </div>
                      <p className="text-sm text-green-100">
                        Step-by-step guided practice with personalized feedback
                      </p>
                    </motion.button>
                  </div>
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
      
      <Footer />
    </div>
  );
}

export default function SatAskPage() {
  return (
    <Suspense>
      <Navbar />
      <SatAsk />
    </Suspense>
  );
}
