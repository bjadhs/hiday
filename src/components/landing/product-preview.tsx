'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, Flame, Coffee, Code2, BookOpen } from 'lucide-react';
import { useMounted } from '@/lib/hooks/use-mounted';

/* Format seconds → H:MM:SS with monospace-friendly padding */
function fmt(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const WEEK = [
  { day: 'M', h: 52 },
  { day: 'T', h: 78 },
  { day: 'W', h: 44 },
  { day: 'T', h: 90 },
  { day: 'F', h: 66 },
  { day: 'S', h: 30 },
  { day: 'S', h: 84, today: true },
];

export function ProductPreview() {
  const mounted = useMounted();
  // Seed so SSR and first client render match; only tick after mount.
  const [primary, setPrimary] = useState(6432); // 1:47:12
  const [secondary, setSecondary] = useState(724); // 0:12:04

  useEffect(() => {
    const id = setInterval(() => {
      setPrimary((s) => s + 1);
      setSecondary((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const goal = 78; // % of daily goal

  return (
    <div className='relative mx-auto w-full max-w-md select-none'>
      {/* ── Floating accent card: streak (top-left) ── */}
      <div className='animate-float absolute -left-6 -top-6 z-20 hidden rounded-2xl border-2 border-border-strong bg-background-elevated p-3 shadow-brutal sm:flex sm:items-center sm:gap-2.5'>
        <div className='flex size-9 items-center justify-center rounded-xl bg-accent/15 border-2 border-warning-border'>
          <Flame className='size-4.5 text-accent' />
        </div>
        <div>
          <div className='font-mono text-sm font-bold leading-none text-foreground'>
            14 days
          </div>
          <div className='mt-1 text-[11px] font-medium text-foreground-muted'>
            current streak
          </div>
        </div>
      </div>

      {/* ── Floating accent card: goal ring (bottom-right) ── */}
      <div className='animate-float-delayed absolute -bottom-7 -right-5 z-20 hidden rounded-2xl border-2 border-border-strong bg-background-elevated p-3.5 shadow-brutal sm:block'>
        <div className='flex items-center gap-3'>
          <div className='relative size-14'>
            <div
              className='size-14 rounded-full'
              style={{
                background: `conic-gradient(var(--primary) ${goal}%, var(--surface-elevated) 0)`,
              }}
            />
            <div className='absolute inset-[5px] flex items-center justify-center rounded-full bg-background-elevated'>
              <span className='font-mono text-xs font-bold text-foreground'>
                {goal}%
              </span>
            </div>
          </div>
          <div>
            <div className='text-xs font-bold text-foreground'>Daily goal</div>
            <div className='mt-0.5 font-mono text-[11px] text-foreground-muted'>
              5h 12m / 6h
            </div>
          </div>
        </div>
      </div>

      {/* ── Main app window ── */}
      <div className='relative z-10 overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated shadow-brutal-xl'>
        {/* Window chrome */}
        <div className='flex items-center justify-between border-b-2 border-border bg-surface px-4 py-3'>
          <div className='flex items-center gap-1.5'>
            <span className='size-3 rounded-full border border-border-strong bg-danger' />
            <span className='size-3 rounded-full border border-border-strong bg-accent' />
            <span className='size-3 rounded-full border border-border-strong bg-success' />
          </div>
          <span className='text-xs font-bold tracking-wide text-foreground-muted'>
            Today · {mounted ? 'Live' : '—'}
          </span>
          <span className='flex items-center gap-1.5 rounded-full border border-danger-border bg-danger-bg px-2 py-0.5'>
            <span className='live-dot size-1.5 rounded-full bg-danger' />
            <span className='text-[10px] font-bold uppercase tracking-wider text-danger'>
              REC
            </span>
          </span>
        </div>

        {/* Active focus session */}
        <div className='p-4'>
          <div className='rounded-2xl border-2 border-primary/30 bg-primary/5 p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-center gap-2.5'>
                <div className='flex size-10 items-center justify-center rounded-xl gradient-primary border-2 border-border-strong shadow-brutal-xs'>
                  <Code2 className='size-5 text-primary-foreground' />
                </div>
                <div>
                  <div className='text-sm font-bold text-foreground'>
                    Deep Work
                  </div>
                  <div className='text-xs font-medium text-foreground-muted'>
                    Design system
                  </div>
                </div>
              </div>
              <button
                aria-hidden
                tabIndex={-1}
                className='flex size-9 items-center justify-center rounded-xl border-2 border-border-strong bg-background-elevated shadow-brutal-xs'
              >
                <Pause className='size-4 fill-foreground text-foreground' />
              </button>
            </div>

            <div className='mt-3 flex items-end justify-between'>
              <span
                className='font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums'
                style={{ fontFamily: 'var(--font-family-mono)' }}
              >
                {fmt(primary)}
              </span>
              <span className='flex items-center gap-1.5 text-xs font-semibold text-primary'>
                <span className='live-dot size-2 rounded-full bg-primary' />
                running
              </span>
            </div>
          </div>

          {/* Concurrent session row */}
          <div className='mt-3 flex items-center justify-between rounded-xl border-2 border-border bg-surface px-3.5 py-2.5'>
            <div className='flex items-center gap-2.5'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-info-bg border-2 border-info-border'>
                <Coffee className='size-4 text-info' />
              </div>
              <span className='text-sm font-semibold text-foreground'>
                Inbox &amp; email
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span
                className='font-mono text-sm font-bold text-foreground-muted tabular-nums'
                style={{ fontFamily: 'var(--font-family-mono)' }}
              >
                {fmt(secondary)}
              </span>
              <span className='flex size-6 items-center justify-center rounded-md border-2 border-border-strong bg-background-elevated'>
                <Play className='size-3 fill-foreground text-foreground' />
              </span>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div className='mt-4 rounded-2xl border-2 border-border bg-surface p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <span className='text-xs font-bold text-foreground'>
                This week
              </span>
              <span className='flex items-center gap-1 text-xs font-semibold text-success'>
                <BookOpen className='size-3.5' />
                32h 40m
              </span>
            </div>
            <div className='flex h-24 items-end justify-between gap-2'>
              {WEEK.map((d, i) => (
                <div
                  key={i}
                  className='flex flex-1 flex-col items-center gap-1.5'
                >
                  <div
                    className={`animate-bar w-full rounded-md border-2 border-border-strong ${
                      d.today ? 'gradient-primary' : 'bg-background-elevated'
                    }`}
                    style={{ height: `${d.h}%`, animationDelay: `${i * 80}ms` }}
                  />
                  <span className='text-[10px] font-bold text-foreground-muted'>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
