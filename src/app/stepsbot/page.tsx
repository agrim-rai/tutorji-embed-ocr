"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn } from "next-auth/react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Brain,
  Target,
  XCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  Play,
  Bot,
  Camera,
  User,
  Crown,
  LogOut,
  RefreshCw,
  Info,
  Maximize2,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';
import { ShiningText } from "@/components/ui/shining-text";
import { ResponseStream } from "@/components/ui/response-stream";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Link from "next/link";

interface Step {
  id: string;
  content: string;
  subSteps: SubStep[];
  isExpanded: boolean;
  isLoadingSubSteps: boolean;
}

interface SubStep {
  id: string;
  content: string;
  theory?: string;
  isExpanded: boolean;
  isLoadingTheory: boolean;
}

interface BreakdownResponse {
  success: boolean;
  content?: string;
  error?: string;
}

interface BotResult {
  chatbotLink: string;
  sessionId: string;
}

interface ProcessedData {
  questions: string[];
  options: string[][];
  correct_answers: number[];
  explanations: string[];
  concept_tags: string[][];
}

export default function StepsBot() {
  // Session management
  const { data: session, status } = useSession();
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Steps breakdown states
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoadingMainSteps, setIsLoadingMainSteps] = useState(false);
  
  // Interactive learning states
  const [botResult, setBotResult] = useState<BotResult | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [showFullQuestion, setShowFullQuestion] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  
  // General states
  const [error, setError] = useState('');
  const [realTimeCredits, setRealTimeCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  // Fetch user credits
  const fetchUserCredits = async () => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    
    try {
      setCreditsLoading(true);
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setRealTimeCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setCreditsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserCredits();
    }
  }, [status]);

  // Utility functions
  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const parseStepsFromContent = (content: string): string[] => {
    if (!content || !content.trim()) return [];
    
    const blocks = content.split('\n\n').filter(block => block.trim());
    
    if (blocks.length > 1) {
      const completeSteps: string[] = [];
      let currentStep = '';
      
      for (const block of blocks) {
        const isStepStart = /^(Step|Sub-step)\s+\d+(\.\d+)?:/i.test(block.trim());
        
        if (isStepStart && currentStep) {
          completeSteps.push(currentStep.trim());
          currentStep = block;
        } else if (isStepStart) {
          currentStep = block;
        } else {
          if (currentStep) {
            currentStep += '\n\n' + block;
          } else {
            currentStep = block;
          }
        }
      }
      
      if (currentStep) {
        completeSteps.push(currentStep.trim());
      }
      
      return completeSteps.length > 0 ? completeSteps : blocks.map(block => block.trim());
    }
    
    return [content.trim()];
  };

  // Image handling functions
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size should be less than 5MB');
      return;
    }

    setSelectedImage(file);
    setError('');
    setSteps([]);
    setBotResult(null);
    setShowIframe(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

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

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError('');
    setSteps([]);
    setBotResult(null);
    setShowIframe(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step analysis function
  const analyzeImageSteps = async () => {
    if (!selectedImage) {
      setError('Please upload an image first');
      return;
    }

    if (status === 'unauthenticated') {
      setError('You need to sign in to use this feature');
      return;
    }

    const currentCredits = realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0);
    if (currentCredits <= 0) {
      setError('No credits remaining. Please upgrade your account or wait for credits to reset.');
      return;
    }

    setIsLoadingMainSteps(true);
    setError('');
    setSteps([]);

    try {
      const imageBase64 = await convertImageToBase64(selectedImage);
      
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageBase64,
          type: 'main'
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success && data.content) {
        const stepContents = parseStepsFromContent(data.content);
        const newSteps: Step[] = stepContents.map(content => ({
          id: generateUniqueId(),
          content,
          subSteps: [],
          isExpanded: false,
          isLoadingSubSteps: false,
        }));
        setSteps(newSteps);
        
        // Update credits
        await fetchUserCredits();
      } else {
        setError(data.error || 'Failed to analyze the image');
      }
    } catch (err) {
      setError('Network error occurred or failed to process image');
    } finally {
      setIsLoadingMainSteps(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Step interaction functions
  const handleGetSubSteps = async (stepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? { ...step, isLoadingSubSteps: true }
          : step
      )
    );

    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepContext: step.content,
          type: 'sub'
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success && data.content) {
        const subStepContents = parseStepsFromContent(data.content);
        const newSubSteps: SubStep[] = subStepContents.map(content => ({
          id: generateUniqueId(),
          content,
          theory: undefined,
          isExpanded: false,
          isLoadingTheory: false,
        }));

        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: newSubSteps,
                  isExpanded: true,
                  isLoadingSubSteps: false,
                }
              : step
          )
        );
      } else {
        setError(data.error || 'Failed to get sub-steps');
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? { ...step, isLoadingSubSteps: false }
              : step
          )
        );
      }
    } catch (err) {
      setError('Network error occurred');
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? { ...step, isLoadingSubSteps: false }
            : step
        )
      );
    }
  };

  const handleGetTheory = async (stepId: string, subStepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              subSteps: step.subSteps.map(subStep =>
                subStep.id === subStepId
                  ? { ...subStep, isLoadingTheory: true }
                  : subStep
              ),
            }
          : step
      )
    );

    const step = steps.find(s => s.id === stepId);
    const subStep = step?.subSteps.find(s => s.id === subStepId);
    if (!subStep) return;

    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepContext: subStep.content,
          type: 'theory'
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success && data.content) {
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: step.subSteps.map(subStep =>
                    subStep.id === subStepId
                      ? {
                          ...subStep,
                          theory: data.content,
                          isExpanded: true,
                          isLoadingTheory: false,
                        }
                      : subStep
                  ),
                }
              : step
          )
        );
      } else {
        setError(data.error || 'Failed to get theory explanation');
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: step.subSteps.map(subStep =>
                    subStep.id === subStepId
                      ? { ...subStep, isLoadingTheory: false }
                      : subStep
                  ),
                }
              : step
          )
        );
      }
    } catch (err) {
      setError('Network error occurred');
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {
                ...step,
                subSteps: step.subSteps.map(subStep =>
                  subStep.id === subStepId
                    ? { ...subStep, isLoadingTheory: false }
                    : subStep
                ),
              }
            : step
        )
      );
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? { ...step, isExpanded: !step.isExpanded }
          : step
      )
    );
  };

  const toggleSubStepExpansion = (stepId: string, subStepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              subSteps: step.subSteps.map(subStep =>
                subStep.id === subStepId
                  ? { ...subStep, isExpanded: !subStep.isExpanded }
                  : subStep
              ),
            }
          : step
      )
    );
  };

  const handleStepClick = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step && step.subSteps.length > 0) {
      toggleStepExpansion(stepId);
    } else if (step && step.subSteps.length === 0 && !step.isLoadingSubSteps) {
      handleGetSubSteps(stepId);
    }
  };

  const handleSubStepClick = (stepId: string, subStepId: string) => {
    const step = steps.find(s => s.id === stepId);
    const subStep = step?.subSteps.find(s => s.id === subStepId);
    if (subStep && subStep.theory) {
      toggleSubStepExpansion(stepId, subStepId);
    } else if (subStep && !subStep.theory && !subStep.isLoadingTheory) {
      handleGetTheory(stepId, subStepId);
    }
  };

  // Interactive learning functions
  const startInteractiveLearning = async () => {
    if (!selectedImage || steps.length === 0) {
      setError('Please analyze the image first to generate steps');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Step 1: Process image for chatbot
      const aiFormData = new FormData();
      aiFormData.append("image", selectedImage);

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: aiFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process image");
      }

      setProcessedData(result.data);

      // Step 2: Create chatbot session
      const chatbotResponse = await fetch("/api/upload-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const chatbotResult = await chatbotResponse.json();

      if (!chatbotResponse.ok) {
        throw new Error(chatbotResult.error || "Failed to create chatbot");
      }

      setBotResult({
        chatbotLink: chatbotResult.chatbotLink,
        sessionId: chatbotResult.sessionId,
      });

      // Update credits
      if (result.creditsRemaining !== undefined) {
        setRealTimeCredits(result.creditsRemaining);
      }
      
      await fetchUserCredits();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interactive learning");
    } finally {
      setProcessing(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        <div className="container mx-auto max-w-7xl p-6 space-y-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl border border-primary/20 backdrop-blur-sm">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent px-2">
              Interactive Learning Assistant
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Upload a problem image, get step-by-step breakdown, and learn interactively with AI guidance
            </p>
          </motion.div>

          {/* Authentication Check */}
          {status === 'unauthenticated' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-card rounded-xl p-6 border shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Sign In Required</h2>
                  <p className="text-muted-foreground text-sm">
                    Sign in to access the interactive learning features
                  </p>
                </div>

                <button
                  onClick={() => signIn('google', { callbackUrl: '/stepsbot' })}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-3 font-medium transition-colors inline-flex items-center justify-center gap-2"
                >
                  <User size={18} />
                  Sign In to Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Main content for authenticated users */}
          {status === 'authenticated' && (
            <>
              {/* User Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="max-w-md mx-auto"
              >
                <div className={`p-3 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {session.user?.image ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500">
                          <img 
                            src={session.user.image} 
                            alt={session.user.name || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                        }`}>
                          {session.user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center space-x-1">
                          <h3 className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            {session.user?.name || 'User'}
                          </h3>
                          {(session.user as any)?.accountType === "pro" && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              isDarkMode ? 'bg-yellow-800 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                            } flex items-center space-x-1`}>
                              <Crown size={8} />
                              <span>PRO</span>
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{session.user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credits display */}
                  <div className={`mt-2 p-2 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/80'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Credits
                        </span>
                        <button
                          onClick={fetchUserCredits}
                          disabled={creditsLoading}
                          className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                            creditsLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Refresh credits"
                        >
                          <RefreshCw 
                            size={10} 
                            className={`${creditsLoading ? 'animate-spin' : ''} ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} 
                          />
                        </button>
                      </div>
                      <span className={`text-xs font-medium ${
                        (realTimeCredits !== null ? realTimeCredits : (session.user?.credits ?? 0)) <= 1
                          ? 'text-red-500' 
                          : isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                      }`}>
                        {creditsLoading ? '...' : `${realTimeCredits !== null ? realTimeCredits : (session.user?.credits ?? 0)}/25`}
                      </span>
                    </div>
                    
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        style={{ width: `${((realTimeCredits !== null ? realTimeCredits : (session.user?.credits ?? 0)) / 25) * 100}%` }}
                        className={`h-full transition-all duration-500 ${
                          (realTimeCredits !== null ? realTimeCredits : (session.user?.credits ?? 0)) <= 1
                            ? 'bg-red-500' 
                            : isDarkMode ? 'bg-indigo-500' : 'bg-indigo-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Image Upload Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-lg"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-semibold text-card-foreground">
                    Upload Problem Image
                  </h2>
                </div>
                
                {!imagePreview ? (
                  <>
                    {isMobile ? (
                      /* Mobile: Camera and Upload buttons */
                      <div className="space-y-4">
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl transition-all hover:from-primary/15 hover:to-primary/10 hover:border-primary/40"
                        >
                          <Camera className="w-8 h-8 text-primary" />
                          <div className="text-center">
                            <h3 className="text-lg font-semibold">Take Photo</h3>
                            <p className="text-sm text-muted-foreground">Capture question image</p>
                          </div>
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-3 p-4 bg-muted/30 border-2 border-dashed border-border rounded-lg transition-all hover:border-primary/50 hover:bg-muted/40"
                        >
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">Upload Image</p>
                            <p className="text-xs text-muted-foreground">Select from gallery</p>
                          </div>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      /* Desktop: Drag and drop area */
                      <div
                        className={`border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${
                          isDragOver 
                            ? 'border-primary bg-primary/5 scale-[1.02]' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 sm:mb-6" />
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                          Drop your image here
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                          or click to browse • Supports JPG, PNG, GIF up to 5MB
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base">
                          <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                          Choose Image
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="relative inline-block rounded-lg sm:rounded-xl overflow-hidden shadow-lg max-w-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-60 sm:max-h-80 object-contain bg-muted/20"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full p-1.5 sm:p-2 transition-colors shadow-lg"
                      >
                        <X size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ready for analysis</p>
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{selectedImage?.name}</p>
                    </div>
                  </motion.div>
                )}

                {imagePreview && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-6 sm:mt-8"
                  >
                    <button
                      onClick={analyzeImageSteps}
                      disabled={isLoadingMainSteps || ((realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0)) <= 0)}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:from-muted disabled:to-muted text-primary-foreground font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg disabled:shadow-none text-sm sm:text-base"
                    >
                      {isLoadingMainSteps ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                          Analyzing image...
                        </>
                      ) : ((realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0)) <= 0) ? (
                        <>
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          No Credits Remaining
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                          Analyze & Break Down Steps
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-destructive/10 border border-destructive/20 text-destructive px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-6 sm:mb-8 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                      <span className="text-sm sm:text-base">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Steps Display */}
              <AnimatePresence>
                {steps.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 sm:mb-8"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <h2 className="text-lg sm:text-2xl font-semibold text-card-foreground">
                        Step-by-Step Breakdown
                      </h2>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {steps.map((step, stepIndex) => (
                        <motion.div 
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: stepIndex * 0.1 }}
                          className="border border-border rounded-lg sm:rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm step-container"
                        >
                          {/* Main Step */}
                          <div className="bg-muted/20 border-b border-border">
                            <div className="p-3 sm:p-4 md:p-6">
                              <div className="flex items-start gap-3 sm:gap-4">
                                <motion.button
                                  animate={{ rotate: step.isExpanded ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-0.5 sm:mt-1 text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0"
                                  disabled={step.subSteps.length === 0 && !step.isLoadingSubSteps}
                                  onClick={() => handleStepClick(step.id)}
                                >
                                  <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                                </motion.button>
                                <div 
                                  className="flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => handleStepClick(step.id)}
                                >
                                  <SimpleMathRenderer 
                                    content={step.content} 
                                    className="text-foreground font-medium leading-relaxed break-words text-sm sm:text-base" 
                                  />
                                </div>
                                {/* Mobile: Compact action button */}
                                <div className="flex-shrink-0 self-start sm:hidden">
                                  <button
                                    onClick={() => handleGetSubSteps(step.id)}
                                    disabled={step.isLoadingSubSteps || step.subSteps.length > 0}
                                    className="bg-primary/10 hover:bg-primary/20 disabled:bg-muted text-primary disabled:text-muted-foreground p-2 rounded-lg transition-all duration-200 border border-primary/20 disabled:border-muted"
                                  >
                                    {step.isLoadingSubSteps ? (
                                      <Loader2 className="animate-spin w-4 h-4" />
                                    ) : step.subSteps.length > 0 ? (
                                      <CheckCircle size={16} />
                                    ) : (
                                      <Plus size={16} />
                                    )}
                                  </button>
                                </div>
                                {/* Desktop: Full action button */}
                                <div className="flex-shrink-0 self-start hidden sm:block">
                                  <button
                                    onClick={() => handleGetSubSteps(step.id)}
                                    disabled={step.isLoadingSubSteps || step.subSteps.length > 0}
                                    className="bg-primary/10 hover:bg-primary/20 disabled:bg-muted text-primary disabled:text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-primary/20 disabled:border-muted whitespace-nowrap"
                                  >
                                    {step.isLoadingSubSteps ? (
                                      <Loader2 className="animate-spin w-4 h-4" />
                                    ) : step.subSteps.length > 0 ? (
                                      <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                                    ) : (
                                      <Plus size={14} className="sm:w-4 sm:h-4" />
                                    )}
                                    {step.subSteps.length > 0 ? 'Expanded' : 'Further Breakdown'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sub Steps */}
                          <AnimatePresence>
                            {step.isExpanded && step.subSteps.length > 0 && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                {step.subSteps.map((subStep, subStepIndex) => (
                                  <motion.div 
                                    key={subStep.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: subStepIndex * 0.05 }}
                                    className="border-b border-border/50 last:border-b-0 step-container"
                                  >
                                    {/* Sub Step Header */}
                                    <div className="bg-card/20">
                                      <div className="p-3 sm:p-4 md:p-6 pl-6 sm:pl-8 md:pl-12">
                                        <div className="flex items-start gap-3 sm:gap-4">
                                          <motion.button
                                            animate={{ rotate: subStep.isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-0.5 sm:mt-1 text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0"
                                            disabled={!subStep.theory && !subStep.isLoadingTheory}
                                            onClick={() => handleSubStepClick(step.id, subStep.id)}
                                          >
                                            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                          </motion.button>
                                          <div 
                                            className="flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSubStepClick(step.id, subStep.id)}
                                          >
                                            <SimpleMathRenderer 
                                              content={subStep.content} 
                                              className="text-muted-foreground leading-relaxed break-words text-sm sm:text-base" 
                                            />
                                          </div>
                                          {/* Mobile: Compact theory button */}
                                          <div className="flex-shrink-0 self-start sm:hidden">
                                            <button
                                              onClick={() => handleGetTheory(step.id, subStep.id)}
                                              disabled={subStep.isLoadingTheory || !!subStep.theory}
                                              className="bg-secondary/50 hover:bg-secondary/70 disabled:bg-muted text-secondary-foreground disabled:text-muted-foreground p-2 rounded-lg transition-all duration-200 border border-secondary/20 disabled:border-muted"
                                            >
                                              {subStep.isLoadingTheory ? (
                                                <Loader2 className="animate-spin w-4 h-4" />
                                              ) : subStep.theory ? (
                                                <CheckCircle size={14} />
                                              ) : (
                                                <FileText size={14} />
                                              )}
                                            </button>
                                          </div>
                                          {/* Desktop: Full theory button */}
                                          <div className="flex-shrink-0 self-start hidden sm:block">
                                            <button
                                              onClick={() => handleGetTheory(step.id, subStep.id)}
                                              disabled={subStep.isLoadingTheory || !!subStep.theory}
                                              className="bg-secondary/50 hover:bg-secondary/70 disabled:bg-muted text-secondary-foreground disabled:text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-secondary/20 disabled:border-muted whitespace-nowrap"
                                            >
                                              {subStep.isLoadingTheory ? (
                                                <Loader2 className="animate-spin w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                                              ) : subStep.theory ? (
                                                <CheckCircle size={12} className="sm:w-[14px] sm:h-[14px]" />
                                              ) : (
                                                <FileText size={12} className="sm:w-[14px] sm:h-[14px]" />
                                              )}
                                              {subStep.theory ? 'Theory Loaded' : 'Get Explanation'}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Theory Explanation */}
                                    <AnimatePresence>
                                      {subStep.isExpanded && subStep.theory && (
                                        <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-3 sm:p-4 md:p-6 pl-8 sm:pl-12 md:pl-16 bg-primary/5 border-l-2 sm:border-l-4 border-primary/30">
                                            <div className="bg-card/40 rounded-lg p-3 sm:p-4 border border-border/50">
                                              <SimpleMathRenderer 
                                                content={subStep.theory} 
                                                className="text-muted-foreground leading-relaxed text-sm sm:text-base" 
                                              />
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>

                    {/* Interactive Learning Button */}
                    {steps.length > 0 && !botResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border-2 border-green-200 dark:border-green-800/40"
                      >
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <Bot className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-green-800 dark:text-green-400">
                              Ready for Interactive Learning?
                            </h3>
                          </div>
                          
                          {/* center the button */}
                          <p className="text-muted-foreground">
                            Now that you have the step breakdown, launch the AI tutor for personalized guidance through the solution!
                          </p>
                          <button
                            onClick={startInteractiveLearning}
                            disabled={processing || ((realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0)) <= 0)}
                            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-muted disabled:to-muted text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg disabled:shadow-none"   
                          >
                            {processing ? (
                              <>
                                <Loader2 className="animate-spin w-5 h-5" />
                                <ShiningText text="Preparing AI Tutor..." />
                              </>
                            ) : (
                              <>

                                <Play className="w-5 h-5  " />
                                Launch Interactive Learning
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bot Result Display */}
              {botResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-8 border-2 border-green-200 dark:border-green-800/40 shadow-lg"
                >
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Bot className="w-8 h-8 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-green-800 dark:text-green-400">
                        AI Tutor Ready!
                      </h2>
                    </div>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Your personalized AI tutor is ready to guide you through the solution step by step. 
                      Start your interactive learning journey now!
                    </p>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        onClick={() => setShowIframe(true)}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 sm:px-12 py-4 text-lg sm:text-xl font-semibold rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl w-full sm:w-auto max-w-full"
                      >
                        <Play className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                        <span className="text-center leading-tight">
                          Start Learning
                          <br className="sm:hidden" />
                          <span className="sm:inline"> with AI Bot</span>
                        </span>
                      </Button>
                    </motion.div>

                    {/* Share functionality */}
                    {shareUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="pt-6 border-t border-border/30"
                      >
                        <div className="text-center space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Share this learning session with others
                          </p>
                          <Button
                            onClick={copyShareLink}
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            {shareCopied ? "Link Copied!" : "Copy Share Link"}
                          </Button>
                          {shareCopied && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="text-sm text-green-600 font-medium"
                            >
                              ✓ Share link copied to clipboard!
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Interactive Learning Iframe */}
              {showIframe && botResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-card rounded-xl border shadow-lg overflow-hidden w-full"
                >
                  {/* Header with controls */}
                  <div className="flex items-center justify-between p-3 lg:p-4 border-b bg-card">
                    <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2">
                      <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      <span className="hidden sm:inline">Interactive Learning Session</span>
                      <span className="sm:hidden">Learning Session</span>
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowFullQuestion(true)}
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex"
                      >
                        <Maximize2 className="mr-2 h-4 w-4" />
                        View Original Question
                      </Button>
                      <Button
                        onClick={() => setShowFullQuestion(true)}
                        variant="outline"
                        size="sm"
                        className="sm:hidden"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setShowIframe(false)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Responsive Layout */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Question Panel */}
                    <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r bg-card lg:h-[700px]">
                      <div className="p-3 lg:p-4 flex flex-col lg:h-full">
                        <h3 className="font-semibold text-base lg:text-lg mb-2 lg:mb-3">
                          Original Question
                        </h3>

                        {/* Image Container */}
                        <div
                          className="border rounded-lg bg-muted/20 overflow-hidden relative"
                          style={{ 
                            minHeight: isMobile ? "180px" : "250px", 
                            maxHeight: isMobile ? "220px" : "350px" 
                          }}
                        >
                          {selectedImage && imagePreview && (
                            <TransformWrapper
                              initialScale={1}
                              minScale={0.3}
                              maxScale={5}
                              centerOnInit={true}
                              wheel={{ step: 0.1 }}
                            >
                              {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                  {/* Zoom Controls */}
                                  <div className="absolute top-2 lg:top-4 right-2 lg:right-4 z-10 flex gap-1">
                                    <Button
                                      onClick={() => zoomIn()}
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6 lg:h-8 lg:w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                                      title="Zoom In"
                                    >
                                      <ZoomIn className="h-3 w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => zoomOut()}
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6 lg:h-8 lg:w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                                      title="Zoom Out"
                                    >
                                      <ZoomOut className="h-3 w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => resetTransform()}
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6 lg:h-8 lg:w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
                                      title="Reset View"
                                    >
                                      <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                  </div>
                                  <TransformComponent>
                                    <img
                                      src={imagePreview}
                                      alt="Original Question"
                                      className="w-full h-full object-contain rounded-lg"
                                    />
                                  </TransformComponent>
                                </>
                              )}
                            </TransformWrapper>
                          )}
                        </div>

                        {/* Full Screen Button */}
                        <div className="mt-2 lg:mt-4">
                          <Button
                            onClick={() => setShowFullQuestion(true)}
                            variant="outline"
                            size="sm"
                            className="w-full text-xs lg:text-sm"
                          >
                            <Maximize2 className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                            <span className="hidden sm:inline">View Full Screen</span>
                            <span className="sm:hidden">Full Screen</span>
                          </Button>
                        </div>

                        {/* Question Analysis */}
                        {processedData && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="mt-2 lg:mt-4 p-3 lg:p-4 bg-muted/30 rounded-lg border border-border/40 flex-1 lg:flex-none lg:max-h-[200px] lg:overflow-y-auto"
                          >
                            <div className="space-y-2 lg:space-y-3">
                              <div className="flex items-start gap-2">
                                <FileText className="w-3 h-3 lg:w-4 lg:h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                                  <p className="text-foreground font-medium">
                                    Analysis
                                  </p>
                                  <p className="text-muted-foreground leading-relaxed">
                                    <span className="font-medium">Topics:</span>{" "}
                                    {processedData.concept_tags
                                      .flat()
                                      .slice(0, isMobile ? 2 : 3)
                                      .join(", ")}
                                    {processedData.concept_tags.flat().length > (isMobile ? 2 : 3) &&
                                      "..."}
                                  </p>
                                  <p className="text-muted-foreground leading-relaxed">
                                    Broken into{" "}
                                    <span className="font-medium text-primary">
                                      {processedData.questions.length} questions
                                    </span>{" "}
                                    for step-by-step learning.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Bot Panel */}
                    <div className="w-full lg:w-2/3 flex-1">
                      <div className="h-[calc(100vh-200px)] min-h-[600px] lg:h-[700px]">
                        <iframe
                          src={botResult.chatbotLink}
                          className="w-full h-full border-0"
                          title="AI Tutor Interactive Session"
                          scrolling="yes"
                          allow="fullscreen"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Full Screen Question Modal */}
              <AnimatePresence>
                {showFullQuestion && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowFullQuestion(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="bg-card rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Original Question</h3>
                        <Button
                          onClick={() => setShowFullQuestion(false)}
                          variant="outline"
                          size="icon"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Full Screen Question"
                          className="w-full rounded-lg"
                        />
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}