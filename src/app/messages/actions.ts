
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

// Helper function to create a deterministic v5 UUID from user IDs for a direct message
function getDirectMessageConversationId(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();
  const namespace = 'd8b2d49e-15f1-4f1e-9b2a-8f8e6a8e3f9e'; // A constant namespace UUID
  const name = sortedIds.join('');
  const hash = createHash('sha1').update(name).digest('hex');
  
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    // "5" specifies UUID version 5
    '5' + hash.substring(13, 16),
    // The 2 most significant bits of this byte must be 10.
    (parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');

  return uuid;
}


export async function createConversation(
  currentUser_id: string,
  participant_ids: string[],
  type: 'direct' | 'group',
  name?: string
) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const allParticipantIds = [...new Set([currentUser_id, ...participant_ids])];

  let conversationId: string;
  
  if (type === 'direct' && allParticipantIds.length === 2) {
    conversationId = getDirectMessageConversationId(allParticipantIds[0], allParticipantIds[1]);
  } else {
    // For group chats, we still generate a random UUID.
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({ type, name: type === 'group' ? name : null })
      .select('id')
      .single();

      if (conversationError) {
        console.error('Error creating group conversation:', conversationError);
        return { error: 'Could not create group conversation.' };
      }
      conversationId = conversationData.id;
  }

  // Use upsert for the conversation. If it exists, fine. If not, create it.
  const { error: upsertConversationError } = await supabase
    .from('conversations')
    .upsert({ id: conversationId, type, name: type === 'group' ? name : null })
    .select('id');

  if (upsertConversationError) {
      console.error('Error upserting conversation:', upsertConversationError);
      return { error: 'Failed to create or find conversation.' };
  }
  
  // Use upsert for participants to avoid errors if they already exist.
  const participantRecords = allParticipantIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
  }));

  const { error: participantError } = await supabase
    .from('conversation_participants')
    .upsert(participantRecords, { onConflict: 'conversation_id, user_id' });

  if (participantError) {
    console.error('Error adding participants:', participantError);
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
