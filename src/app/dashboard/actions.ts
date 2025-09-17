
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Assignment } from '@/app/assignments/actions';

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
        { data: submissionsData, error: submissionsError },
        { count: announcementCount, error: announcementsError }
    ] = await Promise.all([
        supabaseAdmin.from('assignments').select('*').order('due_date', { ascending: true }),
        supabaseAdmin.from('assignment_submissions').select('assignment_id').eq('student_id', user.id),
        supabaseAdmin.from('announcements').select('id', { count: 'exact' }).gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    if (assignmentsError) console.error('Error fetching student assignments:', assignmentsError);
    if (announcementsError) console.error('Error fetching student announcements:', announcementsError);
    if (submissionsError) console.error('Error fetching student submissions:', submissionsError);

    const submittedAssignmentIds = new Set(submissionsData?.map(s => s.assignment_id) || []);
    const now = new Date();
    
    const allAssignments: Assignment[] = assignmentsData || [];

    const overdueAssignments = allAssignments.filter(a => 
        a.due_date && new Date(a.due_date) < now && !submittedAssignmentIds.has(a.id)
    );
    
    const assignmentsToComplete = allAssignments.filter(a => 
        (!a.due_date || new Date(a.due_date) >= now) && !submittedAssignmentIds.has(a.id)
    );

    const upcomingAssignmentsCount = assignmentsToComplete.length;

    return { 
        teacher,
        stats: {
            upcomingAssignments: upcomingAssignmentsCount,
            recentAnnouncements: announcementCount ?? 0,
        },
        overdueAssignments,
        assignmentsToComplete
    };
  }

  return {};
}
