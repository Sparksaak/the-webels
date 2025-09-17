
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { AppUser } from '@/app/messages/types';

export type Announcement = {
    id: string;
    createdAt: string;
    title: string;
    content: string;
    author: AppUser;
};

export async function createAnnouncement(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in to create an announcement.' };
    }
    
    if (user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can create announcements.' };
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    
    if (!title || !content) {
        return { error: 'Title and content are required.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('announcements')
            .insert({
                title,
                content,
                user_id: user.id,
            });

        if (error) throw error;

        revalidatePath('/announcements');
        return { success: true };

    } catch (error: any) {
        console.error('Error creating announcement:', error);
        return { error: 'Could not create announcement. ' + error.message };
    }
}


export async function getAnnouncements(): Promise<Announcement[]> {
    const { data: announcementsData, error } = await supabaseAdmin
        .from('announcements')
        .select(`
            id,
            created_at,
            title,
            content,
            user_id
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }

    const userIds = [...new Set(announcementsData.map(a => a.user_id))];
    if (userIds.length === 0) return [];
    
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, 
    });

    if (usersError) {
        console.error('Error fetching users for announcements:', usersError);
        return [];
    }
    
    const usersById = users
      .filter(u => userIds.includes(u.id))
      .reduce((acc, user) => {
        acc[user.id] = {
            id: user.id,
            name: user.user_metadata.full_name || user.email,
            email: user.email!,
            role: user.user_metadata.role || 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        };
        return acc;
    }, {} as Record<string, AppUser>);


    return announcementsData.map(a => ({
        id: a.id,
        createdAt: a.created_at,
        title: a.title,
        content: a.content,
        author: usersById[a.user_id]
    }));
}


export async function deleteAnnouncement(announcementId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in to delete an announcement.' };
    }
    
    if (user.user_metadata.role !== 'teacher') {
        return { error: 'Only teachers can delete announcements.' };
    }
    
    try {
        const { error } = await supabaseAdmin
            .from('announcements')
            .delete()
            .eq('id', announcementId)
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        revalidatePath('/announcements');
        return { success: true };
    }
    catch (error: any) {
        console.error('Error deleting announcement:', error);
        return { error: 'Could not delete announcement. ' + error.message };
    }
}
