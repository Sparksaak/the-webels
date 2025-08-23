
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
  const allParticipantIds = [...new Set([currentUser_id, ...participant_ids])];

  // For direct messages, check if a conversation already exists
  if (type === 'direct' && allParticipantIds.length === 2) {
    const { data: existingConvo, error: existingConvoError } = await supabase.rpc('get_dm_conversation_participants', {
      user_a_id: allParticipantIds[0],
      user_b_id: allParticipantIds[1],
    });

    if (existingConvoError) {
        console.error('Error checking for existing conversations:', existingConvoError);
        return { error: 'Failed to check for existing conversations.' };
    }
    
    if (existingConvo && existingConvo.length > 0) {
        // Conversation already exists, just return its ID
        return { data: { id: existingConvo[0].conversation_id }};
    }
  }


  // 1. Create the conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .insert({ type, name: type === 'group' ? name : null })
    .select('id')
    .single();

  if (conversationError) {
    console.error('Error creating conversation:', conversationError);
    return { error: 'Failed to create conversation.' };
  }
  const conversationId = conversationData.id;
  
  // 2. Add all participants to the new conversation
  const participantRecords = allParticipantIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
  }));

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert(participantRecords);

  if (participantError) {
    console.error('Error adding participants:', participantError);
    // Attempt to clean up the created conversation if participants fail
    await supabase.from('conversations').delete().eq('id', conversationId);
    return { error: 'Could not add participants to conversation.' };
  }

  revalidatePath('/messages');
  return { data: { id: conversationId } };
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

