declare module 'react-katex' {
  import { FC, ReactNode } from 'react';
  
  interface KaTeXProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error | string) => ReactNode;
    settings?: Record<string, any>;
    children?: string;
  }
  
  export const InlineMath: FC<KaTeXProps>;
  export const BlockMath: FC<KaTeXProps>;
} 