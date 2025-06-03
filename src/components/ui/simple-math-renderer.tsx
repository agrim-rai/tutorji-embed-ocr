import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface SimpleMathRendererProps {
  content: string;
  className?: string;
}

export const SimpleMathRenderer: React.FC<SimpleMathRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const renderContent = (text: string) => {
    if (!text || typeof text !== 'string') {
      return <span>{text}</span>;
    }

    // Simple and robust approach: find math expressions and render them
    const parts: React.ReactNode[] = [];
    let keyCounter = 0;

    // Find all math expressions with their positions
    const mathExpressions: Array<{
      start: number;
      end: number;
      content: string;
      type: 'display' | 'inline';
      original: string;
    }> = [];

    // Pattern for display math: \[ ... \]
    const displayRegex = /\\\[([^]*?)\\\]/g;
    let match;
    while ((match = displayRegex.exec(text)) !== null) {
      mathExpressions.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim(),
        type: 'display',
        original: match[0]
      });
    }
    // Pattern for inline math: \( ... \)
    const inlineRegex = /\\\(([^]*?)\\\)/g;
    while ((match = inlineRegex.exec(text)) !== null) {
      // Check if this overlaps with any display math
      const hasOverlap = mathExpressions.some(existing => 
        (match!.index < existing.end && match!.index + match![0].length > existing.start)
      );
      
      if (!hasOverlap) {
        mathExpressions.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1].trim(),
          type: 'inline',
          original: match[0]
        });
      }
    }

    // Sort by position
    mathExpressions.sort((a, b) => a.start - b.start);

    let currentIndex = 0;

    // Process each math expression
    mathExpressions.forEach(expr => {
      // Add text before this expression
      if (expr.start > currentIndex) {
        const textBefore = text.slice(currentIndex, expr.start);
        if (textBefore) {
          parts.push(
            <span key={`text-${keyCounter++}`}>
              {textBefore}
            </span>
          );
        }
      }

      // Render the math expression
      try {
        if (expr.type === 'display') {
          parts.push(
            <div key={`display-${keyCounter++}`} className="my-4 text-center">
              <BlockMath math={expr.content} />
            </div>
          );
        } else {
          parts.push(
            <span key={`inline-${keyCounter++}`} className="inline-math">
              <InlineMath math={expr.content} />
            </span>
          );
        }
      } catch (error) {
        console.warn('Math rendering error for:', expr.content, error);
        // Fallback: show the original text
        parts.push(
          <span 
            key={`error-${keyCounter++}`} 
            className="bg-red-100 dark:bg-red-900/20 px-1 py-0.5 rounded text-red-700 dark:text-red-400 font-mono text-sm"
            title={`Math rendering failed: ${error}`}
          >
            {expr.original}
          </span>
        );
      }

      currentIndex = expr.end;
    });

    // Add any remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText) {
        parts.push(
          <span key={`remaining-${keyCounter++}`}>
            {remainingText}
          </span>
        );
      }
    }

    // If no math was found, return the original text
    if (parts.length === 0) {
      return <span>{text}</span>;
    }

    return <>{parts}</>;
  };

  return (
    <div className={`simple-math-renderer ${className}`}>
      {renderContent(content)}
      
      <style jsx global>{`
        .simple-math-renderer .katex {
          font-size: inherit !important;
        }
        
        .simple-math-renderer .katex-display {
          margin: 1rem 0 !important;
          text-align: center !important;
        }
        
        .simple-math-renderer .inline-math {
          display: inline;
          vertical-align: baseline;
        }
        
        .simple-math-renderer .inline-math .katex {
          display: inline;
        }
        
        .simple-math-renderer .inline-math .katex .katex-html {
          display: inline;
        }
      `}</style>
    </div>
  );
}; 