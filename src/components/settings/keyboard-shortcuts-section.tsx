'use client';

import { Keyboard } from 'lucide-react';
import { SettingsSection } from './settings-section';

const shortcuts = [
  { keys: ['Space'], description: 'Start or stop the most recent task from the Track page' },
  { keys: ['S'], description: 'Stop the first active session' },
  { keys: ['N'], description: 'Focus the new task input on the Tasks page' },
  { keys: ['?'], description: 'Open or close this keyboard shortcuts reference' },
  { keys: ['Esc'], description: 'Close dialogs and clear selection' },
  { keys: ['Cmd', 'K'], description: 'Open quick navigation (reserved)' },
  { keys: ['Cmd', 'N'], description: 'Start a new default session' },
  { keys: ['Cmd', 'P'], description: 'Start the pomodoro timer' },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className='inline-flex min-w-[1.5rem] items-center justify-center rounded-md border-2 border-border-strong bg-surface-elevated px-2 py-0.5 text-xs font-bold text-foreground shadow-brutal-xs'>
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsSection() {
  return (
    <SettingsSection title='Keyboard Shortcuts' icon={Keyboard}>
      <div className='grid gap-3'>
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className='flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0'
          >
            <span className='text-sm text-muted-foreground'>
              {shortcut.description}
            </span>
            <div className='flex flex-shrink-0 items-center gap-1'>
              {shortcut.keys.map((key, keyIndex) => (
                <span key={keyIndex} className='flex items-center gap-1'>
                  <Kbd>{key}</Kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className='text-muted-foreground'>+</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
