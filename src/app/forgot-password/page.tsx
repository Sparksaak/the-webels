
'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full mt-4" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
            </> : 'Send Password Reset Email'}
        </Button>
    )
}

function ForgotPasswordForm({ origin }: { origin: string }) {
  const boundAction = useMemo(() => requestPasswordReset.bind(null, origin), [origin]);
  const [state, formAction] = useActionState(boundAction, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
        toast({
            title: "Error",
            description: state.error,
            variant: "destructive",
        });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="m@example.com"
          required
        />
      </div>
      <SubmitButton />
    </form>
  );
}


export default function ForgotPasswordPage() {
    const [origin, setOrigin] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setOrigin(window.location.origin);
        setIsClient(true);
    }, []);

    const FormSkeleton = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full mt-4" />
        </div>
    );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <Image src="/logo.png" alt="The Webels Logo" width={48} height={48} />
                    </div>
                    <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                    <CardDescription>
                        No problem! Enter your email address and we'll send you a link to reset it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isClient || !origin ? <FormSkeleton /> : <ForgotPasswordForm origin={origin} /> }
                     <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="flex items-center justify-center gap-1 font-medium text-primary hover:underline">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
