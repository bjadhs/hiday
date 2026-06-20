'use client';

import { notFound } from 'next/navigation';
import { useUser } from '@/lib/supabase';
import { getFeatureByKey } from '@/lib/nav-items';
import { FeaturePreview } from '@/components/dashboard/feature-preview';

/**
 * Client half of the feature preview route. Resolves auth state (to choose
 * between a "Sign in" CTA and an "Open" shortcut) and renders the preview for
 * the feature key handed down by the server page.
 */
export function ExploreClient({ featureKey }: { featureKey: string }) {
  const { user } = useUser();
  const feature = getFeatureByKey(featureKey);

  if (!feature) notFound();

  return <FeaturePreview feature={feature} isAuthenticated={!!user} />;
}
