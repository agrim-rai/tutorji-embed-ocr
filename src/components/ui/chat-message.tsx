'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        'flex w-full px-3 py-2',
        isBot ? 'justify-start' : 'justify-end'
      )}
    >
      <div
        className={cn(
          'flex flex-col max-w-[90%]',
          isBot ? '' : 'items-end'
        )}
      >
        {/* Text Label */}
        <div className={cn(
          'text-sm font-medium mb-1',
          isBot ? 'text-rose-400' : 'text-gray-400'
        )}>
          {isBot ? 'TutorJi' : 'You'}
        </div>
        
        {/* Message Bubble */}
        <div
          className={cn(
            'bg-gray-800 text-white rounded-xl p-3',
            customContent ? 'p-0 bg-transparent' : ''
          )}
        >
          {isTyping ? (
            <div className="flex space-x-1 bg-gray-800 rounded-xl p-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 bg-white rounded-full opacity-60"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-white rounded-full opacity-60"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-white rounded-full opacity-60"
              />
            </div>
          ) : customContent ? (
            <div className="w-full">
              {customContent}
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words text-base leading-relaxed">{message}</div>
              {timestamp && (
                <div className="text-sm text-gray-400 mt-2">
                  {timestamp.toLocaleTimeString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
} 