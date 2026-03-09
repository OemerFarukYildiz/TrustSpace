"use client"

import * as React from "react"
import { Upload } from "lucide-react"

import { cn } from "@/lib/utils"

export interface FileUploadProps {
  accept?: string
  maxSize?: number
  onUpload: (file: File) => void
  multiple?: boolean
  className?: string
}

function formatAccept(accept: string): string {
  return accept
    .split(",")
    .map((ext) => ext.trim().replace(".", "").toUpperCase())
    .join(", ")
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`
  return `${bytes} Bytes`
}

function FileUpload({
  accept,
  maxSize,
  onUpload,
  multiple = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      if (!files) return
      const fileArray = Array.from(files)
      for (const file of fileArray) {
        if (maxSize && file.size > maxSize) continue
        onUpload(file)
        if (!multiple) break
      }
    },
    [maxSize, multiple, onUpload]
  )

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    },
    []
  )

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    },
    []
  )

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleClick = React.useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      if (inputRef.current) inputRef.current.value = ""
    },
    [handleFiles]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
        isDragging
          ? "border-[#0066FF] bg-[#0066FF]/5"
          : "border-muted-foreground/25 hover:border-[#0066FF]/50 hover:bg-muted/50",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          isDragging ? "bg-[#0066FF]/10" : "bg-muted"
        )}
      >
        <Upload
          className={cn(
            "h-6 w-6",
            isDragging ? "text-[#0066FF]" : "text-muted-foreground"
          )}
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Dateien hierher ziehen oder klicken zum Hochladen
        </p>
        {accept && (
          <p className="text-xs text-muted-foreground">
            Erlaubte Formate: {formatAccept(accept)}
          </p>
        )}
        {maxSize && (
          <p className="text-xs text-muted-foreground">
            {`Maximale Dateigr\u00f6\u00dfe: `}{formatSize(maxSize)}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

FileUpload.displayName = "FileUpload"

export { FileUpload }
