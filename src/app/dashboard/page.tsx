
"use client";

import { Suspense, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { StudentDashboard } from '@/components/student-dashboard';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const role = user.user_metadata.role || 'student';
            const fetchedUser: User = {
                id: user.id,
                name: user.user_metadata.full_name,
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

  if (loading || !currentUser) {
    return (
        <div className="flex min-h-screen bg-background items-center justify-center">
            <div>Loading dashboard...</div>
        </div>
    );
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
