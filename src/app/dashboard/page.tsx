
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { StudentDashboard } from '@/components/student-dashboard';
import { redirect } from 'next/navigation';

type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};

async function DashboardPage() {
  const supabase = createClient();
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
      avatarUrl: `https://placehold.co/100x100.png`,
  };

  return (
    <AppLayout user={currentUser}>
        {currentUser.role === 'teacher' ? <TeacherDashboard user={currentUser} /> : <StudentDashboard user={currentUser} />}
    </AppLayout>
  );
}

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-background items-center justify-center"><div>Loading dashboard...</div></div>}>
      <DashboardPage />
    </Suspense>
  )
}
