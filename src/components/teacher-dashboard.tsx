
import Link from 'next/link';
import {
  BookOpen,
  PlusCircle,
  Users,
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/mock-data';

interface TeacherDashboardProps {
    user: User;
}

// Mock data for demonstration - replace with actual data fetching
const teacherClasses = [
    { id: 'class-1', name: 'Intro to React', studentCount: 25 },
    { id: 'class-2', name: 'Advanced NodeJS', studentCount: 18 },
    { id: 'class-3', name: 'UI/UX Design Principles', studentCount: 32 },
];

const teacherAnnouncements = [
    { class: 'Intro to React', title: 'Welcome!', date: 'May 10' },
    { class: 'Advanced NodeJS', title: 'Project 1 Deadline Extended', date: 'May 12' },
];


export function TeacherDashboard({ user }: TeacherDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">3</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">75</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">5</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Submissions</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">12</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>An overview of your current classes.</CardDescription>
              </div>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherClasses.map((c, index) => (
                    <div key={c.id}>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <Link href={`/classes/${c.id}?role=teacher`} className="font-semibold hover:underline">{c.name}</Link>
                                <span className="text-sm text-muted-foreground">{c.studentCount} students</span>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/classes/${c.id}?role=teacher`}>Manage</Link>
                            </Button>
                        </div>
                        {index < teacherClasses.length - 1 && <Separator className="my-4" />}
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
                {teacherAnnouncements.map((ann, index) => (
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
