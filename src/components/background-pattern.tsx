interface BackgroundPatternProps {
  variant?: 'dots' | 'grid';
  className?: string;
  children: React.ReactNode;
}

export function BackgroundPattern({
  variant = 'dots',
  className = '',
  children,
}: BackgroundPatternProps) {
  const patternClass = variant === 'dots' ? 'bg-dots' : 'bg-grid';

  return (
    <div className={`relative min-h-screen w-full ${className}`}>
      {/* Pattern layer — full opacity */}
      <div className={`absolute inset-0 ${patternClass}`} />

      {/* Gradient overlay for depth */}
      <div className='absolute inset-0 bg-linear-to-b from-transparent via-background/20 to-background/50 pointer-events-none' />

      {/* Content — semi-transparent background so pattern peeks through edges */}
      <div className='relative z-10 bg-background/85 backdrop-blur-xs min-h-screen'>
        {children}
      </div>
    </div>
  );
}
