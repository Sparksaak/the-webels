
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createConversation(
  currentUser_id: string,
  participant_ids: string[],
  type: 'direct' | 'group',
  name?: string
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const allParticipantIds = [...new Set([currentUser_id, ...participant_ids])].sort();

  // For direct messages, check if a conversation already exists
  if (type === 'direct' && allParticipantIds.length === 2) {
    const { data: existingConvos, error: existingConvoError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', allParticipantIds);
      
    if (existingConvoError) {
      console.error('Error checking for existing convos:', existingConvoError);
      return { error: 'Failed to check for existing conversation.' };
    }

    if (existingConvos.length > 0) {
        const conversationsByUser = existingConvos.reduce((acc, { conversation_id }) => {
            if (!acc[conversation_id]) {
                acc[conversation_id] = 0;
            }
            acc[conversation_id]++;
            return acc;
        }, {} as Record<string, number>);

        for (const conversation_id in conversationsByUser) {
            if (conversationsByUser[conversation_id] === 2) {
                 const { data: convoDetails, error: convoDetailsError } = await supabase
                    .from('conversations')
                    .select('id, type')
                    .eq('id', conversation_id)
                    .eq('type', 'direct')
                    .single();

                if (convoDetails) {
                     return { data: { id: convoDetails.id } };
                }
            }
        }
    }
  }


  // Create a new conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .insert({ type, name: type === 'group' ? name : null })
    .select('id')
    .single();

  if (conversationError) {
    console.error('Error creating conversation:', conversationError);
    return { error: 'Could not create conversation.' };
  }

  const newConversationId = conversationData.id;

  // Add participants
  const participantRecords = allParticipantIds.map((userId) => ({
    conversation_id: newConversationId,
    user_id: userId,
  }));

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert(participantRecords);

  if (participantError) {
    console.error('Error adding participants:', participantError);
    // Potentially delete the conversation if participants fail to be added
    await supabase.from('conversations').delete().eq('id', newConversationId);
    return { error: 'Could not add participants to conversation.' };
  }

  revalidatePath('/messages');
  return { data: { id: newConversationId } };
}

export async function sendMessage(conversationId: string, content: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to send a message.' };
  }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content,
  });

  if (error) {
    console.error('Error sending message:', error);
    return { error: 'Could not send message.' };
  }

  revalidatePath(`/messages?conversation_id=${conversationId}`);
  return { success: true };
}
