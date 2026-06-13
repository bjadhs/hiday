'use client';

import dynamic from 'next/dynamic';

const KanbanContent = dynamic(
  () => import('./kanban-content'),
  { ssr: false }
);

export default function KanbanWrapper() {
  return <KanbanContent />;
}
