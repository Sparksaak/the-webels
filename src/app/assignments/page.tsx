
'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { getAssignments, deleteAssignment, type Assignment } from './actions';
import { NewAssignmentDialog } from '@/components/new-assignment-dialog';
import { ClientOnly } from '@/components/client-only';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

function DeleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
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
                    <form action={deleteAssignment.bind(null, assignmentId)}>
                        <AlertDialogAction asChild>
                           <Button type="submit" variant="destructive">Delete</Button>
                        </AlertDialogAction>
                    </form>
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
          <CardDescription className={cn('text-sm', isOverdue && assignment.submissionStatus !== 'Submitted' && assignment.submissionStatus !== 'Graded' ? 'text-destructive' : 'text-muted-foreground')}>
            <ClientOnly>Due {format(new Date(dueDate), 'MMM d, yyyy @ p zzz')}</ClientOnly>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2">{assignment.description || "No description provided."}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClientOnly>Posted {formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true })} by {assignment.teacher.name}</ClientOnly>
             {user.role === 'teacher' && user.id === assignment.teacher.id && (
                <ClientOnly>
                    <DeleteAssignmentButton assignmentId={assignment.id} />
                </ClientOnly>
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

function AssignmentsList({ currentUser, initialAssignments }: { currentUser: AppUser, initialAssignments: Assignment[] }) {
  const [filter, setFilter] = useState('all');

  const filteredAssignments = useMemo(() => {
    if (currentUser.role !== 'student') {
        return initialAssignments;
    }

    switch (filter) {
        case 'todo':
            return initialAssignments.filter(a => a.submissionStatus === 'Not Submitted' && (a.dueDate ? !isPast(new Date(a.dueDate)) : true));
        case 'overdue':
            return initialAssignments.filter(a => a.submissionStatus === 'Not Submitted' && (a.dueDate ? isPast(new Date(a.dueDate)) : false));
        case 'submitted':
            return initialAssignments.filter(a => a.submissionStatus === 'Submitted' || a.submissionStatus === 'Graded');
        case 'all':
        default:
            return initialAssignments;
    }
  }, [filter, initialAssignments, currentUser.role]);

  return (
    <>
      {currentUser.role === 'student' && (
        <Tabs defaultValue="all" onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {filteredAssignments.length === 0 ? (
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
    </>
  );
}


function AssignmentsPageContent({ currentUser, initialAssignments }: { currentUser: AppUser, initialAssignments: Assignment[] }) {
    return (
        <AppLayout user={currentUser}>
            <div className="flex items-center justify-between mb-8">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                <p className="text-muted-foreground">
                    {currentUser.role === 'teacher' ? 'Create and manage assignments for your classes.' : 'View and submit your assignments.'}
                </p>
                </div>
                {currentUser.role === 'teacher' && (
                <ClientOnly>
                    <NewAssignmentDialog />
                </ClientOnly>
                )}
            </div>
            <AssignmentsList currentUser={currentUser} initialAssignments={initialAssignments} />
        </AppLayout>
    );
}

export default function AssignmentsPageWrapper() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const role = user.user_metadata?.role || 'student';
            const name = user.user_metadata?.full_name || user.email;

            const appUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`,
            };
            
            setCurrentUser(appUser);
            
            const fetchedAssignments = await getAssignments();
            setAssignments(fetchedAssignments);
            setLoading(false);
        };
        
        fetchData();

    }, [supabase, router]);


    if (loading || !currentUser) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
              <div>Loading...</div>
            </div>
        )
    }

    return <AssignmentsPageContent currentUser={currentUser} initialAssignments={assignments} />
}
