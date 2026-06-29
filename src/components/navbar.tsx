import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavbarProps {
  showGetStarted?: boolean;
}

export function Navbar({
  showGetStarted = true,
}: NavbarProps) {
  return (
    <nav className='sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border-strong'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2.5'>
            <Image src='/logo.svg' alt='Hiday' width={40} height={40} className='size-10' priority />
            <span className='text-xl font-bold text-foreground tracking-tight'>
              Hiday
            </span>
          </Link>

          {/* Actions */}
          <div className='flex items-center gap-2 sm:gap-4'>
            <Link href='/dashboard'>
              <Button
                variant='outline'
                className='border-2 border-border-strong bg-background-elevated shadow-brutal-sm btn-brutal font-semibold'
              >
                Dashboard
              </Button>
            </Link>
            <ThemeToggle />
            {showGetStarted && (
              <Link href='/signup'>
                <Button className='gradient-primary hover:opacity-90 text-primary-foreground border-2 border-border-strong shadow-brutal-sm btn-brutal font-semibold'>
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
