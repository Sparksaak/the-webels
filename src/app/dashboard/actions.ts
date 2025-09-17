
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getDashboardData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Use the admin client to fetch all users securely
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users with admin client:', usersError);
    throw usersError;
  }
  
  const allUsers = users.map(u => ({
      id: u.id,
      full_name: u.user_metadata.full_name || u.email,
      email: u.email,
      role: u.user_metadata.role as 'teacher' | 'student',
      learning_preference: u.user_metadata.learning_preference as 'online' | 'in-person' | undefined
  }));

  if (user.user_metadata.role === 'teacher') {
    const students = allUsers.filter(u => u.role === 'student');
    
    const [
        { count: assignmentCount },
        { count: announcementCount }
    ] = await Promise.all([
        supabaseAdmin.from('assignments').select('id', { count: 'exact' }).eq('teacher_id', user.id),
        supabaseAdmin.from('announcements').select('id', { count: 'exact' }).eq('user_id', user.id)
    ]);

    return { 
        students,
        stats: {
            totalStudents: students.length,
            assignmentsCreated: assignmentCount ?? 0,
            announcementsPosted: announcementCount ?? 0,
        }
    };
  }

  if (user.user_metadata.role === 'student') {
    const teacher = allUsers.find(u => u.role === 'teacher') || null;
    
    const [
        { data: assignmentsData, error: assignmentsError },
        { count: announcementCount, error: announcementsError }
    ] = await Promise.all([
        supabaseAdmin.from('assignments').select('id, due_date').gt('due_date', new Date().toISOString()),
        supabaseAdmin.from('announcements').select('id', { count: 'exact' }).gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    if (assignmentsError) console.error('Error fetching student assignments:', assignmentsError);
    if (announcementsError) console.error('Error fetching student announcements:', announcementsError);

    const upcomingAssignmentsCount = assignmentsData?.length ?? 0;

    return { 
        teacher,
        stats: {
            upcomingAssignments: upcomingAssignmentsCount,
            recentAnnouncements: announcementCount ?? 0,
        }
    };
  }

  return {};
}
