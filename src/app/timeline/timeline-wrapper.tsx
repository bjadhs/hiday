'use client';

import dynamic from 'next/dynamic';

const TimelineContent = dynamic(
  () => import('./timeline-content'),
  { ssr: false }
);

export default function TimelineWrapper() {
  return <TimelineContent />;
}
