
"use client";

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { signup } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Logo } from '@/components/logo';

export function SignupForm() {
  const [state, formAction] = useActionState(signup, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
        toast({
            title: "Error creating account",
            description: state.error,
            variant: "destructive",
        });
    }
  }, [state, toast]);

  return (<div className="mx-auto grid w-[400px] gap-6">
      <div className="grid gap-2 text-center">
        <Logo className="mx-auto" />
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <p className="text-balance text-muted-foreground">
          Create an account to get started with The Webels.
        </p>
      </div>
      <div className="grid gap-4">
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
          
          <Button type="submit" className="w-full mt-4">
            Create an account
          </Button>
        </form>
      </div>
      <div className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Login
        </Link>
      </div>
    </div>);
}
