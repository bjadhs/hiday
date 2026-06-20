'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const pathname = usePathname();

  // Hide the sidebar on the landing page and auth pages. The public /dashboard
  // page intentionally keeps the sidebar visible (even when signed out).
  const hideSidebar =
    pathname === '/' || pathname === '/login' || pathname === '/signup';

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
