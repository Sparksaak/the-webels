
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
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

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

function DeleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
    const deleteAction = async () => {
        'use server';
        await deleteAssignment(assignmentId);
    };

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
                    <form action={deleteAction}>
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
            Due {format(dueDate, 'MMM d, yyyy @ p zzz')}
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

async function AssignmentsList({ currentUser }: { currentUser: AppUser }) {
  const assignments = await getAssignments();

  return (
    <>
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-24">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4">No assignments have been posted yet.</p>
              {currentUser.role === 'teacher' && <p className="text-sm">Click "New Assignment" to get started.</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map(assignment => (
            <AssignmentCard key={assignment.id} assignment={assignment} user={currentUser} />
          ))}
        </div>
      )}
    </>
  );
}

export default async function AssignmentsPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = user.user_metadata?.role || 'student';
    const name = user.user_metadata?.full_name || user.email;

    const currentUser: AppUser = {
        id: user.id,
        name: name,
        email: user.email!,
        role: role,
        avatarUrl: `https://placehold.co/100x100.png`,
    };

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
            <Suspense fallback={<div className="text-center py-24 text-muted-foreground">Loading assignments...</div>}>
                <AssignmentsList currentUser={currentUser} />
            </Suspense>
        </AppLayout>
    );
}
