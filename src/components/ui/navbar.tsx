"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Share2, X, Clipboard, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Interface for share modal props
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string | null;
  isCreatingShare: boolean;
  shareCopied: boolean;
  onCreateShare: () => void;
  onCopyLink: () => void;
}

// Share Modal Component
const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  isCreatingShare,
  shareCopied,
  onCreateShare,
  onCopyLink,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.9,
            y: isMobile ? 50 : 0 
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: 0 
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.9,
            y: isMobile ? 50 : 0 
          }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300 
          }}
          className={`bg-card border rounded-xl shadow-2xl w-full max-w-md mx-auto ${
            isMobile ? 'max-h-[90vh] overflow-y-auto' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Share Breakdown</h3>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-muted-foreground text-sm">
              Share this step-by-step breakdown with friends, classmates, or anyone who needs help with this problem!
            </p>

            {!shareUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <Button
                  onClick={onCreateShare}
                  disabled={isCreatingShare}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-muted disabled:to-muted text-white"
                  size="lg"
                >
                  {isCreatingShare ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Creating Share Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Create Share Link
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                {/* Share URL Display */}
                <div className="p-3 bg-muted/50 border rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono truncate flex-1 min-w-0">
                      {shareUrl}
                    </span>
                    <Button
                      onClick={onCopyLink}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {shareCopied ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          <span className="text-xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-3 w-3 mr-1" />
                          <span className="text-xs">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Success Message */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-lg text-center"
                >
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    ✓ Anyone with this link can view the breakdown without signing in
                  </p>
                </motion.div>

                {/* Copy Button (Large) */}
                <Button
                  onClick={onCopyLink}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {shareCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Link Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Copy Link to Clipboard
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main navbar component with share functionality
interface NavbarProps {
  shareUrl?: string | null;
  isCreatingShare?: boolean;
  shareCopied?: boolean;
  onCreateShare?: () => void;
  onCopyLink?: () => void;
  hasContent?: boolean; // New prop to indicate if there's content to share
}

export function Navbar({ 
  shareUrl = null, 
  isCreatingShare = false, 
  shareCopied = false, 
  onCreateShare = () => {}, 
  onCopyLink = () => {},
  hasContent = false
}: NavbarProps = {}) {
  const { theme, setTheme } = useTheme();
  const [showShareModal, setShowShareModal] = useState(false);

  // Show share button when there's content available to share
  const showShareButton = hasContent;

  return (
    <>
      <nav className="fixed w-full top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl px-4 py-2">
              <span>TutorJi</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 px-4 py-2">
            {/* Share Button - Only visible when shareUrl exists */}
            <AnimatePresence>
              {showShareButton && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  transition={{ 
                    type: "spring", 
                    damping: 20, 
                    stiffness: 300 
                  }}
                >
                  <Button
                    onClick={() => setShowShareModal(true)}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800/40 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-950/40 dark:hover:to-pink-950/40"
                    disabled={isCreatingShare}
                  >
                    {isCreatingShare ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <Link href="/contact">
              <Button variant="outline" size="sm">
                Contact
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        isCreatingShare={isCreatingShare}
        shareCopied={shareCopied}
        onCreateShare={() => {
          onCreateShare();
          // Keep modal open until share URL is created
        }}
        onCopyLink={onCopyLink}
      />
    </>
  );
}
