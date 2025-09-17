
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { AppUser } from '@/app/messages/types';

export type AssignmentSubmission = {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    submission_content: string;
    submitted_at: string;
    grade: string | null;
    feedback: string | null;
};

export type Assignment = {
    id: string;
    createdAt: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    teacher: AppUser;
    submissions: AssignmentSubmission[];
    submissionStatus?: 'Submitted' | 'Not Submitted' | 'Graded';
};

export async function createAssignment(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can create assignments.' };
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!title) {
        return { error: 'Title is required.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('assignments')
            .insert({
                title,
                description,
                due_date: dueDate || null,
                teacher_id: user.id,
            });

        if (error) throw error;

        revalidatePath('/assignments');
        return { success: true };

    } catch (error: any) {
        console.error('Error creating assignment:', error);
        return { error: 'Could not create assignment. ' + error.message };
    }
}

export async function updateAssignment(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can edit assignments.' };
    }

    const assignmentId = formData.get('assignmentId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!assignmentId || !title) {
        return { error: 'Assignment ID and Title are required.' };
    }
    
    try {
        const { data: assignment, error: fetchError } = await supabaseAdmin
            .from('assignments')
            .select('teacher_id')
            .eq('id', assignmentId)
            .single();

        if (fetchError || !assignment) {
            return { error: 'Assignment not found.' };
        }

        if (assignment.teacher_id !== user.id) {
            return { error: 'You are not authorized to edit this assignment.' };
        }
        
        const { error: updateError } = await supabaseAdmin
            .from('assignments')
            .update({
                title,
                description,
                due_date: dueDate || null,
            })
            .eq('id', assignmentId);
        
        if (updateError) throw updateError;
        
        revalidatePath('/assignments');
        return { success: true };

    } catch (error: any) {
        console.error('Error updating assignment:', error);
        return { error: 'Could not update assignment. ' + error.message };
    }
}

export async function getAssignments(): Promise<Assignment[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: assignmentsData, error } = await supabaseAdmin
        .from('assignments')
        .select(`
            id,
            created_at,
            title,
            description,
            due_date,
            teacher_id
        `)
        .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }

    const teacherIds = [...new Set(assignmentsData.map(a => a.teacher_id))];
    const assignmentIds = assignmentsData.map(a => a.id);
    
    // Fetch all users at once
    const { data: { users: allUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
    }

    const usersById = allUsers.reduce((acc, u) => {
        acc[u.id] = {
            id: u.id,
            name: u.user_metadata.full_name || u.email,
            email: u.email!,
            role: u.user_metadata.role || 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        };
        return acc;
    }, {} as Record<string, AppUser>);

    // Fetch all submissions for the assignments
    const { data: submissionsData, error: submissionsError } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', assignmentIds);

    if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        return [];
    }

    const submissionsByAssignment = submissionsData.reduce((acc, sub) => {
        const student = usersById[sub.student_id];
        if (!student) return acc;

        if (!acc[sub.assignment_id]) {
            acc[sub.assignment_id] = [];
        }
        acc[sub.assignment_id].push({
            id: sub.id,
            student_id: sub.student_id,
            student_name: student.name,
            student_email: student.email,
            submission_content: sub.submission_content,
            submitted_at: sub.submitted_at,
            grade: sub.grade,
            feedback: sub.feedback,
        });
        return acc;
    }, {} as Record<string, AssignmentSubmission[]>);

    return assignmentsData.map(a => {
        const submissions = submissionsByAssignment[a.id] || [];
        let submissionStatus: Assignment['submissionStatus'] = 'Not Submitted';
        if (user.user_metadata.role === 'student') {
            const mySubmission = submissions.find(s => s.student_id === user.id);
            if (mySubmission) {
                submissionStatus = mySubmission.grade ? 'Graded' : 'Submitted';
            }
        }

        return {
            id: a.id,
            createdAt: a.created_at,
            title: a.title,
            description: a.description,
            dueDate: a.due_date,
            teacher: usersById[a.teacher_id],
            submissions: submissions,
            submissionStatus: submissionStatus
        };
    });
}

export async function submitAssignment(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'student') {
        return { error: 'Only students can submit assignments.' };
    }

    const assignmentId = formData.get('assignmentId') as string;
    const submissionContent = formData.get('submissionContent') as string;

    if (!assignmentId || !submissionContent) {
        return { error: 'Missing assignment ID or content.' };
    }

    try {
        // Upsert allows students to re-submit before grading
        const { error } = await supabase
            .from('assignment_submissions')
            .upsert({
                assignment_id: assignmentId,
                student_id: user.id,
                submission_content: submissionContent,
                submitted_at: new Date().toISOString()
            }, { onConflict: 'assignment_id,student_id' });

        if (error) throw error;

        revalidatePath('/assignments');
        return { success: true };

    } catch (error: any) {
        console.error('Error submitting assignment:', error);
        return { error: 'Could not submit assignment. ' + error.message };
    }
}

export async function gradeSubmission(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can grade assignments.' };
    }

    const submissionId = formData.get('submissionId') as string;
    const grade = formData.get('grade') as string;
    const feedback = formData.get('feedback') as string;

    if (!submissionId || !grade) {
        return { error: 'Submission ID and grade are required.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('assignment_submissions')
            .update({
                grade,
                feedback,
            })
            .eq('id', submissionId);

        if (error) throw error;
        
        revalidatePath('/assignments');
        revalidatePath(`/assignments/${submissionId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error grading submission:', error);
        return { error: 'Could not grade submission. ' + error.message };
    }
}


export async function deleteAssignment(assignmentId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can delete assignments.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('assignments')
            .delete()
            .eq('id', assignmentId)
            .eq('teacher_id', user.id);

        if (error) throw error;

        revalidatePath('/assignments');
        return { success: true };

    } catch (error: any) {
        console.error('Error deleting assignment:', error);
        return { error: 'Could not delete assignment. ' + error.message };
    }
}
