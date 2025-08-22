
import { createClient } from '@/lib/supabase/server';
import { AppUser } from './types';

export async function getUsers(currentUserId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('users').select('*').not('id', 'eq', currentUserId);
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data as AppUser[];
}

export async function getConversations(userId: string) {
    const supabase = createClient();
    const { data: conversationParticipants, error: convoPartError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (convoPartError || !conversationParticipants) {
        console.error('Error fetching user conversations:', convoPartError);
        return [];
    }

    const conversationIds = conversationParticipants.map(cp => cp.conversation_id);

    const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`*, participants:conversation_participants(user:users(*)), messages(content, created_at)`)
        .in('id', conversationIds)
        .order('created_at', { foreignTable: 'messages', ascending: false });

    if (conversationsError) {
        console.error('Error fetching conversations details:', conversationsError);
        return [];
    }

    return conversations.map(c => ({
        ...c,
        last_message: c.messages[0] || null,
        participants: c.participants.map((p: any) => p.user)
    }));
}

export async function getMessages(conversationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data;
}
