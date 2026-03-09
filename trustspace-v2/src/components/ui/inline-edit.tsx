"use client"

import * as React from "react"
import { Check, Pencil, Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  generateButton?: {
    label: string
    onClick: () => Promise<string>
    loading: boolean
  }
}

function InlineEdit({
  value,
  onSave,
  placeholder = "Klicken zum Bearbeiten...",
  multiline = true,
  className,
  generateButton,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setDraft(value)
  }, [value])

  React.useEffect(() => {
    if (isEditing) {
      if (multiline) {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      } else {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
  }, [isEditing, multiline])

  const handleSave = React.useCallback(() => {
    setIsEditing(false)
    if (draft !== value) {
      onSave(draft)
    }
  }, [draft, value, onSave])

  const handleCancel = React.useCallback(() => {
    setIsEditing(false)
    setDraft(value)
  }, [value])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel()
      }
      if (e.key === "Enter" && !multiline) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === "Enter" && e.metaKey && multiline) {
        e.preventDefault()
        handleSave()
      }
    },
    [handleCancel, handleSave, multiline]
  )

  const handleGenerate = React.useCallback(async () => {
    if (!generateButton) return
    const generated = await generateButton.onClick()
    setDraft(generated)
  }, [generateButton])

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder={placeholder}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0066FF] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#0066FF]/90 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Speichern
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Abbrechen
          </button>
          {generateButton && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateButton.loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles
                className={cn(
                  "h-3.5 w-3.5",
                  generateButton.loading && "animate-spin"
                )}
              />
              {generateButton.label}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setIsEditing(true)
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-md px-3 py-2 transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {value ? (
            <p className="text-sm whitespace-pre-wrap break-words">{value}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">{placeholder}</p>
          )}
        </div>
        <Pencil className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 mt-0.5" />
      </div>
    </div>
  )
}

InlineEdit.displayName = "InlineEdit"

export { InlineEdit }
