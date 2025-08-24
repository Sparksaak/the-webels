
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
        // For direct messages, check if a conversation already exists using the admin client
        if (type === 'direct' && allParticipantIds.length === 2) {
             const { data: existingConvos, error: existingConvoError } = await supabaseAdmin
                .rpc('get_existing_direct_conversation', {
                    user_id_1: allParticipantIds[0],
                    user_id_2: allParticipantIds[1]
                });

            if (existingConvoError) {
                // The function might not exist, so we'll fall back to a manual check
                 const { data: manualCheck, error: manualCheckError } = await supabaseAdmin
                    .from('conversation_participants')
                    .select('conversation_id, user_id')
                    .in('user_id', allParticipantIds);

                if (manualCheckError) throw manualCheckError;
                
                const convoCounts: Record<string, number> = {};
                const userConvos: Record<string, string[]> = {};

                for (const row of manualCheck) {
                    convoCounts[row.conversation_id] = (convoCounts[row.conversation_id] || 0) + 1;
                    if (!userConvos[row.conversation_id]) {
                        userConvos[row.conversation_id] = [];
                    }
                    userConvos[row.conversation_id].push(row.user_id);
                }

                for (const convoId in convoCounts) {
                    const participants = userConvos[convoId];
                    if (convoCounts[convoId] === 2 && participants.every(p => allParticipantIds.includes(p))) {
                       const {data: convoDetails, error: detailsError} = await supabaseAdmin.from('conversations').select('type').eq('id', convoId).single();
                       if (convoDetails?.type === 'direct') {
                         return { success: true, conversationId: convoId };
                       }
                    }
                }
            } else if (existingConvos) {
                return { success: true, conversationId: existingConvos };
            }
        }


        // Use ADMIN client to bypass RLS policies that are causing recursion
        // 1. Create the conversation
        const { data: conversation, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({ name, type, creator_id: user.id })
            .select('id')
            .single();

        if (convError) throw convError;
        const conversationId = conversation.id;

        // 2. Add all participants using the ADMIN client
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

    // Use the admin client to fetch all users
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
