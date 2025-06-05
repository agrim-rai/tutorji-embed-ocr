"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import {
  Brain,
  Target,
  Info,
  FileText,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Home,
  ImageIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  Clock,
  AlertTriangle,
  Plus,
  CheckCircle,
  User,
  Crown,
  LogOut,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";
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

interface ShareData {
  imageUrl: string;
  summaryData?: {
    cruxOfProblem?: string;
    formulaeUsed?: string;
    termDefinitions?: string;
  };
  breakdownData?: {
    steps?: Array<{
      id: number;
      title: string;
      description: string;
    }>;
  };
  createdAt: string;
}

/**
 * UserProfile Component for Share Page
 * Shows login prompt for unauthenticated users or account info for authenticated users
 */
const SharePageUserProfile: React.FC<{
  session: any;
  status: string;
}> = ({ session, status }) => {
  const [realTimeCredits, setRealTimeCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Handle user logout
  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  };

  // Handle direct Google sign in
  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  // Fetch user credits
  const fetchUserCredits = async () => {
    if (status !== "authenticated" || !session?.user?.email) return;

    try {
      setCreditsLoading(true);
      const response = await fetch("/api/user/credits");
      if (response.ok) {
        const data = await response.json();
        setRealTimeCredits(data.credits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Fetch credits on mount if authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserCredits();
    }
  }, [status]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (status === "unauthenticated") {
    return (
      <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Get the Full Experience
            </h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Sign in to create your own breakdowns and access AI tutoring
          </p>

          <button
            onClick={handleSignIn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2.5 font-medium transition-all duration-200 inline-flex items-center justify-center gap-2"
          >
            <User size={16} />
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  // For authenticated users, show profile with credits
  const user = session.user;
  const creditsRemaining = realTimeCredits !== null ? realTimeCredits : (user.credits !== undefined ? user.credits : 0);
  const totalCredits = 25;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
      <div className="space-y-3">
        {/* User Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {user.image ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border/50">
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-primary/10 text-primary">
                {user.name?.charAt(0) || "U"}
              </div>
            )}

            <div className="flex-grow min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {user.name || "User"}
                </h3>
                {user.accountType === "pro" && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center space-x-1">
                    <Crown size={8} />
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {creditsLoading ? "..." : `${creditsRemaining}/${totalCredits} credits`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button size="sm" variant="outline" className="text-xs">
                <Home className="mr-1 h-3 w-3" />
                Main App
              </Button>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Credits progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
          <div
            style={{ width: `${(creditsRemaining / totalCredits) * 100}%` }}
            className={`h-full transition-all duration-500 ${
              creditsRemaining <= 1 ? "bg-red-500" : "bg-primary"
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [showFullQuestion, setShowFullQuestion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Get share ID from params
  useEffect(() => {
    const getShareId = async () => {
      const { id } = await params;
      setShareId(id);
    };
    getShareId();
  }, [params]);

  // Fetch shared data
  useEffect(() => {
    const fetchShareData = async () => {
      if (!shareId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/share/${shareId}`);
        const result = await response.json();

        if (result.success) {
          setShareData(result.data);
          
          // Convert breakdown data to steps format
          if (result.data.breakdownData?.steps) {
            const convertedSteps = result.data.breakdownData.steps.map((step: any) => ({
              id: step.id.toString(),
              content: `${step.title}\n\n${step.description}`,
              subSteps: [],
              isExpanded: false,
              isLoadingSubSteps: false,
            }));
            setSteps(convertedSteps);
          }
        } else {
          setError(result.error || "Failed to load shared content");
        }
      } catch (err) {
        setError("Network error occurred");
        console.error("Error fetching share data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchShareData();
    }
  }, [shareId]);

  // Utility functions
  const generateUniqueId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const parseStepsFromContent = (content: string): string[] => {
    if (!content || !content.trim()) return [];

    const blocks = content.split("\n\n").filter((block) => block.trim());

    if (blocks.length > 1) {
      const completeSteps: string[] = [];
      let currentStep = "";

      for (const block of blocks) {
        const isStepStart = /^(Step|Sub-step)\s+\d+(\.\d+)?:/i.test(
          block.trim()
        );

        if (isStepStart && currentStep) {
          completeSteps.push(currentStep.trim());
          currentStep = block;
        } else if (isStepStart) {
          currentStep = block;
        } else {
          if (currentStep) {
            currentStep += "\n\n" + block;
          } else {
            currentStep = block;
          }
        }
      }

      if (currentStep) {
        completeSteps.push(currentStep.trim());
      }

      return completeSteps.length > 0
        ? completeSteps
        : blocks.map((block) => block.trim());
    }

    return [content.trim()];
  };

  const toggleStepExpansion = (stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, isExpanded: !step.isExpanded } : step
      )
    );
  };

  const toggleSubStepExpansion = (stepId: string, subStepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              subSteps: step.subSteps.map((subStep) =>
                subStep.id === subStepId
                  ? { ...subStep, isExpanded: !subStep.isExpanded }
                  : subStep
              ),
            }
          : step
      )
    );
  };

  // Step interaction functions
  const handleGetSubSteps = async (stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, isLoadingSubSteps: true } : step
      )
    );

    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

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

      const data = await response.json();

      if (data.success) {
        let newSubSteps: SubStep[] = [];

        // Handle new structured JSON response
        if (data.data?.subSteps) {
          newSubSteps = data.data.subSteps.map((subStep: any) => ({
            id: generateUniqueId(),
            content: `${subStep.title}\n\n${subStep.description}`,
            theory: undefined,
            isExpanded: false,
            isLoadingTheory: false,
          }));
        }
        // Fallback to old content parsing for backward compatibility
        else if (data.content) {
          const subStepContents = parseStepsFromContent(data.content);
          newSubSteps = subStepContents.map((content) => ({
            id: generateUniqueId(),
            content,
            theory: undefined,
            isExpanded: false,
            isLoadingTheory: false,
          }));
        }

        setSteps((prevSteps) =>
          prevSteps.map((step) =>
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
        console.error("Failed to get sub-steps:", data.error);
        setSteps((prevSteps) =>
          prevSteps.map((step) =>
            step.id === stepId ? { ...step, isLoadingSubSteps: false } : step
          )
        );
      }
    } catch (err) {
      console.error("Network error occurred:", err);
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === stepId ? { ...step, isLoadingSubSteps: false } : step
        )
      );
    }
  };

  const handleGetTheory = async (stepId: string, subStepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              subSteps: step.subSteps.map((subStep) =>
                subStep.id === subStepId
                  ? { ...subStep, isLoadingTheory: true }
                  : subStep
              ),
            }
          : step
      )
    );

    const step = steps.find((s) => s.id === stepId);
    const subStep = step?.subSteps.find((s) => s.id === subStepId);
    if (!subStep) return;

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

      const data = await response.json();

      if (data.success && data.content) {
        setSteps((prevSteps) =>
          prevSteps.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: step.subSteps.map((subStep) =>
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
        console.error("Failed to get theory explanation:", data.error);
        setSteps((prevSteps) =>
          prevSteps.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: step.subSteps.map((subStep) =>
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
      console.error("Network error occurred:", err);
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                subSteps: step.subSteps.map((subStep) =>
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

  const handleStepClick = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (step && step.subSteps.length > 0) {
      toggleStepExpansion(stepId);
    } else if (step && step.subSteps.length === 0 && !step.isLoadingSubSteps) {
      handleGetSubSteps(stepId);
    }
  };

  const handleSubStepClick = (stepId: string, subStepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    const subStep = step?.subSteps.find((s) => s.id === subStepId);
    if (subStep && subStep.theory) {
      toggleSubStepExpansion(stepId, subStepId);
    } else if (subStep && !subStep.theory && !subStep.isLoadingTheory) {
      handleGetTheory(stepId, subStepId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading shared content...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto max-w-4xl p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-destructive mb-2">
                  Content Not Found
                </h1>
                <p className="text-muted-foreground mb-6">
                  {error}
                </p>
                <Link href="/">
                  <Button>
                    <Home className="mr-2 h-4 w-4" />
                    Go Back Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm shadow-lg">
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Shared Problem Solution
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Interactive step-by-step breakdown with detailed explanations
            </p>
            
            {/* Share Info */}
            {shareData && (
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Shared on {formatDate(shareData.createdAt)}</span>
              </div>
            )}
          </motion.div>

          {/* User Profile / Login Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-md mx-auto"
          >
            <SharePageUserProfile session={session} status={status} />
          </motion.div>

          {/* Main Content */}
          {shareData && (
            <div className="space-y-6">
              {/* Top Section - Problem Image and Summary in Cards */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Problem Image - Takes 2 columns on large screens */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:col-span-2"
                >
                  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">
                        Problem Image
                      </h2>
                    </div>

                    {/* Image Display */}
                    <div className="border border-border/30 rounded-xl bg-muted/10 overflow-hidden relative shadow-inner">
                      <div className="h-[250px] sm:h-[300px] lg:h-[400px] relative">
                        <TransformWrapper
                          initialScale={1}
                          minScale={0.3}
                          maxScale={5}
                          centerOnInit={true}
                          wheel={{ step: 0.1 }}
                        >
                          {({ zoomIn, zoomOut, resetTransform }: any) => (
                            <>
                              {/* Zoom Controls */}
                              <div className="absolute top-3 right-3 z-10 flex gap-1 sm:gap-2">
                                <Button
                                  onClick={() => zoomIn()}
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 bg-background/95 backdrop-blur-sm hover:bg-background border-border/50 shadow-sm"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                                <Button
                                  onClick={() => zoomOut()}
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 bg-background/95 backdrop-blur-sm hover:bg-background border-border/50 shadow-sm"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                                <Button
                                  onClick={() => resetTransform()}
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 bg-background/95 backdrop-blur-sm hover:bg-background border-border/50 shadow-sm"
                                  title="Reset View"
                                >
                                  <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                                <Button
                                  onClick={() => setShowFullQuestion(true)}
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 bg-background/95 backdrop-blur-sm hover:bg-background border-border/50 shadow-sm"
                                  title="Full Screen"
                                >
                                  <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                              </div>
                              <TransformComponent
                                wrapperStyle={{
                                  width: "100%",
                                  height: "100%",
                                }}
                                contentStyle={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  src={shareData.imageUrl}
                                  alt="Shared Problem"
                                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    width: "auto",
                                    height: "auto",
                                  }}
                                />
                              </TransformComponent>
                            </>
                          )}
                        </TransformWrapper>
                      </div>
                    </div>

                    {/* Full Screen Button */}
                    <div className="mt-3">
                      <Button
                        onClick={() => setShowFullQuestion(true)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs sm:text-sm hover:bg-muted/50"
                      >
                        <Maximize2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        View Full Screen
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Analytic Breakdown - Takes 1 column on large screens */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  {shareData.summaryData && (
                    <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0 mt-0.5">
                          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                            Analytic Breakdown
                          </h3>
                          <div className="space-y-4">
                            {/* Crux of Problem */}
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                                Crux of the Problem:
                              </h4>
                              <SimpleMathRenderer
                                content={shareData.summaryData.cruxOfProblem || "Not available"}
                                className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm leading-relaxed ml-5"
                              />
                            </div>

                            {/* Formulae Used */}
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                Key Formulae & Principles:
                              </h4>
                              <SimpleMathRenderer
                                content={shareData.summaryData.formulaeUsed || "Not available"}
                                className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm leading-relaxed ml-5"
                              />
                            </div>

                            {/* Term Definitions */}
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                                Term Definitions:
                              </h4>
                              <SimpleMathRenderer
                                content={shareData.summaryData.termDefinitions || "Not available"}
                                className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm leading-relaxed ml-5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Step-by-Step Section */}
              {steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">
                        Step-by-Step Breakdown
                      </h2>
                    </div>

                    {/* Interactive Features Info */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/40 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-sm">
                          <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                            Interactive Learning Available
                          </p>
                          <p className="text-blue-700 dark:text-blue-300 text-xs">
                            Click on any step to get a detailed breakdown, then click on sub-steps to get theory explanations. No login required!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {steps.map((step, stepIndex) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: stepIndex * 0.1 }}
                          className="border border-border/40 rounded-xl overflow-hidden bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 step-container"
                        >
                          {/* Main Step */}
                          <div className="bg-gradient-to-r from-muted/30 to-muted/20 border-b border-border/30">
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <motion.button
                                  animate={{ rotate: step.isExpanded ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="mt-1 text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10 flex-shrink-0"
                                  disabled={
                                    step.subSteps.length === 0 &&
                                    !step.isLoadingSubSteps
                                  }
                                  onClick={() => handleStepClick(step.id)}
                                >
                                  <ChevronRight size={16} />
                                </motion.button>
                                <div
                                  className="flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => handleStepClick(step.id)}
                                >
                                  <SimpleMathRenderer
                                    content={step.content}
                                    className="text-foreground font-medium leading-relaxed break-words text-sm"
                                  />
                                </div>
                                {/* Action button */}
                                <div className="flex-shrink-0 self-start">
                                  <button
                                    onClick={() => handleGetSubSteps(step.id)}
                                    disabled={
                                      step.isLoadingSubSteps ||
                                      step.subSteps.length > 0
                                    }
                                    className="bg-primary/10 hover:bg-primary/20 disabled:bg-muted/50 text-primary disabled:text-muted-foreground px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-primary/20 disabled:border-muted/30 whitespace-nowrap shadow-sm"
                                  >
                                    {step.isLoadingSubSteps ? (
                                      <Loader2 className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                                    ) : step.subSteps.length > 0 ? (
                                      <CheckCircle size={14} />
                                    ) : (
                                      <Plus size={14} />
                                    )}
                                    <span className="hidden sm:inline">
                                      {step.subSteps.length > 0
                                        ? "Expanded"
                                        : "Further Breakdown"}
                                    </span>
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
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                {step.subSteps.map((subStep, subStepIndex) => (
                                  <motion.div
                                    key={subStep.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: subStepIndex * 0.05,
                                    }}
                                    className="border-b border-border/30 last:border-b-0 step-container"
                                  >
                                    {/* Sub Step Header */}
                                    <div className="bg-gradient-to-r from-card/40 to-card/20">
                                      <div className="p-4 pl-8">
                                        <div className="flex items-start gap-3">
                                          <motion.button
                                            animate={{
                                              rotate: subStep.isExpanded ? 90 : 0,
                                            }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-1 text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10 flex-shrink-0"
                                            disabled={
                                              !subStep.theory &&
                                              !subStep.isLoadingTheory
                                            }
                                            onClick={() =>
                                              handleSubStepClick(
                                                step.id,
                                                subStep.id
                                              )
                                            }
                                          >
                                            <ChevronRight size={14} />
                                          </motion.button>
                                          <div
                                            className="flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
                                            onClick={() =>
                                              handleSubStepClick(
                                                step.id,
                                                subStep.id
                                              )
                                            }
                                          >
                                            <SimpleMathRenderer
                                              content={subStep.content}
                                              className="text-muted-foreground leading-relaxed break-words text-sm"
                                            />
                                          </div>
                                          {/* Theory button */}
                                          <div className="flex-shrink-0 self-start">
                                            <button
                                              onClick={() =>
                                                handleGetTheory(step.id, subStep.id)
                                              }
                                              disabled={
                                                subStep.isLoadingTheory ||
                                                !!subStep.theory
                                              }
                                              className="bg-secondary/40 hover:bg-secondary/60 disabled:bg-muted/30 text-secondary-foreground disabled:text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border border-secondary/20 disabled:border-muted/20 whitespace-nowrap shadow-sm"
                                            >
                                              {subStep.isLoadingTheory ? (
                                                <Loader2 className="animate-spin w-3 h-3" />
                                              ) : subStep.theory ? (
                                                <CheckCircle size={12} />
                                              ) : (
                                                <FileText size={12} />
                                              )}
                                              <span className="hidden sm:inline">
                                                {subStep.theory
                                                  ? "Theory Loaded"
                                                  : "Get Explanation"}
                                              </span>
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
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-4 pl-12 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary/40">
                                            <div className="bg-card/60 rounded-xl p-4 border border-border/40 shadow-inner">
                                              <SimpleMathRenderer
                                                content={subStep.theory}
                                                className="text-muted-foreground leading-relaxed text-sm"
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
                  </div>
                </motion.div>
              )}

              {/* Call to Action */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50/90 to-blue-50/90 dark:from-green-950/30 dark:to-blue-950/30 rounded-2xl border-2 border-green-200/60 dark:border-green-800/40 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full">
                        <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-400">
                        Want to solve your own problems?
                      </h3>
                    </div>

                    <p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
                      Create your own step-by-step breakdowns and get personalized AI tutoring for any problem!
                    </p>

                    <Link href="/">
                      <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <Home className="mr-2 h-4 w-4" />
                        Try It Yourself
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Full Screen Question Modal */}
          <AnimatePresence>
            {showFullQuestion && shareData && (
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
                    <h3 className="text-xl font-semibold">Shared Problem</h3>
                    <Button
                      onClick={() => setShowFullQuestion(false)}
                      variant="outline"
                      size="icon"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={shareData.imageUrl}
                    alt="Full Screen Shared Problem"
                    className="w-full rounded-lg"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
