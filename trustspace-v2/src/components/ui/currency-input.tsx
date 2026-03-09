"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CurrencyInputProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  className?: string
}

function formatGermanNumber(num: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function parseGermanNumber(str: string): number | null {
  if (!str.trim()) return null
  // Remove all dots (thousands separator), replace comma with dot (decimal separator)
  const cleaned = str.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>(
    value != null ? formatGermanNumber(value) : ""
  )
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync display value when prop changes externally and input is not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value != null ? formatGermanNumber(value) : "")
    }
  }, [value, isFocused])

  const handleFocus = React.useCallback(() => {
    setIsFocused(true)
    // Show raw number for easier editing
    if (value != null) {
      setDisplayValue(formatGermanNumber(value))
    }
  }, [value])

  const handleBlur = React.useCallback(() => {
    setIsFocused(false)
    const parsed = parseGermanNumber(displayValue)
    onChange(parsed)
    setDisplayValue(parsed != null ? formatGermanNumber(parsed) : "")
  }, [displayValue, onChange])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayValue(e.target.value)
    },
    []
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur()
      }
    },
    []
  )

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        &euro;
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
    </div>
  )
}

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
