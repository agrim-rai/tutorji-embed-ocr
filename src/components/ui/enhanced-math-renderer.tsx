import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface EnhancedMathRendererProps {
  content: string;
  className?: string;
}

export const EnhancedMathRenderer: React.FC<EnhancedMathRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  // Preprocess content to normalize LaTeX delimiters
  const preprocessContent = (text: string): string => {
    if (!text || typeof text !== 'string') return '';

    // First, replace Unicode symbols with LaTeX
    let processedText = text
      // Greek letters
      .replace(/α/g, '\\alpha')
      .replace(/β/g, '\\beta')
      .replace(/γ/g, '\\gamma')
      .replace(/δ/g, '\\delta')
      .replace(/ε/g, '\\epsilon')
      .replace(/ζ/g, '\\zeta')
      .replace(/η/g, '\\eta')
      .replace(/θ/g, '\\theta')
      .replace(/ι/g, '\\iota')
      .replace(/κ/g, '\\kappa')
      .replace(/λ/g, '\\lambda')
      .replace(/μ/g, '\\mu')
      .replace(/ν/g, '\\nu')
      .replace(/ξ/g, '\\xi')
      .replace(/π/g, '\\pi')
      .replace(/ρ/g, '\\rho')
      .replace(/σ/g, '\\sigma')
      .replace(/τ/g, '\\tau')
      .replace(/υ/g, '\\upsilon')
      .replace(/φ/g, '\\phi')
      .replace(/χ/g, '\\chi')
      .replace(/ψ/g, '\\psi')
      .replace(/ω/g, '\\omega')
      // Capital Greek letters
      .replace(/Γ/g, '\\Gamma')
      .replace(/Δ/g, '\\Delta')
      .replace(/Θ/g, '\\Theta')
      .replace(/Λ/g, '\\Lambda')
      .replace(/Ξ/g, '\\Xi')
      .replace(/Π/g, '\\Pi')
      .replace(/Σ/g, '\\Sigma')
      .replace(/Φ/g, '\\Phi')
      .replace(/Ψ/g, '\\Psi')
      .replace(/Ω/g, '\\Omega')
      // Mathematical symbols
      .replace(/∫/g, '\\int')
      .replace(/∑/g, '\\sum')
      .replace(/∏/g, '\\prod')
      .replace(/∂/g, '\\partial')
      .replace(/∇/g, '\\nabla')
      .replace(/∞/g, '\\infty')
      .replace(/→/g, '\\rightarrow')
      .replace(/←/g, '\\leftarrow')
      .replace(/↔/g, '\\leftrightarrow')
      .replace(/⇒/g, '\\Rightarrow')
      .replace(/⇐/g, '\\Leftarrow')
      .replace(/⇔/g, '\\Leftrightarrow')
      .replace(/≤/g, '\\leq')
      .replace(/≥/g, '\\geq')
      .replace(/≠/g, '\\neq')
      .replace(/≈/g, '\\approx')
      .replace(/≡/g, '\\equiv')
      .replace(/±/g, '\\pm')
      .replace(/∓/g, '\\mp')
      .replace(/×/g, '\\times')
      .replace(/÷/g, '\\div')
      .replace(/√/g, '\\sqrt')
      .replace(/∈/g, '\\in')
      .replace(/∉/g, '\\notin')
      .replace(/⊆/g, '\\subseteq')
      .replace(/⊇/g, '\\supseteq')
      .replace(/∪/g, '\\cup')
      .replace(/∩/g, '\\cap')
      .replace(/∅/g, '\\emptyset')
      .replace(/ℝ/g, '\\mathbb{R}')
      .replace(/ℂ/g, '\\mathbb{C}')
      .replace(/ℕ/g, '\\mathbb{N}')
      .replace(/ℤ/g, '\\mathbb{Z}')
      .replace(/ℚ/g, '\\mathbb{Q}');

    // Normalize LaTeX delimiters for react-markdown
    // Convert \( \) to $ $ for inline math
    processedText = processedText.replace(/\\\((.*?)\\\)/g, '$$$1$$');
    
    // Convert \[ \] to $$ $$ for display math
    processedText = processedText.replace(/\\\[(.*?)\\\]/g, '$$$$$$1$$$$$$');

    return processedText;
  };

  const fallbackRender = (text: string) => {
    console.log('Using fallback renderer for:', text);
    
    const parts: React.ReactNode[] = [];
    let workingText = text;
    let keyCounter = 0;

    // Manual parsing for LaTeX expressions
    const patterns = [
      { regex: /\$\$\$\$([^]*?)\$\$\$\$/g, type: 'block' as const }, // Display math
      { regex: /\$\$([^]*?)\$\$/g, type: 'inline' as const }, // Inline math
      { regex: /\\\[([^]*?)\\\]/g, type: 'block' as const }, // Original LaTeX display
      { regex: /\\\(([^]*?)\\\)/g, type: 'inline' as const }, // Original LaTeX inline
      { regex: /\$([^$\n]+?)\$/g, type: 'inline' as const }, // Single $ inline
    ];

    const allMatches: Array<{
      start: number;
      end: number;
      content: string;
      type: 'block' | 'inline';
      match: string;
    }> = [];

    patterns.forEach(pattern => {
      let match;
      pattern.regex.lastIndex = 0;
      
      while ((match = pattern.regex.exec(workingText)) !== null) {
        if (match[0].length === 0) break;
        
        const start = match.index;
        const end = start + match[0].length;
        const content = match[1]?.trim();
        
        if (content) {
          const hasOverlap = allMatches.some(existing => 
            (start < existing.end && end > existing.start)
          );
          
          if (!hasOverlap) {
            allMatches.push({
              start,
              end,
              content,
              type: pattern.type,
              match: match[0]
            });
          }
        }
      }
    });

    allMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    
    allMatches.forEach(mathMatch => {
      if (mathMatch.start > lastIndex) {
        const textBefore = workingText.slice(lastIndex, mathMatch.start);
        if (textBefore) {
          parts.push(<span key={`text-${keyCounter++}`}>{textBefore}</span>);
        }
      }

      try {
        if (mathMatch.type === 'block') {
          parts.push(
            <div key={`block-${keyCounter++}`} className="my-4 text-center">
              <BlockMath math={mathMatch.content} />
            </div>
          );
        } else {
          parts.push(
            <span key={`inline-${keyCounter++}`} className="mx-1">
              <InlineMath math={mathMatch.content} />
            </span>
          );
        }
      } catch (error) {
        console.warn('Fallback math rendering error:', error);
        parts.push(
          <span 
            key={`error-${keyCounter++}`} 
            className="bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded text-red-600 dark:text-red-400 font-mono text-sm"
            title={`Math error: ${error}`}
          >
            {mathMatch.match}
          </span>
        );
      }

      lastIndex = mathMatch.end;
    });

    if (lastIndex < workingText.length) {
      const remainingText = workingText.slice(lastIndex);
      if (remainingText) {
        parts.push(<span key={`remaining-${keyCounter++}`}>{remainingText}</span>);
      }
    }

    return parts.length > 0 ? parts : [<span key="original">{text}</span>];
  };

  const processedContent = preprocessContent(content);
  
  try {
    // Primary rendering method using react-markdown with math plugins
    return (
      <div className={`enhanced-math-renderer ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Custom rendering for paragraphs to maintain styling
            p: ({ children }) => <span className="block">{children}</span>,
            // Ensure math elements inherit theme colors
            span: ({ children, className: spanClassName }) => (
              <span className={`${spanClassName || ''} text-inherit`}>{children}</span>
            ),
            div: ({ children, className: divClassName }) => (
              <div className={`${divClassName || ''} text-inherit`}>{children}</div>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  } catch (error) {
    console.warn('ReactMarkdown rendering failed, using fallback:', error);
    
    // Fallback to manual rendering
    return (
      <div className={`enhanced-math-renderer fallback ${className}`}>
        {fallbackRender(content)}
      </div>
    );
  }
}; 