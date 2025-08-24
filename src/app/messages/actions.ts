
'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
    
    if (participantIds.length === 0) {
        return { error: 'You must select at least one participant.' };
    }
    
    const allParticipantIds = [...new Set([user.id, ...participantIds])];
    const otherParticipantIds = participantIds.filter(id => id !== user.id);
    const type = allParticipantIds.length > 2 ? 'group' : 'direct';

    try {
        // For direct messages, check if a conversation already exists
        if (type === 'direct' && allParticipantIds.length === 2) {
            const { data: existing, error: existingError } = await supabaseAdmin.rpc('get_existing_conversation_direct', {
                user_id_1: allParticipantIds[0],
                user_id_2: allParticipantIds[1]
            });

            if (existingError) console.error("Error checking for existing DM:", existingError);
            if (existing) {
                return { success: true, conversationId: existing };
            }
        }

        // 1. Create the conversation
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({ name, type, creator_id: user.id })
            .select('id')
            .single();

        if (convError) throw convError;
        const conversationId = conversation.id;

        // 2. Add the creator as the first participant (this is always allowed by RLS)
        const { error: creatorParticipantError } = await supabase
            .from('conversation_participants')
            .insert({ conversation_id: conversationId, user_id: user.id });
        
        if (creatorParticipantError) throw creatorParticipantError;

        // 3. Add the rest of the participants using the admin client to bypass RLS checks
        if (otherParticipantIds.length > 0) {
            const otherParticipantsData = otherParticipantIds.map(userId => ({
                conversation_id: conversationId,
                user_id: userId,
            }));
            const { error: otherParticipantsError } = await supabaseAdmin
                .from('conversation_participants')
                .insert(otherParticipantsData);

            if (otherParticipantsError) throw otherParticipantsError;
        }

        revalidatePath('/messages');
        return { success: true, conversationId: conversationId };

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
        
        revalidatePath(`/messages/${conversationId}`);
        revalidatePath('/messages');
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

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    const allUsers = users
      .filter(u => u.id !== currentUser.id)
      .map(u => ({
          id: u.id,
          full_name: u.user_metadata.full_name || u.email,
          email: u.email,
          role: u.user_metadata.role as 'teacher' | 'student',
          learning_preference: u.user_metadata.learning_preference as 'online' | 'in-person'
      }));

    const currentUserRole = currentUser.user_metadata?.role;
    const currentUserLearningPreference = currentUser.user_metadata?.learning_preference;

    if (currentUserRole === 'teacher') {
        return allUsers;
    }

    if (currentUserRole === 'student') {
        return allUsers.filter(user => {
            if (user.role === 'teacher') return true;
            if (user.role === 'student' && user.learning_preference === currentUserLearningPreference) return true;
            return false;
        });
    }

    return [];
}
