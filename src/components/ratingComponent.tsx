import { RadioGroup, RadioGroupItem } from "@/components/ui/rating-radio-grp";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface RatingComponentProps {
  onSubmit?: (rating: number) => void;
  loading?: boolean;
  submitted?: boolean;
  className?: string;
}

function RatingComponent({ 
  onSubmit, 
  loading = false, 
  submitted = false, 
  className = "" 
}: RatingComponentProps) {
  const id = useId();
  const [selectedRating, setSelectedRating] = useState<string>("");

  const items = [
    { value: "1", label: "Poor", icon: "😠" },
    { value: "2", label: "Fair", icon: "🙁" },
    { value: "3", label: "Good", icon: "😐" },
    { value: "4", label: "Great", icon: "🙂" },
    { value: "5", label: "Excellent", icon: "😀" },
  ];

  const handleSubmit = () => {
    if (selectedRating && onSubmit) {
      onSubmit(parseInt(selectedRating));
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4 text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-800 dark:text-green-300">
            Thanks for your feedback!
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-card border rounded-lg p-4 ${className}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Rate this breakdown</h3>
        </div>

        {/* Rating Selection */}
        <div className="flex flex-col items-center gap-3">
          <RadioGroup 
            className="flex gap-2" 
            value={selectedRating}
            onValueChange={setSelectedRating}
          >
            {items.map((item) => (
              <label
                key={`${id}-${item.value}`}
                className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border transition-all hover:scale-110 hover:border-primary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:scale-110"
                title={item.label}
              >
                <RadioGroupItem
                  id={`${id}-${item.value}`}
                  value={item.value}
                  className="sr-only"
                />
                <span className="text-lg">{item.icon}</span>
              </label>
            ))}
          </RadioGroup>

          {/* Submit Button */}
          {selectedRating && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="sm"
              className="px-4 py-1 h-8"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export { RatingComponent };
