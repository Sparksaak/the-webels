
import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  CalendarCheck,
  MessageSquare,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/mock-data';

interface StudentDashboardProps {
    user: User;
}

// Mock data for demonstration - replace with actual data fetching
const studentClasses = [
    { id: 'class-1', name: 'Intro to React', teacher: 'Dr. Evelyn Reed', upcoming: 'Homework due Friday' },
    { id: 'class-2', name: 'Advanced NodeJS', teacher: 'Dr. Evelyn Reed', upcoming: 'Quiz next week' },
];

const studentAnnouncements = [
    { class: 'Intro to React', title: 'Welcome!', date: 'May 10' },
    { class: 'Advanced NodeJS', title: 'Project 1 Deadline Extended', date: 'May 12' },
];

export function StudentDashboard({ user }: StudentDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>An overview of your current classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentClasses.map((c, index) => (
                    <div key={c.id}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <Link href={`/classes/${c.id}?role=student`} className="font-semibold hover:underline">{c.name}</Link>
                                <span className="text-sm text-muted-foreground">Taught by {c.teacher}</span>
                            </div>
                            <div className='text-right'>
                                <Badge variant="secondary">{c.upcoming}</Badge>
                            </div>
                        </div>
                        {index < studentClasses.length - 1 && <Separator className="my-4" />}
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {studentAnnouncements.map((ann, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div className="bg-primary/10 text-primary p-2 rounded-full">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{ann.title}</p>
                            <p className="text-xs text-muted-foreground">{ann.class} &middot; {ann.date}</p>
                        </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
