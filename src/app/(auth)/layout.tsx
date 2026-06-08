import { Navbar } from '@/components/navbar';
import { BackgroundPattern } from '@/components/background-pattern';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BackgroundPattern variant='dots'>
      <div className='min-h-screen w-full flex flex-col'>
        <Navbar showGetStarted={false} />

        {/* Main Content - Centered */}
        <main className='flex-1 w-full flex items-start justify-center px-4 pt-6 sm:px-6 lg:px-8'>
          <div className='w-full max-w-md mx-auto'>{children}</div>
        </main>
      </div>
    </BackgroundPattern>
  );
}
