"use client"

import React, { useState, useRef } from 'react';
import { Step, SubStep, BreakdownResponse } from '@/types/breakdown';
import { ChevronDown, ChevronRight, Loader2, Plus, FileText, Upload, Image as ImageIcon, X, Sparkles, Brain, Target, XCircle, CheckCircle, MoreHorizontal } from 'lucide-react';
import { SimpleMathRenderer } from '@/components/ui/simple-math-renderer';
import { motion, AnimatePresence } from 'framer-motion';

const StepsPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoadingMainSteps, setIsLoadingMainSteps] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const parseStepsFromContent = (content: string): string[] => {
    if (!content || !content.trim()) {
      return [];
    }
    
    // First, try splitting by double newlines to get logical blocks
    const blocks = content.split('\n\n').filter(block => block.trim());
    
    if (blocks.length > 1) {
      // Check if blocks contain complete step entries
      const completeSteps: string[] = [];
      let currentStep = '';
      
      for (const block of blocks) {
        const isStepStart = /^(Step|Sub-step)\s+\d+(\.\d+)?:/i.test(block.trim());
        
        if (isStepStart && currentStep) {
          // Save previous step and start new one
          completeSteps.push(currentStep.trim());
          currentStep = block;
        } else if (isStepStart) {
          // Start first step
          currentStep = block;
        } else {
          // Continuation of current step
          if (currentStep) {
            currentStep += '\n\n' + block;
          } else {
            currentStep = block;
          }
        }
      }
      
      // Add the last step
      if (currentStep) {
        completeSteps.push(currentStep.trim());
      }
      
      return completeSteps.length > 0 ? completeSteps : blocks.map(block => block.trim());
    }
    
    // If no double newlines, split by lines and group manually
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 1) {
      // Single line content
      return [content.trim()];
    }
    
    const steps: string[] = [];
    let currentStep = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new step (strict matching for sub-steps)
      const isNewStepStart = /^(Step|Sub-step)\s+\d+(\.\d+)?:/i.test(line);
      
      if (isNewStepStart && currentStep) {
        // Save previous step and start new one
        steps.push(currentStep.trim());
        currentStep = line;
      } else {
        // Add to current step
        if (currentStep) {
          currentStep += '\n' + line;
        } else {
          currentStep = line;
        }
      }
    }
    
    // Add the last step
    if (currentStep) {
      steps.push(currentStep.trim());
    }
    
    return steps.length > 0 ? steps : [content.trim()];
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image file size should be less than 5MB');
      return;
    }

    setSelectedImage(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitProblem = async () => {
    if (!selectedImage) {
      setError('Please upload an image to analyze');
      return;
    }

    setIsLoadingMainSteps(true);
    setError('');
    setSteps([]);

    try {
      const imageBase64 = await convertImageToBase64(selectedImage);
      
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageBase64,
          type: 'main'
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success && data.content) {
        const stepContents = parseStepsFromContent(data.content);
        const newSteps: Step[] = stepContents.map(content => ({
          id: generateUniqueId(),
          content,
          subSteps: [],
          isExpanded: false,
          isLoadingSubSteps: false,
        }));
        setSteps(newSteps);
      } else {
        setError(data.error || 'Failed to analyze the image');
      }
    } catch (err) {
      setError('Network error occurred or failed to process image');
    } finally {
      setIsLoadingMainSteps(false);
    }
  };

  const handleGetSubSteps = async (stepId: string) => {
    console.log(`[Frontend] Getting sub-steps for step ID: ${stepId}`);
    
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? { ...step, isLoadingSubSteps: true }
          : step
      )
    );

    const step = steps.find(s => s.id === stepId);
    if (!step) {
      console.error(`[Frontend] Step not found: ${stepId}`);
      return;
    }

    console.log(`[Frontend] Step content: ${step.content.substring(0, 100)}...`);

    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepContext: step.content,
          type: 'sub'
        }),
      });

      const data: BreakdownResponse = await response.json();
      console.log(`[Frontend] Sub-steps API response:`, data);

      if (data.success && data.content) {
        const subStepContents = parseStepsFromContent(data.content);
        console.log(`[Frontend] Parsed sub-steps:`, subStepContents);
        
        const newSubSteps: SubStep[] = subStepContents.map(content => ({
          id: generateUniqueId(),
          content,
          theory: undefined,
          isExpanded: false,
          isLoadingTheory: false,
        }));

        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: newSubSteps,
                  isExpanded: true,
                  isLoadingSubSteps: false,
                }
              : step
          )
        );
      } else {
        console.error(`[Frontend] Sub-steps API failed:`, data.error, data.errorDetails);
        setError(data.error || 'Failed to get sub-steps');
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? { ...step, isLoadingSubSteps: false }
              : step
          )
        );
      }
    } catch (err) {
      console.error(`[Frontend] Network error getting sub-steps:`, err);
      setError('Network error occurred');
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? { ...step, isLoadingSubSteps: false }
            : step
        )
      );
    }
  };

  const handleGetTheory = async (stepId: string, subStepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              subSteps: step.subSteps.map(subStep =>
                subStep.id === subStepId
                  ? { ...subStep, isLoadingTheory: true }
                  : subStep
              ),
            }
          : step
      )
    );

    const step = steps.find(s => s.id === stepId);
    const subStep = step?.subSteps.find(s => s.id === subStepId);
    if (!subStep) return;

    try {
      const response = await fetch('/api/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepContext: subStep.content,
          type: 'theory'
        }),
      });

      const data: BreakdownResponse = await response.json();

      if (data.success && data.content) {
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: step.subSteps.map(subStep =>
                    subStep.id === subStepId
                      ? {
                          ...subStep,
                          theory: data.content,
                          isExpanded: true,
                          isLoadingTheory: false,
                        }
                      : subStep
                  ),
                }
              : step
          )
        );
      } else {
        setError(data.error || 'Failed to get theory explanation');
        setSteps(prevSteps =>
          prevSteps.map(step =>
            step.id === stepId
              ? {
                  ...step,
                  subSteps: step.subSteps.map(subStep =>
                    subStep.id === subStepId
                      ? { ...subStep, isLoadingTheory: false }
                      : subStep
                  ),
                }
              : step
          )
        );
      }
    } catch (err) {
      setError('Network error occurred');
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {
                ...step,
                subSteps: step.subSteps.map(subStep =>
                  subStep.id === subStepId
                    ? { ...subStep, isLoadingTheory: false }
                    : subStep
                ),
              }
            : step
        )
      );
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? { ...step, isExpanded: !step.isExpanded }
          : step
      )
    );
  };

  const toggleSubStepExpansion = (stepId: string, subStepId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              subSteps: step.subSteps.map(subStep =>
                subStep.id === subStepId
                  ? { ...subStep, isExpanded: !subStep.isExpanded }
                  : subStep
              ),
            }
          : step
      )
    );
  };

  const handleStepClick = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step && step.subSteps.length > 0) {
      toggleStepExpansion(stepId);
    } else if (step && step.subSteps.length === 0 && !step.isLoadingSubSteps) {
      handleGetSubSteps(stepId);
    }
  };

  const handleSubStepClick = (stepId: string, subStepId: string) => {
    const step = steps.find(s => s.id === stepId);
    const subStep = step?.subSteps.find(s => s.id === subStepId);
    if (subStep && subStep.theory) {
      toggleSubStepExpansion(stepId, subStepId);
    } else if (subStep && !subStep.theory && !subStep.isLoadingTheory) {
      handleGetTheory(stepId, subStepId);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="relative z-10 min-h-screen py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl border border-primary/20 backdrop-blur-sm">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent px-2">
              Problem Breakdown Assistant
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Upload an image of your problem and get AI-powered step-by-step breakdown with mathematical precision
            </p>
          </motion.div>

          {/* Image Upload Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-lg"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-2xl font-semibold text-card-foreground">
                Upload Problem Image
              </h2>
            </div>
            
            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <motion.div
                  animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <ImageIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 sm:mb-6" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Drop your image here
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                  or click to browse • Supports JPG, PNG, GIF up to 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base">
                  <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Choose Image
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="relative inline-block rounded-lg sm:rounded-xl overflow-hidden shadow-lg max-w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-60 sm:max-h-80 object-contain bg-muted/20"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full p-1.5 sm:p-2 transition-colors shadow-lg"
                  >
                    <X size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Ready for analysis</p>
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{selectedImage?.name}</p>
                </div>
              </motion.div>
            )}

            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6 sm:mt-8"
              >
                <button
                  onClick={handleSubmitProblem}
                  disabled={isLoadingMainSteps}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:from-muted disabled:to-muted text-primary-foreground font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg disabled:shadow-none text-sm sm:text-base"
                >
                  {isLoadingMainSteps ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                      Analyzing image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Analyze Image & Break Down Problem
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl mb-6 sm:mb-8 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                  <span className="text-sm sm:text-base">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steps Display */}
          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-semibold text-card-foreground">
                    Step-by-Step Breakdown
                  </h2>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {steps.map((step, stepIndex) => (
                    <motion.div 
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: stepIndex * 0.1 }}
                      className="border border-border rounded-lg sm:rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm step-container"
                    >
                      {/* Main Step */}
                      <div className="bg-muted/20 border-b border-border">
                        <div className="p-3 sm:p-4 md:p-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <motion.button
                              animate={{ rotate: step.isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-0.5 sm:mt-1 text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0"
                              disabled={step.subSteps.length === 0 && !step.isLoadingSubSteps}
                              onClick={() => handleStepClick(step.id)}
                            >
                              <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                            </motion.button>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleStepClick(step.id)}
                            >
                              <SimpleMathRenderer 
                                content={step.content} 
                                className="text-foreground font-medium leading-relaxed break-words text-sm sm:text-base" 
                              />
                            </div>
                            {/* Mobile: Compact action button */}
                            <div className="flex-shrink-0 self-start sm:hidden">
                              <button
                                onClick={() => handleGetSubSteps(step.id)}
                                disabled={step.isLoadingSubSteps || step.subSteps.length > 0}
                                className="bg-primary/10 hover:bg-primary/20 disabled:bg-muted text-primary disabled:text-muted-foreground p-2 rounded-lg transition-all duration-200 border border-primary/20 disabled:border-muted"
                              >
                                {step.isLoadingSubSteps ? (
                                  <Loader2 className="animate-spin w-4 h-4" />
                                ) : step.subSteps.length > 0 ? (
                                  <CheckCircle size={16} />
                                ) : (
                                  <MoreHorizontal size={16} />
                                )}
                              </button>
                            </div>
                            {/* Desktop: Full action button */}
                            <div className="flex-shrink-0 self-start hidden sm:block">
                              <button
                                onClick={() => handleGetSubSteps(step.id)}
                                disabled={step.isLoadingSubSteps || step.subSteps.length > 0}
                                className="bg-primary/10 hover:bg-primary/20 disabled:bg-muted text-primary disabled:text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-primary/20 disabled:border-muted whitespace-nowrap"
                              >
                                {step.isLoadingSubSteps ? (
                                  <Loader2 className="animate-spin w-4 h-4" />
                                ) : step.subSteps.length > 0 ? (
                                  <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                                ) : (
                                  <Plus size={14} className="sm:w-4 sm:h-4" />
                                )}
                                {step.subSteps.length > 0 ? 'Expanded' : 'Further Breakdown'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sub Steps */}
                      <AnimatePresence>
                        {step.isExpanded && step.subSteps.length > 0 && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            {step.subSteps.map((subStep, subStepIndex) => (
                              <motion.div 
                                key={subStep.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: subStepIndex * 0.05 }}
                                className="border-b border-border/50 last:border-b-0 step-container"
                              >
                                {/* Sub Step Header */}
                                <div className="bg-card/20">
                                  <div className="p-3 sm:p-4 md:p-6 pl-6 sm:pl-8 md:pl-12">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                      <motion.button
                                        animate={{ rotate: subStep.isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-0.5 sm:mt-1 text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0"
                                        disabled={!subStep.theory && !subStep.isLoadingTheory}
                                        onClick={() => handleSubStepClick(step.id, subStep.id)}
                                      >
                                        <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                      </motion.button>
                                      <div 
                                        className="flex-1 min-w-0 cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => handleSubStepClick(step.id, subStep.id)}
                                      >
                                        <SimpleMathRenderer 
                                          content={subStep.content} 
                                          className="text-muted-foreground leading-relaxed break-words text-sm sm:text-base" 
                                        />
                                      </div>
                                      {/* Mobile: Compact theory button */}
                                      <div className="flex-shrink-0 self-start sm:hidden">
                                        <button
                                          onClick={() => handleGetTheory(step.id, subStep.id)}
                                          disabled={subStep.isLoadingTheory || !!subStep.theory}
                                          className="bg-secondary/50 hover:bg-secondary/70 disabled:bg-muted text-secondary-foreground disabled:text-muted-foreground p-2 rounded-lg transition-all duration-200 border border-secondary/20 disabled:border-muted"
                                        >
                                          {subStep.isLoadingTheory ? (
                                            <Loader2 className="animate-spin w-4 h-4" />
                                          ) : subStep.theory ? (
                                            <CheckCircle size={14} />
                                          ) : (
                                            <FileText size={14} />
                                          )}
                                        </button>
                                      </div>
                                      {/* Desktop: Full theory button */}
                                      <div className="flex-shrink-0 self-start hidden sm:block">
                                        <button
                                          onClick={() => handleGetTheory(step.id, subStep.id)}
                                          disabled={subStep.isLoadingTheory || !!subStep.theory}
                                          className="bg-secondary/50 hover:bg-secondary/70 disabled:bg-muted text-secondary-foreground disabled:text-muted-foreground px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-secondary/20 disabled:border-muted whitespace-nowrap"
                                        >
                                          {subStep.isLoadingTheory ? (
                                            <Loader2 className="animate-spin w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                                          ) : subStep.theory ? (
                                            <CheckCircle size={12} className="sm:w-[14px] sm:h-[14px]" />
                                          ) : (
                                            <FileText size={12} className="sm:w-[14px] sm:h-[14px]" />
                                          )}
                                          {subStep.theory ? 'Theory Loaded' : 'Get Explanation'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Theory Explanation */}
                                <AnimatePresence>
                                  {subStep.isExpanded && subStep.theory && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-3 sm:p-4 md:p-6 pl-8 sm:pl-12 md:pl-16 bg-primary/5 border-l-2 sm:border-l-4 border-primary/30">
                                        <div className="bg-card/40 rounded-lg p-3 sm:p-4 border border-border/50">
                                          <SimpleMathRenderer 
                                            content={subStep.theory} 
                                            className="text-muted-foreground leading-relaxed text-sm sm:text-base" 
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
export default StepsPage;