
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect, useState } from 'react';
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

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, null);
  const { toast } = useToast();
  const [role, setRole] = useState('student');

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
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="mx-auto" />
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-balance text-muted-foreground">
              Create an account to get started with Classroom Central. Only one teacher account is allowed.
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
                <Label htmlFor="role">I am a...</Label>
                <Select name="role" required defaultValue="student" onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-1">
                  Note: If a teacher account already exists, you must sign up as a student.
                </p>
              </div>

              {role === 'student' && (
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
              )}
              
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
        </div>
      </div>
       <div className="hidden bg-muted lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-80"></div>
        <Image
          src="https://placehold.co/1200x900.png"
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
