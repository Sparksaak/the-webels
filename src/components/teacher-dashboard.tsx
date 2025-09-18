
"use client";

import {
  Users,
  FileText,
  Megaphone,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import type { AppUser } from '@/app/messages/types';
import type { Assignment } from '@/app/assignments/actions';
import { Button } from './ui/button';
import { generateAvatarUrl, getInitials } from '@/lib/utils';

interface Student {
    id: string;
    full_name: string;
    email: string;
    learning_preference?: 'online' | 'in-person';
    avatarUrl: string;
}

interface TeacherStats {
    totalStudents: number;
    assignmentsCreated: number;
    announcementsPosted: number;
}

interface TeacherDashboardProps {
    user: AppUser;
    initialData: any;
}

export function TeacherDashboard({ user, initialData }: TeacherDashboardProps) {
  const { students, stats, assignmentsToGrade } = initialData || {};
  const loading = !initialData;

  const onlineStudents = students?.filter((s: Student) => s.learning_preference === 'online') || [];
  const inPersonStudents = students?.filter((s: Student) => s.learning_preference === 'in-person') || [];

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats?.totalStudents ?? 0}</div>
                 <p className="text-xs text-muted-foreground">in online & in-person classes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats?.assignmentsCreated ?? 0}</div>
                <p className="text-xs text-muted-foreground">assignments created</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats?.announcementsPosted ?? 0}</div>
                <p className="text-xs text-muted-foreground">announcements posted</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Student Roster</CardTitle>
                <CardDescription>An overview of all your students, organized by class type.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="online">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="online">Online Students ({onlineStudents.length})</TabsTrigger>
                            <TabsTrigger value="in-person">In-Person Students ({inPersonStudents.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="online">
                            <StudentList students={onlineStudents} loading={loading} />
                        </TabsContent>
                        <TabsContent value="in-person">
                            <StudentList students={inPersonStudents} loading={loading} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Assignments to Grade</CardTitle>
                    <CardDescription>
                        These assignments have new submissions that need your attention.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AssignmentsToGradeList assignments={assignmentsToGrade || []} loading={loading} />
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

function StudentList({ students, loading }: { students: Student[], loading: boolean }) {
    if (loading) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>Loading students...</p>
            </div>
        )
    }
    if (students.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>No students in this section.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-72">
            <div className="space-y-4 pr-4">
                {students.map(student => (
                    <div key={student.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                        <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                            <AvatarImage src={student.avatarUrl} alt={student.full_name} />
                            <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}


function AssignmentsToGradeList({ assignments, loading }: { assignments: Assignment[], loading: boolean }) {
    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading assignments...</div>;
    }
    if (assignments.length === 0) {
        return <div className="text-sm text-center py-12 text-muted-foreground">No assignments need grading. You're all caught up!</div>;
    }

    return (
        <ScrollArea className="h-72">
            <ul className="space-y-4 pr-4">
                {assignments.map(assignment => (
                    <li key={assignment.id} className="flex items-center justify-between">
                        <div>
                            <Link href={`/assignments`} className="font-medium hover:underline">
                                {assignment.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                                View submissions
                            </p>
                        </div>
                        <Button asChild variant="secondary" size="sm">
                            <Link href={`/assignments`}>View</Link>
                        </Button>
                    </li>
                ))}
            </ul>
        </ScrollArea>
    )
}
