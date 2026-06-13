import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { ProductPreview } from '@/components/landing/product-preview';
import {
  Clock,
  BarChart3,
  Target,
  CheckCircle2,
  CalendarRange,
  Smartphone,
  ArrowRight,
  Sparkles,
  Layers,
  Timer,
  Star,
  Zap,
} from 'lucide-react';

const AUDIENCE = [
  'Freelancers',
  'Students',
  'Designers',
  'Developers',
  'Founders',
  'Writers',
  'Consultants',
  'Makers',
  'Researchers',
];

export default function Home() {
  return (
    <main className='min-h-screen w-full flex-1 overflow-x-clip bg-background'>
      <Navbar showGetStarted />

      {/* ════════════════ HERO ════════════════ */}
      <section className='relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20'>
        {/* Aurora blobs */}
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <div className='animate-drift absolute -left-24 top-0 size-[28rem] rounded-full bg-primary/20 blur-[110px]' />
          <div className='animate-drift-slow absolute -right-20 top-32 size-[26rem] rounded-full bg-accent/15 blur-[120px]' />
          <div className='absolute bottom-0 left-1/3 size-[24rem] rounded-full bg-info/10 blur-[120px]' />
        </div>
        {/* Dot grid with faded edges */}
        <div className='bg-dots mask-fade-edges pointer-events-none absolute inset-0 -z-10 opacity-60' />

        <div className='mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]'>
          {/* Copy column */}
          <div className='text-center lg:text-left'>
            <div className='animate-fade-in inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-background-elevated px-4 py-1.5 shadow-brutal-sm'>
              <Sparkles className='size-4 text-primary' />
              <span className='text-sm font-bold text-foreground'>
                Your day, beautifully measured
              </span>
            </div>

            <h1 className='mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl'>
              Know exactly where
              <br className='hidden sm:block' />{' '}
              <span className='gradient-text-primary'>your time goes.</span>
            </h1>

            <p className='mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted lg:mx-0'>
              Hiday is the time tracker for people who care about their hours.
              Start a timer in one tap, run several at once, hit your goals, and
              watch the insights roll in — all in a delightfully fast app.
            </p>

            <div className='mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start'>
              <Link href='/signup' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  className='h-auto w-full gradient-primary border-2 border-border-strong px-8 py-6 text-lg font-bold text-primary-foreground shadow-brutal btn-brutal hover:opacity-95 sm:w-auto'
                >
                  Start tracking free
                  <ArrowRight className='ml-1 size-5' />
                </Button>
              </Link>
              <Link href='/login' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  variant='outline'
                  className='h-auto w-full border-2 border-border-strong bg-background-elevated px-8 py-6 text-lg font-semibold text-foreground shadow-brutal-sm btn-brutal hover:bg-surface sm:w-auto'
                >
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className='mt-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start'>
              <div className='flex -space-x-3'>
                {[
                  'gradient-primary',
                  'bg-accent',
                  'bg-info',
                  'bg-success',
                  'bg-danger',
                ].map((c, i) => (
                  <span
                    key={i}
                    className={`flex size-9 items-center justify-center rounded-full border-2 border-background-elevated ${c} text-xs font-bold text-white shadow-brutal-xs`}
                  >
                    {['A', 'M', 'K', 'S', 'J'][i]}
                  </span>
                ))}
              </div>
              <div className='text-center sm:text-left'>
                <div className='flex items-center justify-center gap-0.5 sm:justify-start'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className='size-4 fill-accent text-accent'
                    />
                  ))}
                </div>
                <p className='mt-1 text-sm font-medium text-foreground-muted'>
                  Loved by{' '}
                  <span className='font-bold text-foreground'>10,000+</span>{' '}
                  focused people
                </p>
              </div>
            </div>
          </div>

          {/* Live product preview */}
          <div className='relative lg:pl-6'>
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* ════════════════ MARQUEE ════════════════ */}
      <section className='border-y-2 border-border-strong bg-surface py-5'>
        <div className='marquee-mask flex overflow-hidden'>
          <div className='animate-marquee flex shrink-0 items-center gap-4 pr-4'>
            {[...AUDIENCE, ...AUDIENCE].map((a, i) => (
              <span
                key={i}
                className='flex shrink-0 items-center gap-2 whitespace-nowrap text-lg font-bold text-foreground-muted'
              >
                {a}
                <span className='size-1.5 rounded-full bg-primary' />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ BENTO FEATURES ════════════════ */}
      <section className='relative px-4 py-24 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='mx-auto max-w-2xl text-center'>
            <span className='inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-background-elevated px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-brutal-xs'>
              <Zap className='size-3.5' />
              Features
            </span>
            <h2 className='mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              Everything you need to{' '}
              <span className='gradient-text-primary'>own your hours</span>
            </h2>
            <p className='mt-4 text-lg leading-relaxed text-foreground-muted'>
              Powerful where it counts, effortless everywhere else. Built to get
              out of your way so you can focus.
            </p>
          </div>

          <div className='mt-14 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-5 md:grid-cols-6'>
            {/* Big — Analytics */}
            <article className='group relative overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated p-7 shadow-brutal card-interactive md:col-span-4 md:row-span-2'>
              <div className='absolute -right-10 -top-10 size-48 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-80' />
              <div className='relative'>
                <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/25'>
                  <BarChart3 className='size-6 text-primary' />
                </div>
                <h3 className='mt-5 text-2xl font-bold text-foreground'>
                  Analytics that actually tell you something
                </h3>
                <p className='mt-2 max-w-md leading-relaxed text-foreground-muted'>
                  Interactive donut charts, weekly trends, and per-task
                  breakdowns. See where the hours really went — and where to win
                  them back.
                </p>

                {/* Mini chart visual */}
                <div className='mt-7 flex items-end gap-3'>
                  <div
                    className='relative size-28 shrink-0 rounded-full'
                    style={{
                      background:
                        'conic-gradient(var(--primary) 0% 42%, var(--accent) 42% 68%, var(--info) 68% 86%, var(--success) 86% 100%)',
                    }}
                  >
                    <div className='absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-background-elevated'>
                      <span className='font-mono text-lg font-bold text-foreground'>
                        38h
                      </span>
                      <span className='text-[10px] font-medium text-foreground-muted'>
                        this week
                      </span>
                    </div>
                  </div>
                  <div className='flex h-28 flex-1 items-end gap-2'>
                    {[40, 65, 35, 80, 55, 72, 90].map((h, i) => (
                      <div
                        key={i}
                        className='flex-1 rounded-md border-2 border-border-strong bg-surface'
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </article>

            {/* Concurrent tracking */}
            <article className='group relative overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated p-7 shadow-brutal card-interactive md:col-span-2'>
              <div className='flex size-12 items-center justify-center rounded-2xl bg-info-bg border-2 border-info-border'>
                <Layers className='size-6 text-info' />
              </div>
              <h3 className='mt-5 text-xl font-bold text-foreground'>
                Track several things at once
              </h3>
              <p className='mt-2 leading-relaxed text-foreground-muted'>
                Run multiple timers in parallel. Real life is concurrent — your
                tracker should be too.
              </p>
            </article>

            {/* One-tap */}
            <article className='group relative overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated p-7 shadow-brutal card-interactive md:col-span-2'>
              <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/25'>
                <Timer className='size-6 text-primary' />
              </div>
              <h3 className='mt-5 text-xl font-bold text-foreground'>
                One-tap start
              </h3>
              <p className='mt-2 leading-relaxed text-foreground-muted'>
                No setup, no friction. Tap to start, tap to stop. Add a note and
                move on.
              </p>
            </article>

            {/* Goals */}
            <article className='group relative overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated p-7 shadow-brutal card-interactive md:col-span-2'>
              <div className='flex size-12 items-center justify-center rounded-2xl bg-success-bg border-2 border-success-border'>
                <Target className='size-6 text-success' />
              </div>
              <h3 className='mt-5 text-xl font-bold text-foreground'>
                Goals that stick
              </h3>
              <p className='mt-2 leading-relaxed text-foreground-muted'>
                Set daily and weekly targets, then watch your progress fill in
                live.
              </p>
            </article>

            {/* History */}
            <article className='group relative overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated p-7 shadow-brutal card-interactive md:col-span-2'>
              <div className='flex size-12 items-center justify-center rounded-2xl bg-danger-bg border-2 border-danger-border'>
                <CalendarRange className='size-6 text-danger' />
              </div>
              <h3 className='mt-5 text-xl font-bold text-foreground'>
                A timeline you can trust
              </h3>
              <p className='mt-2 leading-relaxed text-foreground-muted'>
                Every session, neatly logged. Edit, categorize, and export
                whenever you need.
              </p>
            </article>

            {/* Cross platform — wide */}
            <article className='group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-border-strong bg-background-elevated p-7 shadow-brutal card-interactive md:col-span-2'>
              <div>
                <div className='flex size-12 items-center justify-center rounded-2xl bg-accent/15 border-2 border-warning-border'>
                  <Smartphone className='size-6 text-accent' />
                </div>
                <h3 className='mt-5 text-xl font-bold text-foreground'>
                  Everywhere you are
                </h3>
                <p className='mt-2 leading-relaxed text-foreground-muted'>
                  Web, mobile, and desktop — your data syncs instantly across
                  every device.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className='relative overflow-hidden border-y-2 border-border-strong bg-surface px-4 py-24 sm:px-6 lg:px-8'>
        <div className='bg-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-50' />
        <div className='relative mx-auto max-w-7xl'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              Up and running in a minute
            </h2>
            <p className='mt-4 text-lg leading-relaxed text-foreground-muted'>
              Three steps between you and a clearer picture of your day.
            </p>
          </div>

          <div className='mt-16 grid gap-8 md:grid-cols-3'>
            {[
              {
                n: '1',
                title: 'Create your tasks',
                body: 'Add everything you want to track — work, study, training, side projects. Give them colors and icons.',
              },
              {
                n: '2',
                title: 'Track in one tap',
                body: 'Start a timer instantly. Run a few in parallel and jot notes so future-you remembers.',
              },
              {
                n: '3',
                title: 'See the patterns',
                body: 'Review your week, hit your goals, and steadily build the habits that matter.',
              },
            ].map((step) => (
              <div key={step.n} className='relative text-center'>
                <div className='mx-auto flex size-16 items-center justify-center rounded-2xl gradient-primary border-2 border-border-strong shadow-brutal'>
                  <span className='font-mono text-2xl font-bold text-primary-foreground'>
                    {step.n}
                  </span>
                </div>
                <h3 className='mt-5 text-xl font-bold text-foreground'>
                  {step.title}
                </h3>
                <p className='mx-auto mt-2 max-w-xs leading-relaxed text-foreground-muted'>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ STATS BAND ════════════════ */}
      <section className='px-4 py-20 sm:px-6 lg:px-8'>
        <div className='mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3'>
          {[
            { value: '10K+', label: 'Active trackers' },
            { value: '1.2M+', label: 'Hours logged' },
            { value: '4.9', label: 'Average rating' },
          ].map((s) => (
            <div
              key={s.label}
              className='rounded-2xl border-2 border-border-strong bg-background-elevated p-7 text-center shadow-brutal'
            >
              <div className='font-mono text-4xl font-bold text-primary sm:text-5xl'>
                {s.value}
              </div>
              <div className='mt-2 text-sm font-semibold text-foreground-muted'>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ CTA ════════════════ */}
      <section className='px-4 pb-24 pt-4 sm:px-6 lg:px-8'>
        <div className='relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border-2 border-border-strong gradient-primary p-10 text-center shadow-brutal-xl sm:p-16'>
          {/* decorative rings */}
          <div className='pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-2 border-white/15' />
          <div className='pointer-events-none absolute -bottom-24 -left-10 size-72 rounded-full border-2 border-white/10' />

          <div className='relative'>
            <h2 className='text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl'>
              Take control of your time today
            </h2>
            <p className='mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-white/85'>
              Join thousands of focused people using Hiday to track their hours,
              hit their goals, and build better days.
            </p>

            <div className='mt-9 flex justify-center'>
              <Link href='/signup' className='w-full sm:w-auto'>
                <Button
                  size='lg'
                  className='h-auto w-full border-2 border-border-strong bg-background-elevated px-9 py-6 text-lg font-bold text-foreground shadow-brutal btn-brutal hover:bg-surface sm:w-auto'
                >
                  Get started for free
                  <ArrowRight className='ml-1 size-5' />
                </Button>
              </Link>
            </div>

            <div className='mt-8 flex flex-col items-center justify-center gap-4 text-sm font-medium text-white/85 sm:flex-row sm:gap-7'>
              {[
                'No credit card required',
                'Unlimited tasks',
                'Free forever plan',
              ].map((t) => (
                <div key={t} className='flex items-center gap-2'>
                  <CheckCircle2 className='size-4' />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className='border-t-2 border-border-strong bg-surface px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row'>
          <div className='flex items-center gap-2.5'>
            <div className='flex size-8 items-center justify-center rounded-lg gradient-primary border-2 border-border-strong shadow-brutal-xs'>
              <Clock className='size-4 text-primary-foreground' />
            </div>
            <span className='font-bold tracking-tight text-foreground'>
              Hiday
            </span>
          </div>
          <p className='text-sm text-foreground-muted'>
            © 2026 Hiday. All rights reserved.
          </p>
          <div className='flex items-center gap-6'>
            <Link
              href='/login'
              className='text-sm font-medium text-foreground-muted transition-colors hover:text-foreground'
            >
              Sign in
            </Link>
            <Link
              href='/signup'
              className='text-sm font-medium text-foreground-muted transition-colors hover:text-foreground'
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
