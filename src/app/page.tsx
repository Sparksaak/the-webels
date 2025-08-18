
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Code, Bot, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center shadow-sm">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo className="size-8" />
          <span className="ml-2 text-xl font-bold">The Webels</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/40">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Launch Your Tech Career with The Webels
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Join our free, hands-on courses in Python and Web Development. Build real projects, get mentorship, and land your dream job in tech. No experience required.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Start Learning for Free</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Students collaborating on a coding project"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                data-ai-hint="students coding collaboration"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Why The Webels?</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Better Way to Learn Code</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to take you from zero to hero. We focus on practical skills that employers are looking for, in a supportive and engaging environment.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-2 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    <Code className="h-8 w-8" />
                  </div>
                <h3 className="text-xl font-bold">Project-Based Learning</h3>
                <p className="text-muted-foreground">
                  You won't just watch videos. You'll build a portfolio of real-world projects, from web apps to data analysis tools.
                </p>
              </div>
              <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    <Bot className="h-8 w-8" />
                  </div>
                <h3 className="text-xl font-bold">AI-Powered Assistance</h3>
                <p className="text-muted-foreground">
                  Get unstuck faster with our integrated AI teaching assistant, ready to answer your questions 24/7.
                </p>
              </div>
               <div className="grid gap-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                <h3 className="text-xl font-bold">Community & Mentorship</h3>
                <p className="text-muted-foreground">
                  Connect with fellow learners and get guidance from experienced mentors who are invested in your success.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 The Webels. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
