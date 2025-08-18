
"use client";

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

function ClassesContent() {
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
            <div>Loading classes...</div>
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
                <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                <p className="text-muted-foreground">
                    {currentUser.role === 'teacher' ? 'Manage your classes and students.' : 'View your enrolled classes.'}
                </p>
            </div>
            {currentUser.role === 'teacher' && (
                <Button asChild>
                    <Link href="/classes/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Class
                    </Link>
                </Button>
            )}
        </div>
        
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>{currentUser.role === 'teacher' ? 'My Classes' : 'Enrolled Classes'}</CardTitle>
                    <CardDescription>
                        {currentUser.role === 'teacher' ? 'A list of all your created classes.' : 'A list of all classes you are enrolled in.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-12">
                        {currentUser.role === 'teacher' ? (
                            <p>You haven't created any classes yet.</p>
                        ) : (
                            <p>You are not enrolled in any classes yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </AppLayout>
  );
}

export default function ClassesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ClassesContent />
        </Suspense>
    )
}
