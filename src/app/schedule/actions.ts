
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export type ClassSchedule = {
    id: string;
    created_at: string;
    teacher_id: string;
    class_type: 'online' | 'in-person';
    title: string;
    day_of_week: number; // 0 for Sunday, 1 for Monday, etc.
    start_time: string; // HH:mm
    end_time: string; // HH:mm
    description: string | null;
};

export async function createClassSchedule(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can create class schedules.' };
    }

    const title = formData.get('title') as string;
    const class_type = formData.get('class_type') as 'online' | 'in-person';
    const day_of_week = parseInt(formData.get('day_of_week') as string, 10);
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;
    const description = formData.get('description') as string | null;

    if (!title || !class_type || isNaN(day_of_week) || !start_time || !end_time) {
        return { error: 'All fields are required.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('class_schedules')
            .insert({
                teacher_id: user.id,
                title,
                class_type,
                day_of_week,
                start_time,
                end_time,
                description
            });

        if (error) throw error;

        revalidatePath('/schedule');
        return { success: true };

    } catch (error: any) {
        console.error('Error creating class schedule:', error);
        return { error: 'Could not create schedule. ' + error.message };
    }
}

export async function getClassSchedules(): Promise<ClassSchedule[]> {
    const { data, error } = await supabaseAdmin
        .from('class_schedules')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching class schedules:', error);
        return [];
    }

    return data;
}

export async function updateClassSchedule(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can update schedules.' };
    }
    
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const class_type = formData.get('class_type') as 'online' | 'in-person';
    const day_of_week = parseInt(formData.get('day_of_week') as string, 10);
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;
    const description = formData.get('description') as string | null;

    if (!id || !title || !class_type || isNaN(day_of_week) || !start_time || !end_time) {
        return { error: 'All fields are required.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('class_schedules')
            .update({
                title,
                class_type,
                day_of_week,
                start_time,
                end_time,
                description
            })
            .eq('id', id)
            .eq('teacher_id', user.id);

        if (error) throw error;

        revalidatePath('/schedule');
        return { success: true };

    } catch (error: any) {
        console.error('Error updating class schedule:', error);
        return { error: 'Could not update schedule. ' + error.message };
    }
}


export async function deleteClassSchedule(scheduleId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can delete schedules.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('class_schedules')
            .delete()
            .eq('id', scheduleId)
            .eq('teacher_id', user.id);

        if (error) throw error;

        revalidatePath('/schedule');
        return { success: true };

    } catch (error: any) {
        console.error('Error deleting schedule:', error);
        return { error: 'Could not delete schedule. ' + error.message };
    }
}
