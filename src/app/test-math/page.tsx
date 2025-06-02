"use client"

import React from 'react';
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';

const TestMathPage: React.FC = () => {
  const testCases = [
    {
      title: "Basic Variables",
      content: "The variables \\( x \\) and \\( y \\) are related by the equation \\( y = mx + b \\)."
    },
    {
      title: "Display Math Example",
      content: "Step 2: Set up the integral \\[ \\int_0^{\\sqrt{2}} x^3 \\sqrt{3 - x^2} \\, dx \\] to compute the area."
    },
    {
      title: "Problematic Case 1",
      content: "Sub-step 2.2: Set up the integral with the determined limits. Write the integral as \\[ \\int_{0}^{\\sqrt{2}} x^3 \\sqrt{3 - x^2} \\, dx \\] to compute the area under the curve from 0 to √2."
    },
    {
      title: "Problematic Case 2", 
      content: "Sub-step 2.3: Evaluate the integral ∫₀^√2 x³√3 - x² dx using an appropriate method, such as substitution or integration by parts, to find the value of f(√2)."
    },
    {
      title: "Broken Delimiters",
      content: "\\[ some math content \\] and also \\( inline math \\)"
    },
    {
      title: "Missing Backslashes",
      content: "[ x^2 + 2x + 1 ] and ( y = mx + b )"
    },
    {
      title: "Complex Expression",
      content: "The derivative \\( f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} \\) and integration \\[ \\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\]"
    },
    {
      title: "Raw Text from Screenshot",
      content: "Sub-step 1.2: Express (x^2) in terms of (u): since (u = 3 - x^2), it follows that (x^2 = 3 - u)."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Math Rendering Test</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center">
          Testing SimpleMathRenderer with various LaTeX expressions and edge cases
        </p>
        
        <div className="space-y-6">
          {testCases.map((testCase, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">{testCase.title}</h3>
              <div className="bg-muted/20 rounded-lg p-4 border">
                <SimpleMathRenderer 
                  content={testCase.content}
                  className="text-foreground"
                />
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Show raw content & debug info
                </summary>
                <pre className="mt-2 text-xs bg-muted rounded p-2 overflow-x-auto">
                  {testCase.content}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Check browser console for rendering debug info
                </p>
              </details>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Open browser console to see detailed math rendering debug information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestMathPage; 