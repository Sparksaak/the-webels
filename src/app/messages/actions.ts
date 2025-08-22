
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createConversation(participantIds: string[], groupName?: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to create a conversation.' };
    }

    const allParticipantIds = [...new Set([...participantIds, user.id])];
    const isGroup = allParticipantIds.length > 2 || !!groupName;

    // For direct messages, check if a conversation already exists
    if (!isGroup) {
        const { data: existingConvs, error: existingConvError } = await supabase
            .from('participants')
            .select('conversation_id')
            .in('user_id', allParticipantIds);
        
        if (existingConvError) {
            console.error('Error fetching participant records:', existingConvError);
            return { error: 'Failed to check for existing conversation.' };
        }

        const convCounts = existingConvs.reduce((acc: Record<string, number>, { conversation_id }) => {
            if (conversation_id) {
                acc[conversation_id] = (acc[conversation_id] || 0) + 1;
            }
            return acc;
        }, {});
        
        const existingConvId = Object.keys(convCounts).find(convId => convCounts[convId] === 2);

        if (existingConvId) {
             const {data: convType} = await supabase.from('conversations').select('type').eq('id', existingConvId).single();
             if(convType?.type === 'direct') {
                return { conversationId: existingConvId };
             }
        }
    }


    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
            type: isGroup ? 'group' : 'direct',
            name: isGroup ? groupName : null,
        })
        .select()
        .single();

    if (convError) {
        console.error('Error creating conversation:', convError);
        return { error: 'Failed to create conversation.' };
    }

    const participantsData = allParticipantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
    }));

    const { error: participantsError } = await supabase.from('participants').insert(participantsData);

    if (participantsError) {
        console.error('Error adding participants:', participantsError);
        // Attempt to clean up the created conversation if participants fail
        await supabase.from('conversations').delete().eq('id', conversation.id);
        return { error: 'Failed to add participants.' };
    }
    
    revalidatePath('/messages');
    return { conversationId: conversation.id };
}

export async function sendMessage(conversationId: string, content: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to send a message.' };
    }

    if (!content.trim()) {
        return { error: 'Message cannot be empty.' };
    }

    const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
    });

    if (error) {
        console.error('Error sending message:', error);
        return { error: 'Failed to send message.' };
    }

    revalidatePath(`/messages`);
    return { success: true };
}
