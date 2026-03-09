"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderInputProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  step?: number
  labels?: Record<number, string>
  className?: string
}

function SliderInput({
  min,
  max,
  value,
  onChange,
  step = 1,
  labels,
  className,
}: SliderInputProps) {
  const steps = React.useMemo(() => {
    const result: number[] = []
    for (let i = min; i <= max; i += step) {
      result.push(i)
    }
    return result
  }, [min, max, step])

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-[#0066FF]">{value}</span>
        {labels?.[value] && (
          <span className="text-sm font-medium text-muted-foreground">
            {labels[value]}
          </span>
        )}
      </div>

      <div className="relative">
        {/* Track background */}
        <div className="relative h-2 w-full rounded-full bg-muted">
          {/* Filled track */}
          <div
            className="absolute h-full rounded-full bg-[#0066FF] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Native range input (invisible, overlaid for interaction) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0066FF] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0066FF] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
        />
      </div>

      {/* Step labels */}
      {labels && (
        <div className="relative flex justify-between px-0">
          {steps.map((stepValue) => (
            <button
              key={stepValue}
              type="button"
              onClick={() => onChange(stepValue)}
              className={cn(
                "flex flex-col items-center gap-0.5 text-xs transition-colors",
                stepValue === value
                  ? "text-[#0066FF] font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  stepValue === value ? "bg-[#0066FF]" : "bg-muted-foreground/40"
                )}
              />
              {labels[stepValue] != null && (
                <span className="mt-0.5 max-w-[60px] text-center leading-tight">
                  {labels[stepValue]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

SliderInput.displayName = "SliderInput"

export { SliderInput }
