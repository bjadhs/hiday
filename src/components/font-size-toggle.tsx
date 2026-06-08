"use client"

import { Type } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useSettingsStore, type FontSize } from "@/lib/stores"

const fontSizeOptions: { value: FontSize; label: string; size: string }[] = [
  { value: "small", label: "Small", size: "text-sm" },
  { value: "medium", label: "Medium", size: "text-base" },
  { value: "large", label: "Large", size: "text-lg" },
]

export function FontSizeToggle() {
  const { fontSize, setFontSize } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show neutral state during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
<<<<<<< HEAD
      <div className="flex items-center gap-1 p-1 bg-surface-elevated dark:bg-surface-elevated-dark rounded-lg border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs">
=======
      <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border-2 border-border-strong shadow-brutal-xs">
>>>>>>> 136810d (feat: Bruddle neo-brutalist theme system, shared auth component, and navbar)
        {fontSizeOptions.map((option) => (
          <button
            key={option.value}
            className="flex items-center justify-center px-3 h-8 rounded-md transition-all duration-200 font-medium text-muted-foreground"
            aria-label={`${option.label} font size`}
            title={`${option.label} font size`}
            disabled
          >
            <Type className={cn("w-4 h-4", option.size)} />
          </button>
        ))}
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="flex items-center gap-1 p-1 bg-surface-elevated dark:bg-surface-elevated-dark rounded-lg border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs">
=======
    <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border-2 border-border-strong shadow-brutal-xs">
>>>>>>> 136810d (feat: Bruddle neo-brutalist theme system, shared auth component, and navbar)
      {fontSizeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setFontSize(option.value)}
          className={cn(
            "flex items-center justify-center px-3 h-8 rounded-md transition-all duration-200 font-medium",
            fontSize === option.value
              ? "bg-primary text-white shadow-brutal-xs"
              : "text-muted-foreground hover:text-foreground",
            option.size
          )}
          aria-label={`${option.label} font size`}
          title={`${option.label} font size`}
        >
          <Type className={cn("w-4 h-4", option.size)} />
        </button>
      ))}
    </div>
  )
}
