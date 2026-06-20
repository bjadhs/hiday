'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  flowStages,
  getFeatureByKey,
  getNavItemByKey,
  type FlowNode,
} from '@/lib/nav-items';

/**
 * FeatureFlow
 *
 * An interconnected map of every Hiday page, read top → bottom as one
 * workflow: Organize → Capture → Manage → Review. Stages are joined by
 * labelled connector spines so the relationship between pages is explicit
 * (projects hold sessions, captured time becomes sessions, sessions flow
 * across the board, then everything is reviewed). Every node deep-links to
 * its page (or to auth, carrying the feature context, when signed out).
 */
interface FeatureFlowProps {
  isAuthenticated: boolean;
  /** when set, that node is emphasised and the others are muted (context view) */
  highlightKey?: string;
}

/**
 * Where a feature node points. Signed-in users go straight to the page;
 * signed-out users land on its `/explore/<key>` preview (or auth, for pages
 * without a preview such as Settings).
 */
function hrefFor(key: string, isAuthenticated: boolean) {
  const feature = getFeatureByKey(key);
  if (isAuthenticated) {
    return (feature ?? getNavItemByKey(key))?.href ?? '/';
  }
  return feature ? `/explore/${key}` : `/login?feature=${key}`;
}

/** A clickable feature node. `wide` makes a single-node stage feel anchored. */
function FlowCard({
  node,
  isAuthenticated,
  wide,
  highlighted,
  dimmed,
}: {
  node: FlowNode;
  isAuthenticated: boolean;
  wide?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  const feature = getFeatureByKey(node.key);
  if (!feature) return null;
  const { label, icon: Icon, accent } = feature;

  return (
    <Link
      href={hrefFor(node.key, isAuthenticated)}
      aria-current={highlighted ? 'page' : undefined}
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl border-2 border-border-strong bg-background-elevated p-4 shadow-brutal card-interactive transition-opacity',
        wide && 'sm:px-6',
        highlighted && 'border-primary shadow-brutal-colored',
        dimmed && 'opacity-55 hover:opacity-100',
      )}
    >
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border-2',
            accent.badge,
          )}
        >
          <Icon className={cn('size-5', accent.icon)} />
        </div>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <h3 className='truncate text-base font-bold text-foreground'>
            {label}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              accent.badge,
              accent.icon,
            )}
          >
            {node.role}
          </span>
        </div>
        <ArrowUpRight className='size-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
      </div>
      <p className='text-sm leading-relaxed text-foreground-muted'>
        {node.blurb}
      </p>
    </Link>
  );
}

/** Labelled vertical connector joining one stage to the next. */
function Connector({ label }: { label: string }) {
  return (
    <div className='flex flex-col items-center py-1' aria-hidden='true'>
      <span className='h-5 w-0.5 bg-border-strong' />
      <span className='rounded-full border-2 border-border-strong bg-surface px-3 py-1 text-[11px] font-semibold text-foreground-muted shadow-brutal-xs'>
        {label}
      </span>
      <span className='h-5 w-0.5 bg-border-strong' />
      <ChevronDown className='-mt-1 size-4 text-border-strong' />
    </div>
  );
}

export function FeatureFlow({
  isAuthenticated,
  highlightKey,
}: FeatureFlowProps) {
  return (
    <div className='mx-auto w-full max-w-3xl'>
      {flowStages.map((stage, i) => {
        const single = stage.nodes.length === 1;
        return (
          <div key={stage.id}>
            {/* Stage header */}
            <div className='mb-3 flex items-center gap-3'>
              <span className='flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-border-strong bg-primary text-sm font-black text-white shadow-brutal-xs'>
                {stage.step}
              </span>
              <div className='min-w-0'>
                <h2 className='text-lg font-bold leading-tight text-foreground'>
                  {stage.title}
                </h2>
                <p className='text-xs text-foreground-muted'>{stage.caption}</p>
              </div>
            </div>

            {/* Nodes */}
            <div
              className={cn(
                'grid gap-3',
                single ? 'grid-cols-1' : 'sm:grid-cols-2',
                stage.nodes.length === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
              )}
            >
              {stage.nodes.map((node) => (
                <FlowCard
                  key={node.key}
                  node={node}
                  isAuthenticated={isAuthenticated}
                  wide={single}
                  highlighted={highlightKey === node.key}
                  dimmed={!!highlightKey && highlightKey !== node.key}
                />
              ))}
            </div>

            {/* Connector to next stage */}
            {stage.edgeLabel && i < flowStages.length - 1 && (
              <Connector label={stage.edgeLabel} />
            )}
          </div>
        );
      })}

      {/* Settings — the one page that sits outside the main flow */}
      <div className='mt-8 flex justify-center'>
        <Link
          href={hrefFor('settings', isAuthenticated)}
          className='group inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground-muted shadow-brutal-xs transition-colors hover:text-foreground'
        >
          <Settings className='size-4 transition-transform group-hover:rotate-45' />
          Tune everything in Settings
          <ArrowUpRight className='size-4' />
        </Link>
      </div>
    </div>
  );
}
