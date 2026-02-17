'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import {
  Play,
  Square,
  ChevronDown,
  Pause,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Pomodoro preset durations in minutes
const POMODORO_PRESETS = [
  { label: '15m', value: 15 },
  { label: '25m', value: 25 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
];

// Format seconds to MM:SS
function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Circular progress component
function CircularProgress({
  progress,
  size = 140,
  strokeWidth = 12,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90 w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border dark:text-border-dark"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Pomodoro Session type for callbacks
export type PomodoroSession = {
  task: Task;
  title: string;
  duration: number; // planned duration in seconds
  elapsed: number;  // actual elapsed in seconds
};

export type PomodoroTimerProps = {
  onComplete?: (session: PomodoroSession) => void;
  onStop?: (session: PomodoroSession) => void;
  defaultTask?: Task;
  defaultDuration?: number;
  className?: string;
  tasks?: Task[];
};

export function PomodoroTimer({
  onComplete,
  onStop,
  defaultTask,
  defaultDuration = 25,
  className,
  tasks: propTasks,
}: PomodoroTimerProps) {
  // Fetch tasks if not provided as prop
  const { data: fetchedTasks = [] } = useTasks();
  const tasks = propTasks || fetchedTasks;
  const firstTask = tasks[0] || { id: 'default', name: 'Task', color: '#8B5CF6', icon: '📝' };
  
  const [duration, setDuration] = useState(defaultDuration);
  const [selectedTask, setSelectedTask] = useState<Task>(defaultTask || firstTask);
  const [sessionTitle, setSessionTitle] = useState(selectedTask.name);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [timeLeft, setTimeLeft] = useState(defaultDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for timer to avoid effect re-runs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onComplete, onStop });
  const sessionDataRef = useRef({ selectedTask, sessionTitle, duration });

  // Keep refs in sync
  useEffect(() => {
    callbacksRef.current = { onComplete, onStop };
  }, [onComplete, onStop]);

  useEffect(() => {
    sessionDataRef.current = { selectedTask, sessionTitle, duration };
  }, [selectedTask, sessionTitle, duration]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer(); // Clear any existing timer
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer complete
          stopTimer();
          setIsRunning(false);
          
          // Call completion callback using ref
          const { selectedTask, sessionTitle, duration } = sessionDataRef.current;
          callbacksRef.current.onComplete?.({
            task: selectedTask,
            title: sessionTitle,
            duration: duration * 60,
            elapsed: duration * 60,
          });
          
          // Reset after completion
          setTimeout(() => {
            resetInternal();
          }, 500);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Handle timer start/pause effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimer();
    } else {
      stopTimer();
    }
    
    return () => {
      stopTimer();
    };
  }, [isRunning, isPaused, startTimer, stopTimer]);

  const resetInternal = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
    const defaultTaskValue = defaultTask || firstTask;
    setSelectedTask(defaultTaskValue);
    setSessionTitle(defaultTaskValue.name);
  }, [duration, defaultTask, firstTask]);

  const handleManualStop = useCallback(() => {
    const elapsed = duration * 60 - timeLeft;
    callbacksRef.current.onStop?.({
      task: selectedTask,
      title: sessionTitle,
      duration: duration * 60,
      elapsed,
    });
    resetInternal();
  }, [duration, timeLeft, selectedTask, sessionTitle, resetInternal]);

  const start = useCallback(() => {
    if (timeLeft === 0) {
      setTimeLeft(duration * 60);
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [duration, timeLeft]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleDurationChange = useCallback((minutes: number) => {
    setDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const handleTaskChange = useCallback((task: Task) => {
    setSelectedTask(task);
    if (sessionTitle === selectedTask.name) {
      setSessionTitle(task.name);
    }
  }, [sessionTitle, selectedTask.name]);

  const startEditingTitle = () => {
    setEditTitle(sessionTitle);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    setSessionTitle(editTitle.trim() || selectedTask.name);
    setIsEditingTitle(false);
  };

  const cancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditTitle('');
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const isCompleted = timeLeft === 0 && !isRunning;

  const cardState = isCompleted
    ? 'completed'
    : isRunning && !isPaused
      ? 'running'
      : isPaused
        ? 'paused'
        : 'idle';

  const cardStyles = {
    completed: 'bg-success-bg dark:bg-success-bg-dark border-success',
    running: 'bg-orange-50 dark:bg-orange-950/20 border-orange-400',
    paused: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400',
    idle: 'bg-surface dark:bg-surface-dark border-border-strong',
  };

  const timeColors = {
    completed: 'text-success',
    running: 'text-orange-600 dark:text-orange-400',
    paused: 'text-yellow-600 dark:text-yellow-400',
    idle: 'text-foreground',
  };

  return (
    <div
      className={cn(
        'p-4 lg:p-5 rounded-xl border-2 shadow-brutal dark:shadow-brutal-dark h-full flex flex-col overflow-hidden',
        cardStyles[cardState],
        className
      )}
    >
      {/* Header - Edit + Session Title + Clickable Task Badge + POMODORO */}
      <div className="w-full mb-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') cancelEditTitle();
              }}
              placeholder={selectedTask.name}
              className="flex-1 min-w-0 px-2 py-1 text-sm font-bold bg-surface dark:bg-surface-dark border-2 border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              onClick={saveTitle}
              className="p-1 rounded-md bg-success text-white hover:bg-success-dark transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={cancelEditTitle}
              className="p-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Edit button */}
            <button
              onClick={startEditingTitle}
              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="Edit session title"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {/* Session Title */}
            <h3 className="text-sm font-bold truncate shrink min-w-0">
              {sessionTitle}
            </h3>
            {/* Task Badge - Clickable Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                  style={{
                    backgroundColor: `${selectedTask.color}20`,
                    color: selectedTask.color,
                  }}
                >
                  {selectedTask.icon} {selectedTask.name}
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-2 border-border-strong dark:border-border-strong-dark shadow-brutal w-44 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-sm"
              >
                {tasks.map((task) => (
                  <DropdownMenuItem
                    key={task.id}
                    onClick={() => handleTaskChange(task)}
                    className={cn(
                      'cursor-pointer flex items-center gap-2 text-sm py-1.5',
                      selectedTask.id === task.id && 'bg-primary/10 font-medium'
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs shrink-0"
                      style={{ backgroundColor: task.color }}
                    >
                      {task.icon}
                    </span>
                    <span className="truncate">{task.name}</span>
                    {selectedTask.id === task.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* POMODORO label */}
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase shrink-0 ml-auto">
              POMODORO
            </span>
          </div>
        )}
      </div>

      {/* Main Content: Centered Circular Timer */}
      <div className="flex items-center justify-center flex-1 py-1">
        <CircularProgress progress={progress} size={140} strokeWidth={12}>
          <div className="text-center">
            <div
              className={cn(
                'text-xl lg:text-2xl font-mono font-bold tracking-tight',
                timeColors[cardState]
              )}
            >
              {formatTimeRemaining(timeLeft)}
            </div>
            {isRunning && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-24">
                {sessionTitle}
              </p>
            )}
          </div>
        </CircularProgress>
      </div>

      {/* Bottom Row: Small Time Dropdown + Start Button */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {/* Duration Selector */}
        {!isRunning ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 px-2.5 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs text-xs font-medium flex items-center justify-center gap-1.5 hover:border-primary/50 transition-colors min-w-[80px]">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{duration}m</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="border-2 border-border-strong dark:border-border-strong-dark shadow-brutal min-w-20 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-sm"
            >
              {POMODORO_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.value}
                  onClick={() => handleDurationChange(preset.value)}
                  className={cn(
                    'cursor-pointer text-xs py-1.5',
                    duration === preset.value && 'bg-primary/10 font-medium'
                  )}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="h-8 px-2.5 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark text-xs flex items-center justify-center gap-1.5 min-w-[80px]">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium">{duration}m</span>
          </div>
        )}

        {/* Action Buttons */}
        {!isRunning ? (
          <button
            onClick={start}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center gap-1"
          >
            <Play className="w-3 h-3 fill-current" />
            Start
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Main control: Pause/Resume */}
            {isPaused ? (
              <button
                onClick={resume}
                className="h-8 px-3 rounded-lg bg-primary text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="text-xs font-semibold">Resume</span>
              </button>
            ) : (
              <button
                onClick={pause}
                className="h-8 px-3 rounded-lg bg-warning text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center gap-1"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span className="text-xs font-semibold">Pause</span>
              </button>
            )}
            {/* Stop button */}
            <button
              onClick={handleManualStop}
              className="h-8 w-8 rounded-lg bg-danger text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center shrink-0"
              title="Stop"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
