'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useActiveSessionsStore } from '@/lib/stores/active-sessions-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useStopSession } from '@/lib/hooks/use-sessions';

function isTypingTarget(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

function isModifier(event: KeyboardEvent) {
  // Cmd on macOS, Ctrl on Windows/Linux
  return event.metaKey || event.ctrlKey;
}

/**
 * useKeyboardShortcuts
 *
 * Global keyboard shortcut handler for Hiday. All action shortcuts use
 * Cmd (macOS) or Ctrl (Windows/Linux) to avoid clashing with browser
 * defaults and to work reliably in Chrome.
 *
 * Supported shortcuts (when not typing in an input):
 * - Cmd/Ctrl+K: Toggle quick navigation command palette
 * - Cmd/Ctrl+/: Open keyboard shortcuts reference
 * - Cmd/Ctrl+Enter: Start or stop the first active session / recent project
 * - Cmd/Ctrl+S: Stop the first active session
 * - Cmd/Ctrl+N: Start a new default session
 * - Cmd/Ctrl+P: Start the pomodoro timer
 * - Esc: Close dialogs, command palette, and clear selection
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const activeSessions = useActiveSessionsStore((state) => state.activeSessions);
  const { removeSession } = useActiveSessionsStore();
  const { closeExpand, cancelEditTitle, cancelPromptNote } = useActiveSessionsStore();
  const { toggleCommandPalette, closeCommandPalette } = useUIStore();

  const stopSessionMutation = useStopSession();

  const stopFirstSession = useCallback(async () => {
    const first = activeSessions[0];
    if (!first) return;
    try {
      await stopSessionMutation.mutateAsync(first.id);
      removeSession(first.id);
    } catch {
      // Mutation errors are surfaced by React Query; no-op here.
    }
  }, [activeSessions, stopSessionMutation, removeSession]);

  const startMostRecentProject = useCallback(() => {
    window.dispatchEvent(new CustomEvent('hiday:start-recent-project'));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Escape always works and closes any open UI.
      if (event.key === 'Escape') {
        closeExpand();
        cancelEditTitle();
        cancelPromptNote();
        closeCommandPalette();
        return;
      }

      // Ignore bare keys and typing targets. All action shortcuts require
      // Cmd/Ctrl so Chrome doesn't trigger browser defaults (new window,
      // save page, etc.).
      if (!isModifier(event) || isTypingTarget(event)) return;

      const key = event.key.toLowerCase();

      // Cmd/Ctrl+K: Toggle command palette
      if (key === 'k') {
        event.preventDefault();
        event.stopPropagation();
        toggleCommandPalette();
        return;
      }

      // Cmd/Ctrl+/ or Cmd/Ctrl+Shift+/ (?) : Open shortcuts reference
      if (key === '/' || key === '?') {
        event.preventDefault();
        event.stopPropagation();
        router.push('/settings?shortcuts=open');
        return;
      }

      // Cmd/Ctrl+Enter: Toggle first active session or start recent project
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const first = activeSessions[0];
        if (first) {
          stopFirstSession();
        } else if (pathname === '/track') {
          startMostRecentProject();
        }
        return;
      }

      // Cmd/Ctrl+S: Stop first active session
      if (key === 's') {
        event.preventDefault();
        event.stopPropagation();
        stopFirstSession();
        return;
      }

      // Cmd/Ctrl+N: Start a new default session
      if (key === 'n') {
        event.preventDefault();
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent('hiday:start-default-session'));
        return;
      }

      // Cmd/Ctrl+P: Start the pomodoro timer
      if (key === 'p') {
        event.preventDefault();
        event.stopPropagation();
        window.dispatchEvent(new CustomEvent('hiday:start-pomodoro'));
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeSessions,
    pathname,
    router,
    stopFirstSession,
    startMostRecentProject,
    closeExpand,
    cancelEditTitle,
    cancelPromptNote,
    toggleCommandPalette,
    closeCommandPalette,
  ]);
}
