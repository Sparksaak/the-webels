
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { StudentDashboard } from '@/components/student-dashboard';
import { redirect } from 'next/navigation';
import { getDashboardData } from './actions';
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


async function DashboardContent({ currentUser, dashboardData }: { currentUser: AppUser, dashboardData: any }) {
  return (
    <div className="w-full">
        {currentUser.role === 'teacher' ? <TeacherDashboard user={currentUser} initialData={dashboardData} /> : <StudentDashboard user={currentUser} initialData={dashboardData} />}
    </div>
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
  
  const dashboardData = await getDashboardData();

  return (
    <AppLayout user={currentUser}>
      <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><div className="text-muted-foreground">Loading dashboard...</div></div>}>
        <DashboardContent currentUser={currentUser} dashboardData={dashboardData} />
      </Suspense>
    </AppLayout>
  );
}
