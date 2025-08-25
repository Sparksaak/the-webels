
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
             const { data: existingConvoId, error: rpcError } = await supabaseAdmin.rpc('get_existing_direct_conversation', {
                user_id_1: allParticipantIds[0],
                user_id_2: allParticipantIds[1]
            });

            if (rpcError) {
                 // The function might not exist, which is fine, we'll just create a new convo.
                 // We only throw if it's a different, unexpected error.
                if (!rpcError.message.includes('function get_existing_direct_conversation(user_id_1 => uuid, user_id_2 => uuid) does not exist')) {
                    console.error('Error checking for existing DM:', rpcError);
                    throw rpcError;
                }
            }
            
            if (existingConvoId) {
                return { success: true, conversationId: existingConvoId };
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
        
        // --- Add initial system message ---
        const { data: { users: allUsersList }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) throw usersError;
        
        const participantNames = allParticipantIds.map(id => {
            const participantUser = allUsersList.find(u => u.id === id);
            return participantUser?.user_metadata?.full_name || participantUser?.email || 'Unknown User';
        });
        
        let welcomeMessageContent = `A new conversation was started.`;
        if (participantNames.length > 0) {
            welcomeMessageContent = `Conversation with ${participantNames.join(', ')} started.`
        }

        const { error: messageError } = await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id, // Can be null for system messages, but associating with creator is fine
                content: welcomeMessageContent,
            });

        if (messageError) throw messageError;
        // --- End of adding initial message ---

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
        
        revalidatePath(`/messages?conversation_id=${conversationId}`);
        revalidatePath('/messages');
        return { success: true };

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
      .filter(u => u.id !== currentUser.id) // Exclude current user
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
