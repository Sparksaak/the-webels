
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createConversation(
  participant_ids: string[],
  type: 'direct' | 'group',
  name?: string
) {
  console.log('--- [SERVER] Initiating createConversation ---');
  console.log('--- [SERVER] Input participant_ids:', participant_ids);
  console.log('--- [SERVER] Input type:', type);
  console.log('--- [SERVER] Input name:', name);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('--- [SERVER] Create conversation failed: User not logged in.');
    return { error: { message: 'You must be logged in.'} };
  }
  
  if (type === 'direct') {
      participant_ids.sort();
  }
  
  console.log('--- [SERVER] Attempting to call RPC with participants:', participant_ids);

  const { data, error } = await supabase.rpc('create_new_conversation', {
      participant_ids: participant_ids,
      conversation_type: type,
      group_name: name
  });

  if (error) {
      console.error('--- [SERVER] ERROR from create_new_conversation RPC ---');
      console.error('--- [SERVER] Full Error Object:', JSON.stringify(error, null, 2));
      return { 
        error: {
          message: 'Failed to create conversation.',
          details: error.message,
          code: error.code,
          hint: error.hint,
          input_participants: participant_ids
        } 
      };
  }

  console.log('--- [SERVER] Successfully created conversation, ID:', data);
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
