
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppUser } from '@/app/messages/types';
import type { ClassSchedule } from './actions';
import { NewScheduleDialog } from '@/components/new-schedule-dialog';
import { ScheduleList } from '@/components/schedule-list';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getClassSchedules } from './actions';

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


function SchedulePageContent({ currentUser, initialSchedules }: { currentUser: AppUser, initialSchedules: ClassSchedule[] }) {
    const onlineSchedules = initialSchedules.filter(s => s.class_type === 'online');
    const inPersonSchedules = initialSchedules.filter(s => s.class_type === 'in-person');

    return (
        <AppLayout user={currentUser}>
            <div className="w-full space-y-8">
                <div className="flex items-center justify-between">
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
            </div>
        </AppLayout>
    );
}

export default async function SchedulePage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
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
        name: name!,
        email: user.email!,
        role: role,
        avatarUrl: generateAvatarUrl(name!),
        learning_preference: learningPreference,
    };

    const schedules = await getClassSchedules();

    return (
        <Suspense fallback={
            <div className="flex min-h-screen w-full items-center justify-center">
              <div>Loading...</div>
            </div>
        }>
            <SchedulePageContent currentUser={currentUser} initialSchedules={schedules} />
        </Suspense>
    );
}
