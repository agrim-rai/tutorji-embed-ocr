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
  console.log('SimpleMathRenderer received:', content);

  const renderContent = (text: string) => {
    if (!text || typeof text !== 'string') {
      return <span>{text}</span>;
    }

    // Clean up the text and normalize whitespace
    let workingText = text.trim();
    console.log('Processing text:', workingText);

    const parts: React.ReactNode[] = [];
    let keyCounter = 0;

    // More flexible regex patterns that handle different LaTeX delimiter formats
    const mathExpressions: Array<{
      start: number;
      end: number;
      content: string;
      type: 'display' | 'inline';
      original: string;
    }> = [];

    // Pattern 1: Display math with \[ \] (with or without backslashes)
    const displayPatterns = [
      /\\?\[([^]*?)\\\]/g,   // \[content\]
      /\\\[([^]*?)\\?\]/g,   // \[content]  
      /\[([^]*?)\]/g         // [content] (fallback for broken delimiters)
    ];

    // Pattern 2: Inline math with \( \) (with or without backslashes)
    const inlinePatterns = [
      /\\?\(([^]*?)\\\)/g,   // \(content\)
      /\\\(([^]*?)\\?\)/g,   // \(content)
      /\(([^]*?)\)/g         // (content) (fallback)
    ];

    // Process display math first (higher priority)
    displayPatterns.forEach((pattern, patternIndex) => {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(workingText)) !== null) {
        const mathContent = match[1].trim();
        
        // Only accept if it looks like math (contains math symbols or operators)
        const isMathLike = /[=+\-*/^_{}\\∫∑∂∇πα-ωΑ-Ω]/.test(mathContent) || 
                          mathContent.includes('frac') || 
                          mathContent.includes('sqrt') ||
                          mathContent.includes('int') ||
                          mathContent.length > 10; // Long expressions are likely math
        
        if (mathContent && (isMathLike || patternIndex < 2)) { // Always accept first 2 patterns
          // Check for overlaps
          const hasOverlap = mathExpressions.some(existing => 
            (match!.index < existing.end && match!.index + match![0].length > existing.start)
          );
          
          if (!hasOverlap) {
            console.log('Found display math:', mathContent);
            mathExpressions.push({
              start: match!.index,
              end: match!.index + match![0].length,
              content: mathContent,
              type: 'display',
              original: match![0]
            });
          }
        }
      }
    });

    // Process inline math
    inlinePatterns.forEach((pattern, patternIndex) => {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(workingText)) !== null) {
        const mathContent = match[1].trim();
        
        // Only accept if it looks like math
        const isMathLike = /[=+\-*/^_{}\\∫∑∂∇πα-ωΑ-Ω]/.test(mathContent) || 
                          mathContent.includes('frac') || 
                          mathContent.includes('sqrt') ||
                          mathContent.includes('int');
        
        if (mathContent && (isMathLike || patternIndex < 2)) { // Always accept first 2 patterns
          // Check for overlaps with existing expressions
          const hasOverlap = mathExpressions.some(existing => 
            (match!.index < existing.end && match!.index + match![0].length > existing.start)
          );
          
          if (!hasOverlap) {
            console.log('Found inline math:', mathContent);
            mathExpressions.push({
              start: match!.index,
              end: match!.index + match![0].length,
              content: mathContent,
              type: 'inline',
              original: match![0]
            });
          }
        }
      }
    });

    // Sort all expressions by position
    mathExpressions.sort((a, b) => a.start - b.start);
    console.log('All math expressions found:', mathExpressions);

    let currentIndex = 0;

    // Process each math expression
    mathExpressions.forEach(expr => {
      // Add text before this expression
      if (expr.start > currentIndex) {
        const textBefore = workingText.slice(currentIndex, expr.start);
        if (textBefore.trim()) {
          parts.push(
            <span key={`text-${keyCounter++}`} className="inline">
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
            <span 
              key={`inline-${keyCounter++}`} 
              className="inline-flex items-center align-baseline whitespace-nowrap"
              style={{ 
                verticalAlign: 'baseline',
                display: 'inline-flex',
                alignItems: 'baseline'
              }}
            >
              <InlineMath math={expr.content} />
            </span>
          );
        }
        console.log(`Successfully rendered ${expr.type} math:`, expr.content);
      } catch (error) {
        console.warn('Math rendering error for:', expr.content, error);
        // Show error with original content
        parts.push(
          <span 
            key={`error-${keyCounter++}`} 
            className="inline bg-red-100 dark:bg-red-900/20 px-1 py-0.5 rounded text-red-700 dark:text-red-400 font-mono text-sm border border-red-300 dark:border-red-700"
            title={`Math rendering failed: ${error}`}
          >
            {expr.original}
          </span>
        );
      }

      currentIndex = expr.end;
    });

    // Add any remaining text
    if (currentIndex < workingText.length) {
      const remainingText = workingText.slice(currentIndex);
      if (remainingText.trim()) {
        parts.push(
          <span key={`remaining-${keyCounter++}`} className="inline">
            {remainingText}
          </span>
        );
      }
    }

    // If no math was found, return the original text
    if (parts.length === 0) {
      console.log('No math found, returning original text');
      return <span className="inline">{workingText}</span>;
    }

    console.log('Rendered parts:', parts.length);
    return <>{parts}</>;
  };

  return (
    <div className={`simple-math-renderer leading-relaxed ${className}`} 
         style={{ 
           lineHeight: '1.6',
           wordWrap: 'break-word',
           overflowWrap: 'break-word',
           hyphens: 'auto'
         }}>
      <div className="inline-block w-full">
        {renderContent(content)}
      </div>
      
      <style jsx global>{`
        .simple-math-renderer .katex {
          font-size: 1em !important;
        }
        
        .simple-math-renderer .katex-display {
          margin: 1rem 0 !important;
          text-align: center !important;
        }
        
        .simple-math-renderer .katex .base {
          display: inline-flex !important;
          align-items: baseline !important;
        }
        
        /* Ensure proper text flow around math */
        .simple-math-renderer span {
          word-break: normal;
          overflow-wrap: break-word;
        }
        
        /* Prevent awkward breaks in mathematical expressions */
        .simple-math-renderer .katex {
          white-space: nowrap;
          max-width: 100%;
        }
        
        /* Better alignment for inline math */
        .simple-math-renderer .katex .katex-html {
          display: inline-flex;
          align-items: baseline;
        }
        
        /* Responsive handling for very long expressions */
        @media (max-width: 640px) {
          .simple-math-renderer .katex {
            font-size: 0.9em !important;
          }
        }
      `}</style>
    </div>
  );
}; 