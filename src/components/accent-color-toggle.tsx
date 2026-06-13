'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useSettingsStore, type AccentColor } from '@/lib/stores';

const lightThemes: { value: AccentColor; label: string; color: string }[] = [
  { value: 'violet', label: 'Violet', color: 'bg-violet-600' },
  { value: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
  { value: 'rose', label: 'Rose', color: 'bg-rose-600' },
  { value: 'amber', label: 'Amber', color: 'bg-amber-500' },
];

const darkThemes: { value: AccentColor; label: string; color: string }[] = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'zinc', label: 'Zinc', color: 'bg-zinc-500' },
  { value: 'slate', label: 'Slate', color: 'bg-slate-500' },
];

function ColorSwatch({
  value,
  label,
  color,
  isSelected,
  onClick,
}: {
  value: AccentColor;
  label: string;
  color: string;
  isSelected: boolean;
  onClick: (value: AccentColor) => void;
}) {
  return (
    <button
      type='button'
      onClick={() => onClick(value)}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all duration-200',
        'bg-surface-elevated border-border-strong hover:border-primary',
        isSelected && 'border-primary shadow-brutal-xs'
      )}
      aria-label={`Select ${label} accent color`}
      title={label}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 shadow-sm',
          color
        )}
      >
        {isSelected && (
          <Check className='h-4 w-4 text-white drop-shadow-sm' />
        )}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function AccentColorToggle() {
  const { accentColor, setAccentColor } = useSettingsStore();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className='space-y-3'>
        <p className='text-sm font-medium text-muted-foreground'>Light</p>
        <div className='grid grid-cols-4 gap-2'>
          {lightThemes.map((theme) => (
            <div
              key={theme.value}
              className='h-[76px] rounded-lg border-2 border-border bg-surface-elevated'
            />
          ))}
        </div>
        <p className='text-sm font-medium text-muted-foreground'>Dark</p>
        <div className='grid grid-cols-4 gap-2'>
          {darkThemes.map((theme) => (
            <div
              key={theme.value}
              className='h-[76px] rounded-lg border-2 border-border bg-surface-elevated'
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium text-muted-foreground'>Light themes</p>
      <div className='grid grid-cols-4 gap-2'>
        {lightThemes.map((theme) => (
          <ColorSwatch
            key={theme.value}
            value={theme.value}
            label={theme.label}
            color={theme.color}
            isSelected={accentColor === theme.value}
            onClick={setAccentColor}
          />
        ))}
      </div>
      <p className='text-sm font-medium text-muted-foreground'>Dark themes</p>
      <div className='grid grid-cols-4 gap-2'>
        {darkThemes.map((theme) => (
          <ColorSwatch
            key={theme.value}
            value={theme.value}
            label={theme.label}
            color={theme.color}
            isSelected={accentColor === theme.value}
            onClick={setAccentColor}
          />
        ))}
      </div>
    </div>
  );
}
