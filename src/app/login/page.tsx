
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/auth/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full mt-4" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
            </> : 'Login'}
        </Button>
    )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (state?.error) {
        toast({
            title: "Error",
            description: state.error,
            variant: "destructive",
        });
    }
    if (state?.success) {
      router.push('/dashboard');
    }
  }, [state, toast, router]);


  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="mx-auto" />
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
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
              <div className="grid gap-2 mt-4">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <AuthButton />
            </form>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
       <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-accent/70 animate-gradient-xy"></div>
        <Image
          src="https://placehold.co/1200x900.png"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
          data-ai-hint="classroom technology"
        />
         <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center bg-black bg-opacity-30 p-8 rounded-lg backdrop-blur-sm">
            <h2 className="mt-4 text-4xl font-bold">Welcome Back</h2>
            <p className="mt-2 text-xl">Sign in to continue to The Webels.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
