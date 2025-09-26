
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { login, loginWithMagicLink } from '@/app/auth/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { LoadingLink } from '@/components/loading-link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PasswordLoginButton() {
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

function MagicLinkButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full mt-4" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
            </> : 'Send Magic Link'}
        </Button>
    )
}

export default function LoginPage() {
  const [passwordState, passwordAction] = useActionState(login, null);
  const [magicLinkState, magicLinkAction] = useActionState(loginWithMagicLink, null);

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

    const message = searchParams.get('message');
    if (message === 'account-deleted') {
        toast({
            title: "Account Deleted",
            description: "Your account has been successfully deleted.",
        });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (passwordState?.error) {
        toast({
            title: "Error",
            description: passwordState.error,
            variant: "destructive",
        });
    }
    if (passwordState?.success) {
      router.push('/dashboard');
    }
  }, [passwordState, toast, router]);
  
  useEffect(() => {
    if (magicLinkState?.error) {
        toast({
            title: "Error",
            description: magicLinkState.error,
            variant: "destructive",
        });
    }
  }, [magicLinkState, toast]);


  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[380px] gap-8">
          <div className="grid gap-4 text-center">
            <Logo className="mx-auto size-12" />
            <h1 className="text-4xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Welcome back! Sign in to continue.
            </p>
          </div>
          
           <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="passwordless">Passwordless</TabsTrigger>
              </TabsList>
              <TabsContent value="password">
                 <Card className="border-0 shadow-none">
                    <CardHeader className="p-2 pt-6 text-center">
                       <CardDescription>
                          Enter your email and password to log in.
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                       <form action={passwordAction}>
                          <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="m@example.com"
                              required
                            />
                          </div>
                          <div className="grid gap-3 mt-4">
                            <div className="flex items-center">
                              <Label htmlFor="password">Password</Label>
                              <Link
                                href="/forgot-password"
                                className="ml-auto inline-block text-sm text-primary hover:underline"
                              >
                                Forgot your password?
                              </Link>
                            </div>
                            <Input id="password" name="password" type="password" required />
                          </div>
                          <PasswordLoginButton />
                        </form>
                    </CardContent>
                 </Card>
              </TabsContent>
               <TabsContent value="passwordless">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="p-2 pt-6 text-center">
                       <CardDescription>
                          Enter your email to receive a magic link to sign in.
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                       <form action={magicLinkAction}>
                          <div className="grid gap-3">
                            <Label htmlFor="magic-link-email">Email</Label>
                            <Input
                              id="magic-link-email"
                              name="email"
                              type="email"
                              placeholder="m@example.com"
                              required
                            />
                          </div>
                          <MagicLinkButton />
                        </form>
                    </CardContent>
                 </Card>
              </TabsContent>
            </Tabs>
          
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <LoadingLink href="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </LoadingLink>
          </div>
        </div>
      </div>
       <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-cyan-400 to-accent animate-gradient-xy"></div>
        <Image
          src="https://placehold.co/1200x900/111827/F3F4F6/png?text=Modern+Classroom"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover mix-blend-overlay"
          data-ai-hint="classroom technology"
        />
         <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center bg-black/30 p-10 rounded-2xl backdrop-blur-md">
            <h2 className="mt-4 text-5xl font-bold tracking-tight">Welcome Back</h2>
            <p className="mt-3 text-xl text-white/80">Sign in to continue to The Webels.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

    
