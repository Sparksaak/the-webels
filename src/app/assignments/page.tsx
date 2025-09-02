
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

async function AssignmentsContent() {
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
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                <p className="text-muted-foreground">
                    {currentUser.role === 'teacher' ? 'Create and manage assignments for your classes.' : 'View and submit your assignments.'}
                </p>
            </div>
            {currentUser.role === 'teacher' && (
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Assignment
                </Button>
            )}
        </div>
        
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>All Assignments</CardTitle>
                    <CardDescription>
                       A list of all assignments.
                    </CardDescription>
                </Header>
                <CardContent>
                    <div className="text-center text-muted-foreground py-24">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4">No assignments have been posted yet.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </AppLayout>
  );
}

export default function AssignmentsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen bg-background items-center justify-center"><div>Loading assignments...</div></div>}>
            <AssignmentsContent />
        </Suspense>
    )
}
