'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useSettingsStore, themeDefinitions, type ThemePreset } from '@/lib/stores';

const lightPresets: ThemePreset[] = ['classic', 'warm-paper', 'high-contrast'];
const darkPresets: ThemePreset[] = ['classic-dark', 'midnight-bright', 'ocean-dark'];

function PresetCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: ThemePreset;
  isSelected: boolean;
  onClick: (preset: ThemePreset) => void;
}) {
  const def = themeDefinitions[preset];

  return (
    <button
      type="button"
      onClick={() => onClick(preset)}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all duration-200',
        'bg-surface-elevated border-border-strong hover:border-primary',
        isSelected && 'border-primary shadow-brutal-xs'
      )}
      aria-label={`Select ${def.name} theme`}
      title={def.description}
    >
      <span className="relative flex h-8 w-full items-center justify-center overflow-hidden rounded-md border border-border">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${def.accentColor} 0%, ${def.accentColor}88 100%)`,
          }}
        />
        {isSelected && (
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm">
            <Check className="h-3 w-3" />
          </span>
        )}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {def.name}
      </span>
    </button>
  );
}

export function ThemePresetToggle() {
  const { theme, setTheme } = useSettingsStore();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Light themes</p>
        <div className="grid grid-cols-3 gap-2">
          {lightPresets.map((preset) => (
            <div
              key={preset}
              className="h-[76px] rounded-lg border-2 border-border bg-surface-elevated"
            />
          ))}
        </div>
        <p className="text-sm font-medium text-muted-foreground">Dark themes</p>
        <div className="grid grid-cols-3 gap-2">
          {darkPresets.map((preset) => (
            <div
              key={preset}
              className="h-[76px] rounded-lg border-2 border-border bg-surface-elevated"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Light themes</p>
      <div className="grid grid-cols-3 gap-2">
        {lightPresets.map((preset) => (
          <PresetCard
            key={preset}
            preset={preset}
            isSelected={theme === preset}
            onClick={setTheme}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">Dark themes</p>
      <div className="grid grid-cols-3 gap-2">
        {darkPresets.map((preset) => (
          <PresetCard
            key={preset}
            preset={preset}
            isSelected={theme === preset}
            onClick={setTheme}
          />
        ))}
      </div>
    </div>
  );
}
