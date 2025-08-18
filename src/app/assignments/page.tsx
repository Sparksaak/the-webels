
"use client";

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

function AssignmentsContent() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const role = user.user_metadata?.role || 'student';
            const name = user.user_metadata?.full_name || user.email;

            const fetchedUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`,
            };
            setCurrentUser(fetchedUser);
        } else {
            router.push('/login');
        }
        setLoading(false);
    };
    fetchUser();
  }, [router]);

  if (loading) {
    return (
        <div className="flex items-center justify-center">
            <div>Loading assignments...</div>
        </div>
    );
  }

  if (!currentUser) {
      return null;
  }

  return (
    <AppLayout userRole={currentUser.role}>
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                <p className="text-muted-foreground">
                    {currentUser.role === 'teacher' ? 'Create and manage assignments for your classes.' : 'View your assignments.'}
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
                       A list of all your assignments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-24">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4">No assignments have been created yet.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </AppLayout>
  );
}

export default function AssignmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AssignmentsContent />
        </Suspense>
    )
}
