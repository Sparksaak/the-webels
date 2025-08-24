
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
    
    const allParticipantIds = [...new Set([user.id, ...participantIds])];
    const type = allParticipantIds.length > 2 ? 'group' : 'direct';

    if (participantIds.length === 0) {
        return { error: 'You must select at least one participant.' };
    }

    try {
        // For direct messages, check if a conversation already exists between the two users
        if (type === 'direct' && allParticipantIds.length === 2) {
             const { data: existing, error: existingError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .in('user_id', allParticipantIds)
                .then(async ({ data: userConversations, error }) => {
                    if (error) throw error;
                    const conversationCounts: { [key: string]: number } = {};
                    for (const uc of userConversations!) {
                        conversationCounts[uc.conversation_id] = (conversationCounts[uc.conversation_id] || 0) + 1;
                    }

                    const existingConvId = Object.keys(conversationCounts).find(convId => conversationCounts[convId] === 2);
                    
                    if (existingConvId) {
                         const { data: convType } = await supabase.from('conversations').select('type').eq('id', existingConvId).single();
                         if (convType?.type === 'direct') {
                            return { data: [{ id: existingConvId }], error: null };
                         }
                    }

                    return { data: [], error: null };
                });

            if (existingError) throw existingError;
            
            if (existing && existing.length > 0) {
                // Conversation already exists, return the existing conversation id
                return { success: true, conversationId: existing[0].id };
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

    const { data: users, error } = await supabase
        .from('users')
        .select('id, raw_user_meta_data->>full_name as full_name, email, raw_user_meta_data->>role as role, raw_user_meta_data->>learning_preference as learning_preference')
        .neq('id', currentUser.id);

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    
    const currentUserRole = currentUser.user_metadata?.role;
    
    if (currentUserRole === 'teacher') {
        return users.map((u: any) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role as 'teacher' | 'student' }));
    }

    if (currentUserRole === 'student') {
        const studentLearningPreference = currentUser.user_metadata?.learning_preference;
        
        return users.filter((user: any) => {
            if (user.role === 'teacher') return true;
            if (user.role === 'student') {
                return user.learning_preference === studentLearningPreference;
            }
            return false;
        }).map((u: any) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role as 'teacher' | 'student' }));
    }
    
    return [];
}
