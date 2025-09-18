
'use client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppUser } from '@/app/messages/types';
import type { ClassSchedule } from './actions';
import { NewScheduleDialog } from '@/components/new-schedule-dialog';
import { ScheduleList } from '@/components/schedule-list';
import { Suspense } from 'react';

function SchedulePageContent({ currentUser, initialSchedules }: { currentUser: AppUser, initialSchedules: ClassSchedule[] }) {
    const onlineSchedules = initialSchedules.filter(s => s.class_type === 'online');
    const inPersonSchedules = initialSchedules.filter(s => s.class_type === 'in-person');

    return (
        <AppLayout user={currentUser}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
                    <p className="text-muted-foreground">Manage your weekly class schedules.</p>
                </div>
                {currentUser.role === 'teacher' && (
                    <NewScheduleDialog />
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Online Classes Schedule</CardTitle>
                        <CardDescription>Schedule for online classes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <ScheduleList schedules={onlineSchedules} user={currentUser} classType="online" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>In-Person Classes Schedule</CardTitle>
                        <CardDescription>Schedule for in-person classes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScheduleList schedules={inPersonSchedules} user={currentUser} classType="in-person" />
                    </CardContent>
                </Card>
            </div>

        </AppLayout>
    );
}


export default function SchedulePageWrapper() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen w-full items-center justify-center">
              <div>Loading...</div>
            </div>
        }>
            <SchedulePage />
        </Suspense>
    );
}

async function SchedulePage() {
    const { createClient } = await import('@/lib/supabase/server');
    const { redirect } = await import('next/navigation');
    const { cookies } = await import('next/headers');
    const { generateAvatarUrl } = await import('@/lib/utils');
    const { getClassSchedules } = await import('./actions');

    const cookieStore = cookies();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = user.user_metadata?.role || 'student';
    if (role === 'student') {
        redirect('/dashboard');
    }

    const name = user.user_metadata?.full_name || user.email;
    const learningPreference = user.user_metadata?.learning_preference;

    const currentUser: AppUser = {
        id: user.id,
        name: name,
        email: user.email!,
        role: role,
        avatarUrl: generateAvatarUrl(name!),
        learning_preference: learningPreference,
    };

    const schedules = await getClassSchedules();

    return <SchedulePageContent currentUser={currentUser} initialSchedules={schedules} />
}
