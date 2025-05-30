'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '@/components/ui/chat-message';
import { ChatInput } from '@/components/ui/chat-input';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Home, Trophy, Target, Circle, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  attemptCounts: number[];  // Track attempts per question
}

// New QuestionCard component
const QuestionCard: React.FC<{
  questionIndex: number;
  questionText: string;
  options: string[];
  conceptTags: string[];
  onOptionSelect: (optionIndex: number) => void;
}> = ({ questionIndex, questionText, options, conceptTags, onOptionSelect }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const handleOptionClick = (idx: number) => {
    setSelectedOption(idx);
    onOptionSelect(idx);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-card/60 backdrop-blur-sm border border-border/40 rounded-lg overflow-hidden"
    >
      {/* Question Header */}
      <div className="bg-card/80 border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/15 border border-primary/25">
            <span className="text-xs font-medium text-primary">Q{questionIndex + 1}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Question {questionIndex + 1}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{questionText}</p>
      </div>
      
      {/* Options */}
      <div className="p-4 space-y-2">
        {options.map((option, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            onClick={() => handleOptionClick(idx)}
            onMouseEnter={() => setHoveredOption(idx)}
            onMouseLeave={() => setHoveredOption(null)}
            className={`
              group relative p-3 rounded-md cursor-pointer transition-all duration-150 border
              ${selectedOption === idx 
                ? 'bg-primary/8 border-primary/30' 
                : hoveredOption === idx
                ? 'bg-muted/60 border-border/50'
                : 'bg-background/40 border-border/25 hover:bg-muted/40'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                flex items-center justify-center w-6 h-6 rounded transition-all duration-150
                ${selectedOption === idx 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/80 text-muted-foreground border border-border/30'
                }
              `}>
                {selectedOption === idx ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-medium">{String.fromCharCode(65 + idx)}</span>
                )}
              </div>
              <p className={`
                text-xs leading-relaxed transition-colors duration-150 flex-1
                ${selectedOption === idx 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground/80'
                }
              `}>
                {option}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Topics */}
      {conceptTags.length > 0 && (
        <div className="px-4 pb-3 border-t border-border/20 bg-muted/20">
          <div className="pt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-1 rounded-full bg-primary/60"></div>
              <span className="text-xs font-medium text-muted-foreground">Topics</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {conceptTags.map((tag, index) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary/60 text-secondary-foreground border border-border/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

function LearnBotContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('id');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    score: 0,
    answered: [],
    correctAnswers: 0,
    isComplete: false,
    missedConcepts: [],
    attemptCounts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Check if we're running in an iframe
    const isInIframe = window.self !== window.top;
    
    if (isInIframe && messagesContainerRef.current) {
      // If in iframe, scroll the messages container directly
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      // If not in iframe, use normal scrollIntoView
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(scrollToBottom, [messages]);

  const addMessage = (content: string, isBot: boolean): void => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isBot,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessage = useCallback((content: string): void => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(content, true);
    }, 1000);
  }, []);

  const addQuestionMessage = useCallback((questionIndex: number, questionText: string, options: string[]): void => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMessage: Message = {
        id: Date.now().toString(),
        content: '',
        isBot: true,
        timestamp: new Date(),
        isQuestion: true,
        questionData: {
          questionIndex,
          questionText,
          options
        }
      };
      setMessages(prev => [...prev, newMessage]);
    }, 800);
  }, []);

  const showQuestionAtIndex = useCallback((index: number): void => {
    if (!questionData || gameState.isComplete) return;
    
    const question = questionData.questions[index];
    const options = questionData.options[index];
    
    // Helper function to clean option text (remove existing a), b), c), d) prefixes)
    const cleanOption = (option: string): string => {
      return option.replace(/^[a-d]\)\s*/i, '').trim();
    };
    
    // Create clean options array
    const cleanedOptions = options.map(option => cleanOption(option));
    
    // Add the question as a special message type (concepts are now included in the QuestionCard)
    addQuestionMessage(index, question, cleanedOptions);
    
    console.log(`Showing question ${index + 1}:`, question);
  }, [questionData, gameState.isComplete, addQuestionMessage]);

  const showCurrentQuestion = useCallback((): void => {
    showQuestionAtIndex(gameState.currentQuestionIndex);
  }, [gameState.currentQuestionIndex, showQuestionAtIndex]);

  const startQuiz = useCallback((): void => {
    if (!questionData || hasStarted) return;
    
    console.log('Starting quiz - showing question 1');
    setHasStarted(true);
    addBotMessage("Great! Let's begin with your first question. 🚀");
    
    setTimeout(() => {
      console.log('Displaying first question (index 0)');
      showQuestionAtIndex(0);
    }, 2000);
  }, [questionData, hasStarted, addBotMessage, showQuestionAtIndex]);

  // Fetch session data
  useEffect(() => {
    console.log('Fetch effect running, sessionId:', sessionId);
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const fetchSessionData = async () => {
      console.log('Starting data fetch');
      try {
        const response = await fetch(`/api/session?id=${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch session data');
        }
        
        console.log('Data fetched successfully, setting questionData');
        
        setQuestionData(data.jsonData);
        
        setGameState(prev => ({
          ...prev,
          answered: new Array(data.jsonData.questions.length).fill(false),
          attemptCounts: new Array(data.jsonData.questions.length).fill(0)
        }));
        
        // Welcome message - ask user to start
        addBotMessage("Welcome to your personalized learning session! \n\nI'll guide you through a series of questions to help you learn. You can:\n• Answer with a, b, c, d or 0, 1, 2, 3\n• Type 'hint' for assistance\n• Type 'don't know' to skip to the answer\n\nIf you answer incorrectly, I'll provide hints to guide you. You'll have up to three attempts per question.\n\nReady to begin? Click the 'Start Quiz' button or type 'start' to begin!");
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, addBotMessage]);

  const handleAnswer = (userInput: string): void => {
    if (!questionData || gameState.isComplete || !hasStarted) {
      if (!hasStarted) {
        addBotMessage("Please start the quiz first by clicking 'Start Quiz' or typing 'start'!");
        return;
      }
      return;
    }

    const { currentQuestionIndex } = gameState;
    console.log(`handleAnswer called for question ${currentQuestionIndex + 1} (index ${currentQuestionIndex})`);
    
    const correctAnswer = Number(questionData.correct_answers[currentQuestionIndex]);
    const currentAttempt = gameState.attemptCounts[currentQuestionIndex] || 0;
    
    // Parse user input
    let userAnswer: number | null = null;
    const input = userInput.toLowerCase().trim();
    
    if (['a', 'b', 'c', 'd'].includes(input)) {
      userAnswer = input.charCodeAt(0) - 97;
    } else if (['0', '1', '2', '3'].includes(input)) {
      userAnswer = parseInt(input);
    }
    
    if (userAnswer === null) {
      addBotMessage("Please answer with a, b, c, d or 0, 1, 2, 3. You can also type 'hint' or 'don't know' for help.");
      return;
    }

    console.log(`User answered question ${currentQuestionIndex + 1} with option ${userAnswer}, correct answer is ${correctAnswer}`);

    // Check if correct
    const isCorrect = userAnswer === correctAnswer;
    
    // Update game state with new attempt count
    setGameState(prev => {
      const newAttemptCounts = [...prev.attemptCounts];
      newAttemptCounts[currentQuestionIndex] = currentAttempt + 1;
      
      // Only mark as answered if correct or reached max attempts (3)
      const newAnswered = [...prev.answered];
      const newCorrectAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
      const newMissedConcepts = [...prev.missedConcepts];
      
      if (isCorrect || currentAttempt >= 2) {
        newAnswered[currentQuestionIndex] = true;
        
        if (!isCorrect) {
          const concepts = questionData.concept_tags?.[currentQuestionIndex] || [];
          newMissedConcepts.push(...concepts);
        }
      }
      
      return {
        ...prev,
        answered: newAnswered,
        correctAnswers: newCorrectAnswers,
        missedConcepts: newMissedConcepts,
        attemptCounts: newAttemptCounts
      };
    });

    // Provide feedback based on correctness and attempt count
    if (isCorrect) {
      const explanationText = questionData.explanations?.[currentQuestionIndex];
      if (explanationText) {
        addBotMessage(`🎉 Correct! \n\n${explanationText}`);
      } else {
        console.warn(`LearnBot: Explanation is missing for correctly answered question index ${currentQuestionIndex}.`);
        addBotMessage(`🎉 Correct!`);
      }
      
      // Move to next question after correct answer
      setTimeout(() => {
        if (currentQuestionIndex < questionData.questions.length - 1) {
          const nextQuestionIndex = currentQuestionIndex + 1;
          setGameState(prev => ({ ...prev, currentQuestionIndex: nextQuestionIndex }));
          setTimeout(() => {
            console.log(`Moving to question ${nextQuestionIndex + 1}`);
            showQuestionAtIndex(nextQuestionIndex);
          }, 1000);
        } else {
          finishQuiz();
        }
      }, 2000);
    } else {
      // Progressive hints based on attempt number
      if (currentAttempt === 0) {
        // First attempt - give hint1
        const hint1Text = questionData.hint1?.[currentQuestionIndex];
        
        if (hint1Text) {
          addBotMessage(`❌ Not quite right. Let me give you a hint: \n\n${hint1Text}`);
        } else {
          console.warn(`LearnBot: Hint 1 is missing for question index ${currentQuestionIndex}.`);
          addBotMessage(`❌ Not quite right. Let's try again!`);
        }
        
        // Re-show the same question
        setTimeout(() => {
          showCurrentQuestion();
        }, 1000);
      } else if (currentAttempt === 1) {
        // Second attempt - give hint2
        const hint2Text = questionData.hint2?.[currentQuestionIndex];
        
        if (hint2Text) {
          addBotMessage(`❌ Let's try a stronger hint: \n\n${hint2Text}`);
        } else {
          console.warn(`LearnBot: Hint 2 is missing for question index ${currentQuestionIndex}.`);
          addBotMessage(`❌ Still not correct. Let's give it one more try!`);
        }
        
        // Re-show the same question
        setTimeout(() => {
          showCurrentQuestion();
        }, 1000);
      } else {
        // Third attempt (or more) - give explanation and move to next question
        const correctOptionIndex = correctAnswer;
        const correctOption = questionData.options[currentQuestionIndex][correctOptionIndex];
        const cleanedCorrectOption = correctOption.replace(/^[a-d]\)\s*/i, '').trim();
        
        const conceptualExpText = questionData.conceptual_explanation?.[currentQuestionIndex];
        const mainExpText = questionData.explanations?.[currentQuestionIndex];
        
        let feedbackMessage = `❌ The correct answer is ${String.fromCharCode(97 + correctOptionIndex)}) ${cleanedCorrectOption}\n\n`;
        
        if (conceptualExpText) {
          feedbackMessage += `${conceptualExpText}\n\n`;
        } else {
          console.warn(`LearnBot: Conceptual Explanation is missing for question index ${currentQuestionIndex} on final attempt.`);
        }
        
        if (mainExpText) {
          feedbackMessage += mainExpText;
        } else {
          console.warn(`LearnBot: Main Explanation is missing for question index ${currentQuestionIndex} on final attempt.`);
          feedbackMessage += `(No detailed explanation available for this question.)`;
        }
        
        addBotMessage(feedbackMessage.trim());
        
        // Move to next question after explanation
        setTimeout(() => {
          if (currentQuestionIndex < questionData.questions.length - 1) {
            const nextQuestionIndex = currentQuestionIndex + 1;
            setGameState(prev => ({ ...prev, currentQuestionIndex: nextQuestionIndex }));
            setTimeout(() => {
              console.log(`Moving to question ${nextQuestionIndex + 1}`);
              showQuestionAtIndex(nextQuestionIndex);
            }, 1000);
          } else {
            finishQuiz();
          }
        }, 3000);
      }
    }
  };

  const handleSpecialCommand = (command: string): void => {
    if (!questionData || gameState.isComplete) return;

    const { currentQuestionIndex } = gameState;
    
    switch (command.toLowerCase()) {
      case 'start':
        startQuiz();
        break;
        
      case 'hint':
        if (!hasStarted) {
          addBotMessage("Please start the quiz first by clicking 'Start Quiz' or typing 'start'!");
          return;
        }
        
        // Get the appropriate hint based on current attempt count
        const currentAttempt = gameState.attemptCounts[currentQuestionIndex] || 0;
        
        if (currentAttempt === 0) {
          // First attempt - show hint1
          const hint1Text = questionData.hint1?.[currentQuestionIndex];
          if (hint1Text) {
            addBotMessage(`💡 Hint: ${hint1Text}`);
          } else {
            console.warn(`LearnBot: 'hint' command used, but Hint 1 is missing for question index ${currentQuestionIndex}.`);
            addBotMessage(`💡 Try to look at the question carefully!`);
          }
        } else if (currentAttempt === 1) {
          // Second attempt - show hint2
          const hint2Text = questionData.hint2?.[currentQuestionIndex];
          if (hint2Text) {
            addBotMessage(`💡 Stronger hint: ${hint2Text}`);
          } else {
            console.warn(`LearnBot: 'hint' command used, but Hint 2 is missing for question index ${currentQuestionIndex}.`);
            addBotMessage(`💡 Consider the steps needed to solve this problem.`);
          }
        } else {
          // Third attempt - show conceptual explanation
          const conceptualExpText = questionData.conceptual_explanation?.[currentQuestionIndex];
          if (conceptualExpText) {
            addBotMessage(`💡 Concept insight: ${conceptualExpText}`);
          } else {
            console.warn(`LearnBot: 'hint' command used (3rd attempt), but Conceptual Explanation is missing for question index ${currentQuestionIndex}.`);
            addBotMessage(`💡 Let's think about the core concept being tested here.`);
          }
        }
        break;
        
      case "don't know":
      case 'dont know':
        if (!hasStarted) {
          addBotMessage("Please start the quiz first by clicking 'Start Quiz' or typing 'start'!");
          return;
        }
        
        // Reveal the answer and move to next question
        const correctAnswer = Number(questionData.correct_answers[currentQuestionIndex]);
        const correctOption = questionData.options[currentQuestionIndex][correctAnswer];
        // Clean the correct option text
        const cleanedCorrectOption = correctOption.replace(/^[a-d]\)\s*/i, '').trim();
        
        const conceptualExpText = questionData.conceptual_explanation?.[currentQuestionIndex];
        const mainExpText = questionData.explanations?.[currentQuestionIndex];
        
        let revealMessage = `The correct answer is ${String.fromCharCode(97 + correctAnswer)}) ${cleanedCorrectOption}\n\n`;

        if (conceptualExpText) {
          revealMessage += `${conceptualExpText}\n\n`;
        } else {
          console.warn(`LearnBot: 'don't know' command, Conceptual Explanation is missing for question index ${currentQuestionIndex}.`);
        }
        
        if (mainExpText) {
          revealMessage += mainExpText;
        } else {
          console.warn(`LearnBot: 'don't know' command, Main Explanation is missing for question index ${currentQuestionIndex}.`);
          revealMessage += `(No detailed explanation available for this question.)`;
        }
        
        addBotMessage(revealMessage.trim());
        
        // Mark as answered but don't count as correct
        setGameState(prev => {
          const newAnswered = [...prev.answered];
          newAnswered[currentQuestionIndex] = true;
          const concepts = questionData.concept_tags?.[currentQuestionIndex] || [];
          return {
            ...prev,
            answered: newAnswered,
            missedConcepts: [...prev.missedConcepts, ...concepts]
          };
        });
        
        // Move to next question
        setTimeout(() => {
          if (currentQuestionIndex < questionData.questions.length - 1) {
            const nextQuestionIndex = currentQuestionIndex + 1;
            setGameState(prev => ({ ...prev, currentQuestionIndex: nextQuestionIndex }));
            setTimeout(() => {
              console.log(`Moving to question ${nextQuestionIndex + 1}`);
              showQuestionAtIndex(nextQuestionIndex);
            }, 1000);
          } else {
            finishQuiz();
          }
        }, 2000);
        break;
        
      default:
        if (!hasStarted) {
          addBotMessage("Please start the quiz first by clicking 'Start Quiz' or typing 'start'!");
        } else {
          addBotMessage("I understand 'hint', 'don't know', or answer with a, b, c, d (or 0, 1, 2, 3).");
        }
    }
  };

  const finishQuiz = (): void => {
    setGameState(prev => ({ ...prev, isComplete: true }));
    
    const { correctAnswers } = gameState;
    const totalQuestions = questionData!.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    let encouragement = '';
    if (percentage >= 90) encouragement = "Outstanding! 🌟";
    else if (percentage >= 80) encouragement = "Excellent work! 🎉";
    else if (percentage >= 70) encouragement = "Good job! 👏";
    else if (percentage >= 60) encouragement = "Nice effort! 💪";
    else encouragement = "Keep practicing! 📚";
    
    const uniqueMissedConcepts = [...new Set(gameState.missedConcepts)];
    
    let summaryMessage = `🏁 Quiz Complete! ${encouragement}\n\n`;
    summaryMessage += `📊 Your Results:\n`;
    summaryMessage += `• Score: ${correctAnswers}/${totalQuestions} (${percentage}%)\n`;
    summaryMessage += `• Questions attempted: ${totalQuestions}\n\n`;
    
    if (uniqueMissedConcepts.length > 0) {
      summaryMessage += `📝 Topics to review:\n${uniqueMissedConcepts.map(concept => `• ${concept}`).join('\n')}\n\n`;
    }
    
    summaryMessage += `Thank you for learning with me! 🎓`;
    
    addBotMessage(summaryMessage);
  };

  const handleSendMessage = (message: string): void => {
    addMessage(message, false);
    
    const input = message.toLowerCase().trim();
    
    if (input === 'start') {
      handleSpecialCommand('start');
    } else if (['hint', "don't know", 'dont know', 'explain more'].includes(input)) {
      handleSpecialCommand(input);
    } else {
      handleAnswer(message);
    }
  };

  const resetQuiz = (): void => {
    setGameState({
      currentQuestionIndex: 0,
      score: 0,
      answered: new Array(questionData?.questions.length || 0).fill(false),
      correctAnswers: 0,
      isComplete: false,
      missedConcepts: [],
      attemptCounts: new Array(questionData?.questions.length || 0).fill(0)
    });
    setMessages([]);
    setHasStarted(false);
    addBotMessage("Let's start over! 🔄\n\nClick 'Start Quiz' or type 'start' when you're ready to begin again!");
  };

  const handleOptionSelect = (optionIndex: number): void => {
    if (!questionData || gameState.isComplete || !hasStarted) return;
    
    const { currentQuestionIndex } = gameState;
    const optionLetter = String.fromCharCode(97 + optionIndex); // Convert to a, b, c, d
    
    console.log(`Option selected: ${optionLetter} (index ${optionIndex}) for question ${currentQuestionIndex + 1}`);
    
    // Add the user's selection as a message
    addMessage(`${optionLetter}`, false);
    
    // Process the answer
    handleAnswer(optionLetter);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your learning session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Tutorji Bot</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {gameState.isComplete && (
            <Button onClick={resetQuiz} variant="outline" size="sm" className="h-8 px-3 text-xs">
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Restart
            </Button>
          )}
          <Button onClick={() => window.location.href = '/'} variant="outline" size="sm" className="h-8 px-3 text-xs">
            <Home className="mr-1.5 h-3 w-3" />
            Home
          </Button>
        </div>
      </header>

      {/* Progress Indicator */}
      {questionData && (
        <ProgressIndicator
          currentQuestion={gameState.currentQuestionIndex}
          totalQuestions={questionData.questions.length}
          correctAnswers={gameState.correctAnswers}
          conceptTags={questionData.concept_tags[gameState.currentQuestionIndex] || []}
        />
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-background/30">
        <div className="max-w-3xl mx-auto py-2">
          <AnimatePresence mode="wait">
            {messages.map((message) => (
              message.isQuestion ? (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="py-1"
                >
                  <ChatMessage
                    isBot={true}
                    timestamp={message.timestamp}
                    customContent={
                      <QuestionCard 
                        questionIndex={message.questionData!.questionIndex}
                        questionText={message.questionData!.questionText}
                        options={message.questionData!.options}
                        conceptTags={questionData?.concept_tags[message.questionData!.questionIndex] || []}
                        onOptionSelect={handleOptionSelect}
                      />
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChatMessage
                    message={message.content}
                    isBot={message.isBot}
                    timestamp={message.timestamp}
                  />
                </motion.div>
              )
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ChatMessage
                message=""
                isBot={true}
                isTyping={true}
              />
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background">
        {!hasStarted && questionData && !gameState.isComplete && (
          <div className="flex items-center justify-center p-3 border-b bg-card/20">
            <Button 
              onClick={startQuiz}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Start Learning</span>
              </div>
            </Button>
          </div>
        )}
        <ChatInput
          onSendMessage={handleSendMessage}
          onHint={() => handleSpecialCommand('hint')}
          onDontKnow={() => handleSpecialCommand("don't know")}
          disabled={gameState.isComplete}
          showQuickActions={hasStarted && !gameState.isComplete}
        />
      </div>
    </div>
  );
}

export default function LearnBot() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LearnBotContent />
    </Suspense>
  );
} 