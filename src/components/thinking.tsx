import { ShiningText } from "@/components/ui/shining-text"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Image, Calculator, FileText, CheckCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Simple Progress component for thinking animation
interface ProgressProps {
  value: number;
  className?: string;
}

const Progress = ({ value, className = "" }: ProgressProps) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className="bg-blue-500 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
};

// Basic Demo component (keeping existing functionality)
const Demo = () => {
    return (
        <>
            <ShiningText text={"AI is thinking..."}/>
        </>
    )
}

// Enhanced thinking component for plugin processing
interface ThinkingAnimationProps {
  message?: string;
  progress?: number;
  processingTime?: number;
  estimatedTimeRemaining?: number;
  isComplete?: boolean;
  hasError?: boolean;
  className?: string;
}

const ThinkingAnimation = ({ 
  message = "AI is thinking...", 
  progress = 0, 
  processingTime = 0,
  estimatedTimeRemaining = 60,
  isComplete = false,
  hasError = false,
  className = ""
}: ThinkingAnimationProps) => {
  const [dots, setDots] = useState("");
  const [currentIcon, setCurrentIcon] = useState(0);

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Icon rotation based on processing stage
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const icons = [
    <Image key="image" className="w-6 h-6 text-blue-500" />,
    <Brain key="brain" className="w-6 h-6 text-purple-500" />,
    <Calculator key="calculator" className="w-6 h-6 text-green-500" />,
    <FileText key="text" className="w-6 h-6 text-orange-500" />
  ];

  const getProgressColor = () => {
    if (hasError) return "bg-red-500";
    if (isComplete) return "bg-green-500";
    if (progress > 80) return "bg-blue-500";
    if (progress > 60) return "bg-purple-500";
    if (progress > 40) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const formatTime = (seconds: number) => {
    return seconds > 0 ? `${seconds}s remaining` : "Almost done...";
  };

  if (hasError) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <motion.div 
              className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Clock className="w-6 h-6 text-red-500" />
            </motion.div>
          </div>
          <div className="text-red-600 font-medium mb-2">Processing Failed</div>
          <div className="text-sm text-gray-600">Please try again</div>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <motion.div 
              className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <CheckCircle className="w-6 h-6 text-green-500" />
            </motion.div>
          </div>
          <motion.div 
            className="text-green-600 font-medium mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Solution Ready!
          </motion.div>
          <motion.div 
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            Analysis completed successfully
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          {/* Animated icon */}
          <div className="flex items-center justify-center mb-4">
            <motion.div 
              className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 360]
              }}
              transition={{ 
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 4, repeat: Infinity, ease: "linear" }
              }}
            >
              <motion.div
                key={currentIcon}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                {icons[currentIcon]}
              </motion.div>
            </motion.div>
          </div>

          {/* Thinking message with animated dots */}
          <div className="mb-4">
            <ShiningText text={message + dots} />
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <Progress 
              value={progress} 
              className="h-2 mb-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress}% complete</span>
              <span>{formatTime(estimatedTimeRemaining)}</span>
            </div>
          </div>

          {/* Processing time */}
          <div className="text-xs text-gray-400">
            Processing for {processingTime}s
          </div>

          {/* Animated thinking dots */}
          <div className="mt-4 flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  Math.floor(processingTime) % 3 === i ? getProgressColor() : 'bg-gray-200'
                }`}
                animate={{
                  scale: Math.floor(processingTime) % 3 === i ? [1, 1.5, 1] : 1,
                  opacity: Math.floor(processingTime) % 3 === i ? [0.5, 1, 0.5] : 0.3
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { Demo, ThinkingAnimation }