'use client';

interface AppVersionProps {
  version?: string;
}

/**
 * AppVersion
 * 
 * Displays the app version at the bottom of the settings page.
 * 
 * @example
 * ```tsx
 * <AppVersion version="1.0.0" />
 * ```
 */
export function AppVersion({ version = '1.0.0' }: AppVersionProps) {
  return (
    <div className='mt-12 text-center text-sm text-muted-foreground'>
      <p>ATracker v{version}</p>
    </div>
  );
}
