import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

interface SuperMathRendererProps {
  content: string;
  className?: string;
}

export const SuperMathRenderer: React.FC<SuperMathRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const [renderingMethod, setRenderingMethod] = useState<'markdown' | 'mathjax' | 'katex' | 'fallback'>('markdown');
  const [processedContent, setProcessedContent] = useState<string>('');

  // MathJax configuration
  const mathJaxConfig = {
    loader: { load: ["input/tex", "output/chtml"] },
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      packages: {'[+]': ['ams', 'newcommand', 'configmacros']},
    },
    options: {
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process'
    },
    chtml: {
      scale: 1,
      minScale: 0.5,
      matchFontHeight: false,
      fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
    }
  };

  // Comprehensive content preprocessing
  const preprocessContent = (text: string): string => {
    if (!text || typeof text !== 'string') return '';

    let processedText = text
      // Fix LaTeX line breaks - replace \[<number>em] with proper line breaks
      .replace(/\\\[(\d+(?:\.\d+)?)em\]/g, '\n\n')
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

    return processedText;
  };

  // ReactMarkdown + KaTeX renderer
  const MarkdownRenderer = ({ content: mdContent }: { content: string }) => {
    try {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <span className="block">{children}</span>,
            span: ({ children, className: spanClassName }) => (
              <span className={`${spanClassName || ''} text-inherit`}>{children}</span>
            ),
            div: ({ children, className: divClassName }) => (
              <div className={`${divClassName || ''} text-inherit`}>{children}</div>
            ),
          }}
        >
          {mdContent}
        </ReactMarkdown>
      );
    } catch (error) {
      console.warn('ReactMarkdown rendering failed:', error);
      return null;
    }
  };

  // MathJax renderer
  const MathJaxRenderer = ({ content: mjContent }: { content: string }) => {
    try {
      return (
        <MathJaxContext config={mathJaxConfig}>
          <MathJax>{mjContent}</MathJax>
        </MathJaxContext>
      );
    } catch (error) {
      console.warn('MathJax rendering failed:', error);
      return null;
    }
  };

  // Manual KaTeX renderer
  const KatexRenderer = ({ content: kContent }: { content: string }) => {
    const parts: React.ReactNode[] = [];
    let workingText = kContent;
    let keyCounter = 0;

    const patterns = [
      { regex: /\\\[([^]*?)\\\]/g, type: 'block' as const },
      { regex: /\$\$([^]*?)\$\$/g, type: 'block' as const },
      { regex: /\\\(([^]*?)\\\)/g, type: 'inline' as const },
      { regex: /\$([^$\n\r]+?)\$/g, type: 'inline' as const },
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
        console.warn('KaTeX rendering error:', error);
        parts.push(
          <span 
            key={`error-${keyCounter++}`} 
            className="bg-amber-100 dark:bg-amber-900/20 px-2 py-1 rounded text-amber-700 dark:text-amber-400 font-mono text-sm"
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

    return parts.length > 0 ? <>{parts}</> : <span>{kContent}</span>;
  };

  // Fallback text renderer
  const FallbackRenderer = ({ content: fallbackContent }: { content: string }) => {
    return <span className="whitespace-pre-wrap">{fallbackContent}</span>;
  };

  useEffect(() => {
    const processed = preprocessContent(content);
    setProcessedContent(processed);
  }, [content]);

  // Try rendering with different methods in order of preference
  const renderWithFallbacks = () => {
    console.log(`Attempting to render with method: ${renderingMethod}`, { processedContent });
    
    try {
      switch (renderingMethod) {
        case 'markdown':
          const markdownResult = <MarkdownRenderer content={processedContent} />;
          if (markdownResult) return markdownResult;
          break;
        case 'mathjax':
          const mathjaxResult = <MathJaxRenderer content={processedContent} />;
          if (mathjaxResult) return mathjaxResult;
          break;
        case 'katex':
          const katexResult = <KatexRenderer content={processedContent} />;
          if (katexResult) return katexResult;
          break;
        case 'fallback':
        default:
          return <FallbackRenderer content={content} />;
      }
      
      // If we reach here, try the next method
      const methods: Array<typeof renderingMethod> = ['markdown', 'mathjax', 'katex'];
      const currentIndex = methods.indexOf(renderingMethod);
      if (currentIndex < methods.length - 1) {
        const nextMethod = methods[currentIndex + 1];
        console.log(`Falling back to method: ${nextMethod}`);
        setRenderingMethod(nextMethod);
        return <div className="text-gray-500">Switching rendering method to {nextMethod}...</div>;
      }
      
      return <FallbackRenderer content={content} />;
      
    } catch (error) {
      console.warn(`Rendering failed with method ${renderingMethod}:`, error);
      
      // Auto-fallback to next method
      const methods: Array<'markdown' | 'mathjax' | 'katex' | 'fallback'> = ['markdown', 'mathjax', 'katex', 'fallback'];
      const currentIndex = methods.indexOf(renderingMethod);
      if (currentIndex < methods.length - 1) {
        const nextMethod = methods[currentIndex + 1];
        console.log(`Error fallback to method: ${nextMethod}`);
        setRenderingMethod(nextMethod);
        return <div className="text-red-500">Error occurred, switching to {nextMethod}...</div>;
      }
      
      return <FallbackRenderer content={content} />;
    }
  };

  return (
    <div className={`super-math-renderer ${className}`} data-render-method={renderingMethod}>
      {renderWithFallbacks()}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2 text-xs text-gray-500">
          <summary>Debug Info</summary>
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div><strong>Original:</strong> <pre className="whitespace-pre-wrap">{content}</pre></div>
            <div><strong>Processed:</strong> <pre className="whitespace-pre-wrap">{processedContent}</pre></div>
            <div><strong>Method:</strong> {renderingMethod}</div>
          </div>
        </details>
      )}
    </div>
  );
}; 