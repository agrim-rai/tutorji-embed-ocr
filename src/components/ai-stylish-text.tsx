"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Engaging messages for JEE students while AI is processing
const loadingMessages = [
    "Thinking... analyzing the question to identify key concepts and objectives.",
    "Reviewing relevant knowledge and foundational principles.",
    "Evaluating possible solution paths based on logical and analytical reasoning.",
    "Interpreting the structure and constraints of the problem.",
    "Developing a methodical approach for accurate problem resolution.",
    "Synthesizing information to build a coherent and structured response.",
    "Testing assumptions and validating the approach for consistency and correctness.",
    "Finalizing the response to ensure clarity, precision, and relevance."
  ];
interface StreamingTextProps {
  isStreaming: boolean;
  onComplete?: () => void;
  className?: string;
  darkMode?: boolean;
}

export function StreamingLoadingText({ 
  isStreaming, 
  onComplete, 
  className = "",
  darkMode = true 
}: StreamingTextProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Start streaming when isStreaming becomes true
  useEffect(() => {
    if (isStreaming) {
      setIsVisible(true);
      setCurrentMessageIndex(0);
      setDisplayedText("");
      setCharIndex(0);
    } else {
      // Stop streaming immediately when API returns
      setIsVisible(false);
      setDisplayedText("");
      setCharIndex(0);
      setCurrentMessageIndex(0);
    }
  }, [isStreaming]);

  // Handle text streaming effect
  useEffect(() => {
    if (!isStreaming || !isVisible) return;

    const currentMessage = loadingMessages[currentMessageIndex];
    
    if (charIndex < currentMessage.length) {
      // Continue typing current message
      const timer = setTimeout(() => {
        setDisplayedText(currentMessage.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 50); // Typing speed: 50ms per character

      return () => clearTimeout(timer);
    } else {
      // Current message complete, wait then move to next
      const timer = setTimeout(() => {
        const nextIndex = (currentMessageIndex + 1) % loadingMessages.length;
        setCurrentMessageIndex(nextIndex);
        setDisplayedText("");
        setCharIndex(0);
      }, 2000); // Wait 2 seconds before next message

      return () => clearTimeout(timer);
    }
  }, [charIndex, currentMessageIndex, isStreaming, isVisible]);

  // Call onComplete when streaming stops
  useEffect(() => {
    if (!isStreaming && onComplete) {
      onComplete();
    }
  }, [isStreaming, onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`
        flex flex-col items-center justify-center
        p-4 rounded-lg
        ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-indigo-50/50 border border-indigo-200'}
        backdrop-blur-sm
        ${className}
      `}
    >
      {/* Pulsing AI Icon */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7] 
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className={`
          w-10 h-10 rounded-full mb-3
          flex items-center justify-center
          ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}
          text-lg font-bold
        `}
      >
        🤖
      </motion.div>

      {/* Streaming Text */}
      <div className="text-center max-w-sm">
        <motion.p
          className={`
            text-sm font-medium leading-snug
            ${darkMode ? 'text-white' : 'text-gray-800'}
          `}
        >
          {displayedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className={`inline-block w-0.5 h-4 ml-1 ${
              darkMode ? 'bg-indigo-400' : 'bg-indigo-500'
            }`}
          />
        </motion.p>

        {/* Progress indicator */}
        <div className="mt-3 flex justify-center space-x-1.5">
          {loadingMessages.map((_, index) => (
            <motion.div
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${
                index === currentMessageIndex
                  ? darkMode ? 'bg-indigo-400' : 'bg-indigo-500'
                  : darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
              animate={{
                scale: index === currentMessageIndex ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: index === currentMessageIndex ? Infinity : 0,
              }}
            />
          ))}
        </div>

        {/* Motivational footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className={`
            mt-2 text-xs
            ${darkMode ? 'text-gray-400' : 'text-gray-600'}
          `}
        >
          Hang tight! Great solutions take a moment to craft ⚡
        </motion.p>
      </div>
    </motion.div>
  );
}
