
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
        
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Only run logic once.
            if (hasHandledAuth.current) return;

            // This event is triggered when the user lands on this page from the reset link.
            // The session is now available.
            if (event === 'PASSWORD_RECOVERY') {
                hasHandledAuth.current = true;
            } 
            // This handles cases where the user navigates to the page directly without a token.
            else if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
                 if (!session) {
                    hasHandledAuth.current = true; // Mark as handled to prevent re-triggering
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
