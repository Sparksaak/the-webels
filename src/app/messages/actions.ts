
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
    return { error: 'You must be logged in to create a conversation.' };
  }
  
  const allParticipantIds = [...new Set([user.id, ...participant_ids])];

  // For direct messages, we need to sort the IDs to ensure the check is consistent
  if (type === 'direct') {
      allParticipantIds.sort();
  }

  // Call the new database function to handle creation
  const { data, error } = await supabase.rpc('create_new_conversation', {
      participant_ids: allParticipantIds,
      conversation_type: type,
      group_name: name
  });

  if (error) {
      console.error('Error in create_new_conversation RPC:', error);
      return { error: 'Failed to create conversation.' };
  }

  revalidatePath('/messages');
  return { data: { id: data } };
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
