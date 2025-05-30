'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Brain, Target } from 'lucide-react';

interface ProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  correctAnswers: number;
  conceptTags?: string[];
  className?: string;
}

export function ProgressIndicator({ 
  currentQuestion, 
  totalQuestions, 
  correctAnswers,
  conceptTags = [],
  className 
}: ProgressIndicatorProps) {
  const progress = (currentQuestion / totalQuestions) * 100;
  const accuracy = currentQuestion > 0 ? (correctAnswers / currentQuestion) * 100 : 0;

  return (
    <div className={cn("bg-card/40 border-b border-border/30 px-4 py-2.5", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/15">
            <Target className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-400">{correctAnswers}</span>
          </div>
          {currentQuestion > 0 && (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded",
              accuracy >= 70 
                ? "bg-green-500/10" 
                : accuracy >= 50 
                ? "bg-yellow-500/10" 
                : "bg-red-500/10"
            )}>
              <Brain className={cn(
                "h-3 w-3",
                accuracy >= 70 ? "text-green-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-600"
              )} />
              <span className={cn(
                "font-medium",
                accuracy >= 70 
                  ? "text-green-700 dark:text-green-400" 
                  : accuracy >= 50 
                  ? "text-yellow-700 dark:text-yellow-400" 
                  : "text-red-700 dark:text-red-400"
              )}>
                {accuracy.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="bg-primary h-1.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
} 