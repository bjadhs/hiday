"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 p-1 bg-surface-elevated dark:bg-surface-elevated-dark rounded-lg border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200",
          theme === "light"
            ? "bg-primary text-white shadow-brutal-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200",
          theme === "dark"
            ? "bg-primary text-white shadow-brutal-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
