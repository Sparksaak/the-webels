
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Code, BookOpen, BrainCircuit, Heart, Star, Users, ArrowRight, Quote } from 'lucide-react';
import Image from 'next/image';
import { LoadingLink } from '@/components/loading-link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center shadow-sm bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="ml-2 text-xl font-bold text-foreground">The Webels</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <LoadingLink
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4 text-foreground transition-colors"
            prefetch={false}
          >
            Login
          </LoadingLink>
          <LoadingLink href="/signup" asButton buttonProps={{size: "sm"}} prefetch={false}>
              Sign Up
          </LoadingLink>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient-xy"></div>
          <div className="relative container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Free Student-Led Tutoring in CS and AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The Webels is a student-run, non-profit initiative offering free, high-quality tutoring in AP Computer Science, Web Development, Python, and AI/ML. Join our community to learn and grow together.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <LoadingLink href="/signup" asButton buttonProps={{size: "lg"}} prefetch={false}>
                    Get Started for Free
                  </LoadingLink>
                  <LoadingLink href="#features" asButton buttonProps={{size: "lg", variant: "outline"}} prefetch={false}>
                    Learn More
                  </LoadingLink>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/1/600/400"
                width="600"
                height="400"
                alt="Students collaborating on code"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last shadow-2xl transition-transform hover:scale-105"
                data-ai-hint="students coding"
              />
            </div>
          </div>
        </section>
        
        <section id="story" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
            <div className="container px-4 md:px-6">
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">Our Story</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">For Students, By Students</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed">
                            The Webels was born from a simple idea: learning to code should be accessible to everyone, regardless of their background. As students who are passionate about technology, we wanted to create a supportive community where peers can help each other succeed. We believe that the best way to learn is by doing and sharing, which is why all our tutoring is led by fellow students who have excelled in these subjects.
                        </p>
                        <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed">
                            Our non-profit mission drives us to provide completely free, high-quality educational experiences. We're here to break down barriers and build up the next generation of innovators.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Image
                            src="https://picsum.photos/seed/2/550/310"
                            width="550"
                            height="310"
                            alt="A diverse group of students in a classroom"
                            className="overflow-hidden rounded-xl object-cover shadow-xl transition-transform hover:scale-105"
                            data-ai-hint="diverse students"
                        />
                    </div>
                </div>
            </div>
        </section>


        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium">What We Offer</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Learn In-Demand Skills for Free</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides everything you need to master topics from AP Computer Science to advanced AI, with both online and in-person options.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-card hover:shadow-lg">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Expert-Led Curriculum</h3>
                <p className="text-muted-foreground">
                  Master Web Development, Python, and AP Computer Science with our comprehensive materials and dedicated tutors.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-card hover:shadow-lg">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Explore AI & Machine Learning</h3>
                <p className="text-muted-foreground">
                  Dive into the world of Artificial Intelligence with guidance from experienced student tutors who are passionate about the field.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-card hover:shadow-lg">
                 <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Flexible Learning Tracks</h3>
                <p className="text-muted-foreground">
                  Choose between online or in-person tutoring sessions to fit your learning style and schedule perfectly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-3">
                        <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">How It Works</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Getting Started is Easy</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Join our learning community in just a few simple steps.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-4xl gap-8 py-12 sm:grid-cols-2 md:grid-cols-3 md:gap-12">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="bg-background p-5 rounded-full border shadow-sm">
                            <span className="text-2xl font-bold text-primary">1</span>
                        </div>
                        <h3 className="text-xl font-bold">Create an Account</h3>
                        <p className="text-muted-foreground">
                            Sign up for free and tell us your learning preferences.
                        </p>
                    </div>
                     <div className="flex flex-col items-center text-center space-y-3">
                        <div className="bg-background p-5 rounded-full border shadow-sm">
                             <span className="text-2xl font-bold text-primary">2</span>
                        </div>
                        <h3 className="text-xl font-bold">Explore Materials</h3>
                        <p className="text-muted-foreground">
                            Access our curated class materials, assignments, and announcements.
                        </p>
                    </div>
                     <div className="flex flex-col items-center text-center space-y-3">
                        <div className="bg-background p-5 rounded-full border shadow-sm">
                             <span className="text-2xl font-bold text-primary">3</span>
                        </div>
                        <h3 className="text-xl font-bold">Join a Session</h3>
                        <p className="text-muted-foreground">
                            Attend live online or in-person tutoring sessions and start learning!
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-3">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium">Testimonials</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">What Our Students Say</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Hear from students who have grown with The Webels.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl gap-8 py-12 lg:grid-cols-2 lg:gap-12">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12 border" data-ai-hint="person portrait">
                                    <AvatarImage src="https://picsum.photos/seed/t1/100/100" />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2 flex-1">
                                    <Quote className="w-8 h-8 text-primary" />
                                    <p className="text-muted-foreground">"The Webels made learning AP Computer Science so much more approachable. My tutor was patient and really knew their stuff. I finally understood recursion!"</p>
                                    <div>
                                        <p className="font-semibold">Jessica D.</p>
                                        <p className="text-sm text-muted-foreground">High School Student</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12 border" data-ai-hint="person portrait">
                                    <AvatarImage src="https://picsum.photos/seed/t2/100/100" />
                                    <AvatarFallback>MO</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2 flex-1">
                                    <Quote className="w-8 h-8 text-primary" />
                                    <p className="text-muted-foreground">"I wanted to learn web development but didn't know where to start. The online sessions were perfect for my schedule, and it was amazing to learn from another student."</p>
                                    <div>
                                        <p className="font-semibold">Michael O.</p>
                                        <p className="text-sm text-muted-foreground">Beginner Developer</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5 border-t">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Start Learning?</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                        Join our community of passionate learners and tutors today. Create your free account and unlock your potential in tech.
                    </p>
                    <LoadingLink href="/signup" asButton buttonProps={{size: "lg", className: "mt-4"}}>
                        Sign Up for Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </LoadingLink>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 The Webels. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <LoadingLink href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </LoadingLink>
          <LoadingLink href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </LoadingLink>
        </nav>
      </footer>
    </div>
  );
}
