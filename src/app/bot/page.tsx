"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TextareaAutosize from "react-textarea-autosize";
import {
  FaPaperPlane,
  FaSpinner,
  FaRobot,
  FaUser,
  FaArrowLeft,
  FaMoon,
  FaSun,
  FaTrash,
  FaCopy,
  FaCheck,
  FaImage,
  FaMinus,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";

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

// Logo paths
const PRODIJEE_LOGO_DARK = "/logo-ct.png";
const PRODIJEE_LOGO_LIGHT = "/logo-ct.png";

/**
 * Navbar Component for Bot Page
 */
const BotNavbar: React.FC<{
  darkMode: boolean;
  toggleDarkMode: () => void;
  onClearChat: () => void;
}> = ({ darkMode, toggleDarkMode, onClearChat }) => {
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
              <h1 className="text-lg font-bold">TutorJi Bot</h1>
              <p className="text-xs opacity-80">AI Chat Assistant</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onClearChat}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-indigo-600 hover:bg-indigo-500"
            } transition-colors`}
            title="Clear chat"
          >
            <FaTrash className="text-sm" />
          </button>

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
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
              {isUser ? "You" : "TutorJi"}
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
 * Full Screen Image Modal Component
 */
const FullScreenImageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  darkMode: boolean;
}> = ({ isOpen, onClose, imageUrl, darkMode }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
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
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="flex gap-1 bg-black bg-opacity-50 rounded-lg p-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            disabled={zoom <= 0.5}
          >
            <FaMinus />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetZoom();
            }}
            className="px-3 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors text-sm"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            disabled={zoom >= 3}
          >
            <FaPlus />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-lg transition-colors"
        >
          <FaTimes size={20} />
        </button>
      </div>

      <div
        className="max-w-full max-h-full overflow-hidden cursor-move"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt="Full screen question"
          className="max-w-none transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
              position.y / zoom
            }px)`,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

/**
 * Initial Question Display Component
 */
const InitialQuestionDisplay: React.FC<{
  question: string;
  answer: string;
  image?: string;
  darkMode: boolean;
  onImageClick: () => void;
}> = ({ question, answer, image, darkMode, onImageClick }) => {
  if (!question && !answer && !image) return null;

  return (
    <div
      className={`border-b ${
        darkMode ? "border-gray-700" : "border-gray-200"
      } pb-6 mb-6`}
    >
      <div
        className={`p-4 rounded-lg ${
          darkMode ? "bg-gray-800" : "bg-indigo-50"
        } mb-4`}
      >
        <h3
          className={`text-lg font-semibold mb-3 ${
            darkMode ? "text-indigo-400" : "text-indigo-700"
          }`}
        >
          Original Question Context
        </h3>

        {image && (
          <div className="mb-4 flex justify-center">
            <div className="relative group">
              <img
                src={image}
                alt="Question image"
                className="max-w-md max-h-48 w-auto h-auto bg-gray-100 rounded-lg cursor-pointer transition-transform duration-200 group-hover:scale-105"
                onClick={onImageClick}
                onError={(e) => {
                  console.error("Image failed to load:", image);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                onClick={onImageClick}
                className={`absolute top-2 right-2 p-2 rounded-lg transition-opacity opacity-0 group-hover:opacity-100 ${
                  darkMode
                    ? "bg-gray-900 bg-opacity-80 text-white"
                    : "bg-white bg-opacity-80 text-gray-800"
                }`}
                title="View full screen"
              >
                <FaImage size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Display question text */}
        {question && question.trim() && (
          <div className="mb-4">
            <h4
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Question:
            </h4>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {question}
            </p>
          </div>
        )}

        {/* Display initial answer */}
        {answer && answer.trim() && (
          <div>
            <h4
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Previous Solution:
            </h4>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              <SimpleMathRenderer
                content={answer}
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
        clarifications, or explore related topics!
      </p>
    </div>
  );
};

/**
 * Main Bot Page Component that uses useSearchParams
 */
function BotPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract imageId from URL params
  const imageId = searchParams.get("imageId") || "";

  // UI state
  const [darkMode, setDarkMode] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<{
    question: string;
    answer: string;
    imageUrl: string;
    heading?: string;
  } | null>(null);
  const [loadingData, setLoadingData] = useState(!!imageId);
  const [dataError, setDataError] = useState<string | null>(null);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat with Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId,
      initialQuestion: responseData?.question || undefined,
      initialAnswer: responseData?.answer || undefined,
      initialImage: responseData?.imageUrl || undefined,
    },
    onResponse: (response) => {
      // Extract chat ID from response headers
      const responseChatId = response.headers.get("X-Chat-ID");
      if (responseChatId) {
        setChatId(prev => prev || responseChatId);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message) => {
      console.log("Message finished:", message);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Fetch response data if imageId is provided
  useEffect(() => {
    const fetchResponseData = async () => {
      if (!imageId || !session) return;

      try {
        setLoadingData(true);
        console.log("Fetching response data for imageId:", imageId);

        const response = await fetch(
          `/api/get-response?imageId=${encodeURIComponent(imageId)}`
        );

        if (!response.ok) {
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
        setDataError(
          error instanceof Error
            ? error.message
            : "Failed to load question context"
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchResponseData();
  }, [imageId, session]);

  // Focus on input when page loads
  useEffect(() => {
    if (!loadingData) {
      inputRef.current?.focus();
    }
  }, [loadingData]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setChatId(null);
    inputRef.current?.focus();
  };

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  // Check if user is authenticated
  if (!session) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
        }`}
      >
        <div className="text-center">
          <FaRobot
            className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-6`}>
            Please sign in to access the TutorJi Bot
          </p>
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      } transition-colors duration-200`}
    >
      {/* Navigation */}
      <BotNavbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onClearChat={clearChat}
      />

      {/* Main Chat Container */}
      <div className="flex-grow flex flex-col pt-16">
        {/* Messages Container */}
        <div className="flex-grow overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Loading state for fetching response data */}
            {loadingData && (
              <div className="text-center py-12">
                <FaSpinner
                  className={`w-8 h-8 mx-auto mb-4 animate-spin ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Loading question context...
                </p>
              </div>
            )}

            {/* Error state for invalid imageId */}
            {!loadingData && dataError && (
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
                  Question Not Found
                </h2>
                <p
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mb-6 max-w-md mx-auto`}
                >
                  {dataError.includes("imageId")
                    ? "The question you are looking for could not be found. It may have been removed or the link may be invalid."
                    : dataError}
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

            {/* Error state for missing imageId */}
            {!loadingData && !dataError && !imageId && (
              <div className="text-center py-12">
                <FaRobot
                  className={`w-16 h-16 mx-auto mb-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <h2
                  className={`text-xl font-semibold mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  No Question Context
                </h2>
                <p
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mb-6 max-w-md mx-auto`}
                >
                  No question was provided to continue the conversation. Please
                  start by asking a question on the Ask page.
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

            {/* Initial Question Display */}
            {!loadingData && responseData && (
              <InitialQuestionDisplay
                question={responseData.question}
                answer={responseData.answer}
                image={responseData.imageUrl}
                darkMode={darkMode}
                onImageClick={() => setShowFullScreenImage(true)}
              />
            )}

            {/* Chat Messages */}
            {messages.length === 0 &&
              !responseData &&
              !loadingData &&
              !dataError &&
              !imageId && (
                <div className="text-center py-12">
                  <FaRobot
                    className={`w-16 h-16 mx-auto mb-4 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <h2
                    className={`text-xl font-semibold mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Welcome to TutorJi Bot!
                  </h2>
                  <p
                    className={`${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    } max-w-md mx-auto`}
                  >
                    I'm here to help you with JEE and NEET questions. Ask me
                    anything about Physics, Chemistry, Mathematics, Biology, or
                    Zoology!
                  </p>
                </div>
              )}

            {/* Render messages */}
            {messages.map((message, index) => (
              <MessageComponent
                key={message.id || index}
                message={message}
                darkMode={darkMode}
                isStreaming={
                  isLoading &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}

            {/* Loading indicator for new messages */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
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
                      TutorJi
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
            {error && (
              <div
                className={`p-4 rounded-lg ${
                  darkMode
                    ? "bg-red-900 bg-opacity-30 text-red-200"
                    : "bg-red-50 text-red-800"
                } mx-4 mb-4`}
              >
                <p className="text-sm">
                  <strong>Error:</strong> {error.message}
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

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form - only show if not in error state */}
        {!dataError && (imageId ? responseData || loadingData : true) && (
          <div
            className={`border-t ${
              darkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            } p-4`}
          >
            <div className="max-w-4xl mx-auto">
              <form onSubmit={onSubmit} className="flex gap-3 items-end">
                <div className="flex-grow">
                  <TextareaAutosize
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a follow-up question or request clarification..."
                    className={`w-full resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                    }`}
                    maxRows={4}
                    minRows={1}
                    disabled={isLoading || loadingData}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit(e);
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || loadingData}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    !input.trim() || isLoading || loadingData
                      ? darkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : darkMode
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin w-4 h-4" />
                  ) : (
                    <FaPaperPlane className="w-4 h-4" />
                  )}
                </button>

                {isLoading && (
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
      </div>

      {/* Full Screen Image Modal */}
      {responseData?.imageUrl && (
        <FullScreenImageModal
          isOpen={showFullScreenImage}
          onClose={() => setShowFullScreenImage(false)}
          imageUrl={responseData.imageUrl}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

/**
 * Wrapper component with Suspense boundary
 */
export default function BotPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <FaSpinner className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <BotPageContent />
    </Suspense>
  );
}
