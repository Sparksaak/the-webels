
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
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
        // This ref is to prevent the logic from running multiple times on re-renders.
        if (hasHandledAuth.current) return;

        const supabase = createClient();
        
        // This is the key part: when the page loads, Supabase automatically handles the
        // #access_token from the URL. The `onAuthStateChange` event fires to let us know.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            
            // `PASSWORD_RECOVERY` event means the user has successfully arrived from the link.
            // A session is now available, and we can allow them to update their password.
            if (event === 'PASSWORD_RECOVERY') {
                hasHandledAuth.current = true; // Mark as handled to prevent further checks.
            }
            
            // `INITIAL_SESSION` is the first event that fires. If it completes and there's
            // *still* no session, *and* we haven't already handled a PASSWORD_RECOVERY event,
            // then it's safe to assume the user got here without a valid token.
            if (event === 'INITIAL_SESSION' && !session && !hasHandledAuth.current) {
                hasHandledAuth.current = true; // Mark as handled
                toast({
                    title: "Invalid or Expired Link",
                    description: "Your password reset link is either invalid or has expired. Please request a new one.",
                    variant: "destructive"
                });
                router.replace('/forgot-password');
            }
        });
        
        // Clean up the subscription when the component unmounts.
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
