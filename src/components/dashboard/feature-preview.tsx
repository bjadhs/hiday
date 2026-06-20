'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowUpRight, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeatureCard } from '@/lib/nav-items';
import { FeatureFlow } from './feature-flow';

interface FeaturePreviewProps {
  feature: FeatureCard;
  isAuthenticated: boolean;
}

/**
 * FeaturePreview
 *
 * The page a signed-out visitor lands on when they tap a sidebar item
 * (`/explore/<key>`). The sidebar stays visible; the main area shows what the
 * feature does — description, a sample screenshot and the same flow diagram as
 * /dashboard but with this feature highlighted in context — plus a sign-in CTA.
 * Signed-in visitors get a direct "Open" shortcut instead.
 */
export function FeaturePreview({ feature, isAuthenticated }: FeaturePreviewProps) {
  const { key, label, description, image, icon: Icon, accent } = feature;
  const [imageOk, setImageOk] = useState(true);

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-12'>
      <div className='mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8'>
        {/* Back to the overview */}
        <Link
          href='/dashboard'
          className='inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground'
        >
          <ArrowLeft className='size-4' />
          All features
        </Link>

        {/* Hero: copy + screenshot */}
        <div className='mt-6 grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10'>
          {/* Copy + CTAs */}
          <div className='order-2 lg:order-1'>
            <div className='flex items-center gap-3'>
              <div
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-xl border-2',
                  accent.badge,
                )}
              >
                <Icon className={cn('size-6', accent.icon)} />
              </div>
              <h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
                {label}
              </h1>
            </div>

            <p className='mt-4 max-w-prose text-base leading-relaxed text-foreground-muted'>
              {description}
            </p>

            <div className='mt-6 flex flex-wrap items-center gap-3'>
              {isAuthenticated ? (
                <Link
                  href={feature.href}
                  className='inline-flex items-center gap-2 rounded-xl border-2 border-border-strong bg-primary px-5 py-2.5 font-semibold text-white shadow-brutal btn-brutal'
                >
                  Open {label}
                  <ArrowUpRight className='size-4' />
                </Link>
              ) : (
                <>
                  <Link
                    href={`/login?feature=${key}`}
                    className='inline-flex items-center gap-2 rounded-xl border-2 border-border-strong bg-primary px-5 py-2.5 font-semibold text-white shadow-brutal btn-brutal'
                  >
                    <LogIn className='size-4' />
                    Sign in to use {label}
                  </Link>
                  <Link
                    href={`/signup?feature=${key}`}
                    className='inline-flex items-center gap-2 rounded-xl border-2 border-border-strong bg-surface px-5 py-2.5 font-semibold text-foreground shadow-brutal-sm transition-colors hover:bg-surface-elevated'
                  >
                    <UserPlus className='size-4' />
                    Create account
                  </Link>
                </>
              )}
            </div>
            {!isAuthenticated && (
              <p className='mt-3 text-xs text-foreground-muted'>
                Free to start — no credit card required.
              </p>
            )}
          </div>

          {/* Sample screenshot */}
          <div className='order-1 lg:order-2'>
            <div className='relative aspect-[16/10] w-full overflow-hidden rounded-2xl border-2 border-border-strong bg-surface shadow-brutal'>
              {imageOk ? (
                <Image
                  src={image}
                  alt={`${label} preview`}
                  fill
                  unoptimized
                  sizes='(max-width: 1024px) 100vw, 50vw'
                  className='object-cover'
                  onError={() => setImageOk(false)}
                />
              ) : (
                <div className='absolute inset-0 flex items-center justify-center bg-dots'>
                  <Icon className='size-16 text-foreground-muted/40' />
                </div>
              )}
            </div>
            <p className='mt-2 text-center text-xs text-foreground-muted'>
              A peek at the {label} page
            </p>
          </div>
        </div>

        {/* Where it fits — the dashboard flow, this feature highlighted */}
        <section className='mt-12 lg:mt-16'>
          <div className='mx-auto mb-8 max-w-3xl text-center'>
            <h2 className='text-xl font-bold text-foreground sm:text-2xl'>
              Where <span className='gradient-text-primary'>{label}</span> fits
            </h2>
            <p className='mx-auto mt-2 max-w-xl text-sm text-foreground-muted'>
              {label} is one step in the Hiday workflow. Here&apos;s how it
              connects to everything else.
            </p>
          </div>
          <FeatureFlow
            isAuthenticated={isAuthenticated}
            highlightKey={key}
          />
        </section>
      </div>
    </main>
  );
}
