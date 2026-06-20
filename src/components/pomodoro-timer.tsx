"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings2, Monitor, Circle, Play, Pause, Edit2, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type TimerMode = "digital" | "analog"
type TimerState = "running" | "paused" | "break"

interface Project {
  id: string
  name: string
  icon: string
  color: string
}

interface PomodoroTimerProps {
  /** Currently selected project for pomodoro */
  selectedProject: Project | null
  /** Available projects to switch to */
  projects: Project[]
  /** Callback when project is switched */
  onProjectSwitch?: (projectId: string) => void
  /** Callback when pomodoro session completes */
  onComplete?: () => void
  /** Initial pomodoro duration in minutes (default: 25) */
  pomodoroDuration?: number
  /** Break duration in minutes (default: 5) */
  breakDuration?: number
}

const DEFAULT_POMODORO_MINUTES = 25
const DEFAULT_BREAK_MINUTES = 5

export function PomodoroTimer({
  selectedProject,
  projects,
  onProjectSwitch,
  onComplete,
  pomodoroDuration = DEFAULT_POMODORO_MINUTES,
  breakDuration = DEFAULT_BREAK_MINUTES,
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>("digital")
  const [timerState, setTimerState] = useState<TimerState>("running")
  const [timeLeft, setTimeLeft] = useState(pomodoroDuration * 60)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [sessionTitle, setSessionTitle] = useState<string>("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  // Timer countdown effect - always running by default
  useEffect(() => {
    if (timerState !== "running") return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer completed
          setCompletedSessions((c) => c + 1)
          onComplete?.()
          setTimerState("break")
          return breakDuration * 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState, breakDuration, onComplete])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const progress = timerState === "break" 
    ? 1 - (timeLeft / (breakDuration * 60))
    : 1 - (timeLeft / (pomodoroDuration * 60))

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference * (1 - progress)

  const toggleTimer = () => {
    if (timerState === "running") {
      setTimerState("paused")
    } else if (timerState === "paused") {
      setTimerState("running")
    } else if (timerState === "break") {
      setTimerState("running")
      setTimeLeft(pomodoroDuration * 60)
    }
  }

  const resetTimer = () => {
    setTimerState("running")
    setTimeLeft(pomodoroDuration * 60)
  }

  const skipBreak = () => {
    setTimerState("running")
    setTimeLeft(pomodoroDuration * 60)
  }

  const projectColor = selectedProject?.color || "#8B5CF6"
  const projectName = selectedProject?.name || "Select Project"
  const projectIcon = selectedProject?.icon || "⏱️"
  const displayTitle = sessionTitle || projectName

  const handleEditTitle = () => {
    setEditTitle(sessionTitle)
    setIsEditingTitle(true)
  }

  const handleSaveTitle = () => {
    setSessionTitle(editTitle.trim())
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setIsEditingTitle(false)
    setEditTitle("")
  }

  return (
    <Card className={cn(
      "border-2 border-foreground shadow-brutal transition-all duration-300 overflow-hidden",
      timerState === "running" && "border-primary shadow-brutal-primary",
      timerState === "break" && "border-success shadow-brutal-sm"
    )}>
      <CardContent className="p-3">
        {/* Header Row - Session Title + Edit + Project | POMODORO */}
        <div className="mb-3 pb-2 border-b border-border/50">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={projectName}
                className="flex-1 text-sm font-medium bg-background border-2 border-primary rounded px-2 py-1 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle()
                  if (e.key === "Escape") handleCancelEdit()
                }}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 hover:bg-primary/10 rounded text-primary"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-destructive/10 rounded text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Session Title + Edit + Project + POMODORO all in one row */}
              <button
                onClick={handleEditTitle}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <span className="text-sm font-medium text-foreground truncate">{displayTitle}</span>
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ 
                  backgroundColor: `${projectColor}20`,
                  color: projectColor 
                }}
              >
                {projectName}
              </span>
              <span className="text-xs font-bold text-muted-foreground shrink-0">POMODORO</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Left Side - Timer Display (Centered) */}
          <div className="flex-1 flex items-center justify-center">
            {mode === "digital" ? (
              <div className="text-center">
                <p className={cn(
                  "text-4xl md:text-5xl font-mono font-bold tabular-nums leading-none",
                  timerState === "break" && "text-success"
                )}>
                  {formatTime(timeLeft)}
                </p>
                {completedSessions > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {completedSessions} 🍅 completed
                  </p>
                )}
              </div>
            ) : (
              /* Analog Mode */
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                  {/* Background circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted/30"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    fill="none"
                    stroke={timerState === "break" ? "var(--success)" : projectColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                  {/* Tick marks */}
                  {[...Array(12)].map((_, i) => (
                    <line
                      key={i}
                      x1="45"
                      y1="6"
                      x2="45"
                      y2="10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-foreground/50"
                      transform={`rotate(${i * 30} 45 45)`}
                    />
                  ))}
                  {/* Center dot */}
                  <circle cx="45" cy="45" r="3" fill="currentColor" className="text-foreground" />
                  {/* Minute hand */}
                  <line
                    x1="45"
                    y1="45"
                    x2="45"
                    y2={timerState === "break" ? "20" : "15"}
                    stroke={timerState === "break" ? "var(--success)" : projectColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    transform={`rotate(${(timeLeft % 60) * 6} 45 45)`}
                  />
                  {/* Second hand */}
                  <line
                    x1="45"
                    y1="45"
                    x2="45"
                    y2="12"
                    stroke={timerState === "break" ? "var(--success)" : projectColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    transform={`rotate(${(timeLeft % 60) * 6} 45 45)`}
                  />
                </svg>
                
                {/* Time display in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn(
                    "text-[10px] font-mono font-bold",
                    timerState === "break" && "text-success"
                  )}>
                    {Math.floor(timeLeft / 60)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Project & Controls */}
          <div className="flex flex-col items-end gap-2 min-w-[100px]">
            {/* Project Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto py-1.5 px-2 text-left justify-start w-full border-2 border-transparent hover:border-foreground hover:shadow-brutal-sm hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{projectIcon}</span>
                    <div className="text-left">
                      <p className="text-xs font-medium leading-tight truncate max-w-[80px]">{projectName}</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px] max-h-48 overflow-auto">
                {projects.map((project) => (
                  <DropdownMenuItem 
                    key={project.id}
                    onClick={() => onProjectSwitch?.(project.id)}
                    className={cn(
                      "text-xs cursor-pointer",
                      selectedProject?.id === project.id && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="mr-2">{project.icon}</span>
                    {project.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Controls Row */}
            <div className="flex items-center gap-1">
              {/* Play/Pause Button */}
              {timerState === "break" ? (
                <Button
                  size="sm"
                  onClick={skipBreak}
                  className="h-7 px-2 text-[10px] bg-success text-white border-2 border-success shadow-brutal-xs btn-brutal"
                >
                  Skip
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleTimer}
                  className={cn(
                    "h-7 w-7 p-0 border-2 transition-all duration-200",
                    timerState === "running"
                      ? "border-foreground shadow-brutal-xs hover:shadow-brutal-sm hover:shadow-brutal-dark-sm btn-brutal"
                      : "bg-primary-highlight text-primary-foreground border-primary shadow-brutal-xs hover:shadow-brutal-sm hover:shadow-brutal-dark-sm btn-brutal"
                  )}
                >
                  {timerState === "running" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </Button>
              )}

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 border-2 border-transparent hover:border-foreground hover:shadow-brutal-sm hover:bg-transparent"
                  >
                    <Settings2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem 
                    onClick={() => setMode("digital")}
                    className={cn(
                      "text-xs cursor-pointer",
                      mode === "digital" && "bg-primary/10 text-primary"
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5 mr-2" />
                    Digital
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setMode("analog")}
                    className={cn(
                      "text-xs cursor-pointer",
                      mode === "analog" && "bg-primary/10 text-primary"
                    )}
                  >
                    <Circle className="w-3.5 h-3.5 mr-2" />
                    Analog
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetTimer} className="text-xs cursor-pointer text-destructive">
                    Reset Timer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                timerState === "break" ? "bg-success" : "bg-primary-highlight"
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
