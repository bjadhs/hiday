"use client"

import { Type } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMounted } from "@/lib/hooks/use-mounted"
import { useSettingsStore, type FontSize } from "@/lib/stores"

const fontSizeOptions: { value: FontSize; label: string; size: string }[] = [
  { value: "small", label: "Small", size: "text-sm" },
  { value: "medium", label: "Medium", size: "text-base" },
  { value: "large", label: "Large", size: "text-lg" },
]

export function FontSizeToggle() {
  const { fontSize, setFontSize } = useSettingsStore()
  const mounted = useMounted()

  // Show neutral state during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border-2 border-border-strong shadow-brutal-xs">
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
    <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border-2 border-border-strong shadow-brutal-xs">
      {fontSizeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setFontSize(option.value)}
          className={cn(
            "flex items-center justify-center px-3 h-8 rounded-md transition-all duration-200 font-medium",
            fontSize === option.value
              ? "bg-primary-highlight text-white shadow-brutal-xs"
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
