
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
    const email = formData.get('email') as string;

    const userUpdates: { [key: string]: any } = {
        data: {
            ...user.user_metadata,
            full_name: fullName,
        }
    };
    
    if (user.user_metadata.role === 'student') {
        userUpdates.data.learning_preference = learningPreference;
    }
    
    if (email && email !== user.email) {
        userUpdates.email = email;
    }

    const { error } = await supabase.auth.updateUser(userUpdates);
    
    if (error) {
        console.error('Error updating profile:', error);
        return { error: 'Could not update profile. ' + error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard'); // Revalidate dashboard to reflect name changes
    
    if (email && email !== user.email) {
        return { success: true, requiresReauthentication: true };
    }
    
    return { success: true };
}


export async function updatePassword(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) {
        return { error: 'You must be logged in to update your password.' };
    }
    const password = formData.get('password') as string;
    if (!password) {
        return { error: 'Password is required' };
    }
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        return { error: 'Could not update password: ' + error.message };
    }
    return { success: true };
}

export async function deleteAccount() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to delete your account.' };
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
        console.error('Error deleting account:', error);
        return { error: 'Could not delete your account. ' + error.message };
    }

    // This will clear the session cookies
    await supabase.auth.signOut();

    // Redirect to a logged-out page
    redirect('/login?message=account-deleted');
}
