
"use client";

import { Suspense, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { StudentDashboard } from '@/components/student-dashboard';
import { useRouter } from 'next/navigation';

// We need a specific type for the user object that includes the role and full name
type AppUser = {
    id: string;
    email: string;
    role: 'teacher' | 'student';
    name: string;
    avatarUrl: string;
};


function DashboardContent() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // The role and full_name are stored in user_metadata
            const role = user.user_metadata?.role || 'student';
            const name = user.user_metadata?.full_name || user.email; // Fallback to email if name is not set

            const fetchedUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`
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
        <div className="flex min-h-screen bg-background items-center justify-center">
            <div>Loading dashboard...</div>
        </div>
    );
  }

  if (!currentUser) {
      // This case is handled by the redirect in useEffect, but it's good practice
      // to have a fallback UI state.
      return null;
  }

  return (
    <AppLayout userRole={currentUser.role}>
        {currentUser.role === 'teacher' ? <TeacherDashboard user={currentUser} /> : <StudentDashboard user={currentUser} />}
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
