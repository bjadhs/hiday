'use client';

import { useUser } from '@/lib/supabase';
import { FeatureFlow } from '@/components/dashboard/feature-flow';

/**
 * DashboardPage
 *
 * A connected map of everything you can do in Hiday. Rather than a flat grid,
 * the pages are laid out as one workflow — Organize → Capture → Manage →
 * Review — with labelled connectors that make the relationships between pages
 * explicit. Every node deep-links to its page; signed-out users are routed to
 * auth carrying the feature context.
 */
export default function DashboardPage() {
  const { user } = useUser();
  const isAuthenticated = !!user;

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-12'>
      <div className='flex flex-1 flex-col p-4 sm:p-6 lg:p-8'>
        {/* Header */}
        <header className='mx-auto w-full max-w-3xl text-center'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
            What you can do in{' '}
            <span className='gradient-text-primary'>Hiday</span>
          </h1>
          <p className='mx-auto mt-2 max-w-xl text-foreground-muted'>
            {isAuthenticated
              ? 'How it all fits together — follow the flow, or jump straight to any tool.'
              : 'How it all fits together — follow the flow, then sign in to start.'}
          </p>
        </header>

        {/* Connected feature flow */}
        <div className='mt-8 lg:mt-10'>
          <FeatureFlow isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </main>
  );
}
