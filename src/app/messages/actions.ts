
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createConversation(
  participant_ids: string[],
  type: 'direct' | 'group',
  name?: string
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: 'You must be logged in.'} };
  }
  
  const finalParticipantIds = [...new Set([user.id, ...participant_ids])];

  // For direct messages, check if a conversation already exists
  if (type === 'direct' && finalParticipantIds.length === 2) {
    const { data: existing, error: existingError } = await supabase.rpc('get_existing_direct_conversation', {
      user1_id: finalParticipantIds[0],
      user2_id: finalParticipantIds[1]
    });

    if (existingError) {
       console.error('--- Error checking for existing DM ---', existingError);
       // Don't block, just log. Proceed to create.
    }
    
    if (existing) {
       revalidatePath('/messages');
       return { data: { id: existing } };
    }
  }

  // Create new conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      type: type,
      name: type === 'group' ? name : null,
    })
    .select('id')
    .single();

  if (conversationError) {
    console.error('--- createConversation DB Error ---', conversationError);
    return { error: { message: 'Failed to create conversation.', details: conversationError.message } };
  }

  const newConversationId = conversationData.id;

  // Add participants
  const participantObjects = finalParticipantIds.map(userId => ({
    conversation_id: newConversationId,
    user_id: userId,
  }));

  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert(participantObjects);

  if (participantsError) {
    console.error('--- createConversation participants DB Error ---', participantsError);
    // Attempt to clean up the orphaned conversation
    await supabase.from('conversations').delete().eq('id', newConversationId);
    return { error: { message: 'Failed to add participants to conversation.', details: participantsError.message }};
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
    console.error('--- sendMessage DB Error ---', error);
    return { error: 'Could not send message.' };
  }

  revalidatePath(`/messages?conversation_id=${conversationId}`);
  return { success: true };
}
