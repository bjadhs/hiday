"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useMounted } from "@/lib/hooks/use-mounted"
import { useSettingsStore, themeDefinitions } from "@/lib/stores"

export function ThemeToggle() {
  const { setTheme: setNextTheme } = useTheme()
  const { theme: currentPreset, setTheme: setPreset, lastLightPreset, lastDarkPreset } = useSettingsStore()
  const mounted = useMounted()

  const definition = themeDefinitions[currentPreset]
  const isDark = definition?.isDark ?? false

  const handleLight = () => {
    setNextTheme("light")
    setPreset(lastLightPreset)
  }

  const handleDark = () => {
    setNextTheme("dark")
    setPreset(lastDarkPreset)
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border-2 border-border-strong shadow-brutal-xs">
        <button
          className="flex items-center justify-center size-8 rounded-md transition-all duration-200 text-muted-foreground"
          aria-label="Light mode"
          disabled
        >
          <Sun className="size-4" />
        </button>
        <button
          className="flex items-center justify-center size-8 rounded-md transition-all duration-200 text-muted-foreground"
          aria-label="Dark mode"
          disabled
        >
          <Moon className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg border-2 border-border-strong shadow-brutal-xs">
      <button
        onClick={handleLight}
        className={cn(
          "flex items-center justify-center size-8 rounded-md transition-all duration-200",
          !isDark
            ? "bg-primary-highlight text-white shadow-brutal-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Light mode"
      >
        <Sun className="size-4" />
      </button>
      <button
        onClick={handleDark}
        className={cn(
          "flex items-center justify-center size-8 rounded-md transition-all duration-200",
          isDark
            ? "bg-primary-highlight text-white shadow-brutal-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Dark mode"
      >
        <Moon className="size-4" />
      </button>
    </div>
  )
}
