"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useMounted } from "@/lib/hooks/use-mounted"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  // Show neutral state during SSR to avoid hydration mismatch
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
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center justify-center size-8 rounded-md transition-all duration-200",
          theme === "light"
            ? "bg-primary text-white shadow-brutal-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Light mode"
      >
        <Sun className="size-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center justify-center size-8 rounded-md transition-all duration-200",
          theme === "dark"
            ? "bg-primary text-white shadow-brutal-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Dark mode"
      >
        <Moon className="size-4" />
      </button>
    </div>
  )
}
