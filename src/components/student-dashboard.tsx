
"use client";

import {
  FileText,
  Megaphone,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { AppUser } from '@/app/messages/types';
import { type Assignment } from '@/app/assignments/actions';
import { Button } from './ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { type ClassSchedule } from '@/app/schedule/actions';
import { getInitials } from '@/lib/utils';
import { LoadingLink } from './loading-link';

interface StudentDashboardProps {
    user: AppUser;
    initialData: any;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  avatarUrl: string;
}

interface StudentStats {
    upcomingAssignments: number;
    recentAnnouncements: number;
}


function formatTime(timeString: string) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];


export function StudentDashboard({ user, initialData }: StudentDashboardProps) {
  const { 
      teacher, 
      stats, 
      overdueAssignments, 
      assignmentsToComplete,
      schedules,
  } = initialData || {};

  const loading = !initialData;
  
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
                    <AssignmentList assignments={overdueAssignments || []} loading={loading} emptyMessage="No overdue assignments. Great job!" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Assignments to Complete</CardTitle>
                    <CardDescription>Here are your upcoming assignments.</CardDescription>
                </CardHeader>
                <CardContent>
                     <AssignmentList assignments={assignmentsToComplete || []} loading={loading} emptyMessage="No assignments to complete." />
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
                        <AvatarImage src={teacher.avatarUrl} alt={teacher.full_name} />
                        <AvatarFallback>{getInitials(teacher.full_name)}</AvatarFallback>
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
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>Your weekly class times.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                 <div className="text-sm text-muted-foreground pt-4">Loading schedule...</div>
              ) : schedules && schedules.length > 0 ? (
                 <div className="space-y-3 pt-4">
                    {schedules.map((schedule: ClassSchedule) => (
                        <div key={schedule.id} className="flex items-center gap-4 text-muted-foreground">
                            <Clock className="h-6 w-6 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-foreground">{schedule.title}</p>
                                <p className="text-sm">
                                    {weekDays.find(d => d.value === schedule.day_of_week)?.label} from {formatTime(schedule.start_time)} to {formatTime(schedule.end_time)}
                                </p>
                            </div>
                        </div>
                    ))}
                 </div>
              ) : (
                 <div className="text-sm text-muted-foreground pt-4">No classes scheduled for your track yet.</div>
              )}
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
                        <LoadingLink href={`/assignments?assignment_id=${assignment.id}`} className="font-medium hover:underline">
                            {assignment.title}
                        </LoadingLink>
                        <p className="text-xs text-muted-foreground">
                            {assignment.dueDate ? (
                                <>
                                    Due {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                                </>
                            ) : (
                                'No due date'
                            )}
                        </p>
                    </div>
                     <LoadingLink href={`/assignments`} asButton buttonProps={{variant: "secondary", size: "sm"}}>
                        View
                    </LoadingLink>
                </li>
            ))}
        </ul>
    )
}
