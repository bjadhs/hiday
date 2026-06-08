'use client';

import dynamic from 'next/dynamic';

const HistoryContent = dynamic(
  () => import('./history-content'),
  { ssr: false }
);

export default function HistoryWrapper() {
  return <HistoryContent />;
}
