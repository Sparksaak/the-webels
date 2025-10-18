
import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAssignments, type Assignment } from './actions';
import { cookies } from 'next/headers';
import { AssignmentsPageContent } from '@/components/assignments-page-content';

function getInitials(name: string | null | undefined = ''): string {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function generateAvatarUrl(name: string | null | undefined): string {
    const initials = getInitials(name);
    return `https://placehold.co/100x100/EFEFEF/333333/png?text=${initials}`;
}

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};


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
        avatarUrl: generateAvatarUrl(name),
    };
    
    const assignments = await getAssignments();

    return (
        <AppLayout user={currentUser}>
            <div className="w-full space-y-8">
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
            </div>
        </AppLayout>
    );
}
