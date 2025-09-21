
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? 'signup';

  const title = type === 'magic-link' ? 'Check your email' : 'Confirm your email';
  const description = type === 'magic-link' 
    ? "We've sent a magic link to your email address. Click the link to sign in instantly."
    : "We've sent a confirmation link to your email address. Please click the link to complete your registration.";

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive an email? Check your spam folder.
          </p>
          <p className="mt-4 text-sm">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ConfirmContent />
      </Suspense>
    </div>
  );
}
