import { notFound } from 'next/navigation';
import { featureCards, getFeatureByKey } from '@/lib/nav-items';
import { ExploreClient } from './explore-client';

/** Pre-render a static preview for every known feature key. */
export function generateStaticParams() {
  return featureCards.map((f) => ({ feature: f.key }));
}

/**
 * Public per-feature preview (`/explore/<key>`). Signed-out visitors are sent
 * here from the sidebar / proxy instead of a bare login, so the sidebar stays
 * visible and they see what the feature does before signing in. Rendering of
 * the auth-dependent CTA is delegated to a client component.
 */
export default async function ExploreFeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;

  if (!getFeatureByKey(feature)) notFound();

  return <ExploreClient featureKey={feature} />;
}
