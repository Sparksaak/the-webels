
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { redirect } from 'next/navigation';
import { generateAvatarUrl } from '@/lib/utils';
import { getProfile, type Profile } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/profile-form';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

async function SettingsContent({ user, profile }: { user: AppUser, profile: Profile }) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and profile settings.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>This is how others will see you on the site.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm profile={profile} />
                </CardContent>
            </Card>
        </div>
    )
}

export default async function SettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = user.user_metadata?.role || 'student';
    const name = user.user_metadata?.full_name || user.email;

    const currentUser: AppUser = {
        id: user.id,
        name: name!,
        email: user.email!,
        role: role,
        avatarUrl: generateAvatarUrl(name!),
    };

    const profile = await getProfile();

    if (!profile) {
        // Handle case where profile is not found, maybe redirect or show an error
        return (
             <AppLayout user={currentUser}>
                <div className="text-center text-muted-foreground">Could not load profile.</div>
             </AppLayout>
        );
    }

    return (
        <AppLayout user={currentUser}>
            <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><div className="text-muted-foreground">Loading settings...</div></div>}>
                <SettingsContent user={currentUser} profile={profile} />
            </Suspense>
        </AppLayout>
    );
}
