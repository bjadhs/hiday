'use client';

import { usePathname } from "next/navigation";
import { NavBar } from "./nav-bar";

interface NavBarWrapperProps {
  children: React.ReactNode;
}

export function NavBarWrapper({ children }: NavBarWrapperProps) {
  const pathname = usePathname();
  
  // Hide NavBar on landing page and auth pages
  const hideNavBar = pathname === '/' || pathname === '/login' || pathname === '/signup';
  
  if (hideNavBar) {
    return <>{children}</>;
  }
  
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
