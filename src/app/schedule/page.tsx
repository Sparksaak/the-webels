
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { AppUser } from '@/app/messages/types';
import { getClassSchedules, type ClassSchedule } from './actions';
import { NewScheduleDialog } from '@/components/new-schedule-dialog';
import { ScheduleList } from '@/components/schedule-list';

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
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
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

            if (role === 'student') {
                router.push('/dashboard');
                return;
            }

            const name = user.user_metadata?.full_name || user.email;
            const learningPreference = user.user_metadata?.learning_preference;

            const appUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`,
                learning_preference: learningPreference,
            };
            
            setCurrentUser(appUser);
            
            const fetchedSchedules = await getClassSchedules();
            setSchedules(fetchedSchedules);

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

    return <SchedulePageContent currentUser={currentUser} initialSchedules={schedules} />
}
