import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import {
  Clock,
  BarChart3,
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Smartphone,
} from 'lucide-react';

export default async function Home() {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated, redirect to track page
  if (user) {
    redirect('/track');
  }

  // Landing page for non-authenticated users
  return (
    <main className='min-h-screen bg-background dark:bg-background-dark'>
      {/* Navigation */}
      <nav className='border-b-2 border-border-strong dark:border-border-strong-dark'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center gap-2'>
              <div className='w-10 h-10 rounded-lg bg-primary border-2 border-border-strong dark:border-white/20 shadow-brutal-sm flex items-center justify-center'>
                <Clock className='w-5 h-5 text-white' />
              </div>
              <span className='text-xl font-bold'>Hiday</span>
            </div>
            <div className='flex items-center gap-4'>
              <Link
                href='/login'
                className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
              >
                Sign in
              </Link>
              <Link href='/signup'>
                <Button className='bg-primary hover:bg-primary-dark text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-sm btn-brutal'>
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='py-20 lg:py-32 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border-2 border-primary/20 mb-8'>
            <Zap className='w-4 h-4 text-primary' />
            <span className='text-sm font-medium text-primary'>
              Free to get started
            </span>
          </div>
          <h1 className='text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6'>
            Track Your Time.
            <br />
            <span className='text-primary'>Build Better Habits.</span>
          </h1>
          <p className='text-lg sm:text-xl text-muted-foreground dark:text-muted-foreground-dark max-w-2xl mx-auto mb-10'>
            The modern time tracking app for freelancers, habit-builders, and
            productivity enthusiasts. Simple, fast, and beautifully designed.
          </p>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
            <Link href='/signup'>
              <Button
                size='lg'
                className='w-full sm:w-auto bg-primary hover:bg-primary-dark text-white text-lg px-8 py-6 border-2 border-border-strong dark:border-white/20 shadow-brutal btn-brutal'
              >
                Start Tracking Free
              </Button>
            </Link>
            <Link href='/login'>
              <Button
                size='lg'
                className='w-full sm:w-auto text-lg px-8 py-6 bg-surface-elevated dark:bg-surface-elevated-dark text-foreground dark:text-foreground-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-sm btn-brutal hover:bg-surface dark:hover:bg-surface-dark'
              >
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 pt-16 border-t-2 border-border dark:border-border-dark'>
            <div>
              <div className='text-3xl sm:text-4xl font-bold text-primary'>
                10K+
              </div>
              <div className='text-sm text-muted-foreground mt-1'>
                Active Users
              </div>
            </div>
            <div>
              <div className='text-3xl sm:text-4xl font-bold text-primary'>
                1M+
              </div>
              <div className='text-sm text-muted-foreground mt-1'>
                Hours Tracked
              </div>
            </div>
            <div>
              <div className='text-3xl sm:text-4xl font-bold text-primary'>
                4.9
              </div>
              <div className='text-sm text-muted-foreground mt-1'>
                App Store Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-surface dark:bg-surface-dark border-t-2 border-border dark:border-border-dark'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4'>
              Everything You Need
            </h2>
            <p className='text-lg text-muted-foreground dark:text-muted-foreground-dark max-w-2xl mx-auto'>
              Powerful features to help you understand where your time goes and
              build lasting habits.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Feature 1 */}
            <div className='p-6 rounded-xl bg-background dark:bg-background-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
              <div className='w-12 h-12 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4'>
                <Clock className='w-6 h-6 text-primary' />
              </div>
              <h3 className='text-xl font-bold mb-2'>One-Tap Tracking</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Start tracking any task with a single tap. No complicated setup,
                just instant time tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='p-6 rounded-xl bg-background dark:bg-background-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
              <div className='w-12 h-12 rounded-lg bg-success/20 border-2 border-success/30 flex items-center justify-center mb-4'>
                <Target className='w-6 h-6 text-success-dark' />
              </div>
              <h3 className='text-xl font-bold mb-2'>Goal Setting</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Set daily and weekly goals for your tasks. Build streaks and stay
                motivated with visual progress.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='p-6 rounded-xl bg-background dark:bg-background-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
              <div className='w-12 h-12 rounded-lg bg-info/20 border-2 border-info/30 flex items-center justify-center mb-4'>
                <BarChart3 className='w-6 h-6 text-info-dark' />
              </div>
              <h3 className='text-xl font-bold mb-2'>Rich Analytics</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Beautiful charts and reports showing where your time goes.
                Interactive donut charts and trend analysis.
              </p>
            </div>

            {/* Feature 4 */}
            <div className='p-6 rounded-xl bg-background dark:bg-background-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
              <div className='w-12 h-12 rounded-lg bg-warning/20 border-2 border-warning/30 flex items-center justify-center mb-4'>
                <TrendingUp className='w-6 h-6 text-warning-dark' />
              </div>
              <h3 className='text-xl font-bold mb-2'>Streak Tracking</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Build consistency with streak tracking. Daily, goal, and category
                streaks to keep you motivated.
              </p>
            </div>

            {/* Feature 5 */}
            <div className='p-6 rounded-xl bg-background dark:bg-background-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
              <div className='w-12 h-12 rounded-lg bg-danger/20 border-2 border-danger/30 flex items-center justify-center mb-4'>
                <Calendar className='w-6 h-6 text-danger-dark' />
              </div>
              <h3 className='text-xl font-bold mb-2'>Session History</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Complete history of all your time entries. Edit, categorize, and
                export your data anytime.
              </p>
            </div>

            {/* Feature 6 */}
            <div className='p-6 rounded-xl bg-background dark:bg-background-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
              <div className='w-12 h-12 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4'>
                <Smartphone className='w-6 h-6 text-primary' />
              </div>
              <h3 className='text-xl font-bold mb-2'>Cross-Platform</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Works seamlessly on web, mobile, and desktop. Your data syncs
                across all your devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4'>
              How It Works
            </h2>
            <p className='text-lg text-muted-foreground dark:text-muted-foreground-dark max-w-2xl mx-auto'>
              Get started in less than a minute. Three simple steps to better
              time management.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-16 h-16 rounded-full bg-primary border-2 border-border-strong dark:border-white/20 shadow-brutal flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-white'>1</span>
              </div>
              <h3 className='text-xl font-bold mb-2'>Create Tasks</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Set up tasks for everything you want to track. Work, hobbies,
                exercise - anything goes.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 rounded-full bg-primary border-2 border-border-strong dark:border-white/20 shadow-brutal flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-white'>2</span>
              </div>
              <h3 className='text-xl font-bold mb-2'>Track Time</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Tap to start, tap to stop. Add notes to your sessions to remember
                what you worked on.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 rounded-full bg-primary border-2 border-border-strong dark:border-white/20 shadow-brutal flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl font-bold text-white'>3</span>
              </div>
              <h3 className='text-xl font-bold mb-2'>Analyze & Improve</h3>
              <p className='text-muted-foreground dark:text-muted-foreground-dark'>
                Review your patterns, set goals, and build better habits with
                detailed insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-primary/5 border-t-2 border-primary/20'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4'>
            Ready to Take Control of Your Time?
          </h2>
          <p className='text-lg text-muted-foreground dark:text-muted-foreground-dark mb-8 max-w-2xl mx-auto'>
            Join thousands of people who use Hiday to track their time,
            build habits, and achieve their goals.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-8'>
            <Link href='/signup'>
              <Button
                size='lg'
                className='w-full sm:w-auto bg-primary hover:bg-primary-dark text-white text-lg px-8 py-6 border-2 border-border-strong dark:border-white/20 shadow-brutal btn-brutal'
              >
                Get Started for Free
              </Button>
            </Link>
          </div>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-success-dark' />
              <span>No credit card required</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-success-dark' />
              <span>Unlimited tasks</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-success-dark' />
              <span>Free forever plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 px-4 sm:px-6 lg:px-8 border-t-2 border-border dark:border-border-dark'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-primary border-2 border-border-strong dark:border-white/20 shadow-brutal-xs flex items-center justify-center'>
                <Clock className='w-4 h-4 text-white' />
              </div>
              <span className='font-bold'>Hiday</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              © {new Date().getFullYear()} Hiday. All rights reserved.
            </p>
            <div className='flex items-center gap-6'>
              <Link
                href='/login'
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                Sign in
              </Link>
              <Link
                href='/signup'
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
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
