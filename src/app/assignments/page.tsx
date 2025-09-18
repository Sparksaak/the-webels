
import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateAvatarUrl } from '@/lib/utils';
import { getAssignments, type Assignment } from './actions';
import { cookies } from 'next/headers';
import { AssignmentsPageContent } from '@/components/assignments-page-content';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};


export default async function AssignmentsPage() {
    const supabase = createClient();
    
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
        avatarUrl: generateAvatarUrl(name),
    };
    
    const assignments = await getAssignments();

    return (
        <AppLayout user={currentUser}>
            <div className="flex items-center justify-between mb-8">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                <p className="text-muted-foreground">
                    {currentUser.role === 'teacher' ? 'Create and manage assignments for your classes.' : 'View and submit your assignments.'}
                </p>
                </div>
            </div>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><div className="text-muted-foreground">Loading assignments...</div></div>}>
                <AssignmentsPageContent currentUser={currentUser} initialAssignments={assignments} />
            </Suspense>
        </AppLayout>
    );
}
