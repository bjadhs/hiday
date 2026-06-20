'use client';

import { Loader2 } from 'lucide-react';
import { useTrackPage } from '@/lib/hooks/use-track-page';
import {
  ActiveTimerCard,
  ProjectsGrid,
  TodaySessions,
  PomodoroTimer,
  SessionEditDialog,
} from '@/components/track';

/**
 * TrackPage
 * 
 * The main tracking interface with three main sections:
 * 1. Active Timer Card - Shows current active sessions or ready state with recent projects/sessions
 * 2. Projects Grid - Quick start/stop for projects
 * 3. Today's Sessions - List of completed sessions today
 */
export default function TrackPage() {
  const {
    activeSessions,
    editingSession,
    isEditDialogOpen,
    projects,
    todaySessions,
    isLoadingProjects,
    isLoadingSessions,
    projectsError,
    startSessionMutation,
    stopSessionMutation,
    recentProjects,
    startProject,
    stopSession,
    updateSession,
    handleEditSession,
    handleCloseEditDialog,
    refetchTodaySessions,
    firstProject,
  } = useTrackPage();

  // Loading state
  if (isLoadingProjects || isLoadingSessions) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (projectsError) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load projects</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pb-20 lg:pb-0">
      <div className="flex-1 p-4 lg:p-8">
        {/* Row 1: Timer Cards Grid - Fixed height 280px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6 h-[280px] items-start">
          {/* Active Timer Card - Fixed height with concurrent sessions */}
          <ActiveTimerCard
            firstProject={firstProject}
            recentProjects={recentProjects}
            todaySessions={todaySessions}
            onStartProject={startProject}
            onStopSession={stopSession}
            onUpdateSession={updateSession}
            isStarting={startSessionMutation.isPending}
            isStopping={stopSessionMutation.isPending}
            projects={projects}
          />

          {/* Pomodoro Timer Card - Fixed height */}
          <PomodoroTimer
            onComplete={async () => {
              refetchTodaySessions();
            }}
            onStop={async () => {
              refetchTodaySessions();
            }}
          />
        </div>

        {/* Row 2: Projects and Today's Sessions - Fixed height 400px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6 h-[400px] mt-6 items-start">
          {/* Projects Grid - Left side */}
          <ProjectsGrid
            projects={projects}
            activeSessions={activeSessions}
            onStartProject={startProject}
            onStopSession={stopSession}
            isPending={startSessionMutation.isPending || stopSessionMutation.isPending}
          />

          {/* Today's Sessions - Right side */}
          <TodaySessions
            sessions={todaySessions}
            onEditSession={handleEditSession}
          />
        </div>
      </div>

      {/* Edit Session Dialog */}
      <SessionEditDialog
        session={editingSession}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />


    </main>
  );
}
