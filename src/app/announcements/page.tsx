
'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Megaphone, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAnnouncements, deleteAnnouncement, type Announcement } from './actions';
import { NewAnnouncementDialog } from '@/components/new-announcement-dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { generateAvatarUrl } from '@/lib/utils';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

function DeleteButton({ announcementId }: { announcementId: string }) {
    const deleteAction = async () => {
        await deleteAnnouncement(announcementId);
    };

    return (
        <form action={deleteAction}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
            </Button>
        </form>
    );
}

function AnnouncementsList({ currentUser }: { currentUser: AppUser }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
        const data = await getAnnouncements();
        setAnnouncements(data);
        setLoading(false);
    }
    fetchAnnouncements();
  }, []);

  if (loading) {
      return <div className="flex min-h-[calc(100vh_-_theme(spacing.24))] bg-background items-center justify-center"><div>Loading announcements...</div></div>;
  }
  
  return (
    <>
      <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                <p className="text-muted-foreground">
                    {currentUser.role === 'teacher' ? 'Create and view announcements for your classes.' : 'View announcements from your teachers.'}
                </p>
            </div>
            {currentUser.role === 'teacher' && (
                <NewAnnouncementDialog />
            )}
        </div>
        
        <div className="mt-8">
            {announcements.length === 0 ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>All Announcements</CardTitle>
                        <CardDescription>
                           A list of all announcements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground py-24">
                            <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4">No announcements have been posted yet.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {announcements.map((announcement) => (
                        <Card key={announcement.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{announcement.title}</CardTitle>
                                        <CardDescription className="mt-2">
                                            Posted on {format(new Date(announcement.createdAt), 'MMMM d, yyyy')}
                                        </CardDescription>
                                    </div>
                                    {currentUser.role === 'teacher' && currentUser.id === announcement.author.id && (
                                        <DeleteButton announcementId={announcement.id} />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{announcement.content}</p>
                            </CardContent>
                            <CardFooter className="flex items-center gap-3">
                                 <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                                    <AvatarImage src={announcement.author.avatarUrl} alt={announcement.author.name} />
                                    <AvatarFallback>{announcement.author.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm">
                                    <p className="font-semibold">{announcement.author.name}</p>
                                    <p className="text-muted-foreground">{announcement.author.role}</p>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </>
  )
}

export default function AnnouncementsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const role = user.user_metadata?.role || 'student';
            const name = user.user_metadata?.full_name || user.email;

            const appUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: role,
                avatarUrl: generateAvatarUrl(name),
            };
            
            setCurrentUser(appUser);
            setLoading(false);
        };
        
        fetchUser();
    }, [supabase, router]);

    if (loading || !currentUser) {
        return <div className="flex min-h-screen bg-background items-center justify-center"><div>Loading...</div></div>;
    }

    return (
        <AppLayout user={currentUser}>
            <Suspense fallback={<div className="flex min-h-[calc(100vh_-_theme(spacing.24))] bg-background items-center justify-center"><div>Loading announcements...</div></div>}>
                <AnnouncementsList currentUser={currentUser} />
            </Suspense>
        </AppLayout>
    )
}
