
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export type Profile = {
    id: string;
    email: string;
    full_name: string;
    role: 'teacher' | 'student';
    learning_preference?: 'online' | 'in-person';
};

export async function getProfile(): Promise<Profile | null> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata.full_name || '',
        role: user.user_metadata.role || 'student',
        learning_preference: user.user_metadata.learning_preference,
    };
}

export async function updateProfile(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to update your profile.' };
    }

    const fullName = formData.get('fullName') as string;
    const learningPreference = formData.get('learningPreference') as string;

    const userData: { [key: string]: any } = {
        full_name: fullName,
    };
    
    if (user.user_metadata.role === 'student') {
        userData.learning_preference = learningPreference;
    }

    const { error } = await supabase.auth.updateUser({
        data: userData,
    });
    
    if (error) {
        console.error('Error updating profile:', error);
        return { error: 'Could not update profile. ' + error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard'); // Revalidate dashboard to reflect name changes
    return { success: true };
}
