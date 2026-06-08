'use client';

import dynamic from 'next/dynamic';

const TodosContent = dynamic(
  () => import('./todos-content'),
  { ssr: false }
);

export default function TodosWrapper() {
  return <TodosContent />;
}
