
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { signup } from '@/app/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { LoadingLink } from '@/components/loading-link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function AuthButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className={cn(buttonVariants(), "w-full mt-4")} disabled={pending}>
             {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
            </> : 'Create an account'}
        </button>
    )
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (state?.error) {
        toast({
            title: "Error creating account",
            description: state.error,
            variant: "destructive",
        });
    }
  }, [state, toast]);

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-sm gap-6">
          <div className="grid gap-2 text-center">
            <Image src="/logo.png" alt="The Webels Logo" width={48} height={48} className="mx-auto" />
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-balance text-muted-foreground">
              Create an account to get started with The Webels.
            </p>
          </div>
          <div className="grid gap-4">
          {!isClient ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
               <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
               <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form action={formAction}>
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" name="name" placeholder="John Doe" required />
              </div>
              <div className="grid gap-2 mt-4">
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
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              
              <div className="grid gap-2 mt-4">
                <Label htmlFor="subjectOfInterest">Subject of Interest</Label>
                <Select name="subjectOfInterest" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="ap-cs">AP Computer Science Tutoring</SelectItem>
                    <SelectItem value="ai-ml">AI/ML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 mt-4">
                <Label htmlFor="learningPreference">Learning Preference</Label>
                <Select name="learningPreference" required defaultValue="online">
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <AuthButton />
            </form>
          )}
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <LoadingLink href="/login" className="underline">
              Login
            </LoadingLink>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-accent/70 animate-gradient-xy"></div>
        <Image
          src="https://placehold.co/1200x900/10B981/FFFFFF/png?text=Learn+Something+New"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
          data-ai-hint="education abstract"
        />
         <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center bg-black bg-opacity-30 p-8 rounded-lg backdrop-blur-sm">
            <h2 className="mt-4 text-4xl font-bold">Join the Future of Education</h2>
            <p className="mt-2 text-xl">Sign up to access a world of modern learning tools.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
