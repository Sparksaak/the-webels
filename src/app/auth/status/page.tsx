
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { CheckCircle2, XCircle } from 'lucide-react';

function StatusContent() {
    const searchParams = useSearchParams();
    const success = searchParams.get('success') === 'true';
    const message = searchParams.get('message');
    const error = searchParams.get('error');

    return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    {success ? (
                        <>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            Verification Successful
                        </>
                    ) : (
                        <>
                            <XCircle className="h-8 w-8 text-destructive" />
                            Verification Failed
                        </>
                    )}
                </CardTitle>
                <CardDescription>
                    {success ? message : error}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                {success ? (
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Proceed to Login
                    </Link>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Please <Link href="/signup" className="underline hover:text-primary">try signing up again</Link> or contact support if the issue persists.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


export default function AuthStatusPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center"><div>Loading...</div></div>}>
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <StatusContent />
        </div>
    </Suspense>
  )
}
