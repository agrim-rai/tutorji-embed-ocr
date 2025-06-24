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
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Home, Trophy, Target, BookOpen, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

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

function SATLearnBotContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("id");

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
  const [hasStarted, setHasStarted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [gameState]);

  const fetchSessionData = async () => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/sat/upload-json?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setQuestionData(data);
      setGameState(prev => ({
        ...prev,
        answered: new Array(data.questions.length).fill(false),
        attemptCounts: new Array(data.questions.length).fill(0),
      }));
      
    } catch (err) {
      console.error("Error fetching session data:", err);
      setError(err instanceof Error ? err.message : "Failed to load session data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const handleAnswer = (selectedOption: number): void => {
    if (!questionData || gameState.answered[gameState.currentQuestionIndex]) {
      return;
    }

    const currentQuestion = gameState.currentQuestionIndex;
    const correctAnswer = questionData.correct_answers[currentQuestion];
    const isCorrect = selectedOption === correctAnswer;

    setGameState(prev => {
      const newAnswered = [...prev.answered];
      const newAttemptCounts = [...prev.attemptCounts];
      
      newAnswered[currentQuestion] = true;
      newAttemptCounts[currentQuestion] = prev.attemptCounts[currentQuestion] + 1;

      const newCorrectAnswers = isCorrect 
        ? prev.correctAnswers + 1 
        : prev.correctAnswers;

      const newScore = isCorrect 
        ? prev.score + Math.max(100 - (newAttemptCounts[currentQuestion] - 1) * 20, 20)
        : prev.score;

      return {
        ...prev,
        answered: newAnswered,
        attemptCounts: newAttemptCounts,
        correctAnswers: newCorrectAnswers,
        score: newScore,
        missedConcepts: !isCorrect 
          ? [...prev.missedConcepts, ...questionData.concept_tags[currentQuestion]]
          : prev.missedConcepts,
      };
    });

    // Show explanation after answering
    setShowExplanation(true);
  };

  const nextQuestion = (): void => {
    if (!questionData) return;

    if (gameState.currentQuestionIndex < questionData.questions.length - 1) {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setShowHints(false);
      setCurrentHintLevel(0);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = (): void => {
    setGameState(prev => ({ ...prev, isComplete: true }));
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
    setHasStarted(false);
    setShowHints(false);
    setCurrentHintLevel(0);
    setShowExplanation(false);
  };

  const handleOptionSelect = (optionIndex: number): void => {
    handleAnswer(optionIndex);
  };

  const showHint = (): void => {
    if (currentHintLevel === 0) {
      setShowHints(true);
      setCurrentHintLevel(1);
    } else if (currentHintLevel === 1) {
      setCurrentHintLevel(2);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading interactive learning session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-red-400 mb-4">
            <Target className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Session Error</h2>
          </div>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/sat"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to SAT
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              SAT Interactive Learning
            </h1>
          </motion.div>
          <p className="text-gray-300 text-lg">
            Master SAT concepts through guided practice
          </p>
        </div>

        {/* Progress Bar */}
        {questionData && hasStarted && !gameState.isComplete && (
          <div className="mb-8">
            <ProgressIndicator
              currentQuestion={gameState.currentQuestionIndex}
              totalQuestions={questionData.questions.length}
              correctAnswers={gameState.correctAnswers}
              conceptTags={questionData.concept_tags[gameState.currentQuestionIndex] || []}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!hasStarted && questionData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center text-white border border-white/20"
            >
              <div className="mb-6">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h2 className="text-2xl font-bold mb-2">Ready to Learn?</h2>
                <p className="text-gray-300">
                  You'll work through {questionData.questions.length} practice questions
                  with hints and detailed explanations.
                </p>
              </div>
              
              <Button
                onClick={() => setHasStarted(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Start Learning
              </Button>
            </motion.div>
          )}

          {/* Quiz Complete */}
          {gameState.isComplete && questionData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center text-white border border-white/20"
            >
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-3xl font-bold mb-4">🎉 Great Job!</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-500/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-300">
                    {gameState.score}
                  </div>
                  <div className="text-blue-200">Total Score</div>
                </div>
                <div className="bg-green-500/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-300">
                    {gameState.correctAnswers}/{questionData.questions.length}
                  </div>
                  <div className="text-green-200">Correct</div>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-300">
                    {Math.round((gameState.correctAnswers / questionData.questions.length) * 100)}%
                  </div>
                  <div className="text-purple-200">Accuracy</div>
                </div>
              </div>

              {gameState.missedConcepts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Areas to Review:</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[...new Set(gameState.missedConcepts)].map((concept, index) => (
                      <span
                        key={index}
                        className="bg-orange-500/20 text-orange-200 px-3 py-1 rounded-full text-sm"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetQuiz}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/sat">
                  <Button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2">
                    <Home className="w-4 h-4 mr-2" />
                    Back to SAT
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Current Question */}
          {hasStarted && !gameState.isComplete && questionData && (
            <div className="space-y-6">
              <SATQuestionCard
                questionIndex={gameState.currentQuestionIndex}
                questionText={questionData.questions[gameState.currentQuestionIndex]}
                options={questionData.options[gameState.currentQuestionIndex]}
                conceptTags={questionData.concept_tags[gameState.currentQuestionIndex]}
                onOptionSelect={handleOptionSelect}
              />

              {/* Hints Section */}
              {!gameState.answered[gameState.currentQuestionIndex] && (
                <div className="text-center">
                  <Button
                    onClick={showHint}
                    disabled={currentHintLevel >= 2}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2"
                  >
                    {currentHintLevel === 0 ? "Show Hint" : currentHintLevel === 1 ? "Show Another Hint" : "All Hints Used"}
                  </Button>
                </div>
              )}

              {/* Hints Display */}
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-white"
                >
                  <h4 className="font-semibold mb-2 text-yellow-300">💡 Hint:</h4>
                  <p className="text-yellow-100">
                    {currentHintLevel >= 1 && questionData.hint1[gameState.currentQuestionIndex]}
                  </p>
                  {currentHintLevel >= 2 && (
                    <p className="text-yellow-100 mt-2">
                      {questionData.hint2[gameState.currentQuestionIndex]}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Explanation */}
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-white"
                >
                  <h4 className="font-semibold mb-2 text-blue-300">📝 Explanation:</h4>
                  <p className="text-blue-100 mb-3">
                    {questionData.explanations[gameState.currentQuestionIndex]}
                  </p>
                  <div className="bg-blue-600/30 rounded-lg p-3">
                    <h5 className="font-medium text-blue-200 mb-1">Conceptual Understanding:</h5>
                    <p className="text-blue-100 text-sm">
                      {questionData.conceptual_explanation[gameState.currentQuestionIndex]}
                    </p>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button
                      onClick={nextQuestion}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2"
                    >
                      {gameState.currentQuestionIndex < questionData.questions.length - 1 ? "Next Question" : "Finish"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      <Footer />
    </div>
  );
}

export default function SATLearnBot() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <SATLearnBotContent />
    </Suspense>
  );
} 