'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar } from '@radix-ui/react-avatar';

interface ChatMessageProps {
  message?: string;
  isBot: boolean;
  timestamp?: Date;
  isTyping?: boolean;
  customContent?: React.ReactNode;
}

export function ChatMessage({ message, isBot, timestamp, isTyping, customContent }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'flex w-full gap-2.5 px-3 py-2',
        isBot ? 'justify-start' : 'justify-end'
      )}
    >
      {isBot && (
        <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-primary/90 text-primary-foreground">
          <span className="text-xs">🤖</span>
        </div>
      )}
      
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[85%]',
          customContent 
            ? 'p-0 bg-transparent' // No padding/background for custom content like questions
            : isBot
            ? 'bg-muted/80 text-foreground px-3 py-2 rounded-lg'
            : 'bg-primary text-primary-foreground ml-auto px-3 py-2 rounded-lg'
        )}
      >
        {isTyping ? (
          <div className="flex space-x-1 px-3 py-2 bg-muted/80 rounded-lg">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-1.5 h-1.5 bg-current rounded-full opacity-60"
            />
          </div>
        ) : customContent ? (
          <div className="w-full">
            {customContent}
            {timestamp && (
              <div className="text-xs opacity-50 mt-2 px-1">
                {timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">{message}</div>
        )}
        
        {timestamp && !isTyping && !customContent && (
          <div className="text-xs opacity-50">
            {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {!isBot && (
        <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-background border border-border/40">
          <span className="text-xs">👤</span>
        </div>
      )}
    </motion.div>
  );
} 