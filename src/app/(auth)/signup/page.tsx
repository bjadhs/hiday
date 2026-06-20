import { Suspense } from 'react';
import { AuthCard } from '@/components/auth-card';
import { FeatureSummary } from '@/components/feature-summary';
import { getFeatureByKey } from '@/lib/nav-items';

/**
 * Reads the `?feature=` search param and renders its summary. Isolated in its
 * own async component so the page can wrap it in <Suspense> — that keeps the
 * static auth shell prerenderable instead of blocking the whole route on the
 * dynamic searchParams read.
 */
async function FeatureContext({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const { feature } = await searchParams;
  const matched = getFeatureByKey(feature);
  if (!matched) return null;
  return <FeatureSummary feature={matched} mode='signup' />;
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <FeatureContext searchParams={searchParams} />
      </Suspense>
      <AuthCard mode='signup' />
    </>
  );
}
