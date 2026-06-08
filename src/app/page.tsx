import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { BackgroundPattern } from '@/components/background-pattern';
import {
  Clock,
  BarChart3,
  Target,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Smartphone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <main className='min-h-screen bg-background'>
      {/* Navigation */}
      <Navbar showGetStarted />


      {/* Hero Section */}
      <BackgroundPattern variant="dots">
        <section className='relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden'>
          <div className='absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
          <div className='absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl' />

          <div className='relative max-w-7xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/20 mb-8 animate-fade-in'>
            <Sparkles className='size-4 text-primary' />
            <span className='text-sm font-semibold text-primary'>
              Free to get started
            </span>
          </div>

          <h1 className='text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground'>
            Track Your Time.
            <br />
            <span className='gradient-text-primary'>Build Better Habits.</span>
          </h1>

          <p className='text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto mb-10 leading-relaxed'>
            The modern time tracking app for freelancers, habit-builders, and
            productivity enthusiasts. Simple, fast, and beautifully designed.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <Link href='/signup'>
              <Button
                size='lg'
                className='w-full sm:w-auto gradient-primary hover:opacity-90 text-primary-foreground text-lg px-8 py-6 border-2 border-border-strong shadow-brutal btn-brutal font-semibold'
              >
                Start Tracking Free
                <ArrowRight className='size-5 ml-2' />
              </Button>
            </Link>
            <Link href='/login'>
              <Button
                size='lg'
                variant='outline'
                className='w-full sm:w-auto text-lg px-8 py-6 bg-background-elevated text-foreground border-2 border-border-strong shadow-brutal-sm btn-brutal hover:bg-surface font-semibold'
              >
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 pt-16 border-t border-border'>
            <div>
              <div className='text-3xl sm:text-4xl font-bold text-primary'>
                10K+
              </div>
              <div className='text-sm text-foreground-muted mt-1 font-medium'>
                Active Users
              </div>
            </div>
            <div>
              <div className='text-3xl sm:text-4xl font-bold text-primary'>
                1M+
              </div>
              <div className='text-sm text-foreground-muted mt-1 font-medium'>
                Hours Tracked
              </div>
            </div>
            <div>
              <div className='text-3xl sm:text-4xl font-bold text-primary'>
                4.9
              </div>
              <div className='text-sm text-foreground-muted mt-1 font-medium'>
                App Store Rating
              </div>
            </div>
          </div>
        </div>
      </section>
      </BackgroundPattern>

      {/* Features Grid */}
      <section className='py-24 px-4 sm:px-6 lg:px-8 bg-surface border-t border-border'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 text-foreground'>
              Everything You Need
            </h2>
            <p className='text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed'>
              Powerful features to help you understand where your time goes and
              build lasting habits.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Feature 1 */}
            <div className='p-6 rounded-2xl bg-background border-2 border-border-strong shadow-brutal card-interactive'>
              <div className='size-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4'>
                <Clock className='size-6 text-primary' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                One-Tap Tracking
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Start tracking any task with a single tap. No complicated setup,
                just instant time tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='p-6 rounded-2xl bg-background border-2 border-border-strong shadow-brutal card-interactive'>
              <div className='size-12 rounded-xl bg-success-bg border-2 border-success-border flex items-center justify-center mb-4'>
                <Target className='size-6 text-success' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Goal Setting
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Set daily and weekly goals for your tasks. Build streaks and
                stay motivated with visual progress.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='p-6 rounded-2xl bg-background border-2 border-border-strong shadow-brutal card-interactive'>
              <div className='size-12 rounded-xl bg-info-bg border-2 border-info-border flex items-center justify-center mb-4'>
                <BarChart3 className='size-6 text-info' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Rich Analytics
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Beautiful charts and reports showing where your time goes.
                Interactive donut charts and trend analysis.
              </p>
            </div>

            {/* Feature 4 */}
            <div className='p-6 rounded-2xl bg-background border-2 border-border-strong shadow-brutal card-interactive'>
              <div className='size-12 rounded-xl bg-warning-bg border-2 border-warning-border flex items-center justify-center mb-4'>
                <TrendingUp className='size-6 text-warning' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Streak Tracking
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Build consistency with streak tracking. Daily, goal, and
                category streaks to keep you motivated.
              </p>
            </div>

            {/* Feature 5 */}
            <div className='p-6 rounded-2xl bg-background border-2 border-border-strong shadow-brutal card-interactive'>
              <div className='size-12 rounded-xl bg-danger-bg border-2 border-danger-border flex items-center justify-center mb-4'>
                <Calendar className='size-6 text-danger' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Session History
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Complete history of all your time entries. Edit, categorize, and
                export your data anytime.
              </p>
            </div>

            {/* Feature 6 */}
            <div className='p-6 rounded-2xl bg-background border-2 border-border-strong shadow-brutal card-interactive'>
              <div className='size-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4'>
                <Smartphone className='size-6 text-primary' />
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Cross-Platform
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Works seamlessly on web, mobile, and desktop. Your data syncs
                across all your devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <BackgroundPattern variant="grid">
        <section className='relative py-24 px-4 sm:px-6 lg:px-8'>
          <div className='relative max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4 text-foreground'>
              How It Works
            </h2>
            <p className='text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed'>
              Get started in less than a minute. Three simple steps to better
              time management.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='size-16 rounded-2xl gradient-primary border-2 border-border-strong shadow-brutal flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-primary-foreground'>
                  1
                </span>
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Create Tasks
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Set up tasks for everything you want to track. Work, hobbies,
                exercise - anything goes.
              </p>
            </div>

            <div className='text-center'>
              <div className='size-16 rounded-2xl gradient-primary border-2 border-border-strong shadow-brutal flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-primary-foreground'>
                  2
                </span>
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Track Time
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Tap to start, tap to stop. Add notes to your sessions to
                remember what you worked on.
              </p>
            </div>

            <div className='text-center'>
              <div className='size-16 rounded-2xl gradient-primary border-2 border-border-strong shadow-brutal flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-primary-foreground'>
                  3
                </span>
              </div>
              <h3 className='text-xl font-bold mb-2 text-foreground'>
                Analyze & Improve
              </h3>
              <p className='text-foreground-muted leading-relaxed'>
                Review your patterns, set goals, and build better habits with
                detailed insights.
              </p>
            </div>
          </div>
        </div>
      </section>
      </BackgroundPattern>

      {/* CTA Section */}
      <section className='py-24 px-4 sm:px-6 lg:px-8 bg-surface border-t border-border relative overflow-hidden'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-primary/5 rounded-full blur-3xl' />
        <div className='relative max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4 text-foreground'>
            Ready to Take Control of Your Time?
          </h2>
          <p className='text-lg text-foreground-muted mb-8 max-w-2xl mx-auto leading-relaxed'>
            Join thousands of people who use Hiday to track their time, build
            habits, and achieve their goals.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-8'>
            <Link href='/signup'>
              <Button
                size='lg'
                className='w-full sm:w-auto gradient-primary hover:opacity-90 text-primary-foreground text-lg px-8 py-6 border-2 border-border-strong shadow-brutal btn-brutal font-semibold'
              >
                Get Started for Free
                <ArrowRight className='size-5 ml-2' />
              </Button>
            </Link>
          </div>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-foreground-muted'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-4 text-success' />
              <span>No credit card required</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-4 text-success' />
              <span>Unlimited tasks</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='size-4 text-success' />
              <span>Free forever plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-10 px-4 sm:px-6 lg:px-8 border-t border-border bg-background'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div className='flex items-center gap-2.5'>
              <div className='size-8 rounded-lg gradient-primary border-2 border-border-strong shadow-brutal-xs flex items-center justify-center'>
                <Clock className='size-4 text-primary-foreground' />
              </div>
              <span className='font-bold text-foreground tracking-tight'>
                Hiday
              </span>
            </div>
            <p className='text-sm text-foreground-muted'>
              © 2026 Hiday. All rights reserved.
            </p>
            <div className='flex items-center gap-6'>
              <Link
                href='/login'
                className='text-sm text-foreground-muted hover:text-foreground transition-colors font-medium'
              >
                Sign in
              </Link>
              <Link
                href='/signup'
                className='text-sm text-foreground-muted hover:text-foreground transition-colors font-medium'
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
