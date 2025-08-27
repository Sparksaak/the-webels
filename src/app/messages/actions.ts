
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
        // If it's a DM, check if one already exists between the two users
        if (type === 'direct' && allParticipantIds.length === 2) {
             const { data: existingConvoId, error: rpcError } = await supabaseAdmin.rpc('get_existing_direct_conversation', {
                user_id_1: allParticipantIds[0],
                user_id_2: allParticipantIds[1]
            });

            if (rpcError) {
                // This is a bit of a hack. If the function doesn't exist, we can ignore the error.
                // This might happen if migrations haven't run yet.
                // A better solution would be to ensure migrations run before the app starts.
                if (!rpcError.message.includes('function get_existing_direct_conversation(user_id_1 => uuid, user_id_2 => uuid) does not exist')) {
                    console.error('Error checking for existing DM:', rpcError);
                    throw rpcError;
                }
            }
            
            if (existingConvoId) {
                return { success: true, conversationId: existingConvoId };
            }
        }
        
        // Create the new conversation
        const { data: conversation, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({ name, type, creator_id: user.id })
            .select('id')
            .single();

        if (convError) throw convError;
        const conversationId = conversation.id;

        // Add participants
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
        // Fetch sender details using admin client to ensure we have access
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
        
        // This will trigger the client to re-fetch conversations, which will now have the new last message
        revalidatePath('/messages');
        
        return { 
            success: true, 
            message: {
                ...newMessage,
                sender: sender // Return the full sender object
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

    // Filter out the current user from the list
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

    // Teachers can message anyone
    if (currentUserRole === 'teacher') {
        return allUsers;
    }

    // Students can message teachers and other students in their same learning track
    if (currentUserRole === 'student') {
        return allUsers.filter(user => {
            if (user.role === 'teacher') return true;
            if (user.role === 'student' && user.learning_preference === currentUserLearningPreference) return true;
            return false;
        });
    }

    return [];
}
