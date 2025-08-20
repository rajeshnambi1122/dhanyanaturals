"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className={cn("animate-spin", sizeClasses[size], className)}>
      <div className="w-full h-full border-2 border-green-200 border-t-green-600 rounded-full"></div>
    </div>
  )
}
