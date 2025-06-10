import React, { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface SimpleMathRendererProps {
  content: string;
  className?: string;
}

// Move regex patterns outside of component to avoid re-creation
const DISPLAY_MATH_REGEX = /\\\[([^]*?)\\\]/g;
const INLINE_MATH_REGEX = /\\\(([^]*?)\\\)/g;

// Helper types
interface MathExpression {
  start: number;
  end: number;
  content: string;
  type: 'display' | 'inline';
  original: string;
}

// Helper function to find math expressions - moved outside component
const findMathExpressions = (text: string): MathExpression[] => {
  const mathExpressions: MathExpression[] = [];

  // Find display math: \[ ... \]
  let match;
  while ((match = DISPLAY_MATH_REGEX.exec(text)) !== null) {
    mathExpressions.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1].trim(),
      type: 'display',
      original: match[0]
    });
  }

  // Reset regex state
  DISPLAY_MATH_REGEX.lastIndex = 0;

  // Find inline math: \( ... \)
  while ((match = INLINE_MATH_REGEX.exec(text)) !== null) {
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

  // Reset regex state
  INLINE_MATH_REGEX.lastIndex = 0;

  // Sort by position
  return mathExpressions.sort((a, b) => a.start - b.start);
};

// Helper function to parse content into renderable parts
const parseContent = (text: string): React.ReactNode[] => {
  if (!text || typeof text !== 'string') {
    return [<span key="empty">{text}</span>];
  }

  const mathExpressions = findMathExpressions(text);
  const parts: React.ReactNode[] = [];
  let keyCounter = 0;
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
          <div key={`display-${keyCounter++}`} className="my-4 w-full overflow-x-auto">
            <div className="text-center min-w-fit">
              <BlockMath math={expr.content} />
            </div>
          </div>
        );
      } else {
        parts.push(
          <span key={`inline-${keyCounter++}`} className="inline-math overflow-x-auto inline-block max-w-full">
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
    return [<span key="original">{text}</span>];
  }

  return parts;
};

// Main component implementation
const SimpleMathRendererImpl: React.FC<SimpleMathRendererProps> = ({
  content,
  className = ''
}) => {
  // Memoize the parsing so it only runs when content changes
  const renderedParts = useMemo(() => {
    return parseContent(content);
  }, [content]);

  return (
    <div className={`simple-math-renderer ${className}`}>
      {renderedParts}

      <style jsx global>{`
        .simple-math-renderer .katex {
          font-size: inherit !important;
        }

        .simple-math-renderer .katex-display {
          margin: 1rem 0 !important;
          text-align: center !important;
        }

        .simple-math-renderer .inline-math {
          display: inline-block;
          vertical-align: baseline;
          max-width: 100%;
        }

        .simple-math-renderer .inline-math .katex {
          display: inline;
        }

        .simple-math-renderer .inline-math .katex .katex-html {
          display: inline;
        }

        /* Scrollbar styling for WebKit browsers */
        .simple-math-renderer .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        .simple-math-renderer .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .simple-math-renderer .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }

        .simple-math-renderer .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }

        /* Dark mode scrollbar */
        .dark .simple-math-renderer .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .dark .simple-math-renderer .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
        }

        .dark .simple-math-renderer .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

// Export memoized component that only re-renders when props change
export const SimpleMathRenderer = React.memo(SimpleMathRendererImpl);