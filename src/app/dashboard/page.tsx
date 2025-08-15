"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
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
import {
  announcements,
  assignments,
  classes,
  enrollments,
  submissions,
  users,
} from '@/lib/mock-data';

function DashboardContent() {
  const searchParams = useSearchParams();
  const userRole = searchParams.get('role') === 'student' ? 'student' : 'teacher';
  const currentUser = users.find((u) => u.role === userRole)!;
  const teacher = users.find((u) => u.role === 'teacher')!;

  const teacherClasses = classes.filter((c) => c.teacherId === currentUser.id);
  const studentEnrollments = enrollments.filter((e) => e.userId === currentUser.id);
  const studentClasses = classes.filter((c) => studentEnrollments.some((e) => e.classId === c.id));
  const studentAssignments = assignments.filter(a => studentClasses.some(sc => sc.id === a.classId));
  const pendingSubmissionsCount = submissions.filter(s => s.studentId === currentUser.id && s.status === 'pending').length;

  return (
    <AppLayout userRole={userRole}>
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
                {userRole === 'teacher' ? 'Total Classes' : 'Enrolled Classes'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userRole === 'teacher' ? teacherClasses.length : studentClasses.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'teacher' ? 'Total Students' : 'Pending Assignments'}
              </CardTitle>
              {userRole === 'teacher' ? (
                 <Users className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userRole === 'teacher'
                  ? enrollments.filter(e => teacherClasses.some(tc => tc.id === e.classId)).length
                  : pendingSubmissionsCount
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
              <div className="text-2xl font-bold">{studentAssignments.length}</div>
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
              {userRole === 'teacher' && (
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(userRole === 'teacher' ? teacherClasses : studentClasses).map((cls) => (
                  <Link key={cls.id} href={`/classes/${cls.id}?role=${userRole}`} className="block">
                    <div className="flex items-center space-x-4 rounded-md border p-4 transition-all hover:bg-muted/50">
                        <div className={`h-2 w-2 rounded-full ${cls.color}`} />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{cls.name}</p>
                            <p className="text-sm text-muted-foreground">{cls.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6" data-ai-hint="person portrait">
                                <AvatarImage src={teacher.avatarUrl} />
                                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{teacher.name}</span>
                        </div>
                    </div>
                  </Link>
                ))}
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
                {announcements.map((ann) => (
                  <div key={ann.id} className="flex items-start space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{ann.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ann.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{ann.content}</p>
                    </div>
                  </div>
                ))}
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
