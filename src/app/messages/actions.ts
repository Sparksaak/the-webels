
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createConversation(
  participant_ids: string[],
  type: 'direct' | 'group',
  name?: string
) {
  console.log('--- Initiating createConversation ---');
  console.log('Input participant_ids:', participant_ids);
  console.log('Input type:', type);
  console.log('Input name:', name);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('Create conversation failed: User not logged in.');
    return { error: 'You must be logged in to create a conversation.' };
  }
  
  // For direct messages, ensure the participant list is sorted to create a consistent check
  if (type === 'direct') {
      participant_ids.sort();
  }
  
  console.log('Attempting to call RPC with participants:', participant_ids);

  // Call the new database function to handle creation
  const { data, error } = await supabase.rpc('create_new_conversation', {
      participant_ids: participant_ids,
      conversation_type: type,
      group_name: name
  });

  if (error) {
      console.error('--- ERROR from create_new_conversation RPC ---');
      console.error('Status:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('------------------------------------------');
      return { error: 'Failed to create conversation.' };
  }

  console.log('Successfully created conversation, ID:', data);
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

    
