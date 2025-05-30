'use client'

import { Suspense, lazy, memo, forwardRef } from 'react'

// Define the Spline props interface to match the library
interface SplineProps {
  scene: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  [key: string]: any
}

// Create a fallback component that matches the expected ForwardRefExoticComponent type
const SplineFallback = forwardRef<HTMLDivElement, SplineProps>(
  ({ className, style, ...props }, ref) => (
    <div ref={ref} className={className} style={style}>
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        <span>3D scene unavailable</span>
      </div>
    </div>
  )
)
SplineFallback.displayName = 'SplineFallback'

// Dynamic import with proper error handling
const Spline = lazy(() => 
  import('@splinetool/react-spline')
    .then(module => ({ default: module.default }))
    .catch(() => ({ default: SplineFallback }))
)

interface SplineSceneProps {
  scene: string
  className?: string
}

export const SplineScene = memo(function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded-lg w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Loading 3D scene...</span>
          </div>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={`${className} w-full h-full object-contain`}
        style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'visible',
          willChange: 'transform', // Optimize for GPU acceleration
        }}
        onLoad={() => {
          // Optional: Add any load optimization here
        }}
      />
    </Suspense>
  )
})