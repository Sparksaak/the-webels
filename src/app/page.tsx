
'use client';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Code, BookOpen, BrainCircuit, Quote, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { LoadingLink } from '@/components/loading-link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import placeholderImages from '@/app/lib/placeholder-images.json';

export default function LandingPage() {
  const sectionsRef = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
          <span className="ml-3 text-2xl font-bold tracking-wider text-foreground">The Webels</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <LoadingLink
            href="/login"
            className="text-sm font-medium hover:text-primary transition-colors"
            prefetch={false}
          >
            Login
          </LoadingLink>
          <LoadingLink href="/signup" asButton prefetch={false}>
              Sign Up
          </LoadingLink>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-br from-primary/10 via-cyan-400/10 to-emerald-500/10 animate-gradient-xy"></div>
          <div className="px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-6 z-10">
                <div className="space-y-6 text-focus-in">
                  <h1 className="text-5xl font-extrabold sm:text-6xl xl:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">
                    Free Tutoring in CS and AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The Webels is a student-run, non-profit initiative offering free, high-quality tutoring in AP Computer Science, Web Development, Python, and AI/ML. Join our community to learn and grow together.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row animate-fade-in-up animation-delay-500">
                  <LoadingLink href="/signup" asButton buttonProps={{size: "lg"}} prefetch={false}>
                    Get Started for Free
                  </LoadingLink>
                  <LoadingLink href="#features" asButton buttonProps={{size: "lg", variant: "outline"}} prefetch={false}>
                    Learn More
                  </LoadingLink>
                </div>
              </div>
              <div className="relative animate-fade-in-up animation-delay-300">
                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/50 to-emerald-500/50 rounded-3xl blur-2xl"></div>
                 <Image
                    src={placeholderImages.landingHero.src}
                    width={placeholderImages.landingHero.width}
                    height={placeholderImages.landingHero.height}
                    alt="Students collaborating on code"
                    className="mx-auto aspect-video overflow-hidden rounded-2xl object-cover sm:w-full lg:order-last shadow-2xl transition-transform hover:scale-105 duration-500"
                    data-ai-hint={placeholderImages.landingHero.hint}
                  />
              </div>
            </div>
          </div>
        </section>
        
        <section ref={el => sectionsRef.current[0] = el} id="story" className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-secondary/30 to-background fade-in-section">
            <div className="px-4 md:px-6">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-4">
                        <div className="inline-block rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-semibold tracking-wider">Our Story</div>
                        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">For Students, By Students</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed">
                            The Webels was born from a simple idea: learning to code should be accessible to everyone, regardless of their background. As students who are passionate about technology, we wanted to create a supportive community where peers can help each other succeed. We believe that the best way to learn is by doing and sharing, which is why all our tutoring is led by fellow students who have excelled in these subjects.
                        </p>
                        <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed">
                            Our non-profit mission drives us to provide completely free, high-quality educational experiences. We're here to break down barriers and build up the next generation of innovators.
                        </p>
                    </div>
                    <div className="relative">
                       <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-400 to-orange-400 rounded-3xl blur-xl opacity-50"></div>
                        <Image
                            src={placeholderImages.landingStory.src}
                            width={placeholderImages.landingStory.width}
                            height={placeholderImages.landingStory.height}
                            alt="A diverse group of students in a classroom"
                            className="relative overflow-hidden rounded-2xl object-cover shadow-xl transition-transform hover:scale-105 duration-500"
                            data-ai-hint={placeholderImages.landingStory.hint}
                        />
                    </div>
                </div>
            </div>
        </section>

        <section ref={el => sectionsRef.current[1] = el} id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background fade-in-section">
          <div className="px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-3">
                <div className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-semibold tracking-wider text-secondary-foreground">What We Offer</div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">Learn In-Demand Skills for Free</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides everything you need to master topics from AP Computer Science to advanced AI, with both online and in-person options.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-16 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-2xl hover:-translate-y-2">
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                  <Code className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Expert-Led Curriculum</h3>
                <p className="text-muted-foreground">
                  Master Web Development, Python, and AP Computer Science with our comprehensive materials and dedicated tutors.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-2xl hover:-translate-y-2">
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                  <BrainCircuit className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Explore AI & Machine Learning</h3>
                <p className="text-muted-foreground">
                  Dive into the world of Artificial Intelligence with guidance from experienced student tutors who are passionate about the field.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 hover:bg-card hover:shadow-2xl hover:-translate-y-2">
                 <div className="bg-primary/10 p-4 rounded-full mb-6">
                    <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Flexible Learning Tracks</h3>
                <p className="text-muted-foreground">
                  Choose between online or in-person tutoring sessions to fit your learning style and schedule perfectly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section ref={el => sectionsRef.current[2] = el} id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-secondary/30 to-background fade-in-section">
            <div className="px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-3">
                        <div className="inline-block rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-semibold tracking-wider">How It Works</div>
                        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">Getting Started is Easy</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Join our learning community in just a few simple steps.
                        </p>
                    </div>
                </div>
                <div className="relative mx-auto max-w-4xl py-20">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2/3 w-full border-t-2 border-b-2 border-dashed border-primary/20"></div>
                  <div className="grid gap-12 sm:grid-cols-3">
                      <div className="flex flex-col items-center text-center space-y-4 z-10">
                          <div className="bg-background flex items-center justify-center size-20 rounded-full border-4 border-primary shadow-lg">
                              <span className="text-3xl font-bold text-primary">1</span>
                          </div>
                          <h3 className="text-2xl font-bold">Create an Account</h3>
                          <p className="text-muted-foreground">
                              Sign up for free and tell us your learning preferences.
                          </p>
                      </div>
                       <div className="flex flex-col items-center text-center space-y-4 z-10">
                          <div className="bg-background flex items-center justify-center size-20 rounded-full border-4 border-primary shadow-lg">
                               <span className="text-3xl font-bold text-primary">2</span>
                          </div>
                          <h3 className="text-2xl font-bold">Explore Materials</h3>
                          <p className="text-muted-foreground">
                              Access our curated class materials, assignments, and announcements.
                          </p>
                      </div>
                       <div className="flex flex-col items-center text-center space-y-4 z-10">
                          <div className="bg-background flex items-center justify-center size-20 rounded-full border-4 border-primary shadow-lg">
                               <span className="text-3xl font-bold text-primary">3</span>
                          </div>
                          <h3 className="text-2xl font-bold">Join a Session</h3>
                          <p className="text-muted-foreground">
                              Attend live online or in-person tutoring sessions and start learning!
                          </p>
                      </div>
                  </div>
                </div>
            </div>
        </section>

        <section ref={el => sectionsRef.current[3] = el} id="testimonials" className="w-full py-16 md:py-24 lg:py-32 fade-in-section">
            <div className="px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-3">
                        <div className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-semibold tracking-wider text-secondary-foreground">Testimonials</div>
                        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">What Our Students Say</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Hear from students who have grown with The Webels.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl gap-8 py-16 lg:grid-cols-2 lg:gap-12">
                    <Card className="bg-card hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-6">
                                <Avatar className="h-16 w-16 border-2 border-primary/50" data-ai-hint={placeholderImages.testimonial1.hint}>
                                    <AvatarImage src={placeholderImages.testimonial1.src} />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div className="space-y-4 flex-1">
                                    <Quote className="w-10 h-10 text-primary/50" />
                                    <p className="text-muted-foreground text-lg">"The Webels made learning AP Computer Science so much more approachable. My tutor was patient and really knew their stuff. I finally understood recursion!"</p>
                                    <div>
                                        <p className="font-semibold text-lg">Jessica D.</p>
                                        <p className="text-sm text-muted-foreground">High School Student</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-6">
                                <Avatar className="h-16 w-16 border-2 border-primary/50" data-ai-hint={placeholderImages.testimonial2.hint}>
                                    <AvatarImage src={placeholderImages.testimonial2.src} />
                                    <AvatarFallback>MO</AvatarFallback>
                                </Avatar>
                                <div className="space-y-4 flex-1">
                                    <Quote className="w-10 h-10 text-primary/50" />
                                    <p className="text-muted-foreground text-lg">"I wanted to learn web development but didn't know where to start. The online sessions were perfect for my schedule, and it was amazing to learn from another student."</p>
                                    <div>
                                        <p className="font-semibold text-lg">Michael O.</p>
                                        <p className="text-sm text-muted-foreground">Beginner Developer</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section ref={el => sectionsRef.current[4] = el} id="cta" className="w-full py-16 md:py-24 lg:py-32 bg-secondary/50 border-t fade-in-section">
            <div className="px-4 md:px-6">
                <div className="flex flex-col items-center space-y-6 text-center bg-gradient-to-r from-primary to-accent p-12 rounded-2xl shadow-2xl">
                    <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl text-primary-foreground">Ready to Start Learning?</h2>
                    <p className="max-w-2xl text-primary-foreground/80 md:text-xl">
                        Join our community of passionate learners and tutors today. Create your free account and unlock your potential in tech.
                    </p>
                    <LoadingLink href="/signup" asButton buttonProps={{size: "lg", variant: "secondary", className: "mt-4 scale-110 hover:scale-125 transition-transform duration-300"}}>
                        Sign Up for Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </LoadingLink>
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-background border-t">
          <div className="flex flex-col gap-4 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6">
            <p className="text-sm text-muted-foreground">&copy; 2024 The Webels. All rights reserved.</p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
              <LoadingLink href="#" className="text-sm hover:underline underline-offset-4" prefetch={false}>
                Terms of Service
              </LoadingLink>
              <LoadingLink href="#" className="text-sm hover:underline underline-offset-4" prefetch={false}>
                Privacy
              </LoadingLink>
            </nav>
          </div>
      </footer>
    </div>
  );
}
