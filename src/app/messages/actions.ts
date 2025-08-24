
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createConversation(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'You must be logged in to create a conversation.' };
    }

    const participantIds = formData.getAll('participants') as string[];
    const name = formData.get('name') as string || null;
    const type = participantIds.length > 1 ? 'group' : 'direct';

    if (participantIds.length === 0) {
        return { error: 'You must select at least one participant.' };
    }
    
    // Add the current user to the participant list
    const allParticipantIds = [...new Set([user.id, ...participantIds])];

    try {
        // For direct messages, check if a conversation already exists
        if (type === 'direct' && allParticipantIds.length === 2) {
            const { data: existing, error: existingError } = await supabase.rpc('get_existing_conversation', {
                user_ids: allParticipantIds
            });

            if (existingError) throw existingError;

            if (existing) {
                // Conversation already exists, redirect or return the existing conversation id
                return { success: true, conversationId: existing };
            }
        }


        // Create the conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({ name, type, creator_id: user.id })
            .select('id')
            .single();

        if (convError) throw convError;

        // Add participants
        const participantData = allParticipantIds.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId,
        }));

        const { error: participantsError } = await supabase
            .from('conversation_participants')
            .insert(participantData);

        if (participantsError) throw participantsError;

        revalidatePath('/messages');
        return { success: true, conversationId: conversation.id };

    } catch (error: any) {
        console.error('Error creating conversation:', error);
        return { error: 'Could not create conversation. ' + error.message };
    }
}

export async function sendMessage(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const content = formData.get('content') as string;
    const conversationId = formData.get('conversationId') as string;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to send a message.' };
    }
    if (!content || !conversationId) {
        return { error: 'Message content and conversation ID are required.' };
    }

    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content,
            });

        if (error) throw error;
        
        revalidatePath(`/messages`);
        return { success: true };

    } catch (error: any) {
        console.error('Error sending message:', error);
        return { error: 'Could not send message.' };
    }
}

export async function getUsers() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return [];

    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, user_metadata->>learning_preference as learning_preference')
        .neq('id', currentUser.id);

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    const { data: teacherData, error: teacherError } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('role', 'teacher')
        .single();

    if (teacherError && teacherError.code !== 'PGRST116') { // Ignore 'No rows found' error
        console.error('Error fetching teacher:', teacherError);
    }
    
    const teacher = teacherData;
    const studentLearningPreference = currentUser.user_metadata?.learning_preference;

    if (currentUser.role === 'student') {
         return users.filter(user => {
            if (user.role === 'teacher') return true; // Always allow messaging the teacher
            if (user.role === 'student') {
                return user.learning_preference === studentLearningPreference;
            }
            return false;
        });
    }

    // Teacher can message anyone
    return users.map(u => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role as 'teacher' | 'student' }));
}
