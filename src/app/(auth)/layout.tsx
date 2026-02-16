import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background dark:bg-background-dark">
      {/* Header */}
      <header className="border-b-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary border-2 border-border-strong dark:border-white/20 shadow-brutal-sm flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Hiday</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t-2 border-border dark:border-border-dark bg-surface dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Hiday. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
