import { cn } from '@/lib/utils';
import type { FeatureCard } from '@/lib/nav-items';

interface FeatureSummaryProps {
  feature: FeatureCard;
  mode: 'signin' | 'signup';
}

/**
 * Compact banner shown above the AuthCard when a visitor arrives from a
 * specific feature (e.g. /login?feature=track). Mirrors the description the
 * /dashboard box showed so the auth screen stays in context.
 */
export function FeatureSummary({ feature, mode }: FeatureSummaryProps) {
  const { label, description, icon: Icon, accent } = feature;

  return (
    <div className='mb-4 w-full rounded-2xl border-2 border-border-strong bg-background-elevated p-4 shadow-brutal-sm'>
      <div className='flex items-start gap-3'>
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border-2',
            accent.badge,
          )}
        >
          <Icon className={cn('size-5', accent.icon)} />
        </div>
        <div className='min-w-0'>
          <p className='text-xs font-bold uppercase tracking-wider text-primary'>
            {mode === 'signup' ? 'Sign up to use' : 'Sign in to use'} · {label}
          </p>
          <p className='mt-1 text-sm leading-relaxed text-foreground-muted'>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
