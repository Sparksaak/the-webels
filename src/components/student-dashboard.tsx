
"use client";

import {
  FileText,
  Megaphone,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useEffect, useState } from 'react';
import type { AppUser } from '@/app/messages/types';
import { getDashboardData } from '@/app/dashboard/actions';
import { type Assignment } from '@/app/assignments/actions';
import { Button } from './ui/button';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ClientOnly } from './client-only';

interface StudentDashboardProps {
    user: AppUser;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface StudentStats {
    upcomingAssignments: number;
    recentAnnouncements: number;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [overdueAssignments, setOverdueAssignments] = useState<Assignment[]>([]);
  const [assignmentsToComplete, setAssignmentsToComplete] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { teacher: fetchedTeacher, stats: fetchedStats, overdueAssignments: fetchedOverdue, assignmentsToComplete: fetchedUpcoming } = await getDashboardData();
        if (fetchedTeacher) {
            setTeacher(fetchedTeacher as Teacher);
        }
        if (fetchedStats) {
            setStats(fetchedStats as StudentStats);
        }
        if (fetchedOverdue) {
            setOverdueAssignments(fetchedOverdue as Assignment[]);
        }
        if (fetchedUpcoming) {
            setAssignmentsToComplete(fetchedUpcoming as Assignment[]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments To Do</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats?.upcomingAssignments ?? 0}</div>
               <p className="text-xs text-muted-foreground">upcoming assignments</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Announcements</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats?.recentAnnouncements ?? 0}</div>
               <p className="text-xs text-muted-foreground">in the last 7 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Overdue Assignments
                    </CardTitle>
                    <CardDescription>These assignments are past their due date. Submit them as soon as possible.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AssignmentList assignments={overdueAssignments} loading={loading} emptyMessage="No overdue assignments. Great job!" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Assignments to Complete</CardTitle>
                    <CardDescription>Here are your upcoming assignments.</CardDescription>
                </CardHeader>
                <CardContent>
                     <AssignmentList assignments={assignmentsToComplete} loading={loading} emptyMessage="No assignments to complete." />
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Teacher</CardTitle>
              <CardDescription>Your primary instructor for your class.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>Loading teacher information...</p>
                  </div>
                ) : teacher ? (
                  <div className="flex items-center gap-4 pt-4">
                    <Avatar className="h-12 w-12" data-ai-hint="person portrait">
                        <AvatarImage src={`https://placehold.co/100x100.png`} alt={teacher.full_name} />
                        <AvatarFallback>{teacher.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">{teacher.full_name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>Your teacher has not been assigned yet.</p>
                    </div>
                )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>Your upcoming class time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-muted-foreground pt-4">
                <Clock className="h-8 w-8" />
                <div className="text-center ">
                    <p className="font-semibold text-foreground">Monday, 10:00 AM</p>
                    <p className="text-sm">Next class starts soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}


function AssignmentList({ assignments, loading, emptyMessage }: { assignments: Assignment[], loading: boolean, emptyMessage: string }) {
    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading assignments...</div>;
    }
    if (assignments.length === 0) {
        return <div className="text-sm text-muted-foreground">{emptyMessage}</div>;
    }

    return (
        <ul className="space-y-4">
            {assignments.map(assignment => (
                <li key={assignment.id} className="flex items-center justify-between">
                    <div>
                        <Link href={`/assignments?assignment_id=${assignment.id}`} className="font-medium hover:underline">
                            {assignment.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                            {assignment.dueDate ? (
                                <ClientOnly>
                                    Due {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                                </ClientOnly>
                            ) : (
                                'No due date'
                            )}
                        </p>
                    </div>
                     <Button asChild variant="secondary" size="sm">
                        <Link href={`/assignments`}>View</Link>
                    </Button>
                </li>
            ))}
        </ul>
    )
}
