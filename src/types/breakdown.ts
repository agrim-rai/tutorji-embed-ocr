export interface SubStep {
  id: string;
  content: string;
  theory?: string;
  isExpanded: boolean;
  isLoadingTheory: boolean;
}

export interface Step {
  id: string;
  content: string;
  subSteps: SubStep[];
  isExpanded: boolean;
  isLoadingSubSteps: boolean;
}

export interface BreakdownResponse {
  success: boolean;
  content?: string;
  type?: 'main' | 'sub' | 'theory' | 'summary';
  error?: string;
  model?: string;
  errorDetails?: string;
  timestamp?: string;
} 