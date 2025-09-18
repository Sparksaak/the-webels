
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { StudentDashboard } from '@/components/student-dashboard';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ClientOnly } from '@/components/client-only';
import { generateAvatarUrl } from '@/lib/utils';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

async function DashboardContent({ currentUser }: { currentUser: AppUser }) {
  return (
    <ClientOnly>
      {currentUser.role === 'teacher' ? <TeacherDashboard user={currentUser} /> : <StudentDashboard user={currentUser} />}
    </ClientOnly>
  );
}

export default async function DashboardPage() {
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

  return (
    <AppLayout user={currentUser}>
      <Suspense fallback={<div className="flex min-h-[calc(100vh_-_theme(spacing.24))] items-center justify-center"><div>Loading dashboard...</div></div>}>
        <DashboardContent currentUser={currentUser} />
      </Suspense>
    </AppLayout>
  );
}
