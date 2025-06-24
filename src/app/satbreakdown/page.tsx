"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import Image from 'next/image';
import Link from 'next/link';
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  Play,
  Bot,
  User,
  LogOut,
  RefreshCw,
  Info,
  Maximize2,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  XCircle,
  CheckCircle,
  Target,
  Brain,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";
import { ShiningText } from "@/components/ui/shining-text";
import { RatingComponent } from "@/components/ratingComponent";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";

// Interfaces from page.tsx
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

interface SatQuestionData {
    questionId: string;
    imageUrl: string;
    aiResponse: string;
    questionText: string;
}

function SatBreakdown() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const questionId = searchParams.get('id') || '';

    // States for question data and breakdown
    const [question, setQuestion] = useState<SatQuestionData | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [summaryData, setSummaryData] = useState<{
        cruxOfProblem?: string;
        formulaeUsed?: string;
        termDefinitions?: string;
    } | null>(null);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isLoadingMainSteps, setIsLoadingMainSteps] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true); // Assuming dark mode is default
    const [showFullImage, setShowFullImage] = useState(false);
    
    const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fetchQuestionDetails = async (id: string) => {
        if (!id) return;
        try {
            const response = await fetch(`/api/sat?id=${encodeURIComponent(id)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch question details');
            }
            const data = await response.json();
            if (data.success && data.question) {
                setQuestion(data.question);
            } else {
                throw new Error(data.error || 'Question not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };
    
    const analyzeSatQuestion = async (id: string) => {
        if (!id) return;

        setIsLoadingSummary(true);
        setError(null);

        // Fetch summary
        try {
            const summaryResponse = await fetch("/api/sat/breakdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: id, type: "summary" }),
            });
            const summaryData: BreakdownResponse = await summaryResponse.json();
            if (summaryData.success && summaryData.data) {
                setSummaryData(summaryData.data);
            } else {
                console.error("Failed to get question summary:", summaryData.error);
            }
        } catch (err) {
            console.error("Network error getting summary:", err);
        }
        setIsLoadingSummary(false);
        setIsLoadingMainSteps(true);

        // Fetch main steps
        try {
            const mainStepsResponse = await fetch("/api/sat/breakdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: id, type: "main" }),
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
            setIsLoadingMainSteps(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (questionId) {
            setLoading(true);
            Promise.all([
                fetchQuestionDetails(questionId),
                analyzeSatQuestion(questionId)
            ]);
        } else {
            setError("No Question ID provided.");
            setLoading(false);
        }
    }, [questionId]);


    const handleGetSubSteps = async (stepId: string) => {
        const step = steps.find((s) => s.id === stepId);
        if (!step || !questionId) return;

        setSteps((prevSteps) =>
          prevSteps.map((s) =>
            s.id === stepId ? { ...s, isLoadingSubSteps: true } : s
          )
        );

        try {
            const response = await fetch("/api/sat/breakdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: questionId,
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

    const handleGetTheory = async (stepId: string, subStepId: string) => {
        const step = steps.find((s) => s.id === stepId);
        const subStep = step?.subSteps.find((s) => s.id === subStepId);
        if (!subStep || !questionId) return;

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
            const response = await fetch("/api/sat/breakdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: questionId,
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

    // Render logic
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading SAT question breakdown...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl">
                    <div className="flex items-center gap-2">
                        <XCircle size={18} />
                        <span className="text-base">{error}</span>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <Navbar 
                shareUrl={null}
                isCreatingShare={false}
                shareCopied={false}
                onCreateShare={() => {}}
                onCopyLink={() => {}}
                hasContent={steps.length > 0}
            />

            <main className="flex-1 pt-16">
                <div className="container mx-auto max-w-4xl p-6 space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">SAT Question Breakdown</h1>
                            <p className="text-muted-foreground mt-2">Question ID: {question?.questionId}</p>
                        </div>
                        <Link 
                            href={`/satask?id=${questionId}`}
                            className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition-colors flex items-center space-x-2`}
                        >
                            <ArrowLeft size={14} />
                            <span>Back to Question</span>
                        </Link>
                    </div>

                    {/* Question Image */}
                    {question?.imageUrl && (
                        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-lg">
                            <h2 className="text-2xl font-semibold mb-4">Question Image</h2>
                            <div className="relative h-64 w-full">
                                <Image
                                    src={question.imageUrl}
                                    alt={`SAT Question ${question.questionId}`}
                                    fill
                                    style={{ objectFit: "contain" }}
                                    className="rounded-lg"
                                />
                                <button
                                    onClick={() => setShowFullImage(true)}
                                    className="absolute bottom-2 right-2 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-gray-900 bg-opacity-80 text-white hover:bg-opacity-90 shadow-lg transition-all backdrop-blur-sm"
                                >
                                    <Maximize2 size={12} />
                                    <span>View Full Size</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Analytic Breakdown Display */}
                    <AnimatePresence>
                        {(summaryData || isLoadingSummary) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="mb-6 sm:mb-8"
                        >
                            {summaryData ? (
                            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 dark:from-slate-900/95 dark:to-slate-800/95 border border-slate-700/60 dark:border-slate-700/60 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                                <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-white">
                                    Analytic Breakdown
                                    </h3>
                                </div>
                                
                                <div className="space-y-5">
                                    {/* Crux of Problem */}
                                    <div>
                                    <h4 className="text-default font-semibold text-white mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4 text-blue-400" />
                                        Crux of the Problem:
                                    </h4>
                                    <SimpleMathRenderer
                                        content={summaryData.cruxOfProblem || "Not available"}
                                        className="text-slate-200 text-default leading-relaxed"
                                    />
                                    </div>

                                    {/* Formulae Used */}
                                    <div>
                                    <h4 className="text-default font-semibold text-white mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        Key Formulae & Principles:
                                    </h4>
                                    <SimpleMathRenderer
                                        content={summaryData.formulaeUsed || "Not available"}
                                        className="text-slate-200 text-default leading-relaxed"
                                    />
                                    </div>

                                    {/* Term Definitions */}
                                    <div>
                                    <h4 className="text-default font-semibold text-white mb-3 flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-blue-400" />
                                        Term Definitions:
                                    </h4>
                                    <SimpleMathRenderer
                                        content={summaryData.termDefinitions || "Not available"}
                                        className="text-slate-200 text-default leading-relaxed"
                                    />
                                    </div>
                                </div>
                                </div>
                            </div>
                            ) : (
                                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-6 backdrop-blur-sm shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span className="text-blue-700 dark:text-blue-300 text-sm">
                                            <ShiningText text="Understanding the question..." />
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Steps Display */}
                    <AnimatePresence>
                        {(steps.length > 0 || isLoadingMainSteps) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">
                                Step-by-Step Breakdown
                            </h2>
                            </div>
                            
                            {isLoadingMainSteps ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="animate-spin w-8 h-8 text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                {steps.map((step, stepIndex) => (
                                    <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: stepIndex * 0.1 }}
                                    className="border border-border/40 rounded-xl overflow-hidden bg-gradient-to-r from-card/50 to-card/30"
                                    >
                                    <div className="bg-gradient-to-r from-muted/30 to-muted/20 border-b border-border/30">
                                        <div className="p-4 flex items-start gap-2 cursor-pointer" onClick={() => handleStepClick(step.id)}>
                                        <motion.div
                                            animate={{ rotate: step.isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-1"
                                        >
                                            <ChevronRight size={16} />
                                        </motion.div>
                                        <div className="flex-1">
                                            <SimpleMathRenderer content={step.content} className="font-medium" />
                                        </div>
                                        {step.isLoadingSubSteps && <Loader2 className="animate-spin w-4 h-4" />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {step.isExpanded && step.subSteps.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="pl-8 pr-4 py-2 bg-card/40"
                                        >
                                            {step.subSteps.map((subStep) => (
                                            <div key={subStep.id} className="border-l-2 border-primary/20 pl-4 py-2 my-2">
                                                <div className="flex items-start gap-2 cursor-pointer" onClick={() => handleSubStepClick(step.id, subStep.id)}>
                                                <motion.div animate={{ rotate: subStep.isExpanded ? 90 : 0 }} className="mt-1">
                                                    <ChevronRight size={14} />
                                                </motion.div>
                                                <SimpleMathRenderer content={subStep.content} className="text-sm text-muted-foreground flex-1" />
                                                {subStep.isLoadingTheory && <Loader2 className="animate-spin w-4 h-4" />}
                                                </div>
                                                <AnimatePresence>
                                                {subStep.isExpanded && subStep.theory && (
                                                    <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="pl-6 pt-2"
                                                    >
                                                        <div className="p-3 bg-primary/5 border-l-2 border-primary/30 rounded-r-lg">
                                                            <SimpleMathRenderer content={subStep.theory} className="text-sm" />
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
                            )}
                        </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Interactive Learning Links */}
                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Continue Your Learning</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href={`/satbot?id=${encodeURIComponent(questionId || '')}`}
                                className={`flex-1 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors`}
                            >
                                <Bot size={18} />
                                <span>Chat with AI Tutor</span>
                            </Link>
                            
                            <Link
                                href={`/satask?id=${encodeURIComponent(questionId || '')}`}
                                className={`flex-1 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors`}
                            >
                                <Target size={18} />
                                <span>Practice with this Question</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            
            <AnimatePresence>
                {showFullImage && question?.imageUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowFullImage(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-card rounded-xl p-4 max-w-4xl max-h-[90vh] w-full overflow-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowFullImage(false)}
                                className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>
                            <img
                                src={question.imageUrl}
                                alt="Full Screen Question"
                                className="w-full rounded-lg"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
}

export default function SatBreakdownPage() {
    return (
        <Suspense>
            <SatBreakdown />
        </Suspense>
    );
}