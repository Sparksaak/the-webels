
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { updatePasswordWithToken } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full mt-4" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
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
            title: "Error updating password",
            description: state.error,
            variant: "destructive",
        });
    }
    if (state?.success) {
        toast({
            title: "Success",
            description: "Your password has been updated. Please log in with your new password.",
        });
        router.push('/login');
    }
  }, [state, toast, router]);

  return (
    <form action={formAction}>
      <div className="grid gap-4">
        <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required placeholder="••••••••" />
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}


export default function UpdatePasswordPage() {
    const { toast } = useToast();
    const router = useRouter();
    const hasHandledAuth = useRef(false);

    useEffect(() => {
        if (hasHandledAuth.current) return;
        hasHandledAuth.current = true;
        
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // This event is triggered when the user lands on this page from the reset link.
                // The session is now available. We don't need to do anything with it here,
                // as the form submission will use it to authorize the password update.
            } else if (event === 'SIGNED_IN') {
                // This handles cases where the user is already signed in.
                // We should still allow them to proceed if they have a recovery token.
                // The page is protected by checking the session on submit.
            } else if (event === 'INITIAL_SESSION') {
                 if (!session) {
                    toast({
                        title: "Invalid or Expired Link",
                        description: "Your password reset link is either invalid or has expired. Please request a new one.",
                        variant: "destructive"
                    });
                    router.replace('/forgot-password');
                }
            }
        });
        
        return () => {
            subscription?.unsubscribe();
        }
    }, [router, toast]);


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl">Update Your Password</CardTitle>
                    <CardDescription>
                       Enter and confirm your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UpdatePasswordForm />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
