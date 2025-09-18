
'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { StudentDashboard } from '@/components/student-dashboard';
import { useRouter } from 'next/navigation';
import { generateAvatarUrl } from '@/lib/utils';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};


function DashboardContent({ currentUser }: { currentUser: AppUser }) {
  return (
      <>
        {currentUser.role === 'teacher' ? <TeacherDashboard user={currentUser} /> : <StudentDashboard user={currentUser} />}
      </>
  );
}

export default function DashboardPage() {
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
      }
      fetchUser();
  }, [router, supabase]);

  if (loading || !currentUser) {
      return (
          <div className="flex min-h-screen w-full items-center justify-center">
            <div>Loading dashboard...</div>
          </div>
      )
  }

  return (
    <AppLayout user={currentUser}>
      <Suspense fallback={<div className="flex h-[calc(100vh-theme(spacing.24))] w-full items-center justify-center"><div className="text-muted-foreground">Loading dashboard...</div></div>}>
        <DashboardContent currentUser={currentUser} />
      </Suspense>
    </AppLayout>
  );
}
