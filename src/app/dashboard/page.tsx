
"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  PlusCircle,
  Users,
} from 'lucide-react';

import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/mock-data';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function DashboardContent() {
  const searchParams = useSearchParams();
  const userRole = searchParams.get('role') === 'student' ? 'student' : 'teacher';

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const role = user.user_metadata.role || 'student';
            const fetchedUser: User = {
                id: user.id,
                name: user.user_metadata.full_name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`
            };
            setCurrentUser(fetchedUser);
        }
    };
    fetchUser();
  }, []);

  if (!currentUser) {
    return <div>Loading...</div>;
  }


  return (
    <AppLayout userRole={currentUser.role}>
      <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser.name}!</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentUser.role === 'teacher' ? 'Total Classes' : 'Enrolled Classes'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentUser.role === 'teacher' ? 3 : 2}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentUser.role === 'teacher' ? 'Total Students' : 'Pending Assignments'}
              </CardTitle>
              {currentUser.role === 'teacher' ? (
                 <Users className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentUser.role === 'teacher'
                  ? 12
                  : 1
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* MY CLASSES */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle>My Classes</CardTitle>
                <CardDescription>An overview of your current classes.</CardDescription>
              </div>
              {currentUser.role === 'teacher' && (
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mocked class data for display */}
              </div>
            </CardContent>
          </Card>

          {/* RECENT ANNOUNCEMENTS */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Mocked announcement data for display */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
