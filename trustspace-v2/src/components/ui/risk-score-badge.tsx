import * as React from "react"

import { cn, getRiskColor, getRiskLabel, getRiskLevelV2 } from "@/lib/utils"

export interface RiskScoreBadgeProps {
  score: number
  maxScore?: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-2",
} as const

const scoreSizeStyles = {
  sm: "text-xs font-bold",
  md: "text-sm font-bold",
  lg: "text-base font-bold",
} as const

function RiskScoreBadge({
  score,
  maxScore = 75,
  size = "md",
  showLabel = true,
  className,
}: RiskScoreBadgeProps) {
  const isV2 = maxScore === 100

  let colorClasses: string
  let label: string

  if (isV2) {
    const level = getRiskLevelV2(score)
    colorClasses = level.color
    label = level.label
  } else {
    colorClasses = getRiskColor(score)
    label = getRiskLabel(score)
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        sizeStyles[size],
        colorClasses,
        className
      )}
    >
      <span className={scoreSizeStyles[size]}>{score}</span>
      {showLabel && (
        <span className="font-medium">{label}</span>
      )}
    </span>
  )
}

RiskScoreBadge.displayName = "RiskScoreBadge"

export { RiskScoreBadge }
