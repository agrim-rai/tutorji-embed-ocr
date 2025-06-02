"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useParams } from "next/navigation";
import {
  FileText,
  Loader2,
  XCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Bot,
  ExternalLink,
  Share2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

interface SharedUploadData {
  imageUrl: string;
  sessionId: string;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params?.id as string;
  
  // State management
  const [shareData, setShareData] = useState<SharedUploadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch shared upload data
  useEffect(() => {
    if (!shareId) {
      setError("Invalid share ID");
      setLoading(false);
      return;
    }

    const fetchShareData = async () => {
      try {
        const response = await fetch(`/api/save-upload?id=${shareId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("This shared link has expired or doesn't exist");
          } else {
            throw new Error("Failed to load shared content");
          }
        }
        
        const data = await response.json();
        setShareData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [shareId]);

  // Copy share link to clipboard
  const copyShareLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate bot URL
  const getBotUrl = () => {
    if (!shareData) return "";
    return `/learnbot?id=${shareData.sessionId}`;
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto max-w-2xl p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-destructive mb-2">
                  Content Not Found
                </h1>
                <p className="text-muted-foreground">{error}</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This could happen if:
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                  <li>• The link has expired (shared content expires after 90 days)</li>
                  <li>• The link was typed incorrectly</li>
                  <li>• The content was removed</li>
                </ul>
              </div>

              <Link href="/upload-image">
                <Button className="mt-6">
                  <Bot className="mr-2 h-4 w-4" />
                  Create Your Own AI Learning Session
                </Button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Main content
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
                <Share2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Shared AI Learning Session</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              An AI-powered breakdown of an academic question, shared for collaborative learning
            </p>
            
            {/* Share info */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Shared on {formatDate(shareData!.createdAt)}</span>
              </div>
              <Button
                onClick={copyShareLink}
                variant="ghost"
                size="sm"
                className="h-auto p-1"
              >
                <Share2 className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </motion.div>

          {/* Bot Activation Section */}
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
                  AI Learning Bot Ready!
                </h2>
              </div>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore this shared learning session with step-by-step AI guidance. 
                Start your interactive journey through the solution!
              </p>

              {/* Start Learning Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Button
                  onClick={() => setShowIframe(true)}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 sm:px-12 py-4 text-lg sm:text-xl font-semibold rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl w-full sm:w-auto max-w-full"
                >
                  <Bot className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <span className="text-center leading-tight">
                    Start Learning
                    <br className="sm:hidden" />
                    <span className="sm:inline"> with AI Bot</span>
                  </span>
                </Button>
              </motion.div>

              {/* Create Your Own Button */}
              <div className="pt-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground mb-3">
                  Want to create your own AI learning session?
                </p>
                <Link href="/upload-image">
                  <Button variant="outline" size="lg">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Upload Your Question
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Interactive Session */}
          {showIframe && shareData && (
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
                    onClick={() => setShowFullImage(true)}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Full Screen Question
                  </Button>
                  <Button
                    onClick={() => setShowFullImage(true)}
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

                    {/* Zoomable Image Container */}
                    <div
                      className="border rounded-lg bg-muted/20 overflow-hidden relative"
                      style={{ 
                        minHeight: "180px", 
                        maxHeight: "350px" 
                      }}
                    >
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
                                src={shareData.imageUrl}
                                alt="Shared Question"
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </TransformComponent>
                          </>
                        )}
                      </TransformWrapper>
                    </div>

                    {/* Full Screen Button */}
                    <div className="mt-2 lg:mt-4">
                      <Button
                        onClick={() => setShowFullImage(true)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs lg:text-sm"
                      >
                        <Maximize2 className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">View Full Screen</span>
                        <span className="sm:hidden">Full Screen</span>
                      </Button>
                    </div>

                    {/* Share Info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="mt-2 lg:mt-4 p-3 lg:p-4 bg-muted/30 rounded-lg border border-border/40 flex-1 lg:flex-none"
                    >
                      <div className="space-y-2 lg:space-y-3">
                        <div className="flex items-start gap-2">
                          <Share2 className="w-3 h-3 lg:w-4 lg:h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                            <p className="text-foreground font-medium">
                              Shared Learning Session
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                              This question has been processed by AI and broken down into step-by-step learning components.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                              <span className="font-medium">Shared:</span>{" "}
                              {formatDate(shareData.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Bot Panel */}
                <div className="w-full lg:w-2/3 flex-1">
                  <div className="h-[calc(100vh-200px)] min-h-[600px] lg:h-[700px]">
                    <iframe
                      src={getBotUrl()}
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
        </div>

        {/* Full Screen Image Modal */}
        {showFullImage && shareData && (
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
              className="bg-card rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Shared Question</h3>
                <Button
                  onClick={() => setShowFullImage(false)}
                  variant="outline"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={shareData.imageUrl}
                alt="Full Screen Shared Question"
                className="w-full rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
} 