
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { AppUser } from '@/app/messages/types';

export type ClassMaterial = {
    id: string;
    created_at: string;
    teacher_id: string;
    title: string;
    content: string | null;
    topic: string | null;
    is_published: boolean;
};

// This function is for both creating and updating
export async function saveMaterial(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can manage materials.' };
    }

    const id = formData.get('id') as string | null;
    const title = formData.get('title') as string;
    const topic = formData.get('topic') as string;
    const content = formData.get('content') as string;
    const is_published = formData.get('is_published') === 'true';

    if (!title) {
        return { error: 'Title is required.' };
    }

    const dataToSave = {
        teacher_id: user.id,
        title,
        topic,
        content,
        is_published
    };

    try {
        let error;
        if (id) {
            // Update existing material
            ({ error } = await supabaseAdmin
                .from('class_materials')
                .update(dataToSave)
                .eq('id', id));
        } else {
            // Create new material
            ({ error } = await supabaseAdmin
                .from('class_materials')
                .insert(dataToSave));
        }
        
        if (error) throw error;

        revalidatePath('/materials');
        return { success: true };

    } catch (error: any) {
        console.error('Error saving material:', error);
        return { error: 'Could not save material. ' + error.message };
    }
}

export async function getClassMaterials(): Promise<ClassMaterial[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
     const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];
    
    let query = supabaseAdmin.from('class_materials').select('*');

    // Teachers see all materials (published and drafts), students only see published
    if (user.user_metadata.role === 'student') {
        query = query.eq('is_published', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching class materials:', error);
        return [];
    }
    
    return data as ClassMaterial[];
}


export async function deleteMaterial(materialId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can delete materials.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('class_materials')
            .delete()
            .eq('id', materialId)
            .eq('teacher_id', user.id);

        if (error) throw error;

        revalidatePath('/materials');
        return { success: true };

    } catch (error: any) {
        console.error('Error deleting material:', error);
        return { error: 'Could not delete material. ' + error.message };
    }
}
