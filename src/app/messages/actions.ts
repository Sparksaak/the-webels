
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
    const type = allParticipantIds.length > 2 ? 'group' : 'direct';

    try {
        if (type === 'direct' && allParticipantIds.length === 2) {
            const { data: existingConversations, error: existingError } = await supabaseAdmin
                .from('conversation_participants')
                .select('conversation_id')
                .in('user_id', allParticipantIds);
            
            if (existingError) throw existingError;

            const conversationCounts = existingConversations.reduce((acc, { conversation_id }) => {
                acc[conversation_id] = (acc[conversation_id] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const dmConversationId = Object.entries(conversationCounts).find(([, count]) => count === 2)?.[0];

            if (dmConversationId) {
                // Check if it is indeed a direct conversation
                const { data: convDetails } = await supabaseAdmin.from('conversations').select('type').eq('id', dmConversationId).single();
                if (convDetails?.type === 'direct') {
                    return { success: true, conversationId: dmConversationId };
                }
            }
        }
        
        const { data: conversation, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({ name, type, creator_id: user.id })
            .select('id')
            .single();

        if (convError) throw convError;
        const conversationId = conversation.id;

        const participantsData = allParticipantIds.map(userId => ({
            conversation_id: conversationId,
            user_id: userId,
        }));
        
        const { error: participantsError } = await supabaseAdmin
            .from('conversation_participants')
            .insert(participantsData);

        if (participantsError) throw participantsError;

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
        const { data: senderData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (userError) throw userError;

        const sender = {
            id: senderData.user.id,
            name: senderData.user.user_metadata.full_name || senderData.user.email,
            email: senderData.user.email,
            role: senderData.user.user_metadata.role,
            avatarUrl: 'https://placehold.co/100x100.png',
        };

        const { data: newMessage, error } = await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content,
            })
            .select()
            .single();

        if (error) throw error;
        
        revalidatePath('/messages');
        
        return { 
            success: true, 
            message: {
                ...newMessage,
                sender: sender
            }
        };

    } catch (error: any)
    {
        console.error('Error sending message:', error);
        return { error: 'Could not send message: ' + error.message };
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
          learning_preference: u.user_metadata.learning_preference as 'online' | 'in-person' | undefined
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
