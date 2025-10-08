
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Assignment } from '@/app/assignments/actions';
import type { ClassSchedule } from '@/app/schedule/actions';
import { generateAvatarUrl } from '@/lib/utils';

export async function getDashboardData() {
  const cookieStore = cookies();
  const supabase = createClient();

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
  
  const allUsers = users.map(u => {
      const fullName = u.user_metadata.full_name || u.email;
      return {
        id: u.id,
        full_name: fullName,
        email: u.email,
        role: u.user_metadata.role as 'teacher' | 'student',
        learning_preference: u.user_metadata.learning_preference as 'online' | 'in-person' | undefined,
        subject_of_interest: u.user_metadata.subject_of_interest as string | undefined,
        avatarUrl: generateAvatarUrl(fullName)
      };
  });

  if (user.user_metadata.role === 'teacher') {
    const students = allUsers.filter(u => u.role === 'student');
    
    const [
        { count: assignmentCount },
        { count: announcementCount },
        { data: assignmentsToGradeData, error: assignmentsToGradeError }
    ] = await Promise.all([
        supabaseAdmin.from('assignments').select('id', { count: 'exact' }).eq('teacher_id', user.id),
        supabaseAdmin.from('announcements').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabaseAdmin.from('assignments')
            .select('*, submissions:assignment_submissions ( id, grade )')
            .eq('teacher_id', user.id)
    ]);
    
    if (assignmentsToGradeError) {
      console.error('Error fetching assignments to grade:', assignmentsToGradeError);
    }
    
    const assignmentsToGrade = (assignmentsToGradeData || [])
      .filter(assignment => {
          const hasUngradedSubmissions = assignment.submissions.some(sub => sub.grade === null);
          return hasUngradedSubmissions;
      })
      .map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: a.due_date,
          createdAt: a.created_at,
          submissions: [],
          teacher: allUsers.find(u => u.id === a.teacher_id)!
      }));


    return { 
        students,
        stats: {
            totalStudents: students.length,
            assignmentsCreated: assignmentCount ?? 0,
            announcementsPosted: announcementCount ?? 0,
        },
        assignmentsToGrade,
    };
  }

  if (user.user_metadata.role === 'student') {
    const teacher = allUsers.find(u => u.role === 'teacher') || null;
    
    const [
        { data: assignmentsData, error: assignmentsError },
        { data: submissionsData, error: submissionsError },
        { count: announcementCount, error: announcementsError },
        { data: schedulesData, error: schedulesError }
    ] = await Promise.all([
        supabaseAdmin.from('assignments').select('*').order('due_date', { ascending: true }),
        supabaseAdmin.from('assignment_submissions').select('assignment_id').eq('student_id', user.id),
        supabaseAdmin.from('announcements').select('id', { count: 'exact' }).gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabaseAdmin.from('class_schedules').select('*').eq('class_type', user.user_metadata.learning_preference).order('day_of_week').order('start_time'),
    ]);

    if (assignmentsError) console.error('Error fetching student assignments:', assignmentsError);
    if (announcementsError) console.error('Error fetching student announcements:', announcementsError);
    if (submissionsError) console.error('Error fetching student submissions:', submissionsError);
    if (schedulesError) console.error('Error fetching student schedules:', schedulesError);

    const submittedAssignmentIds = new Set(submissionsData?.map(s => s.assignment_id) || []);
    const now = new Date();
    
    const allAssignments: Assignment[] = (assignmentsData || []).map(a => ({
        ...a,
        createdAt: a.created_at,
        dueDate: a.due_date,
        submissions: [],
    }));

    const overdueAssignments = allAssignments.filter(a => 
        a.dueDate && new Date(a.dueDate) < now && !submittedAssignmentIds.has(a.id)
    );
    
    const assignmentsToComplete = allAssignments.filter(a => 
        (!a.dueDate || new Date(a.dueDate) >= now) && !submittedAssignmentIds.has(a.id)
    );

    const upcomingAssignmentsCount = assignmentsToComplete.length;

    return { 
        teacher,
        stats: {
            upcomingAssignments: upcomingAssignmentsCount,
            recentAnnouncements: announcementCount ?? 0,
        },
        overdueAssignments,
        assignmentsToComplete,
        schedules: schedulesData as ClassSchedule[]
    };
  }

  return {};
}
