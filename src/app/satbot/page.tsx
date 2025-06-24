"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/components/ui/chat-message";
import { ChatInput } from "@/components/ui/chat-input";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Home, Trophy, Target, BookOpen, ArrowLeft, MessageCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import Image from "next/image";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  isTyping?: boolean;
  isQuestion?: boolean;
  questionData?: {
    questionIndex: number;
    questionText: string;
    options: string[];
  };
}

interface QuestionData {
  questions: string[];
  options: string[][];
  correct_answers: (number | string)[];
  hint1: string[];
  hint2: string[];
  explanations: string[];
  conceptual_explanation: string[];
  concept_tags: string[][];
}

interface GameState {
  currentQuestionIndex: number;
  score: number;
  answered: boolean[];
  correctAnswers: number;
  isComplete: boolean;
  missedConcepts: string[];
  attemptCounts: number[];
}

// Component to display question and answer in direct chat mode
const QuestionDisplay: React.FC<{
  questionId: string;
  imageUrl: string;
  answer: string;
}> = ({ questionId, imageUrl, answer }) => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Target className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          SAT Question {questionId}
        </h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Question Image */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Question Image</h3>
          <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="SAT Question"
              width={400}
              height={300}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        
        {/* AI Solution */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">AI Solution</h3>
          <div className="prose prose-sm max-w-none dark:prose-invert bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <SimpleMathRenderer 
              content={answer} 
              className="text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// SAT-themed QuestionCard component
const SATQuestionCard: React.FC<{
  questionIndex: number;
  questionText: string;
  options: string[];
  conceptTags: string[];
  timestamp?: Date;
  onOptionSelect: (optionIndex: number) => void;
}> = ({
  questionIndex,
  questionText,
  options,
  conceptTags,
  timestamp,
  onOptionSelect,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const handleOptionClick = (idx: number) => {
    setSelectedOption(idx);
    onOptionSelect(idx);
  };

  const hasLongOptions = options.some((option) => option.length > 50);

  const renderOptions = () => {
    const optionElements = options.map((option, idx) => (
      <button
        key={idx}
        onClick={() => handleOptionClick(idx)}
        onMouseEnter={() => setHoveredOption(idx)}
        onMouseLeave={() => setHoveredOption(null)}
        aria-label={`Option ${String.fromCharCode(65 + idx)}: ${option}`}
        className={`
          flex items-center bg-indigo-800/80 hover:bg-indigo-700/80 rounded-lg p-3 ${hasLongOptions ? 'text-sm' : 'text-base'} transition-all duration-200 w-full border border-indigo-600/50
          ${selectedOption === idx ? "bg-indigo-700/90 ring-2 ring-indigo-400" : ""}
        `}
      >
        <span className="inline-block bg-indigo-600 text-white px-2 py-1 rounded-full mr-3 text-base font-medium flex-shrink-0">
          {String.fromCharCode(65 + idx)}
        </span>
        <span className="text-left flex-1 text-white">{option}</span>
      </button>
    ));

    if (hasLongOptions) {
      return (
        <div className="flex flex-col space-y-3 mt-4">{optionElements}</div>
      );
    } else {
  return (
        <div className="grid grid-cols-2 gap-3 mt-4">{optionElements}</div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-br from-indigo-900/90 to-blue-900/90 text-white rounded-xl p-4 border border-indigo-600/30 shadow-lg backdrop-blur-sm"
    >
      {/* Question Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full font-medium">
          SAT Q{questionIndex + 1}
        </div>
        <span className="text-lg font-semibold text-indigo-100">
          Question {questionIndex + 1}
        </span>
      </div>

      {/* Question Text */}
      <p className="text-base leading-relaxed mb-4 text-indigo-50">{questionText}</p>

      {/* Options */}
      {renderOptions()}

      {/* Topics and Timestamp */}
      <div className="mt-4 pt-3 border-t border-indigo-600/40">
        {conceptTags.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-indigo-300 font-medium mb-2 block">SAT Topics:</span>
            <div className="flex flex-wrap gap-2">
              {conceptTags.map((tag, index) => (
                <span
                  key={tag}
                  className="inline-block bg-indigo-700/60 border border-indigo-500/50 px-2 py-1 rounded-full text-xs text-indigo-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="text-xs text-indigo-300">
          {timestamp
            ? timestamp.toLocaleTimeString()
            : new Date().toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

function SATBotContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("id");
  const questionId = searchParams?.get("questionId");
  const imageUrl = searchParams?.get("imageUrl");
  const answer = searchParams?.get("answer");

  // Check if this is a direct question chat (new behavior) or session-based (old behavior)
  const isDirectChat = questionId && imageUrl && answer;

  const [messages, setMessages] = useState<Message[]>([]);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    score: 0,
    answered: [],
    correctAnswers: 0,
    isComplete: false,
    missedConcepts: [],
    attemptCounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const isInIframe = window.self !== window.top;

    if (isInIframe && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    } else {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(scrollToBottom, [messages]);

  const cleanOption = (option: string): string => {
    if (typeof option !== "string") return String(option);
    return option.replace(/^[a-d][\.\)]\s*/i, "").trim();
  };

  const fetchSessionData = async () => {
    if (isDirectChat) {
      // Direct chat mode - just set loading to false, we'll display question/answer directly
      setLoading(false);
      return;
    }

    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/sat/upload-json?id=${sessionId}`);
      const data = await response.json();

      if (data.success && data.jsonData) {
        const cleanedData = {
          ...data.jsonData,
          options: data.jsonData.options.map((optionSet: string[]) =>
            optionSet.map(cleanOption)
          ),
        };
        setQuestionData(cleanedData);
        setGameState((prev) => ({
          ...prev,
          answered: new Array(cleanedData.questions.length).fill(false),
          attemptCounts: new Array(cleanedData.questions.length).fill(0),
        }));
      } else {
        setError(data.error || "Failed to load session data");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId, isDirectChat]);

  const addMessage = useCallback(
    (content: string, isBot: boolean = true, isQuestion: boolean = false) => {
      const message: Message = {
        id: Date.now().toString(),
        content,
        isBot,
        timestamp: new Date(),
        isQuestion,
      };

      if (isQuestion && questionData) {
        message.questionData = {
          questionIndex: gameState.currentQuestionIndex,
          questionText: questionData.questions[gameState.currentQuestionIndex],
          options: questionData.options[gameState.currentQuestionIndex],
        };
      }

      setMessages((prev) => [...prev, message]);
    },
    [questionData, gameState.currentQuestionIndex]
  );

  const handleAnswer = (userInput: string): void => {
    if (!questionData || gameState.isComplete) return;

    const currentQuestion = gameState.currentQuestionIndex;
         const correctAnswer = Number(questionData.correct_answers[currentQuestion]);
     let selectedAnswer: number;

     if (["a", "b", "c", "d"].includes(userInput.toLowerCase())) {
       selectedAnswer = userInput.toLowerCase().charCodeAt(0) - 97;
     } else {
       selectedAnswer = parseInt(userInput) - 1;
     }

     if (isNaN(selectedAnswer) || selectedAnswer < 0 || selectedAnswer > 3) {
       addMessage("Please provide a valid answer (A, B, C, D or 1, 2, 3, 4).");
       return;
     }

     const isCorrect = selectedAnswer === correctAnswer;
    const newAttemptCounts = [...gameState.attemptCounts];
    newAttemptCounts[currentQuestion] += 1;

    if (isCorrect) {
      const newAnswered = [...gameState.answered];
      newAnswered[currentQuestion] = true;

      setGameState((prev) => ({
        ...prev,
        answered: newAnswered,
        correctAnswers: prev.correctAnswers + 1,
        attemptCounts: newAttemptCounts,
      }));

      if (questionData.explanations?.[currentQuestion]) {
        addMessage(
          `🎉 Excellent! That's correct! ${questionData.explanations[currentQuestion]}`
        );
      } else {
        addMessage(
          `🎉 Excellent! That's correct!`
        );
      }

      setTimeout(() => {
        if (currentQuestion < questionData.questions.length - 1) {
          setGameState((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
          }));
          askCurrentQuestion();
        } else {
          finishQuiz();
        }
      }, 2000);
    } else {
      setGameState((prev) => ({
        ...prev,
        attemptCounts: newAttemptCounts,
      }));

      const attemptCount = newAttemptCounts[currentQuestion];

      if (attemptCount === 1) {
        addMessage("Not quite right. Would you like a hint? Type 'hint' for assistance, or try another answer.");
      } else if (attemptCount === 2) {
        addMessage("Still not correct. Type 'hint' for a stronger clue, or if you're unsure, type 'don't know' to see the explanation.");
      } else {
        if (questionData.conceptual_explanation?.[currentQuestion]) {
          addMessage(
            `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${questionData.conceptual_explanation[currentQuestion]}`
          );
        } else {
          addMessage(
            `The correct answer is ${String.fromCharCode(65 + correctAnswer)}.`
          );
        }

        if (questionData.explanations?.[currentQuestion]) {
          addMessage(questionData.explanations[currentQuestion]);
        }

        const missedConcept = questionData.concept_tags?.[currentQuestion] || [];
        setGameState((prev) => ({
          ...prev,
          missedConcepts: [...prev.missedConcepts, ...missedConcept],
        }));

        setTimeout(() => {
          if (currentQuestion < questionData.questions.length - 1) {
            setGameState((prev) => ({
              ...prev,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
            }));
            askCurrentQuestion();
          } else {
            finishQuiz();
          }
        }, 3000);
      }
    }
  };

     const handleSpecialCommand = (command: string): void => {
     if (!questionData) return;

     const currentQuestion = gameState.currentQuestionIndex;
     const correctAnswer = Number(questionData.correct_answers[currentQuestion]);
     const attemptCount = gameState.attemptCounts[currentQuestion];

    if (command === "hint") {
      if (attemptCount === 1) {
        if (questionData.hint1?.[currentQuestion]) {
          addMessage(`💡 Hint: ${questionData.hint1[currentQuestion]}`);
        } else {
          addMessage(`💡 Think about the fundamental concepts involved in this SAT problem.`);
        }
      } else if (attemptCount === 2) {
        if (questionData.hint2?.[currentQuestion]) {
          addMessage(`💡 Stronger hint: ${questionData.hint2[currentQuestion]}`);
        } else {
          addMessage(`💡 Consider the key formula or theorem that applies here.`);
        }
      } else {
        if (questionData.conceptual_explanation?.[currentQuestion]) {
          addMessage(
            `Here's the conceptual explanation: ${questionData.conceptual_explanation[currentQuestion]}`
          );
        } else {
          addMessage(`Here's a detailed explanation of the concept.`);
        }
      }
    } else if (command === "don't know") {
      if (questionData.conceptual_explanation?.[currentQuestion]) {
        addMessage(
          `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${questionData.conceptual_explanation[currentQuestion]}`
        );
      } else {
        addMessage(
          `The correct answer is ${String.fromCharCode(65 + correctAnswer)}.`
        );
      }

      if (questionData.explanations?.[currentQuestion]) {
        addMessage(questionData.explanations[currentQuestion]);
      }

      const missedConcept = questionData.concept_tags?.[currentQuestion] || [];
      setGameState((prev) => ({
        ...prev,
        missedConcepts: [...prev.missedConcepts, ...missedConcept],
      }));

      setTimeout(() => {
        if (currentQuestion < questionData.questions.length - 1) {
          setGameState((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
          }));
          askCurrentQuestion();
        } else {
          finishQuiz();
        }
      }, 3000);
    }
  };

  const askCurrentQuestion = (): void => {
    if (!questionData) return;

    const currentQuestion = gameState.currentQuestionIndex;
    if (currentQuestion >= questionData.questions.length) {
      finishQuiz();
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(
        `**Question ${currentQuestion + 1}:**\n\n${questionData.questions[currentQuestion]}`,
        true,
        true
      );
    }, 1000);
  };

  const finishQuiz = (): void => {
    setGameState((prev) => ({ ...prev, isComplete: true }));

    const percentage = Math.round((gameState.correctAnswers / questionData!.questions.length) * 100);
    const uniqueMissedConcepts = [...new Set(gameState.missedConcepts)];

    addMessage(
      `🎊 **SAT Learning Session Complete!**\n\nFinal Score: ${gameState.correctAnswers}/${questionData!.questions.length} (${percentage}%)\n\n` +
      (percentage >= 80 
        ? "🌟 Outstanding performance! You've mastered these SAT concepts!"
        : percentage >= 60
        ? "👍 Good work! With a bit more practice, you'll excel at these SAT topics."
        : "📚 Keep practicing! Review the concepts you found challenging.")
    );

    if (uniqueMissedConcepts.length > 0) {
      addMessage(
        `**Areas for SAT Review:**\n${uniqueMissedConcepts.map(concept => `• ${concept}`).join('\n')}\n\nFocus on these topics in your SAT preparation!`
      );
    }
  };

  const handleSendMessage = (message: string): void => {
    addMessage(message, false);

    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage === "start" && !hasStarted) {
      setHasStarted(true);
      addMessage("🚀 Welcome to your personalized SAT learning session! Let's begin with the first question.");
      setTimeout(askCurrentQuestion, 1000);
    } else if (["hint", "don't know"].includes(lowerMessage)) {
      handleSpecialCommand(lowerMessage);
    } else {
      handleAnswer(message);
    }
  };

  const resetQuiz = (): void => {
    if (!questionData) return;

    setGameState({
      currentQuestionIndex: 0,
      score: 0,
      answered: new Array(questionData.questions.length).fill(false),
      correctAnswers: 0,
      isComplete: false,
      missedConcepts: [],
      attemptCounts: new Array(questionData.questions.length).fill(0),
    });
    setMessages([]);
    setHasStarted(false);
    addMessage("🎯 Ready for a fresh start? Type 'start' to begin your SAT learning journey!");
  };

  const handleOptionSelect = (optionIndex: number): void => {
    const optionLetter = String.fromCharCode(65 + optionIndex);
    handleSendMessage(optionLetter);
  };

  // Chat functions for direct chat mode
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);

    // Add user message
    addMessage(userMessage, false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          initialQuestion: `SAT Question ${questionId}`,
          initialAnswer: answer,
          initialImage: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let botResponseContent = "";
      const botMessage: Message = {
        id: Date.now().toString(),
        content: "",
        isBot: true,
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages(prev => [...prev, botMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                botResponseContent += data.choices[0].delta.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === botMessage.id 
                      ? { ...msg, content: botResponseContent, isTyping: true }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore parsing errors for individual chunks
            }
          }
        }
      }

      // Mark as finished
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessage.id 
            ? { ...msg, content: botResponseContent, isTyping: false }
            : msg
        )
      );

    } catch (error) {
      console.error("Chat error:", error);
      addMessage("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (isDirectChat && !hasStarted) {
      // Direct chat mode - show welcome message for chat
      setHasStarted(true);
      addMessage(
        `🎯 **Welcome to SAT Chat Assistant!**\n\nI'm here to help you understand this SAT question. You can ask me anything about:\n• The solution approach\n• Mathematical concepts\n• Alternative methods\n• Related practice problems\n\nFeel free to ask your questions!`
      );
    } else if (questionData && !hasStarted) {
      // Session-based mode - show interactive learning welcome
      addMessage(
        `🎯 **Welcome to SAT Interactive Learning!**\n\nI'll guide you through ${questionData.questions.length} carefully designed questions to help you master SAT concepts step by step.\n\n**Commands:**\n• Type 'start' to begin\n• Type 'hint' if you need help\n• Type 'don't know' if you want to see the explanation\n• Select A, B, C, or D for your answers\n\nReady to boost your SAT skills? Type 'start' when you're ready!`
      );
    }
  }, [questionData, hasStarted, addMessage, isDirectChat]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-600" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Loading SAT Learning Session
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Preparing your personalized SAT questions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-red-500">
            <Target className="h-16 w-16 mx-auto mb-4" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Session Error
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/sat">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to SAT Portal
              </Button>
            </Link>
            <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <Navbar />
      
      <main className="pt-16 pb-8">
        <div className="container mx-auto max-w-4xl h-[calc(100vh-6rem)] flex flex-col">
          {/* Question Display for Direct Chat Mode */}
          {isDirectChat && questionId && imageUrl && answer && (
            <QuestionDisplay 
              questionId={questionId}
              imageUrl={decodeURIComponent(imageUrl)}
              answer={decodeURIComponent(answer)}
            />
          )}
          
          {/* Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-t-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  {isDirectChat ? <MessageCircle className="h-6 w-6 text-white" /> : <BookOpen className="h-6 w-6 text-white" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isDirectChat ? "SAT Chat Assistant" : "SAT Interactive Learning"}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isDirectChat ? "Ask questions about this SAT problem" : "Personalized AI-guided SAT practice"}
                  </p>
                </div>
      </div>
              
              <div className="flex items-center gap-2">
                                 {questionData && (
                   <ProgressIndicator
                     currentQuestion={gameState.currentQuestionIndex + (gameState.isComplete ? 0 : 0)}
                     totalQuestions={questionData.questions.length}
                     correctAnswers={gameState.correctAnswers}
                   />
                 )}
                <Link href="/sat">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    SAT Portal
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
                      </div>
                    </div>

          {/* Chat Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-x border-gray-200/50 dark:border-gray-700/50 p-4 space-y-4"
          >
                         {messages.map((message) => (
               <div key={message.id}>
                 <ChatMessage 
                   message={message.content} 
                   isBot={message.isBot} 
                   timestamp={message.timestamp}
                   isTyping={message.isTyping}
                 />
                 {message.isQuestion && message.questionData && questionData && (
                   <div className="mt-4 mb-6">
                     <SATQuestionCard
                       questionIndex={message.questionData.questionIndex}
                       questionText={message.questionData.questionText}
                       options={message.questionData.options}
                       conceptTags={questionData.concept_tags[message.questionData.questionIndex] || []}
                       timestamp={message.timestamp}
                       onOptionSelect={handleOptionSelect}
                     />
                    </div>
                  )}
                </div>
             ))}
             
             {isTyping && (
               <ChatMessage
                 message="SAT Bot is thinking..."
                 isBot={true}
                 timestamp={new Date()}
                 isTyping={true}
               />
             )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-b-xl p-4 shadow-sm">
            {isDirectChat ? (
              /* Direct Chat Input */
              <form onSubmit={handleChatSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me anything about this SAT question..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isChatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </form>
            ) : (
              /* Interactive Learning Input */
              <div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <ChatInput onSendMessage={handleSendMessage} disabled={gameState.isComplete} />
                  </div>
                  {gameState.isComplete && (
                    <Button onClick={resetQuiz} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                      <RefreshCw className="h-4 w-4" />
                      Start Over
                    </Button>
                  )}
                </div>
                
                {!gameState.isComplete && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Commands: 'start' to begin | 'hint' for help | 'don't know' to reveal answer | A/B/C/D to answer
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function SATBot() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SATBotContent />
    </Suspense>
  );
} 