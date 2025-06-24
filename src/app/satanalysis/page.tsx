"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Upload, 
  ImageIcon, 
  X, 
  Loader2, 
  ChevronRight,
  Target,
  FileText,
  Brain,
  Bot,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  Camera,
  User,
  Crown,
  LogOut,
  Home,
  BookOpen,
  Star,
  Settings,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";
import { motion, AnimatePresence } from "framer-motion";

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
  data?: {
    steps?: Array<{
      id: number;
      title: string;
      description: string;
    }>;
    subSteps?: Array<{
      id: number;
      title: string;
      description: string;
    }>;
    cruxOfProblem?: string;
    formulaeUsed?: string;
    termDefinitions?: string;
  };
  error?: string;
}

export default function SatAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);
  
  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    cruxOfProblem?: string;
    formulaeUsed?: string;
    termDefinitions?: string;
  } | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5MB.");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
      // Reset analysis data
      setSummaryData(null);
      setSteps([]);
      setQuestionId(null);
    }
  };
  
  // Upload image to server
  const uploadImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }
    
    setUploadingImage(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Failed to upload image");
      }
      
      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed");
      }
      
      setUploadedImageUrl(uploadData.imageUrl);
      
      // Generate a temporary question ID for this analysis
      const tempId = `temp-${Date.now()}`;
      setQuestionId(tempId);
      
      return uploadData.imageUrl;
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Analyze image with breakdown API
  const analyzeImage = async () => {
    // First upload the image if not already uploaded
    let imageUrl = uploadedImageUrl;
    if (!imageUrl) {
      imageUrl = await uploadImage();
      if (!imageUrl) return; // Upload failed
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // First get summary
      const summaryResponse = await fetch("/api/breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageUrl,
          type: "summary",
        }),
      });
      
      const summaryData: BreakdownResponse = await summaryResponse.json();
      
      if (summaryData.success && summaryData.data) {
        setSummaryData(summaryData.data);
      }
      
      // Then get main steps
      const mainStepsResponse = await fetch("/api/breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageUrl,
          type: "main",
        }),
      });
      
      const mainStepsData: BreakdownResponse = await mainStepsResponse.json();
      
      if (mainStepsData.success && mainStepsData.data?.steps) {
        const newSteps = mainStepsData.data.steps.map((step) => ({
          id: generateUniqueId(),
          content: `${step.title}\n\n${step.description}`,
          subSteps: [],
          isExpanded: false,
          isLoadingSubSteps: false,
        }));
        setSteps(newSteps);
      } else {
        setError(mainStepsData.error || "Failed to analyze the image");
      }
    } catch (err) {
      setError("Network error occurred or failed to process image");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle getting sub-steps
  const handleGetSubSteps = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    
    setSteps((prevSteps) =>
      prevSteps.map((s) =>
        s.id === stepId ? { ...s, isLoadingSubSteps: true } : s
      )
    );
    
    try {
      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stepContext: step.content,
          type: "sub",
        }),
      });
      
      const data: BreakdownResponse = await response.json();
      
      if (data.success && data.data?.subSteps) {
        const newSubSteps = data.data.subSteps.map((subStep) => ({
          id: generateUniqueId(),
          content: `${subStep.title}\n\n${subStep.description}`,
          isExpanded: false,
          isLoadingTheory: false,
        }));
        
        setSteps((prevSteps) =>
          prevSteps.map((s) =>
            s.id === stepId
              ? { ...s, subSteps: newSubSteps, isExpanded: true, isLoadingSubSteps: false }
              : s
          )
        );
      } else {
        throw new Error(data.error || "Failed to get sub-steps");
      }
    } catch (err) {
      console.error(err);
      setSteps((prevSteps) =>
        prevSteps.map((s) =>
          s.id === stepId ? { ...s, isLoadingSubSteps: false } : s
        )
      );
    }
  };
  
  // Handle getting theory explanation
  const handleGetTheory = async (stepId: string, subStepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    const subStep = step?.subSteps.find((s) => s.id === subStepId);
    if (!subStep) return;
    
    setSteps((prevSteps) =>
      prevSteps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              subSteps: s.subSteps.map((sub) =>
                sub.id === subStepId ? { ...sub, isLoadingTheory: true } : sub
              ),
            }
          : s
      )
    );
    
    try {
      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stepContext: subStep.content,
          type: "theory",
        }),
      });
      
      const data: BreakdownResponse = await response.json();
      
      if (data.success && data.content) {
        setSteps((prevSteps) =>
          prevSteps.map((s) =>
            s.id === stepId
              ? {
                  ...s,
                  subSteps: s.subSteps.map((sub) =>
                    sub.id === subStepId
                      ? { ...sub, theory: data.content, isExpanded: true, isLoadingTheory: false }
                      : sub
                  ),
                }
              : s
          )
        );
      } else {
        throw new Error(data.error || "Failed to get theory");
      }
    } catch (err) {
      console.error(err);
      setSteps((prevSteps) =>
        prevSteps.map((s) =>
          s.id === stepId
            ? {
                ...s,
                subSteps: s.subSteps.map((sub) =>
                  sub.id === subStepId ? { ...sub, isLoadingTheory: false } : sub
                ),
              }
            : s
        )
      );
    }
  };
  
  // Handle step click
  const handleStepClick = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (step) {
      if (step.subSteps.length > 0) {
        setSteps(steps.map(s => s.id === stepId ? {...s, isExpanded: !s.isExpanded} : s));
      } else if (!step.isLoadingSubSteps) {
        handleGetSubSteps(stepId);
      }
    }
  };
  
  // Handle sub-step click
  const handleSubStepClick = (stepId: string, subStepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    const subStep = step?.subSteps.find((ss) => ss.id === subStepId);
    if (subStep) {
      if (subStep.theory) {
        setSteps(steps.map(s => s.id === stepId ? { ...s, subSteps: s.subSteps.map(ss => ss.id === subStepId ? {...ss, isExpanded: !ss.isExpanded} : ss)} : s));
      } else if (!subStep.isLoadingTheory) {
        handleGetTheory(stepId, subStepId);
      }
    }
  };
  
  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setSummaryData(null);
    setSteps([]);
    setError(null);
    setQuestionId(null);
    setProcessedData(null);
    setIsProcessing(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Start Interactive Learning function
  const startInteractiveLearning = async () => {
    if (!selectedImage) {
      setError("Please upload an image first");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Step 1: Process image for SAT interactive learning
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/sat/process-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process image for interactive learning");
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

      // Navigate to SAT bot
      router.push(chatbotResult.chatbotLink);

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
  
  // Check if user is authenticated
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex items-center space-x-4">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">
            Authentication Required
          </h1>
          <p className="text-gray-300 mb-8 text-center">
            You need to be signed in to use the SAT Analysis feature.
          </p>
          <div className="flex justify-center">
            <Link 
              href="/api/auth/signin"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      <Navbar />
      
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full backdrop-blur-sm border border-white/10">
                <Sparkles className="w-12 h-12 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              SAT Question Analysis
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Upload your SAT question image and get instant AI-powered step-by-step breakdowns
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={14} />
              <Link href="/sat" className="hover:text-white transition-colors">SAT Portal</Link>
              <ChevronRight size={14} />
              <span className="text-white">Quick Analysis</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/80 to-gray-800/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Upload className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Upload SAT Question Image</h2>
            </div>
            <p className="text-gray-300 text-sm mt-2">Get instant AI analysis with step-by-step breakdown</p>
          </div>
          
          <div className="p-6">
            {imagePreview ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center">
                  <div className="relative w-full max-h-64 flex justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-64 rounded shadow-md object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedImage?.name} ({((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={analyzeImage}
                    disabled={uploadingImage || isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span>Uploading Image...</span>
                      </>
                    ) : isAnalyzing ? (
                      <>
                        <Brain className="mr-2 h-5 w-5" />
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>AI is analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        <span>Analyze Question</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={removeImage}
                    variant="outline"
                    className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-red-500/50 hover:text-red-300 transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-gray-600/50 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 transition-all duration-300 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-10 w-10 text-indigo-400" />
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Drop your SAT question here
                    </p>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      or click to browse files
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF up to 5MB • AI analysis in seconds
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Powered</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>Step-by-step</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Brain className="w-3 h-3" />
                      <span>Detailed Theory</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-200 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-500/20 rounded-full">
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-red-300">Upload Error</p>
                    <p className="text-sm text-red-200/80 mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
        
        <AnimatePresence>
          {summaryData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      Question Analysis
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        Crux of the Problem:
                      </h4>
                      <SimpleMathRenderer
                        content={summaryData.cruxOfProblem || "Not available"}
                        className="text-slate-200 leading-relaxed"
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Key Formulae & Principles:
                      </h4>
                      <SimpleMathRenderer
                        content={summaryData.formulaeUsed || "Not available"}
                        className="text-slate-200 leading-relaxed"
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-400" />
                        Term Definitions:
                      </h4>
                      <SimpleMathRenderer
                        content={summaryData.termDefinitions || "Not available"}
                        className="text-slate-200 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 rounded-lg">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold">
                  Step-by-Step Breakdown
                </h2>
              </div>
              
              <div className="space-y-4">
                {steps.map((step, stepIndex) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: stepIndex * 0.1 }}
                    className="border border-gray-700/40 rounded-xl overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-800/30"
                  >
                    <div className="bg-gradient-to-r from-gray-700/30 to-gray-700/20 border-b border-gray-700/30">
                      <div className="p-4 flex items-start gap-2 cursor-pointer" onClick={() => handleStepClick(step.id)}>
                        <motion.div
                          animate={{ rotate: step.isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-1"
                        >
                          <ChevronRight size={16} className="text-gray-400" />
                        </motion.div>
                        <div className="flex-1">
                          <SimpleMathRenderer content={step.content} className="font-medium text-gray-200" />
                        </div>
                        {step.isLoadingSubSteps && <Loader2 className="animate-spin w-4 h-4 text-indigo-400" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {step.isExpanded && step.subSteps.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-8 pr-4 py-2 bg-gray-800/40"
                        >
                          {step.subSteps.map((subStep) => (
                            <div key={subStep.id} className="border-l-2 border-indigo-900/20 pl-4 py-2 my-2">
                              <div className="flex items-start gap-2 cursor-pointer" onClick={() => handleSubStepClick(step.id, subStep.id)}>
                                <motion.div animate={{ rotate: subStep.isExpanded ? 90 : 0 }} className="mt-1">
                                  <ChevronRight size={14} className="text-gray-400" />
                                </motion.div>
                                <SimpleMathRenderer content={subStep.content} className="text-sm text-gray-400 flex-1" />
                                {subStep.isLoadingTheory && <Loader2 className="animate-spin w-4 h-4 text-indigo-400" />}
                              </div>
                              <AnimatePresence>
                                {subStep.isExpanded && subStep.theory && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="pl-6 pt-2"
                                  >
                                    <div className="p-3 bg-indigo-900/5 border-l-2 border-indigo-800/30 rounded-r-lg">
                                      <SimpleMathRenderer content={subStep.theory} className="text-sm text-gray-300" />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg">
                      <Bot className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready for Interactive Learning?</h3>
                  <p className="text-gray-300 text-sm">
                    Take your understanding to the next level with AI-guided practice sessions
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startInteractiveLearning}
                    disabled={!selectedImage || isProcessing}
                    className="p-6 bg-gradient-to-br from-green-600/90 to-blue-600/90 hover:from-green-700/90 hover:to-blue-700/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      {isProcessing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Bot className="w-6 h-6" />
                      )}
                      <span className="text-lg font-semibold">
                        {isProcessing ? 'Creating Session...' : 'Start Interactive Learning'}
                      </span>
                    </div>
                    <p className="text-sm text-green-100">
                      AI-guided practice with step-by-step questions and personalized feedback
                    </p>
                  </motion.button>

                  <div className="p-6 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <Target className="w-6 h-6 text-purple-400" />
                      <span className="text-lg font-semibold text-white">Alternative Options</span>
                    </div>
                    <div className="space-y-3">
                      <Link
                        href={`/satask?id=${encodeURIComponent(uploadedImageUrl || '')}`}
                        className="block w-full py-2 px-4 bg-purple-600/80 hover:bg-purple-700/80 text-white text-sm rounded-lg transition-colors text-center"
                      >
                        View with Chat Interface
                      </Link>
                      <Link
                        href={`/satbreakdown?id=${encodeURIComponent(uploadedImageUrl || '')}`}
                        className="block w-full py-2 px-4 bg-indigo-600/80 hover:bg-indigo-700/80 text-white text-sm rounded-lg transition-colors text-center"
                      >
                        Detailed Analysis View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Footer />
    </div>
  );
} 