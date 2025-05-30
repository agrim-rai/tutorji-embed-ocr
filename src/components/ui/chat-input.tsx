'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onHint?: () => void;
  onDontKnow?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showQuickActions?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onHint, 
  onDontKnow, 
  disabled = false,
  placeholder = "Click on an option or type a, b, c, d to answer...",
  showQuickActions = true
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="border-t bg-background p-4">
      {showQuickActions && (
        <div className="mb-3 flex gap-2">
          {onHint && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onHint}
              disabled={disabled}
              className="text-xs"
            >
              <Lightbulb className="mr-1 h-3 w-3" />
              Hint
            </Button>
          )}
          {onDontKnow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDontKnow}
              disabled={disabled}
              className="text-xs"
            >
              <HelpCircle className="mr-1 h-3 w-3" />
              Don't Know
            </Button>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          )}
          rows={1}
        />
        <Button
          type="submit"
          disabled={!input.trim() || disabled}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
} 