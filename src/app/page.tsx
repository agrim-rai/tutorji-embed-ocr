"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
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
  RotateCw,
  Crop as CropIcon,
  Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { SimpleMathRenderer } from "@/components/ui/simple-math-renderer";
import { ShiningText } from "@/components/ui/shining-text";
import { ResponseStream } from "@/components/ui/response-stream";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import dynamic from "next/dynamic";
import Link from "next/link";

// Lazy load the SplineSceneBasic component with SSR disabled and error handling
const SplineSceneBasic = dynamic(
  () =>
    import("@/components/robotui").then((mod) => ({
      default: mod.SplineSceneBasic,
    })),
  {
    ssr: false,
    loading: () => null, // No loading placeholder since it won't show on mobile anyway
  }
);

// Error boundary component for the robot UI
const RobotUIWrapper: React.FC = () => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false); // Reset error state when component mounts
  }, []);

  if (hasError) {
    return null; // Fail silently for robot UI
  }

  try {
    return <SplineSceneBasic />;
  } catch (error) {
    console.warn("Robot UI failed to load:", error);
    setHasError(true);
    return null;
  }
};

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
  };
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

// Add new interface for streaming messages
interface StreamingMessage {
  id: string;
  content: string;
  timestamp: number;
}

/**
 * UserProfile Component
 *
 * Displays the current user's information and credits status
 * Shows upgrade option for free users and authentication status
 */
const UserProfile: React.FC<{
  session: any;
  darkMode?: boolean;
  realTimeCredits?: number | null;
  creditsLoading?: boolean;
  onRefreshCredits?: () => void;
}> = ({
  session,
  darkMode = false,
  realTimeCredits,
  creditsLoading,
  onRefreshCredits,
}) => {
  // Check if user is authenticated
  const isAuthenticated = !!session?.user;

  // Handle user logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Handle direct Google sign in
  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div
        className={`p-3 ${
          darkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-gray-50 border-gray-200"
        } border rounded-lg backdrop-blur-sm`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <User size={16} />
          </div>

          <div className="flex-grow">
            <h3
              className={`text-sm font-medium ${
                darkMode ? "text-gray-200" : "text-gray-900"
              }`}
            >
              Guest User
            </h3>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Sign in to access AI features
            </p>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          className={`mt-3 w-full py-2 rounded-lg text-sm font-medium ${
            darkMode
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-indigo-500 hover:bg-indigo-600 text-white"
          } transition-colors flex items-center justify-center`}
        >
          <User className="mr-2" size={14} />
          Sign In
        </button>
      </div>
    );
  }

  // For authenticated users, show compact profile with credits
  const user = session.user;
  // Use real-time credits if available, otherwise fall back to session credits
  const creditsRemaining =
    realTimeCredits !== null
      ? realTimeCredits
      : user.credits !== undefined
      ? user.credits
      : 0;
  const totalCredits = 25; // This could be made dynamic in the future

  return (
    <div
      className={`p-3 ${
        darkMode
          ? "bg-gray-800/50 border-gray-700"
          : "bg-gray-50 border-gray-200"
      } border rounded-lg backdrop-blur-sm`}
    >
      {/* Compact user profile header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {user.image ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500">
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                darkMode
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-500 text-white"
              }`}
            >
              {user.name?.charAt(0) || "U"}
            </div>
          )}

          <div className="flex-grow min-w-0">
            <div className="flex items-center space-x-1">
              <h3
                className={`text-sm font-medium truncate ${
                  darkMode ? "text-gray-200" : "text-gray-900"
                }`}
              >
                {user.name || "User"}
              </h3>
              {user.accountType === "pro" && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    darkMode
                      ? "bg-yellow-800 text-yellow-300"
                      : "bg-yellow-100 text-yellow-800"
                  } flex items-center space-x-1`}
                >
                  <Crown size={8} />
                  <span>PRO</span>
                </span>
              )}
            </div>
            <p
              className={`text-xs truncate ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {user.email}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`p-1.5 rounded-lg text-xs font-medium ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          } transition-colors flex items-center`}
          title="Logout"
        >
          <LogOut size={12} />
        </button>
      </div>

      {/* Compact credits display */}
      <div
        className={`mt-2 p-2 rounded ${
          darkMode ? "bg-gray-700/50" : "bg-white/80"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <span
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Credits
            </span>
            {onRefreshCredits && (
              <button
                onClick={onRefreshCredits}
                disabled={creditsLoading}
                className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                  creditsLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Refresh credits"
              >
                <RefreshCw
                  size={10}
                  className={`${creditsLoading ? "animate-spin" : ""} ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </button>
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              creditsRemaining <= 1
                ? "text-red-500"
                : darkMode
                ? "text-indigo-400"
                : "text-indigo-600"
            }`}
          >
            {creditsLoading ? "..." : `${creditsRemaining}/${totalCredits}`}
          </span>
        </div>

        {/* Compact credits progress bar */}
        <div
          className={`w-full h-1.5 rounded-full overflow-hidden ${
            darkMode ? "bg-gray-600" : "bg-gray-200"
          }`}
        >
          <div
            style={{ width: `${(creditsRemaining / totalCredits) * 100}%` }}
            className={`h-full transition-all duration-500 ${
              creditsRemaining <= 1
                ? "bg-red-500"
                : darkMode
                ? "bg-indigo-500"
                : "bg-indigo-500"
            }`}
          ></div>
        </div>

        {/* Credits reset notice for free users with no credits */}
        {user.accountType === "free" && creditsRemaining === 0 && (
          <div
            className={`mt-1 text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            } text-center`}
          >
            Resets in 24h
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [questionSummary, setQuestionSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Interactive learning states
  const [botResult, setBotResult] = useState<BotResult | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [showFullQuestion, setShowFullQuestion] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );

  // Add new states for streaming and layout
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessages, setStreamingMessages] = useState<
    StreamingMessage[]
  >([]);
  const [showDesktopLayout, setShowDesktopLayout] = useState(false);

  // General states
  const [error, setError] = useState("");
  const [realTimeCredits, setRealTimeCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Clipboard and focus states
  const [isUploadAreaFocused, setIsUploadAreaFocused] = useState(false);
  const [clipboardFocused, setClipboardFocused] = useState(false);

  // Camera and crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle direct Google sign in
  const handleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

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

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch user credits
  const fetchUserCredits = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.email) return;

    try {
      setCreditsLoading(true);
      const response = await fetch("/api/user/credits");
      if (response.ok) {
        const data = await response.json();
        setRealTimeCredits(data.credits);

        // Update session object with latest credits for immediate UI updates
        if (session?.user) {
          (session.user as any).credits = data.credits;
        }
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setCreditsLoading(false);
    }
  }, [status, session?.user?.email, session?.user]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserCredits();
    }
  }, [status, fetchUserCredits]);

  // Set up periodic credit refresh every 30 seconds
  useEffect(() => {
    if (status !== "authenticated") return;

    const intervalId = setInterval(() => {
      fetchUserCredits();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [status, fetchUserCredits]); // Add fetchUserCredits to dependency array

  // Manual refresh on window focus (when user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (status === "authenticated") {
        fetchUserCredits();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [status, fetchUserCredits]); // Add fetchUserCredits to dependency array

  // Utility functions
  const generateUniqueId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

  const getQuestionSummary = async () => {
    if (!selectedImage) return;

    setQuestionSummary(null);

    try {
      const imageBase64 = await convertImageToBase64(selectedImage);

      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageBase64,
          type: "summary",
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success && data.content) {
        setQuestionSummary(data.content);
      } else {
        console.error("Failed to get question summary:", data.error);
        // Don't show error for summary failure, just continue without it
      }
    } catch (err) {
      console.error("Network error getting summary:", err);
      // Don't show error for summary failure, just continue without it
    }
  };

  // Image handling functions
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setSelectedImage(file);
    setSteps([]);
    setBotResult(null);
    setProcessedData(null);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For mobile, show crop modal like camera capture
      if (isMobile) {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageSrc = e.target?.result as string;
            setCropImageSrc(imageSrc);
            setRotationAngle(0); // Reset rotation angle for new image
            setShowCropModal(true);
          };
          reader.readAsDataURL(file);
        } else {
          setError("Please select a valid image file");
        }
      } else {
        // For desktop, process directly as before
        handleImageUpload(file);
      }
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

  /**
   * Handle camera capture for mobile devices
   */
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        setCropImageSrc(imageSrc);
        setRotationAngle(0); // Reset rotation angle for new image
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError("Please capture a valid image file");
    }
  };

  /**
   * Trigger camera input
   */
  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  /**
   * Generate canvas from crop with rotation
   */
  const generateCroppedImage = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      return new Promise((resolve, reject) => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) {
            reject(new Error("Canvas not available"));
            return;
          }

          const scaleX = image.naturalWidth / image.width;
          const scaleY = image.naturalHeight / image.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // Set canvas dimensions based on crop
          const cropWidth = crop.width * scaleX;
          const cropHeight = crop.height * scaleY;

          // When rotating by 90 or 270 degrees, swap width and height
          const isRotated90or270 =
            rotationAngle === 90 || rotationAngle === 270;
          canvas.width = isRotated90or270 ? cropHeight : cropWidth;
          canvas.height = isRotated90or270 ? cropWidth : cropHeight;

          // Clear canvas and translate to center for rotation
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotationAngle * Math.PI) / 180);

          // Draw the image with correct position adjustment for rotation
          ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            cropWidth,
            cropHeight,
            -cropWidth / 2,
            -cropHeight / 2,
            cropWidth,
            cropHeight
          );

          ctx.restore();

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const file = new File([blob], "cropped-image.jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(file);
              } else {
                reject(new Error("Failed to generate blob from canvas"));
              }
            },
            "image/jpeg",
            0.9
          );
        } catch (error) {
          reject(error);
        }
      });
    },
    [rotationAngle] // Add rotationAngle to dependency array
  );

  /**
   * Handle crop completion and image processing
   */
  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const croppedFile = await generateCroppedImage(
        imgRef.current,
        completedCrop
      );
      handleImageUpload(croppedFile);
      setShowCropModal(false);
      setCropImageSrc(null);
    } catch (error) {
      console.error("Crop operation failed:", error);
      setError("Failed to crop image. Please try again.");
    }
  };

  /**
   * Cancel crop operation
   */
  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
    // Reset camera input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  /**
   * Handle rotation of the image
   */
  const rotateImage = () => {
    // Rotate 90 degrees clockwise each time
    setRotationAngle((prevAngle) => (prevAngle + 90) % 360);
  };

  /**
   * Reset rotation angle
   */
  const resetRotation = () => {
    setRotationAngle(0);
  };

  /**
   * Handle clipboard paste functionality
   */
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!isUploadAreaFocused && !clipboardFocused) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
            event.preventDefault();
            break;
          }
        }
      }
    },
    [isUploadAreaFocused, clipboardFocused]
  );

  const handleUploadAreaClick = () => {
    setIsUploadAreaFocused(true);
    uploadAreaRef.current?.focus();
  };

  const handleUploadAreaBlur = () => {
    setIsUploadAreaFocused(false);
  };

  const handleClipboardAreaClick = () => {
    setClipboardFocused(true);
    // Keep the previous focus handler for upload area
    setIsUploadAreaFocused(false);
    // Focus the clipboard area element to ensure paste events work
    if (uploadAreaRef.current) {
      uploadAreaRef.current.focus();
    }
  };

  const handleClipboardAreaBlur = () => {
    setClipboardFocused(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // Add global paste event listener
  React.useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      handlePaste(event);
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => {
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [isUploadAreaFocused, clipboardFocused, handlePaste]); // Add proper dependency array

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSteps([]);
    setBotResult(null);
    setProcessedData(null);
    setError("");
    setShowIframe(false);
    setShowCropModal(false);
    setCropImageSrc(null);
    setCompletedCrop(null);
    setRotationAngle(0);
    setShareUrl(null);
    setShareCopied(false);
    setIsStreaming(false);
    setStreamingMessages([]);
    setShowDesktopLayout(false);
    setQuestionSummary(null);
    setIsLoadingSummary(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  // Step analysis function
  const analyzeImageSteps = async () => {
    if (!selectedImage) {
      setError("Please upload an image first");
      return;
    }

    if (status === "unauthenticated") {
      setError("You need to sign in to use this feature");
      return;
    }

    const currentCredits =
      realTimeCredits !== null ? realTimeCredits : session?.user?.credits ?? 0;
    if (currentCredits <= 0) {
      setError(
        "No credits remaining. Please upgrade your account or wait for credits to reset."
      );
      return;
    }

    // Start loading immediately when button is clicked
    setIsLoadingSummary(true);
    setError("");
    setSteps([]);

    // Deduct one credit first
    try {
      const deductResponse = await fetch("/api/user/credits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1 }),
      });

      const deductResult = await deductResponse.json();

      if (!deductResponse.ok) {
        setError(deductResult.error || "Failed to deduct credit");
        setIsLoadingSummary(false);
        return;
      }

      // Update real-time credits
      setRealTimeCredits(deductResult.credits);
    } catch (err) {
      setError("Failed to process credit deduction");
      setIsLoadingSummary(false);
      return;
    }

    // First get the question summary
    await getQuestionSummary();

    // Then transition to main steps loading
    setIsLoadingSummary(false);
    setIsLoadingMainSteps(true);

    try {
      const imageBase64 = await convertImageToBase64(selectedImage);

      const response = await fetch("/api/breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageBase64,
          type: "main",
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success) {
        let newSteps: Step[] = [];

        // Handle new structured JSON response
        if (data.data?.steps) {
          newSteps = data.data.steps.map((step) => ({
            id: generateUniqueId(),
            content: `${step.title}\n\n${step.description}`,
            subSteps: [],
            isExpanded: false,
            isLoadingSubSteps: false,
          }));
        }
        // Fallback to old content parsing for backward compatibility
        else if (data.content) {
          const stepContents = parseStepsFromContent(data.content);
          newSteps = stepContents.map((content) => ({
            id: generateUniqueId(),
            content,
            subSteps: [],
            isExpanded: false,
            isLoadingSubSteps: false,
          }));
        }

        setSteps(newSteps);

        // Update credits
        await fetchUserCredits();
      } else {
        setError(data.error || "Failed to analyze the image");
      }
    } catch (err) {
      setError("Network error occurred or failed to process image");
    } finally {
      setIsLoadingMainSteps(false);
    }
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

      const data: BreakdownResponse = await response.json();

      if (data.success) {
        let newSubSteps: SubStep[] = [];

        // Handle new structured JSON response
        if (data.data?.subSteps) {
          newSubSteps = data.data.subSteps.map((subStep) => ({
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
        setError(data.error || "Failed to get sub-steps");
        setSteps((prevSteps) =>
          prevSteps.map((step) =>
            step.id === stepId ? { ...step, isLoadingSubSteps: false } : step
          )
        );
      }
    } catch (err) {
      setError("Network error occurred");
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

      const data: BreakdownResponse = await response.json();

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
        setError(data.error || "Failed to get theory explanation");
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
      setError("Network error occurred");
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

  // Interactive learning functions with streaming
  const startInteractiveLearningWithStreaming = async () => {
    if (!selectedImage || steps.length === 0) {
      setError("Please analyze the image first to generate steps");
      return;
    }

    // Start streaming and API call simultaneously
    setIsStreaming(true);
    setStreamingMessages([]);
    setError("");
    setProcessing(true);

    const streamingTexts = [
      "Analyzing image content and mathematical expressions...",
      "Identifying key problem components and variable relationships...",
      "Processing question structure and determining solution pathway...",
      "Generating adaptive learning framework for personalized guidance...",
      "Calibrating interactive response system for optimal learning experience...",
      "Finalizing AI tutor configuration and knowledge base integration...",
      "Establishing secure learning session and preparing interface...",
    ];

    // Start API call immediately
    const apiPromise = (async () => {
      try {
        // Step 0: Add one credit to compensate for the deduction in process-image API
        await fetch("/api/user/credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: 1 }),
        });

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

        // Update credits
        if (result.creditsRemaining !== undefined) {
          setRealTimeCredits(result.creditsRemaining);
        }

        await fetchUserCredits();

        return {
          chatbotLink: chatbotResult.chatbotLink,
          sessionId: chatbotResult.sessionId,
        };
      } catch (err) {
        throw err;
      }
    })();

    // Start streaming messages with cancellation support
    const streamingPromise = (async () => {
      for (let i = 0; i < streamingTexts.length; i++) {
        // Check if API has finished
        const apiFinished = await Promise.race([
          apiPromise.then(() => true),
          new Promise((resolve) => setTimeout(() => resolve(false), 10)),
        ]);

        if (apiFinished) {
          break; // Stop streaming if API finished
        }

        const delay = i === 0 ? 800 : i < 3 ? 1200 : 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        setStreamingMessages((prev) => [
          ...prev,
          {
            id: `msg-${i}`,
            content: streamingTexts[i],
            timestamp: Date.now(),
          },
        ]);
      }
    })();

    // Wait for API to complete (streaming will stop automatically when API finishes)
    try {
      const result = await apiPromise;

      // Stop streaming and show success
      setIsStreaming(false);
      setBotResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start interactive learning"
      );
      setIsStreaming(false);
    } finally {
      setProcessing(false);
    }
  };

  const launchDesktopLayout = () => {
    if (!isMobile) {
      setShowDesktopLayout(true);
    }
    setShowIframe(true);
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

  // Show login wall if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For unauthenticated users, show different layouts for desktop vs mobile
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto max-w-7xl p-6 space-y-8">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">
                  Interactive Learning Assistant
                </h1>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Upload a problem image, get step-by-step breakdown, and learn
                interactively with AI guidance
              </p>
            </motion.div>

            {isMobile ? (
              /* Mobile: Login box only */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-card rounded-xl p-6 border shadow-sm text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">
                      AI Step-by-Step Learning
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Break down complex problems into manageable steps with
                      interactive AI guidance
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Sparkles size={14} />
                      <span>Advanced Learning Features:</span>
                    </div>
                    <ul className="text-xs space-y-1 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>AI-powered step breakdown</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>Interactive sub-step exploration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>Theory explanations on demand</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>Personalized AI tutoring chat</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>25 free credits to get started</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleSignIn}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-3 font-medium transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    Sign In to Start Learning
                  </button>

                  <p className="text-xs text-muted-foreground">
                    Sign in with Google • Get started instantly
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Desktop: Robot UI + Login box side by side */
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Animated Bot */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <RobotUIWrapper />
                </motion.div>

                {/* Right: Login and info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="space-y-6 flex flex-col justify-center"
                >
                  <div className="bg-card rounded-xl p-6 border shadow-sm space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Brain className="w-8 h-8 text-primary" />
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold">
                          AI Step-by-Step Learning
                        </h2>
                        <p className="text-muted-foreground">
                          Transform complex problems into digestible steps with
                          our advanced AI learning assistant
                        </p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg text-left">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <Sparkles size={16} />
                          <span>What you get with Interactive Learning:</span>
                        </div>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>
                              Intelligent problem breakdown into steps
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Interactive sub-step exploration</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Theory explanations on demand</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Personalized AI tutoring sessions</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>25 free credits to get started</span>
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={handleSignIn}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-3 font-medium transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <User size={18} />
                        Sign In to Start Learning
                      </button>

                      <p className="text-xs text-muted-foreground">
                        Sign in with Google to get started instantly
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
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
              Upload a problem image, get step-by-step breakdown, and learn
              interactively with AI guidance
            </p>
          </motion.div>

          {/* User Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-md mx-auto"
          >
            <UserProfile
              session={session}
              darkMode={isDarkMode}
              realTimeCredits={realTimeCredits}
              creditsLoading={creditsLoading}
              onRefreshCredits={fetchUserCredits}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div
            className={`grid gap-8 ${
              isMobile ? "grid-cols-1" : "lg:grid-cols-2"
            }`}
          >
            {/* Left Side - Animated Bot (Desktop only) */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-6 order-1 lg:order-1"
              >
                {/* Animated Bot - Desktop only */}
                <div className="block">
                  <RobotUIWrapper />
                </div>
              </motion.div>
            )}

            {/* Right Side - Upload Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: isMobile ? 0 : 0.2,
              }}
              className={`space-y-6 ${
                isMobile ? "order-1" : "order-2 lg:order-2"
              }`}
            >
              {/* Image Upload Section */}
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg h-[580px] flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-semibold text-card-foreground">
                    Upload Problem Image
                  </h2>
                </div>

                {/* Image Upload Area */}
                <div className="flex-1 flex flex-col">
                  {imagePreview ? (
                    <div className="space-y-4 h-full flex flex-col justify-center border-2 border-dashed rounded-lg p-6 text-center transition-all bg-muted/30">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-md object-contain"
                      />
                      <p className="text-sm text-muted-foreground">
                        {selectedImage?.name} (
                        {((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)}{" "}
                        MB)
                      </p>
                      {/* <button
                        onClick={removeImage}
                        className="mt-2 px-4 py-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-lg transition-colors"
                      >
                        <X className="inline mr-2 h-4 w-4" />
                        Remove Image
                      </button> */}
                    </div>
                  ) : (
                    <>
                      {isMobile ? (
                        /* Mobile: Two buttons layout with crop and rotate options */
                        <div className="flex-1 flex flex-col gap-4 justify-center">
                          {/* Take Photo Button - Larger */}
                          <button
                            onClick={triggerCameraInput}
                            className="flex flex-col items-center gap-3 p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl transition-all hover:from-primary/15 hover:to-primary/10 hover:border-primary/40 active:scale-95"
                          >
                            <div className="p-4 bg-primary/10 rounded-full">
                              <Camera className="w-10 h-10 text-primary" />
                            </div>
                            <div className="text-center">
                              <h3 className="text-xl font-semibold text-foreground">
                                Take Photo
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Capture, crop & rotate question
                              </p>
                            </div>
                          </button>

                          {/* Upload Button - Smaller */}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-3 p-4 bg-muted/30 border-2 border-dashed border-border rounded-lg transition-all hover:border-primary/50 hover:bg-muted/40"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                Upload Image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Select, crop & rotate
                              </p>
                            </div>
                          </button>

                          {/* Hidden inputs */}
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
                            onChange={handleCameraCapture}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        /* Desktop: Split upload and paste areas */
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          {/* Upload Area */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer bg-muted/30 flex flex-col justify-center hover:border-primary/50 hover:bg-primary/5"
                            role="button"
                            aria-label="Upload image area - click to select file"
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />

                            <div className="space-y-4">
                              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                              <div>
                                <p className="text-lg font-medium">
                                  Upload Image
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Click to browse or drag & drop
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Paste Area */}
                          <div
                            ref={uploadAreaRef}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={handleClipboardAreaClick}
                            onBlur={handleClipboardAreaBlur}
                            onKeyDown={handleKeyDown}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer bg-muted/30 flex flex-col justify-center outline-none ${
                              clipboardFocused
                                ? "border-primary/70 bg-primary/5 ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            }`}
                            tabIndex={0}
                            role="button"
                            aria-label="Paste image area - click and paste from clipboard"
                          >
                            <div className="space-y-4">
                              <Clipboard className="w-12 h-12 text-muted-foreground mx-auto" />
                              <div>
                                <p className="text-lg font-medium">
                                  Paste from Clipboard
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Click here and press{" "}
                                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                    {navigator.platform.indexOf("Mac") > -1
                                      ? "Cmd+V"
                                      : "Ctrl+V"}
                                  </kbd>
                                </p>
                                {clipboardFocused && (
                                  <p className="text-xs text-primary font-medium mt-2">
                                    Ready for paste! Press{" "}
                                    {navigator.platform.indexOf("Mac") > -1
                                      ? "Cmd+V"
                                      : "Ctrl+V"}{" "}
                                    now
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {session && (
                            <div className="col-span-2 text-center">
                              <span className="text-xs text-muted-foreground">
                                <span className="font-medium">
                                  1 credit will be used
                                </span>{" "}
                                for each question breakdown. You have{" "}
                                {realTimeCredits !== null
                                  ? realTimeCredits
                                  : session.user.credits ?? 0}{" "}
                                credits remaining.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action Button */}
                {imagePreview && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={analyzeImageSteps}
                      disabled={
                        isLoadingMainSteps ||
                        isLoadingSummary ||
                        (realTimeCredits !== null
                          ? realTimeCredits
                          : session?.user?.credits ?? 0) <= 0
                      }
                      className="flex-1"
                      size="lg"
                    >
                      {isLoadingSummary ? (
                        <ShiningText text="Understanding question..." />
                      ) : isLoadingMainSteps ? (
                        <ShiningText text="AI is analyzing..." />
                      ) : (realTimeCredits !== null
                          ? realTimeCredits
                          : session?.user?.credits ?? 0) <= 0 ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          No Credits Remaining
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze & Break Down Steps
                        </>
                      )}
                    </Button>

                    <Button onClick={removeImage} variant="outline" size="lg">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

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
                  <XCircle
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Summary Display */}
          <AnimatePresence>
            {(questionSummary || isLoadingSummary || isLoadingMainSteps) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-6 mb-6 sm:mb-8 backdrop-blur-sm shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0 mt-0.5">
                    {isLoadingSummary ? (
                      <Loader2 className="animate-spin w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Crux of the Question
                    </h3>
                    {isLoadingSummary ? (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 dark:text-blue-300 text-sm">
                          <ShiningText text="Understanding the question..." />
                        </span>
                      </div>
                    ) : questionSummary ? (
                      <div className="prose prose-sm prose-blue dark:prose-invert max-w-none">
                        <SimpleMathRenderer
                          content={questionSummary}
                          className="text-blue-800 dark:text-blue-200 leading-relaxed"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Credits Notice */}
          {session?.user &&
            (realTimeCredits !== null
              ? realTimeCredits
              : session.user.credits ?? 0) <= 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 text-sm bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800 mb-1">
                      No Credits Remaining
                    </h4>
                    <p className="text-yellow-700 mb-3">
                      You've used all your credits for this account. Get more
                      credits to continue using the AI Step Breakdown feature.
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href="/features/premium"
                        className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded hover:bg-yellow-700 transition-colors"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          {/* Steps Display */}
          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg mb-6 sm:mb-8 ${
                  showDesktopLayout ? "hidden md:block" : ""
                }`}
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
                              disabled={
                                step.subSteps.length === 0 &&
                                !step.isLoadingSubSteps
                              }
                              onClick={() => handleStepClick(step.id)}
                            >
                              <ChevronRight
                                size={18}
                                className="sm:w-5 sm:h-5"
                              />
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
                                disabled={
                                  step.isLoadingSubSteps ||
                                  step.subSteps.length > 0
                                }
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
                                disabled={
                                  step.isLoadingSubSteps ||
                                  step.subSteps.length > 0
                                }
                                className="bg-primary/10 hover:bg-primary/20 disabled:bg-muted text-primary disabled:text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-primary/20 disabled:border-muted whitespace-nowrap"
                              >
                                {step.isLoadingSubSteps ? (
                                  <Loader2 className="animate-spin w-4 h-4" />
                                ) : step.subSteps.length > 0 ? (
                                  <CheckCircle
                                    size={14}
                                    className="sm:w-4 sm:h-4"
                                  />
                                ) : (
                                  <Plus size={14} className="sm:w-4 sm:h-4" />
                                )}
                                {step.subSteps.length > 0
                                  ? "Expanded"
                                  : "Further Breakdown"}
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
                                className="border-b border-border/50 last:border-b-0 step-container"
                              >
                                {/* Sub Step Header */}
                                <div className="bg-card/20">
                                  <div className="p-3 sm:p-4 md:p-6 pl-6 sm:pl-8 md:pl-12">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                      <motion.button
                                        animate={{
                                          rotate: subStep.isExpanded ? 90 : 0,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-0.5 sm:mt-1 text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0"
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
                                        <ChevronRight
                                          size={16}
                                          className="sm:w-[18px] sm:h-[18px]"
                                        />
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
                                          className="text-muted-foreground leading-relaxed break-words text-sm sm:text-base"
                                        />
                                      </div>
                                      {/* Mobile: Compact theory button */}
                                      <div className="flex-shrink-0 self-start sm:hidden">
                                        <button
                                          onClick={() =>
                                            handleGetTheory(step.id, subStep.id)
                                          }
                                          disabled={
                                            subStep.isLoadingTheory ||
                                            !!subStep.theory
                                          }
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
                                          onClick={() =>
                                            handleGetTheory(step.id, subStep.id)
                                          }
                                          disabled={
                                            subStep.isLoadingTheory ||
                                            !!subStep.theory
                                          }
                                          className="bg-secondary/50 hover:bg-secondary/70 disabled:bg-muted text-secondary-foreground disabled:text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-secondary/20 disabled:border-muted whitespace-nowrap"
                                        >
                                          {subStep.isLoadingTheory ? (
                                            <Loader2 className="animate-spin w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                                          ) : subStep.theory ? (
                                            <CheckCircle
                                              size={12}
                                              className="sm:w-[14px] sm:h-[14px]"
                                            />
                                          ) : (
                                            <FileText
                                              size={12}
                                              className="sm:w-[14px] sm:h-[14px]"
                                            />
                                          )}
                                          {subStep.theory
                                            ? "Theory Loaded"
                                            : "Get Explanation"}
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

                {/* Interactive Learning Button - CENTERED */}
                {steps.length > 0 && !botResult && !isStreaming && (
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

                      <p className="text-muted-foreground text-center">
                        Now that you have the step breakdown, launch the AI
                        tutor for personalized guidance through the solution!
                      </p>

                      <div className="flex justify-center">
                        <button
                          onClick={startInteractiveLearningWithStreaming}
                          disabled={
                            processing ||
                            (realTimeCredits !== null
                              ? realTimeCredits
                              : session?.user?.credits ?? 0) <= 0
                          }
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-muted disabled:to-muted text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg disabled:shadow-none"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="animate-spin w-5 h-5" />
                              <ShiningText text="Preparing AI Tutor..." />
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Launch Interactive Learning
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streaming Messages Display */}
          <AnimatePresence>
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-8 border-2 border-green-200 dark:border-green-800/40 shadow-lg"
              >
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Bot className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-green-800 dark:text-green-400">
                      Preparing AI Tutor
                    </h2>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    {streamingMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <ResponseStream
                          textStream={message.content}
                          className="text-muted-foreground"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {processing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2 className="animate-spin w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">
                        Finalizing setup...
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bot Result Display */}
          {botResult && !showDesktopLayout && (
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
                  Your personalized AI tutor is ready to guide you through the
                  solution step by step. Start your interactive learning journey
                  now!
                </p>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={launchDesktopLayout}
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

          {/* Desktop Layout - Split View */}
          <AnimatePresence>
            {showDesktopLayout && botResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden md:block"
              >
                {/* Desktop Split Layout */}
                <div className="grid grid-cols-2 gap-6 h-[800px]">
                  {/* Left Side - Question + Steps */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Question Image */}
                    <div className="bg-card rounded-xl border shadow-sm h-[300px]">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          Question
                        </h3>
                      </div>
                      <div className="p-4 h-[calc(100%-64px)] flex flex-col">
                        {imagePreview && (
                          <>
                            <div className="border rounded-lg bg-muted/20 overflow-hidden relative flex-1">
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
                                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                                      <Button
                                        onClick={() => zoomIn()}
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
                                        title="Zoom In"
                                      >
                                        <ZoomIn className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        onClick={() => zoomOut()}
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
                                        title="Zoom Out"
                                      >
                                        <ZoomOut className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        onClick={() => resetTransform()}
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
                                        title="Reset View"
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          setShowFullQuestion(true)
                                        }
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
                                        title="Full Screen"
                                      >
                                        <Maximize2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <TransformComponent>
                                      <img
                                        src={imagePreview}
                                        alt="Question"
                                        className="w-full h-full object-contain rounded-lg"
                                      />
                                    </TransformComponent>
                                  </>
                                )}
                              </TransformWrapper>
                            </div>

                            {/* Full Screen Button */}
                            <div className="mt-3">
                              <Button
                                onClick={() => setShowFullQuestion(true)}
                                variant="outline"
                                size="sm"
                                className="w-full text-sm"
                              >
                                <Maximize2 className="mr-2 h-4 w-4" />
                                View Full Screen
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Steps List */}
                    <div className="bg-card rounded-xl border shadow-sm h-[480px] flex flex-col">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Step-by-Step Solution
                        </h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {steps.map((step, stepIndex) => (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: stepIndex * 0.05,
                              }}
                              className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary mt-1">
                                  {stepIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <SimpleMathRenderer
                                    content={step.content}
                                    className="text-foreground leading-relaxed text-sm"
                                  />

                                  {/* Sub-steps */}
                                  {step.subSteps.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-2">
                                      {step.subSteps.map(
                                        (subStep, subIndex) => (
                                          <div
                                            key={subStep.id}
                                            className="flex items-start gap-2"
                                          >
                                            <div className="w-4 h-4 bg-secondary/20 rounded-full flex items-center justify-center text-xs text-secondary-foreground mt-1">
                                              {String.fromCharCode(
                                                97 + subIndex
                                              )}
                                            </div>
                                            <SimpleMathRenderer
                                              content={subStep.content}
                                              className="text-muted-foreground text-xs leading-relaxed"
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Right Side - AI Bot Iframe */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-card rounded-xl border shadow-sm overflow-hidden"
                  >
                    <div className="p-4 border-b bg-card">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Bot className="w-5 h-5 text-primary" />
                          AI Interactive Tutor
                        </h3>
                        <Button
                          onClick={() => setShowDesktopLayout(false)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="h-[calc(100%-64px)]">
                      <iframe
                        src={botResult.chatbotLink}
                        className="w-full h-full border-0"
                        title="AI Tutor Interactive Session"
                        scrolling="yes"
                        allow="fullscreen"
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Interactive Learning Iframe (unchanged) */}
          {showIframe && botResult && !showDesktopLayout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-card rounded-xl border shadow-lg overflow-hidden w-full md:hidden"
            >
              {/* Header with controls */}
              <div className="flex items-center justify-between p-3 lg:p-4 border-b bg-card">
                <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  <span className="hidden sm:inline">
                    Interactive Learning Session
                  </span>
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
                        maxHeight: isMobile ? "220px" : "350px",
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
                          {({ zoomIn, zoomOut, resetTransform }: any) => (
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
                        <span className="hidden sm:inline">
                          View Full Screen
                        </span>
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
                                {processedData.concept_tags.flat().length >
                                  (isMobile ? 2 : 3) && "..."}
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

          {/* Crop Modal with Rotation */}
          <AnimatePresence>
            {showCropModal && cropImageSrc && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-card rounded-xl p-6 max-w-4xl max-h-[90vh] w-full overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CropIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-semibold">
                          Crop & Rotate Image
                        </h3>
                      </div>
                      <Button
                        onClick={handleCropCancel}
                        variant="outline"
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Instructions */}
                    <p className="text-sm text-muted-foreground">
                      Drag the corners to select the area you want to keep. Use
                      rotation controls if needed. Focus on the question content
                      for best results.
                    </p>

                    {/* Rotation Controls */}
                    <div className="flex items-center justify-center gap-4 p-2 bg-muted/30 rounded-lg">
                      <Button
                        onClick={resetRotation}
                        variant="outline"
                        size="sm"
                        disabled={rotationAngle === 0}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {rotationAngle}°
                        </span>
                      </div>

                      <Button onClick={rotateImage} variant="outline" size="sm">
                        <RotateCw className="mr-2 h-4 w-4" />
                        Rotate 90°
                      </Button>
                    </div>

                    {/* Crop Area */}
                    <div className="flex justify-center">
                      <div className="max-w-full max-h-[60vh] overflow-auto">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={undefined}
                          minWidth={50}
                          minHeight={50}
                        >
                          <img
                            ref={imgRef}
                            src={cropImageSrc || ""}
                            alt="Crop preview"
                            className="max-w-full h-auto"
                            style={{ transform: `rotate(${rotationAngle}deg)` }}
                            onLoad={() => {
                              // Auto-select most of the image initially
                              if (imgRef.current) {
                                const { width, height } = imgRef.current;
                                setCrop({
                                  unit: "px",
                                  width: width * 0.9,
                                  height: height * 0.9,
                                  x: width * 0.05,
                                  y: height * 0.05,
                                });
                              }
                            }}
                          />
                        </ReactCrop>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                      <Button onClick={handleCropCancel} variant="outline">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCropComplete}
                        disabled={!completedCrop}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <CropIcon className="mr-2 h-4 w-4" />
                        Crop & Upload
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
