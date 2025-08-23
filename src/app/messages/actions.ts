
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createConversation(
  participant_ids: string[],
  type: 'direct' | 'group',
  name?: string
) {
  console.log('--- createConversation Action Started ---');
  console.log('Input Participants:', participant_ids);
  console.log('Input Type:', type);
  console.log('Input Name:', name);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Create Conversation Error: User not logged in.');
    return { error: { message: 'You must be logged in.'} };
  }
  
  const finalParticipantIds = [...new Set([user.id, ...participant_ids])];
  if (type === 'direct') {
      finalParticipantIds.sort();
  }
  console.log('Final Participants for DB:', finalParticipantIds);
  
  const { data, error } = await supabase.rpc('create_new_conversation', {
      participant_ids: finalParticipantIds,
      conversation_type: type,
      group_name: name
  });

  if (error) {
      console.error('--- createConversation RPC Error ---', {
        message: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint
      });
      return { 
        error: {
          message: 'Failed to create conversation.',
          details: error.details,
          code: error.code,
        } 
      };
  }

  console.log('--- createConversation Success ---', { newConversationId: data });
  revalidatePath('/messages');
  return { data: { id: data } };
}

export async function sendMessage(conversationId: string, content: string) {
  console.log('--- sendMessage Action Started ---');
  console.log('Conversation ID:', conversationId);
  console.log('Content:', content);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('sendMessage Error: User not logged in.');
    return { error: 'You must be logged in to send a message.' };
  }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content,
  });

  if (error) {
    console.error('--- sendMessage DB Error ---', error);
    return { error: 'Could not send message.', details: error };
  }

  console.log('--- sendMessage Success ---');
  revalidatePath(`/messages?conversation_id=${conversationId}`);
  return { success: true };
}
