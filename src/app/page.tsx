"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useSession, signOut, signIn } from "next-auth/react";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
  Home,
  Download,
  Eye,
  Sparkles,
  ExternalLink,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Bot,
  Play,
  ChevronDown,
  ChevronUp,
  Camera,
  Crop as CropIcon,
  User,
  Crown,
  LogOut,
  Info,
  RotateCw,
  Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import dynamic from "next/dynamic";
import { ShiningText } from "@/components/ui/shining-text";
import { ResponseStream } from "@/components/ui/response-stream";
import Link from "next/link";

interface ProcessedData {
  questions: string[];
  options: string[][];
  correct_answers: number[];
  explanations: string[];
  concept_tags: string[][];
}

interface BotResult {
  chatbotLink: string;
  sessionId: string;
}

// Lazy load the SplineSceneBasic component with SSR disabled
const SplineSceneBasic = dynamic(() => import("@/components/robotui").then(mod => ({ default: mod.SplineSceneBasic })), {
  ssr: false,
  loading: () => null, // No loading placeholder since it won't show on mobile anyway
})

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
}> = ({ session, darkMode = false, realTimeCredits, creditsLoading, onRefreshCredits }) => {
  // Check if user is authenticated
  const isAuthenticated = !!session?.user;
  
  // Handle user logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Handle direct Google sign in
  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };
  
  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className={`p-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg backdrop-blur-sm`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}>
            <User size={16} />
          </div>
          
          <div className="flex-grow">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Guest User</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sign in to access AI features</p>
          </div>
        </div>
        
        <button
          onClick={handleSignIn}
          className={`mt-3 w-full py-2 rounded-lg text-sm font-medium ${
            darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
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
  const creditsRemaining = realTimeCredits !== null ? realTimeCredits : (user.credits !== undefined ? user.credits : 0);
  const totalCredits = 25; // This could be made dynamic in the future
  
  return (
    <div className={`p-3 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg backdrop-blur-sm`}>
      {/* Compact user profile header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {user.image ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500">
              <img 
                src={user.image} 
                alt={user.name || 'User'} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
            }`}>
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {user.name || 'User'}
              </h3>
              {user.accountType === "pro" && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  darkMode ? 'bg-yellow-800 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                } flex items-center space-x-1`}>
                  <Crown size={8} />
                  <span>PRO</span>
                </span>
              )}
            </div>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
          </div>
        </div>
        
        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className={`p-1.5 rounded-lg text-xs font-medium ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          } transition-colors flex items-center`}
          title="Logout"
        >
          <LogOut size={12} />
        </button>
      </div>
      
      {/* Compact credits display */}
      <div className={`mt-2 p-2 rounded ${
        darkMode ? 'bg-gray-700/50' : 'bg-white/80'
      }`}>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Credits
            </span>
            {onRefreshCredits && (
              <button
                onClick={onRefreshCredits}
                disabled={creditsLoading}
                className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                  creditsLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Refresh credits"
              >
                <RefreshCw 
                  size={10} 
                  className={`${creditsLoading ? 'animate-spin' : ''} ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} 
                />
              </button>
            )}
          </div>
          <span className={`text-xs font-medium ${
            (creditsRemaining <= 1)
              ? 'text-red-500' 
              : darkMode ? 'text-indigo-400' : 'text-indigo-600'
          }`}>
            {creditsLoading ? '...' : `${creditsRemaining}/${totalCredits}`}
          </span>
        </div>
        
        {/* Compact credits progress bar */}
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
          darkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}>
          <div 
            style={{ width: `${(creditsRemaining / totalCredits) * 100}%` }}
            className={`h-full transition-all duration-500 ${
              (creditsRemaining <= 1) 
                ? 'bg-red-500' 
                : darkMode ? 'bg-indigo-500' : 'bg-indigo-500'
            }`}
          ></div>
        </div>
        
        {/* Credits reset notice for free users with no credits */}
        {user.accountType === "free" && creditsRemaining === 0 && (
          <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
            Resets in 24h
          </div>
        )}
      </div>
    </div>
  );
};

export default function UploadImagePage() {
  // Session management with NextAuth
  const { data: session, status } = useSession();
  
  // State management
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [botResult, setBotResult] = useState<BotResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [showFullQuestion, setShowFullQuestion] = useState(false);
  const [showGeneratedQuestions, setShowGeneratedQuestions] = useState(false);
  const [isUploadAreaFocused, setIsUploadAreaFocused] = useState(false);
  const [showThinkingDropdown, setShowThinkingDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Real-time credits state
  const [realTimeCredits, setRealTimeCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  
  // Camera and crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  
  // Dark mode detection
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Add rotation state
  const [rotationAngle, setRotationAngle] = useState(0);
  const [clipboardFocused, setClipboardFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if screen is mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for dark mode and listen for theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  /**
   * Fetch real-time credits from the database
   */
  const fetchUserCredits = async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    try {
      setCreditsLoading(true);
      const response = await fetch('/api/user/credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRealTimeCredits(data.credits);
        
        // Update session object with latest credits for immediate UI updates
        if (session?.user) {
          (session.user as any).credits = data.credits;
        }
      } else {
        console.error('Failed to fetch credits:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Fetch credits on session load and page refresh
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserCredits();
    }
  }, [status, session?.user?.email]);

  // Set up periodic credit refresh every 30 seconds
  useEffect(() => {
    if (status !== 'authenticated') return;

    const intervalId = setInterval(() => {
      fetchUserCredits();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [status]);

  // Manual refresh on window focus (when user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        fetchUserCredits();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status]);

  // Handle direct Google sign in
  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  /**
   * Handle image file selection from input or drag & drop
   */
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        processImageFile(file);
      }
    }
  };

  /**
   * Handle drag and drop functionality
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  /**
   * Process the selected image file and create preview
   */
  const processImageFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      setSelectedImage(file);
      setError(null);
      setProcessedData(null);
      setBotResult(null);
      setShowIframe(false);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file");
    }
  };

  /**
   * Handle clipboard paste functionality
   */
  const handlePaste = (event: ClipboardEvent) => {
    if (!isUploadAreaFocused && !clipboardFocused) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          event.preventDefault();
          break;
        }
      }
    }
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
      return new Promise((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas dimensions based on crop
        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;
        
        // When rotating by 90 or 270 degrees, swap width and height
        const isRotated90or270 = rotationAngle === 90 || rotationAngle === 270;
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
              const file = new File([blob], 'cropped-image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(file);
            }
          },
          'image/jpeg',
          0.9
        );
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
      const croppedFile = await generateCroppedImage(imgRef.current, completedCrop);
      processImageFile(croppedFile);
      setShowCropModal(false);
      setCropImageSrc(null);
    } catch (error) {
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
   * Handle upload area focus and keyboard events
   */
  const handleUploadAreaClick = () => {
    setIsUploadAreaFocused(true);
    uploadAreaRef.current?.focus();
  };

  const handleUploadAreaDoubleClick = () => {
    fileInputRef.current?.click();
  };

  const handleBrowseClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleUploadAreaBlur = () => {
    setIsUploadAreaFocused(false);
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
  }, [isUploadAreaFocused, clipboardFocused]); // Add clipboardFocused to dependency array

  /**
   * Send image to AI for processing and automatically create session
   */
  const processImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    // Check authentication first
    if (status === 'unauthenticated') {
      setError("You need to sign in to use this feature. Please login to continue.");
      return;
    }

    // Check if user has credits (use real-time credits if available)
    const currentCredits = realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0);
    if (currentCredits <= 0) {
      setError("No credits remaining. Please upgrade your account or wait for credits to reset.");
      return;
    }

    setProcessing(true);
    setShowThinkingDropdown(true); // Show thinking dropdown immediately
    setError(null);

    try {
      // Step 1: Process image with AI
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process image");
      }

      setProcessedData(result.data);

      // Update both session and real-time credits with the new credits remaining
      if (result.creditsRemaining !== undefined) {
        setRealTimeCredits(result.creditsRemaining);
        if (session?.user) {
          (session.user as any).credits = result.creditsRemaining;
        }
      }

      // Step 2: Automatically create chatbot session
      await createChatbotSession(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setProcessing(false);
      // Refresh credits after processing to ensure UI is up to date
      setTimeout(() => {
        fetchUserCredits();
      }, 1000);
    }
  };

  /**
   * Create chatbot session automatically after AI processing
   */
  const createChatbotSession = async (data: ProcessedData) => {
    try {
      const response = await fetch("/api/upload-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create chatbot");
      }

      setBotResult({
        chatbotLink: result.chatbotLink,
        sessionId: result.sessionId,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create chatbot session"
      );
    }
  };

  /**
   * Copy text to clipboard with feedback
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /**
   * Download processed data as JSON file
   */
  const downloadJSON = () => {
    if (!processedData) return;

    const dataStr = JSON.stringify(processedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-generated-questions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Reset all states to initial values
   */
  const reset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setProcessedData(null);
    setError(null);
    setBotResult(null);
    setCopied(false);
    setShowIframe(false);
    setShowFullQuestion(false);
    setIsUploadAreaFocused(false);
    setClipboardFocused(false); // Reset clipboard focus state
    setShowThinkingDropdown(false);
    setShowCropModal(false);
    setCropImageSrc(null);
    setCompletedCrop(null);
    setRotationAngle(0); // Reset rotation angle
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  /**
   * Open LearnBot in new tab
   */
  const openInNewTab = () => {
    if (botResult) {
      window.open(botResult.chatbotLink, "_blank");
    }
  };

  /**
   * Show LearnBot in iframe within the same page
   */
  const showInIframe = () => {
    setShowIframe(true);
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

  // Show login wall if not authenticated
  if (status === 'loading') {
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
  if (status === 'unauthenticated') {
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
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">AI Question Breakdown</h1>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Upload an image of any academic question and our AI will break it down into scaffolded learning steps
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
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">AI Learning Bot</h2>
                    <p className="text-muted-foreground text-sm">
                      Get personalized, step-by-step guidance through any academic question with our interactive AI tutor
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Sparkles size={14} />
                      <span>Interactive Learning Features:</span>
                    </div>
                    <ul className="text-xs space-y-1 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>Question breakdown & analysis</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>Step-by-step problem solving</span>
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
                  <SplineSceneBasic />
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
                        <Bot className="w-8 h-8 text-primary" />
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold">AI Learning Bot</h2>
                        <p className="text-muted-foreground">
                          Transform any question into an interactive learning experience with our AI tutor
                        </p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg text-left">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <Sparkles size={16} />
                          <span>What you get with AI Learning:</span>
                        </div>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Intelligent question breakdown & analysis</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Step-by-step guided problem solving</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>Interactive chatbot for personalized help</span>
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
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">AI Question Breakdown</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Upload an image of any academic question and our AI will break it
              down into scaffolded learning steps
            </p>
          </motion.div>

          {/* User Profile Section - Top position for logged-in users */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-md mx-auto"
          >
            <UserProfile session={session} darkMode={isDarkMode} realTimeCredits={realTimeCredits} creditsLoading={creditsLoading} onRefreshCredits={fetchUserCredits} />
          </motion.div>

          {/* Main Content Grid */}
          <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
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
                  <SplineSceneBasic />
                </div>
              </motion.div>
            )}

            {/* Right Side - Upload Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: isMobile ? 0 : 0.2 }}
              className={`space-y-6 ${isMobile ? 'order-1' : 'order-2 lg:order-2'}`}
            >
              <div className="bg-card rounded-xl p-6 border shadow-sm h-[580px] flex flex-col">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-primary" />
                  Upload Question Image
                </h2>

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
                        {((selectedImage?.size || 0) / 1024 / 1024).toFixed(
                          2
                        )}{" "}
                        MB)
                      </p>
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
                              <h3 className="text-xl font-semibold text-foreground">Take Photo</h3>
                              <p className="text-sm text-muted-foreground">
                                Capture, crop & rotate question
                              </p>
                            </div>
                          </button>

                          {/* Upload Button - Smaller */}
                          <button
                            onClick={handleBrowseClick}
                            className="flex items-center justify-center gap-3 p-4 bg-muted/30 border-2 border-dashed border-border rounded-lg transition-all hover:border-primary/50 hover:bg-muted/40"
                          >
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <div className="text-left">
                              <p className="text-sm font-medium">Upload Image</p>
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
                            onChange={handleImageSelect}
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
                            onClick={handleBrowseClick}
                            className="border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer bg-muted/30 flex flex-col justify-center hover:border-primary/50 hover:bg-primary/5"
                            role="button"
                            aria-label="Upload image area - click to select file"
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
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
                                    {navigator.platform.indexOf('Mac') > -1 ? 'Cmd+V' : 'Ctrl+V'}
                                  </kbd>
                                </p>
                                {clipboardFocused && (
                                  <p className="text-xs text-primary font-medium mt-2">
                                    Ready for paste! Press {navigator.platform.indexOf('Mac') > -1 ? 'Cmd+V' : 'Ctrl+V'} now
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {session && (
                            <div className="col-span-2 text-center">
                              <span className="text-xs text-muted-foreground">
                                <span className="font-medium">1 credit will be used</span> for each question breakdown. 
                                You have {realTimeCredits !== null ? realTimeCredits : (session.user.credits ?? 0)} credits remaining.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={processImage}
                    disabled={!selectedImage || processing || ((realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0)) <= 0)}
                    className="flex-1"
                    size="lg"
                  >
                    {processing ? (
                      <ShiningText text="AI is thinking..." />
                    ) : ((realTimeCredits !== null ? realTimeCredits : (session?.user?.credits ?? 0)) <= 0) ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        No Credits Remaining
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Breakdown Problem
                      </>
                    )}
                  </Button>

                  <Button onClick={reset} variant="outline" size="lg">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Enhanced Thinking Dropdown */}
                <AnimatePresence>
                  {processing && showThinkingDropdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="mt-4 relative overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-purple-50/30 dark:from-primary/10 dark:via-blue-950/20 dark:to-purple-950/10 border border-primary/20 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                        <div className="space-y-3">
                          {/* Header with animated icon */}
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="p-2 bg-primary/10 rounded-full"
                            >
                              <Bot className="w-4 h-4 text-primary" />
                            </motion.div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                AI Processing
                                <motion.div
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  className="flex gap-1"
                                >
                                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                                </motion.div>
                              </h4>
                            </div>
                          </div>

                          {/* Compact thinking content */}
                          <div className="bg-background/60 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                            <div className="max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                              <ResponseStream
                                textStream="🔍 Analyzing the image and question to extract relevant content and structure. 📘 Identifying key concepts, equations, and visual elements. 🧠 Evaluating problem complexity and learning goals. 🧩 Organizing information into clear, teachable steps. 🔗 Mapping related concepts and prerequisite knowledge.  Generating adaptive, step-by-step guidance tailored to your needs. 🤖 Initializing the AI tutor to support your learning journey. ⚙️ Optimizing clarity, progression, and engagement. ✅ Almost ready to begin."
                                mode="fade"
                                className="text-xs text-muted-foreground/90 leading-relaxed"
                                fadeDuration={400}
                              />
                            </div>
                          </div>

                          {/* Progress indicator */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground/80">
                                Progress
                              </span>
                              <motion.span
                                className="text-primary font-medium"
                                key={Math.random()} // Force re-render for animation
                              >
                                {processing ? "Processing..." : "Complete!"}
                              </motion.span>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: processing ? "85%" : "100%" }}
                                transition={{
                                  duration: processing ? 8 : 0.5,
                                  ease: "easeOut",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Animated background elements */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-lg"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
                  >
                    <XCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}

                {/* No Credits Notice */}
                {session?.user && ((realTimeCredits !== null ? realTimeCredits : (session.user.credits ?? 0)) <= 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 text-sm bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800 mb-1">No Credits Remaining</h4>
                        <p className="text-yellow-700 mb-3">
                          You've used all your credits for this account. Get more credits to continue using the AI Question Breakdown feature.
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
              </div>
            </motion.div>
          </div>

          {/* Results Section - Full Width Below */}
          {(processedData || botResult) && (
            <div className="space-y-6">
              {/* Prominent Bot Activation Section - PRIMARY */}
              {botResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-8 border-2 border-green-200 dark:border-green-800/40 shadow-lg"
                >
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Bot className="w-8 h-8 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-green-800 dark:text-green-400">
                        Learning Bot Ready!
                      </h2>
                    </div>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Your personalized AI tutor is ready to guide you through
                      the solution step by step. Start your interactive learning
                      journey now!
                    </p>

                    {/* Prominent Action Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Button
                        onClick={showInIframe}
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

                    {/* Additional Options */}
                    <div className="grid md:grid-cols-2 gap-4 mt-8">
                      {/* <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          Session ID
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={botResult.sessionId}
                            readOnly
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                          />
                          <Button
                            onClick={() => copyToClipboard(botResult.sessionId)}
                            variant="outline"
                            size="icon"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div> */}

                      {/* <div className="space-y-3">
                        <label className="block text-sm font-medium">
                          Direct Link
                        </label>
                        <div className="flex gap-2">
                          <Button
                            onClick={openInNewTab}
                            variant="outline"
                            className="flex-1"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div> */}
                    </div>

                    {/* Copy Success Message */}
                    {copied && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-center text-sm text-green-600 font-medium"
                      >
                        ✓ Copied to clipboard!
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Generated Questions - SECONDARY (Collapsible) */}
              {processedData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-card/50 rounded-xl border border-dashed border-border/60 overflow-hidden"
                >
                  {/* Collapsible Header */}
                  <button
                    onClick={() =>
                      setShowGeneratedQuestions(!showGeneratedQuestions)
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-medium text-muted-foreground">
                        View Generated Questions (
                        {processedData.questions.length})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {showGeneratedQuestions ? "Hide" : "Show"}
                      </span>
                      {showGeneratedQuestions ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  <AnimatePresence>
                    {showGeneratedQuestions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border/30"
                      >
                        <div className="p-4 space-y-4">
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {processedData.questions.map((question, index) => (
                              <div
                                key={index}
                                className="p-3 bg-background/60 rounded-lg border border-border/40"
                              >
                                <h4 className="font-medium mb-1 text-sm">
                                  Question {index + 1}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                                  {question}
                                </p>
                                <div className="text-xs text-muted-foreground/80">
                                  Topics:{" "}
                                  {processedData.concept_tags[index].join(", ")}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 pt-3 border-t border-border/30">
                            <Button
                              onClick={downloadJSON}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="mr-2 h-3 w-3" />
                              Download JSON
                            </Button>
                            <Button
                              onClick={() => setShowGeneratedQuestions(false)}
                              variant="ghost"
                              size="sm"
                            >
                              <ChevronUp className="mr-2 h-3 w-3" />
                              Collapse
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          )}

          {/* Iframe Section - Overlay */}
          {showIframe && botResult && processedData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-card rounded-xl border shadow-lg overflow-hidden"
            >
              {/* Header with controls */}
              <div className="flex items-center justify-between p-3 lg:p-4 border-b bg-card">
                <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
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
                    Full Screen Question
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

              {/* Responsive Layout - Mobile-First Design */}
              <div className="flex flex-col lg:flex-row">
                {/* Question Panel - Compact on mobile, standard on desktop */}
                <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r bg-card lg:h-[700px]">
                  <div className="p-3 lg:p-4 flex flex-col lg:h-full">
                    <h3 className="font-semibold text-base lg:text-lg mb-2 lg:mb-3">
                      Original Question
                    </h3>

                    {/* Zoomable Image Container - More compact on mobile */}
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

                    {/* Full Screen Button - More compact on mobile */}
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

                    {/* Question Analysis - More compact on mobile */}
                    {processedData && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
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

                {/* Bot Panel - Optimized for mobile with maximum available height */}
                <div className="w-full lg:w-2/3 flex-1">
                  <div className="h-[calc(100vh-200px)] min-h-[600px] lg:h-[700px]">
                    <iframe
                      src={botResult.chatbotLink}
                      className="w-full h-full border-0"
                      title="LearnBot Interactive Session"
                      scrolling="yes"
                      allow="fullscreen"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* How it Works Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-card rounded-xl p-6 border shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">How it Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium">1. Upload Image</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an image of any academic question or problem
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium">2. AI Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI breaks down the problem into scaffolded learning steps
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium">3. Interactive Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Get a personalized chatbot to guide you through the solution
                </p>
              </div>
            </div>
          </motion.div>
        </div>

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
                      <h3 className="text-xl font-semibold">Crop & Rotate Image</h3>
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
                    Drag the corners to select the area you want to keep. Use rotation controls if needed. Focus on the question content for best results.
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
                      <span className="text-sm font-medium">{rotationAngle}°</span>
                    </div>
                    
                    <Button
                      onClick={rotateImage}
                      variant="outline"
                      size="sm"
                    >
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
                          src={cropImageSrc}
                          alt="Crop preview"
                          className="max-w-full h-auto"
                          style={{ transform: `rotate(${rotationAngle}deg)` }}
                          onLoad={() => {
                            // Auto-select most of the image initially
                            if (imgRef.current) {
                              const { width, height } = imgRef.current;
                              setCrop({
                                unit: 'px',
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
                    <Button
                      onClick={handleCropCancel}
                      variant="outline"
                    >
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
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </main>

      <Footer />
    </div>
  );
}
