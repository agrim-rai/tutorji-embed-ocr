"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TextareaAutosize from "react-textarea-autosize";
import {
  FaPaperPlane,
  FaSpinner,
  FaRobot,
  FaUser,
  FaArrowLeft,
  FaTrash,
  FaExternalLinkAlt,
  FaTimes,
} from "react-icons/fa";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";
import Image from "next/image";

const StreamingText: React.FC<{
  content: string;
  darkMode: boolean;
  isStreaming: boolean;
}> = ({ content, darkMode, isStreaming }) => {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!isStreaming) {
      setDisplay(content);
      return;
    }
    const id = setTimeout(() => {
      setDisplay(content);
    }, 100);
    return () => clearTimeout(id);
  }, [content, isStreaming]);

  return (
    <div className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
      <SimpleMathRenderer content={display} className={darkMode ? "text-gray-200" : "text-gray-800"} />
      {isStreaming && <span className={`inline-block w-2 h-4 ml-1 ${darkMode ? "bg-gray-300" : "bg-gray-600"} animate-pulse`} />}
    </div>
  );
};

const MessageItem: React.FC<{
  message: any;
  darkMode: boolean;
  isStreaming?: boolean;
}> = ({ message, darkMode, isStreaming = false }) => {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-4 p-4 ${isUser ? (darkMode ? "bg-gray-800" : "bg-blue-50") : darkMode ? "bg-gray-750" : "bg-gray-50"}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? (darkMode ? "bg-blue-600" : "bg-blue-500") : darkMode ? "bg-indigo-600" : "bg-indigo-500"} text-white`}>
        {isUser ? <FaUser size={14} /> : <FaRobot size={14} />}
      </div>
      <div className="flex-grow min-w-0">
        {isUser ? (
          <p className={`whitespace-pre-wrap text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{message.content}</p>
        ) : (
          <StreamingText content={message.content} darkMode={darkMode} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
};

function SatBotInner() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const questionId = params.get("id") || "";

  const [questionData, setQuestionData] = useState<{
    questionText: string;
    aiResponse: string;
    imageUrl: string;
  } | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(!!questionId);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

  // chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId,
      initialQuestion: questionData?.questionText || undefined,
      initialAnswer: questionData?.aiResponse || undefined,
      initialImage: questionData?.imageUrl || undefined,
    },
    onResponse: (res) => {
      const id = res.headers.get("X-Chat-ID");
      if (id) setChatId((prev) => prev || id);
    },
  });

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  // fetch question data
  useEffect(() => {
    if (!questionId) return;
    const fetchData = async () => {
      try {
        setLoadingQuestion(true);
        const res = await fetch(`/api/sat?id=${encodeURIComponent(questionId)}`);
        if (!res.ok) {
          throw new Error("Failed to load question");
        }
        const data = await res.json();
        if (data.success) {
          setQuestionData(data.question);
        } else throw new Error(data.error || "Failed to load question");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingQuestion(false);
      }
    };
    fetchData();
  }, [questionId]);

  // Scroll to input on load after question data is available
  useEffect(() => {
    if (!loadingQuestion && questionData) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100); // A small delay ensures the layout is stable before scrolling
    }
  }, [loadingQuestion, questionData]);

  // redirect if no session
  if (!session) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="text-center space-y-4">
          <p>Please sign in to chat.</p>
          <Link href="/auth/signin" className="px-4 py-2 bg-indigo-600 text-white rounded">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      <div className="absolute top-4 left-4 z-10">
        <Link href={`/satask?id=${encodeURIComponent(questionId)}`} className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
          <FaArrowLeft />
          <span>Back to Question</span>
        </Link>
      </div>

      <div className="flex-grow flex flex-col max-w-4xl w-full mx-auto pt-16">
        <div className="flex-grow overflow-y-auto min-h-0 p-4">
          {loadingQuestion && (
            <div className="flex justify-center py-4"><FaSpinner className="animate-spin" /></div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          {questionData && (
            <div className={`mb-4 p-6 rounded-lg ${darkMode ? "bg-slate-800" : "bg-indigo-50"}`}>
              <h2 className="font-semibold mb-4 text-lg">Question {questionId}</h2>
              
              {questionData.imageUrl && (
                <div className="mb-6">
                  {showFullImage ? (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
                      <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                          onClick={() => setShowFullImage(false)}
                          className="absolute -top-8 right-0 md:top-4 md:right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
                        >
                          <FaTimes size={20} />
                        </button>
                        <img
                          src={questionData.imageUrl}
                          alt="SAT Question"
                          className="max-w-full max-h-[90vh] mx-auto"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full bg-slate-700 rounded-lg overflow-hidden group">
                      <div className="relative h-64 w-full">
                        <Image
                          src={questionData.imageUrl}
                          alt="SAT Question"
                          fill
                          style={{ objectFit: "contain" }}
                          className="rounded-lg"
                        />
                      </div>
                      <button
                        onClick={() => setShowFullImage(true)}
                        className="absolute bottom-2 right-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-gray-900 bg-opacity-80 text-white hover:bg-opacity-90 shadow-lg transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                      >
                        <FaExternalLinkAlt size={12} />
                        <span>View Full Size</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="prose prose-invert max-w-none">
                <h3 className="text-md font-semibold mb-2 text-gray-300">Solution:</h3>
                <SimpleMathRenderer content={questionData.aiResponse} className={darkMode ? "text-gray-200" : "text-gray-800"} />
              </div>
              <p className="text-center text-gray-400 text-sm mt-8 pt-4 border-t border-slate-700">
                ● Continue the conversation below - ask follow-up questions, or explore related topics!
              </p>
            </div>
          )}
          {messages.map((m, idx) => (
            <MessageItem key={m.id || idx} message={m} darkMode={darkMode} isStreaming={isLoading && idx === messages.length -1 && m.role === "assistant"} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <div className={`p-4 flex-shrink-0`}>
          <form onSubmit={(e) => {e.preventDefault(); if (!input.trim() || isLoading) return; handleSubmit(e);}} className="flex gap-3 items-end">
            <TextareaAutosize
              value={input}
              onChange={handleInputChange}
              ref={inputRef}
              className={`flex-grow resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder:text-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              }`}
              minRows={1}
              maxRows={4}
              placeholder="Ask a follow-up question or request clarification..."
            />
            <button type="submit" disabled={!input.trim() || isLoading} className={`p-3 rounded-lg ${darkMode ? "bg-indigo-600" : "bg-indigo-500"} text-white disabled:opacity-50 flex items-center justify-center w-12 h-12`}>
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
            </button>
            {isLoading && (
              <button type="button" onClick={stop} className={`p-3 rounded ${darkMode ? "bg-red-600" : "bg-red-500"} text-white`}><FaTrash /></button>
            )}
          </form>
          <p className="text-xs text-center text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SatBotPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center text-gray-500"><FaSpinner className="animate-spin" /></div>}>
      <SatBotInner />
    </Suspense>
  );
} 