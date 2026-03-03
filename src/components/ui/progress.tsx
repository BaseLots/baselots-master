import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  className?: string
}

function Progress({
  className,
  value,
  max = 100,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 transition-all duration-500 ease-out rounded-full"
        style={{
          background: `linear-gradient(90deg, #FF5722 0%, #FF8A65 100%)`,
          transform: `translateX(-${100 - percentage}%)`,
        }}
      />
    </div>
  )
}

export { Progress }
