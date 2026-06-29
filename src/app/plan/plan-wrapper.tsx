'use client';

import dynamic from 'next/dynamic';

const PlanContent = dynamic(
  () => import('./plan-content'),
  { ssr: false }
);

export default function PlanWrapper() {
  return <PlanContent />;
}
