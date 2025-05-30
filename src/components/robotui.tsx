'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useInView } from 'react-intersection-observer'
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"

// Lazy load the SplineScene component with SSR disabled
const SplineScene = dynamic(() => import("@/components/ui/splite").then(mod => ({ default: mod.SplineScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse bg-muted rounded-lg w-full h-full"></div>
    </div>
  )
})

export function SplineSceneBasic() {
  const [isMobile, setIsMobile] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true, // Only trigger once when it comes into view
  })

  // Check if screen is mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Don't render on mobile
  if (isMobile) {
    return null
  }

  return (
    <Card className="w-full h-[580px] bg-card border shadow-sm relative overflow-hidden" ref={ref}>
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
      />
      
      <div className="flex h-full">
        {/* Left content - Reduced width to give more space to robot */}
        <div className="w-2/5 p-6 relative z-10 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
            AI Learning Bot
          </h1>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Your intelligent tutoring companion ready to break down complex problems 
            and guide you through step-by-step solutions.
          </p>
        </div>

        {/* Right content - Increased width for better robot visibility */}
        <div className="w-3/5 relative p-4 flex items-center justify-center">
          <div className="w-full h-full max-w-none">
            {inView && (
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}