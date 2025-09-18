
'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { deleteAssignment, type Assignment } from '@/app/assignments/actions';
import { NewAssignmentDialog } from '@/components/new-assignment-dialog';
import { Badge } from '@/components/ui/badge';
import { ViewAssignmentSheet } from '@/components/view-assignment-sheet';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

function DeleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
    const [isPending, startTransition] = useTransition();
    
    const handleDelete = () => {
        startTransition(async () => {
            await deleteAssignment(assignmentId);
        });
    };
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the assignment and all associated submissions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                       <Button onClick={handleDelete} variant="destructive" disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete'}
                       </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


function AssignmentCard({ assignment, user }: { assignment: Assignment, user: AppUser }) {
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = dueDate ? isPast(dueDate) : false;

  const getStatus = () => {
    if (user.role === 'teacher') {
      const submittedCount = assignment.submissions.length;
      return `${submittedCount} submitted`;
    }
    switch (assignment.submissionStatus) {
      case 'Submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'Graded':
        return <Badge className="bg-green-100 text-green-800">Graded</Badge>;
      case 'Not Submitted':
        return isOverdue ? <Badge variant="destructive">Overdue</Badge> : <Badge variant="outline">Not Submitted</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
            <CardTitle className="text-xl pr-4">{assignment.title}</CardTitle>
             <div className="text-sm text-right flex-shrink-0">
                {getStatus()}
            </div>
        </div>
        {dueDate && (
          <CardDescription className={cn('text-sm', isOverdue && user.role === 'student' && assignment.submissionStatus !== 'Submitted' && assignment.submissionStatus !== 'Graded' ? 'text-destructive' : 'text-muted-foreground')}>
            Due {format(new Date(dueDate), 'MMM d, yyyy @ p zzz')}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2">{assignment.description || "No description provided."}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Posted {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })} by {assignment.teacher.name}
             {user.role === 'teacher' && user.id === assignment.teacher.id && (
                <DeleteAssignmentButton assignmentId={assignment.id} />
            )}
        </div>
        <ViewAssignmentSheet assignment={assignment} user={user}>
            <Button variant="secondary">
              {user.role === 'teacher' ? 'View Submissions' : 'View Assignment'}
            </Button>
        </ViewAssignmentSheet>
      </CardFooter>
    </Card>
  );
}

function AssignmentCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-28" />
            </CardFooter>
        </Card>
    );
}

function AssignmentsList({ currentUser, initialAssignments }: { currentUser: AppUser, initialAssignments: Assignment[] }) {
  const [filter, setFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (value: string) => {
    startTransition(() => {
        setFilter(value);
    });
  }

  const filteredAssignments = useMemo(() => {
    if (currentUser.role === 'teacher') {
        switch (filter) {
            case 'needs-grading':
                return initialAssignments.filter(a => a.submissions.some(s => !s.grade));
            case 'graded':
                 return initialAssignments.filter(a => a.submissions.length > 0 && a.submissions.every(s => s.grade));
            case 'all':
            default:
                return initialAssignments;
        }
    }

    // Student filtering logic
    switch (filter) {
        case 'todo':
            return initialAssignments.filter(a => a.submissionStatus === 'Not Submitted' && (a.dueDate ? !isPast(new Date(a.dueDate)) : true));
        case 'overdue':
            return initialAssignments.filter(a => a.submissionStatus === 'Not Submitted' && (a.dueDate ? isPast(new Date(a.dueDate)) : false));
        case 'completed':
            return initialAssignments.filter(a => a.submissionStatus === 'Submitted' || a.submissionStatus === 'Graded');
        case 'all':
        default:
            return initialAssignments;
    }
  }, [filter, initialAssignments, currentUser.role]);

  const TABS_CONFIG = {
      teacher: [
          { value: 'all', label: 'All' },
          { value: 'needs-grading', label: 'Needs Grading' },
          { value: 'graded', label: 'Graded' },
      ],
      student: [
          { value: 'all', label: 'All' },
          { value: 'todo', label: 'To Do' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'completed', label: 'Completed' },
      ],
  }
  const currentTabs = TABS_CONFIG[currentUser.role];

  return (
    <>
        <Tabs defaultValue="all" onValueChange={handleTabChange} className="mb-6">
            <div className='flex justify-between items-center'>
                 <TabsList>
                    {currentTabs.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} disabled={isPending}>{tab.label}</TabsTrigger>
                    ))}
                 </TabsList>
                 {currentUser.role === 'teacher' && <NewAssignmentDialog />}
            </div>

            {currentTabs.map(tab => (
                 <TabsContent key={tab.value} value={tab.value} className="mt-6">
                    {isPending ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <AssignmentCardSkeleton />
                            <AssignmentCardSkeleton />
                            <AssignmentCardSkeleton />
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <Card>
                        <CardContent className="py-24">
                            <div className="text-center text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4">No assignments found for this filter.</p>
                            {currentUser.role === 'teacher' && initialAssignments.length === 0 && <p className="text-sm">Click "New Assignment" to get started.</p>}
                            </div>
                        </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAssignments.map(assignment => (
                            <AssignmentCard key={assignment.id} assignment={assignment} user={currentUser} />
                        ))}
                        </div>
                    )}
                 </TabsContent>
            ))}
        </Tabs>
    </>
  );
}


export function AssignmentsPageContent({ currentUser, initialAssignments }: { currentUser: AppUser, initialAssignments: Assignment[] }) {
    return (
        <AssignmentsList currentUser={currentUser} initialAssignments={initialAssignments} />
    );
}
