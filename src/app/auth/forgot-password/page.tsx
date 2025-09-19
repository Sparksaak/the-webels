
'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { forgotPassword } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
             {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
            </> : 'Send Reset Link'}
        </Button>
    )
}

export default function ForgotPasswordPage() {
    const [state, formAction] = useActionState(forgotPassword, null);
    const { toast } = useToast();

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
                title: "Check your email",
                description: "A password reset link has been sent to your email address.",
            });
        }
    }, [state, toast]);
    
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="w-full max-w-md p-4">
                <Card className="shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            <Logo />
                        </div>
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-4">
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
                        <div className="mt-4 text-center text-sm">
                            Remember your password?{' '}
                            <Link href="/login" className="underline">
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
