'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';

type AuthMode = 'signin' | 'signup';

interface AuthCardProps {
  mode: AuthMode;
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const isSignup = mode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isSignup) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/track`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
      return;
    }

    // Sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push('/track');
    router.refresh();
  };

  // ─── Success State (signup only) ───
  if (isSuccess && isSignup) {
    return (
      <Card className='w-full border-3 border-border-strong shadow-brutal-lg bg-background'>
        <CardHeader className='space-y-3 text-center pb-2'>
          <div className='mx-auto size-14 rounded-2xl bg-success-bg border-2 border-success-border flex items-center justify-center'>
            <CheckCircle2 className='size-7 text-success' />
          </div>
          <CardTitle className='text-2xl font-bold tracking-tight'>
            Check your email
          </CardTitle>
          <CardDescription className='text-foreground-muted'>
            We&apos;ve sent a confirmation link to{' '}
            <span className='font-semibold text-foreground'>{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-2'>
          <p className='text-sm text-foreground-muted text-center leading-relaxed'>
            Click the link in the email to verify your account and start
            tracking your time.
          </p>
        </CardContent>
        <CardFooter className='pt-2'>
          <Link href='/login' className='w-full'>
            <Button
              variant='outline'
              className='w-full border-2 border-border-strong shadow-brutal-sm btn-brutal hover:bg-surface font-semibold'
            >
              <ArrowLeft className='mr-2 size-4' />
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // ─── Form State ───
  return (
    <Card className='w-full border-3 border-border-strong shadow-brutal-lg bg-background overflow-hidden rounded-2xl py-0'>
      {/* Top accent banner — brutalist block */}
      <div className='w-full gradient-primary border-b-2 border-border-strong shadow-brutal-sm py-4 px-6 flex items-center gap-3'>
        {isSignup ? (
          <UserPlus className='size-6 text-white' />
        ) : (
          <LogIn className='size-6 text-white' />
        )}
        <span className='text-white font-bold text-lg tracking-tight'>
          {isSignup ? 'Join Hiday' : 'Sign In to Hiday'}
        </span>
      </div>

      <CardHeader className='space-y-2 pt-0 pb-4'>
        <CardTitle className='text-2xl font-bold tracking-tight'>
          {isSignup ? 'Create an account' : 'Welcome back'}
        </CardTitle>
        <CardDescription className='text-foreground-muted'>
          {isSignup
            ? 'Sign up to start tracking your time and building habits'
            : 'Sign in to your account to continue tracking'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className='space-y-5'>
          {error && (
            <Alert
              variant='destructive'
              className='border-2 border-danger-border bg-danger-bg text-danger shadow-brutal-sm'
            >
              <AlertDescription className='font-medium'>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className='space-y-2'>
            <Label htmlFor='email' className='font-semibold text-sm'>
              Email
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-foreground-muted' />
              <Input
                id='email'
                type='email'
                placeholder='name@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='pl-11 h-11 border-2 border-border-strong bg-surface shadow-brutal-xs focus:shadow-brutal-sm focus:border-primary transition-all'
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className='space-y-2'>
            <Label htmlFor='password' className='font-semibold text-sm'>
              Password
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-foreground-muted' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder={
                  isSignup ? 'Create a password' : 'Enter your password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='pl-11 pr-11 h-11 border-2 border-border-strong bg-surface shadow-brutal-xs focus:shadow-brutal-sm focus:border-primary transition-all'
                required
                minLength={isSignup ? 6 : undefined}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors'
              >
                {showPassword ? (
                  <EyeOff className='size-4' />
                ) : (
                  <Eye className='size-4' />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password (signup only) */}
          {isSignup && (
            <div className='space-y-2'>
              <Label
                htmlFor='confirmPassword'
                className='font-semibold text-sm'
              >
                Confirm Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-foreground-muted' />
                <Input
                  id='confirmPassword'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='pl-11 h-11 border-2 border-border-strong bg-surface shadow-brutal-xs focus:shadow-brutal-sm focus:border-primary transition-all'
                  required
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className='flex flex-col space-y-4 pt-2 pb-6'>
          <Button
            type='submit'
            className='w-full h-11 gradient-primary hover:opacity-90 text-primary-foreground border-2 border-border-strong shadow-brutal btn-brutal font-semibold text-base'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                {isSignup ? 'Creating account...' : 'Signing in...'}
              </>
            ) : isSignup ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </Button>

          <p className='text-sm text-center text-foreground-muted'>
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link
                  href='/login'
                  className='text-primary hover:text-primary-hover font-semibold transition-colors underline underline-offset-2'
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href='/signup'
                  className='text-primary hover:text-primary-hover font-semibold transition-colors underline underline-offset-2'
                >
                  Sign up
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
