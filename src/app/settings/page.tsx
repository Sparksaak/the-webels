
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { redirect } from 'next/navigation';
import { getProfile, type Profile } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProfileForm } from '@/components/profile-form';
import { UpdatePasswordForm } from '@/components/update-password-form';
import { DeleteAccountButton } from '@/components/delete-account-button';
import { cookies } from 'next/headers';

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

async function SettingsContent({ user, profile }: { user: AppUser, profile: Profile }) {
    return (
        <div className="w-full space-y-8">
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
            
            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Update your password here. It is recommended to use a strong password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UpdatePasswordForm />
                </CardContent>
            </Card>

            <Separator />

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                        <div>
                            <h3 className="font-semibold">Delete Account</h3>
                            <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                        </div>
                        <DeleteAccountButton />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default async function SettingsPage() {
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
        name: name!,
        email: user.email!,
        role: role,
        avatarUrl: generateAvatarUrl(name!),
    };

    const profile = await getProfile();

    if (!profile) {
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
