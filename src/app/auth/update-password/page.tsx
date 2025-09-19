
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { updatePasswordWithToken } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
             {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Password...
            </> : 'Update Password'}
        </Button>
    )
}

function UpdatePasswordForm() {
    const [state, formAction] = useActionState(updatePasswordWithToken, null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state?.error) {
            toast({
                title: "Error",
                description: state.error,
                variant: "destructive",
            });
        }
        if (state?.success) {
            toast({
                title: "Success",
                description: "Your password has been updated successfully. You can now log in.",
            });
            router.push('/login');
        }
    }, [state, toast, router]);

     return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-2xl">Update Password</CardTitle>
                <CardDescription>
                    Enter your new password below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                        />
                    </div>
                    <SubmitButton />
                </form>
            </CardContent>
        </Card>
    );
}

function UpdatePasswordPageContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    if (error) {
         return (
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Invalid Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                    <Button asChild className="w-full mt-4">
                        <Link href="/auth/forgot-password">Request a new link</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return <UpdatePasswordForm />;
}

export default function UpdatePasswordPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="w-full max-w-md p-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <UpdatePasswordPageContent />
                </Suspense>
            </div>
        </div>
    );
}
