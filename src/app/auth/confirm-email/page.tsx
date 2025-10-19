
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') ?? 'signup';

  const getContent = () => {
    switch(type) {
      case 'magic-link':
        return {
          title: 'Check your email',
          description: "We've sent a magic link to your email address. Click the link to sign in instantly."
        };
      case 'password-reset':
        return {
          title: 'Check your email',
          description: "We've sent a password reset link to your email address. Please click the link to set a new password."
        };
      case 'signup':
      default:
         return {
          title: 'Confirm your email',
          description: "We've sent a confirmation link to your email address. Please click the link to complete your registration."
        };
    }
  }

  const { title, description } = getContent();

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <Image src="/logo.png" alt="The Webels Logo" width={48} height={48} />
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
