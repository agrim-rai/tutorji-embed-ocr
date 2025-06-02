# Problem Breakdown System Documentation

## Overview

The Problem Breakdown System is an AI-powered educational tool that analyzes mathematical problems from images and provides step-by-step solutions with detailed explanations. The system uses a hierarchical approach: Main Steps → Sub-steps → Theory Explanations.

## Architecture

### Components

1. **Steps Page** (`src/app/steps/page.tsx`) - Main UI component
2. **Breakdown API** (`/api/breakdown`) - Backend processing endpoint
3. **SimpleMathRenderer** - Mathematical notation rendering component
4. **Type Definitions** (`@/types/breakdown`) - TypeScript interfaces

### Data Flow

```
Image Upload → Base64 Conversion → API Call → AI Processing → Content Parsing → UI Rendering
```

## How It Works

### 1. Image Upload Process

The system accepts mathematical problem images through:
- **Drag & Drop**: Users can drag images directly onto the upload area
- **File Browser**: Click to open file selector
- **File Validation**: Checks file type (image/*) and size (max 5MB)
- **Preview Generation**: Creates thumbnail preview using FileReader API

```javascript
const handleImageUpload = (file: File) => {
  // Validation
  if (!file.type.startsWith('image/')) return;
  if (file.size > 5 * 1024 * 1024) return; // 5MB limit
  
  // Set file and create preview
  setSelectedImage(file);
  const reader = new FileReader();
  reader.onload = (e) => setImagePreview(e.target?.result as string);
  reader.readAsDataURL(file);
};
```

### 2. API Communication

The system makes three types of API calls to `/api/breakdown`:

#### Main Steps Analysis
```javascript
{
  imageData: "data:image/jpeg;base64,/9j/4AAQ...", // Base64 encoded image
  type: "main"
}
```

#### Sub-steps Breakdown
```javascript
{
  stepContext: "Step content requiring further breakdown",
  type: "sub"
}
```

#### Theory Explanation
```javascript
{
  stepContext: "Sub-step content needing theoretical explanation",
  type: "theory"
}
```

### 3. Content Parsing System

The `parseStepsFromContent` function intelligently processes AI responses:

```javascript
const parseStepsFromContent = (content: string): string[] => {
  // 1. Try splitting by double newlines (logical blocks)
  const blocks = content.split('\n\n').filter(block => block.trim());
  
  if (blocks.length > 1) {
    return blocks.map(block => block.trim());
  }
  
  // 2. Smart single-line parsing with mathematical expression detection
  const lines = content.split('\n').filter(line => line.trim());
  const steps: string[] = [];
  let currentStep = '';
  
  for (const line of lines) {
    const isStepHeader = /^(Step|Sub-step|\d+\.|[A-Za-z]\))/.test(line);
    const isMathExpression = /[=∫∑∏√±×÷∞∂∆∇∈∉⊂⊃∪∩∀∃λμπθφψω]/.test(line);
    
    if (isStepHeader && currentStep && !isMathExpression) {
      steps.push(currentStep.trim());
      currentStep = line;
    } else {
      // Group mathematical expressions with their context
      if (isMathExpression && !currentStep.endsWith('\n')) {
        currentStep += '\n\n' + line; // Extra spacing for equations
      } else {
        currentStep += '\n' + line;
      }
    }
  }
  
  return steps;
};
```

#### Key Features:
- **Mathematical Expression Detection**: Recognizes Unicode math symbols, LaTeX syntax, and equation patterns
- **Intelligent Grouping**: Keeps equations with their explanatory text
- **Step Header Recognition**: Identifies new steps vs. continuation of current step
- **Spacing Management**: Adds appropriate spacing around mathematical expressions

### 4. State Management

The system uses React state to manage the breakdown hierarchy:

```typescript
interface Step {
  id: string;
  content: string;
  subSteps: SubStep[];
  isExpanded: boolean;
  isLoadingSubSteps: boolean;
}

interface SubStep {
  id: string;
  content: string;
  theory?: string;
  isExpanded: boolean;
  isLoadingTheory: boolean;
}
```

#### State Updates:
- **Lazy Loading**: Sub-steps and theory are loaded on-demand
- **Expansion States**: Track which sections are expanded/collapsed
- **Loading States**: Show loading indicators during API calls
- **Error Handling**: Display error messages for failed requests

### 5. UI Interactions

#### Main Step Interaction
```javascript
const handleStepClick = (stepId: string) => {
  const step = steps.find(s => s.id === stepId);
  if (step && step.subSteps.length > 0) {
    toggleStepExpansion(stepId); // Expand/collapse existing sub-steps
  } else if (!step.isLoadingSubSteps) {
    handleGetSubSteps(stepId); // Load sub-steps from API
  }
};
```

#### Sub-step Interaction
```javascript
const handleSubStepClick = (stepId: string, subStepId: string) => {
  const subStep = findSubStep(stepId, subStepId);
  if (subStep && subStep.theory) {
    toggleSubStepExpansion(stepId, subStepId); // Toggle theory display
  } else if (!subStep.isLoadingTheory) {
    handleGetTheory(stepId, subStepId); // Load theory from API
  }
};
```

### 6. Mathematical Rendering

The `SimpleMathRenderer` component handles mathematical notation display:
- **Unicode Support**: Renders mathematical symbols correctly
- **LaTeX Integration**: Processes LaTeX syntax for complex expressions
- **Responsive Design**: Adapts to different screen sizes
- **Syntax Highlighting**: Visual distinction for mathematical content

## API Response Format

### Success Response
```typescript
interface BreakdownResponse {
  success: true;
  content: string; // Formatted step content
  metadata?: {
    processingTime: number;
    confidence: number;
  };
}
```

### Error Response
```typescript
interface BreakdownResponse {
  success: false;
  error: string; // Error message for user display
  details?: string; // Technical details for debugging
}
```

## Key Features

### 1. Progressive Disclosure
- Start with high-level main steps
- Drill down into detailed sub-steps
- Access theoretical explanations on demand

### 2. Smart Content Parsing
- Recognizes mathematical expressions
- Groups related content appropriately
- Maintains proper spacing and formatting

### 3. Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly interaction areas

### 4. Error Handling
- Graceful failure modes
- User-friendly error messages
- Retry mechanisms for failed requests

### 5. Performance Optimization
- Lazy loading of content
- Efficient state updates
- Minimal re-renders

## Usage Flow

1. **Upload**: User uploads an image of a mathematical problem
2. **Analysis**: System sends image to AI for main step extraction
3. **Display**: Main steps are displayed with expansion options
4. **Breakdown**: User clicks on steps to get detailed sub-steps
5. **Theory**: User clicks on sub-steps to get theoretical explanations
6. **Navigation**: User can expand/collapse sections as needed

## Error Scenarios

### Image Upload Errors
- Invalid file type → "Please select a valid image file"
- File too large → "Image file size should be less than 5MB"
- Upload failure → "Failed to upload image"

### API Errors
- Network issues → "Network error occurred"
- Processing failures → "Failed to analyze the image"
- Timeout → "Request timeout, please try again"

### Content Parsing Errors
- Empty response → Fallback to original content
- Malformed content → Display raw response with warning
- Partial failures → Show available content with error notice

## Customization Options

### Styling
- CSS custom properties for theming
- Responsive breakpoints
- Animation preferences
- Color scheme variants

### Behavior
- Auto-expansion settings
- Loading timeout values
- Error retry attempts
- Content parsing sensitivity

## Future Enhancements

### Planned Features
1. **Multi-language Support**: Support for problems in different languages
2. **Voice Narration**: Audio explanations for accessibility
3. **Interactive Graphs**: Dynamic mathematical visualizations
4. **Solution Validation**: Step-by-step solution checking
5. **Export Options**: PDF/Word export of complete breakdowns
6. **Collaboration**: Share breakdowns with others
7. **History**: Save and revisit previous problems

### Technical Improvements
1. **Caching**: Cache breakdown results for faster loading
2. **Offline Support**: Work without internet connection
3. **Real-time Collaboration**: Multiple users working on same problem
4. **Advanced Math Rendering**: Support for complex mathematical notation
5. **Performance Monitoring**: Track and optimize response times

## Troubleshooting

### Common Issues

#### Equations Split Across Multiple Steps
- **Cause**: Content parsing treats each line as separate step
- **Solution**: Updated parsing logic groups mathematical expressions with context
- **Prevention**: Use double newlines to separate logical blocks in API responses

#### Loading States Not Clearing
- **Cause**: API errors not properly handled
- **Solution**: Ensure all loading states are reset in finally blocks
- **Prevention**: Add timeout mechanisms for long-running requests

#### Math Rendering Issues
- **Cause**: Unsupported mathematical notation
- **Solution**: Enhance SimpleMathRenderer with additional symbol support
- **Prevention**: Test with diverse mathematical expressions

#### Mobile Interface Problems
- **Cause**: Touch targets too small or spacing issues
- **Solution**: Responsive design improvements and larger touch areas
- **Prevention**: Regular testing on mobile devices

### Debug Tools

1. **Console Logging**: Enable detailed logging for API calls and state changes
2. **React DevTools**: Inspect component state and props
3. **Network Tab**: Monitor API request/response cycles
4. **Performance Tab**: Profile rendering performance

## Conclusion

The Problem Breakdown System provides a sophisticated yet user-friendly approach to mathematical problem solving. Through intelligent content parsing, progressive disclosure, and responsive design, it helps students understand complex problems step by step.

The modular architecture allows for easy maintenance and future enhancements, while the robust error handling ensures a reliable user experience even when things go wrong. 