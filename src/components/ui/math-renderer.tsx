import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  // Add debugging
  console.log('MathRenderer received content:', content);

  const preprocessContent = (text: string): string => {
    // Replace various mathematical symbols with LaTeX equivalents
    return text
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
  };

  const renderContent = (text: string) => {
    if (!text || typeof text !== 'string') {
      return [<span key="empty"></span>];
    }

    const processedText = preprocessContent(text);
    console.log('Processed text:', processedText);
    
    // Simple approach: split by math delimiters and render accordingly
    const parts: React.ReactNode[] = [];
    let workingText = processedText;
    let keyCounter = 0;

    // Process in order of precedence
    const patterns = [
      { regex: /\\\[([^]*?)\\\]/g, type: 'block' as const, delim: ['\\[', '\\]'] },
      { regex: /\$\$([^]*?)\$\$/g, type: 'block' as const, delim: ['$$', '$$'] },
      { regex: /\\\(([^]*?)\\\)/g, type: 'inline' as const, delim: ['\\(', '\\)'] },
      { regex: /\$([^$\n]*?)\$/g, type: 'inline' as const, delim: ['$', '$'] },
    ];

    // Find all matches first
    const allMatches: Array<{
      start: number;
      end: number;
      content: string;
      type: 'block' | 'inline';
      match: string;
    }> = [];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(workingText)) !== null) {
        // Avoid infinite loops
        if (match[0].length === 0) break;
        
        const start = match.index;
        const end = start + match[0].length;
        const content = match[1]?.trim();
        
        if (content) {
          console.log(`Found ${pattern.type} math:`, content);
          // Check for overlaps
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
      // Reset regex
      pattern.regex.lastIndex = 0;
    });

    console.log('Found math expressions:', allMatches);

    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    
    allMatches.forEach(mathMatch => {
      // Add text before math
      if (mathMatch.start > lastIndex) {
        const textBefore = workingText.slice(lastIndex, mathMatch.start);
        if (textBefore) {
          parts.push(<span key={`text-${keyCounter++}`}>{textBefore}</span>);
        }
      }

      // Add math content
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
        console.warn('Math rendering error:', error, 'for content:', mathMatch.content);
        // Fallback to showing the original text
        parts.push(
          <span 
            key={`error-${keyCounter++}`} 
            className="bg-destructive/10 text-destructive px-2 py-1 rounded font-mono text-sm"
            title={`Math rendering error: ${error}`}
          >
            {mathMatch.match}
          </span>
        );
      }

      lastIndex = mathMatch.end;
    });

    // Add remaining text
    if (lastIndex < workingText.length) {
      const remainingText = workingText.slice(lastIndex);
      if (remainingText) {
        parts.push(<span key={`remaining-${keyCounter++}`}>{remainingText}</span>);
      }
    }

    // If no math was found, return the original text
    if (parts.length === 0) {
      console.log('No math found, returning original text');
      return [<span key="original">{processedText}</span>];
    }

    console.log('Rendered parts:', parts.length);
    return parts;
  };

  return (
    <div className={`math-renderer ${className}`}>
      {renderContent(content)}
    </div>
  );
}; 