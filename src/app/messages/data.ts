
'use server';

import { createClient } from '@/lib/supabase/server';
import { AppUser } from './types';
import { cookies } from 'next/headers';

export async function getUsers(currentUserId: string): Promise<AppUser[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from('users').select('*').not('id', 'eq', currentUserId);
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data.map(u => ({...u, avatarUrl: `https://placehold.co/100x100.png`})) as AppUser[];
}


export async function getConversations(userId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: conversationParticipants, error: convoPartError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (convoPartError || !conversationParticipants) {
        console.error('Error fetching user conversations:', convoPartError);
        return [];
    }

    if (conversationParticipants.length === 0) {
      return [];
    }

    const conversationIds = conversationParticipants.map(cp => cp.conversation_id);

    const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
            id,
            type,
            name,
            participants:users(*),
            messages(content, created_at)
        `)
        .in('id', conversationIds)
        .order('created_at', { foreignTable: 'messages', ascending: false });
        
    if (conversationsError) {
        console.error('Error fetching conversations details:', conversationsError);
        return [];
    }
    
    // Manually join participants based on conversation_participants table
    const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select('*, user:users(*)')
        .in('conversation_id', conversationIds);

    if(allParticipantsError) {
        console.error('Error fetching all participants', allParticipantsError);
        return [];
    }

    return conversations.map((c: any) => ({
        ...c,
        last_message: c.messages[0] || null,
        participants: allParticipants
            .filter(p => p.conversation_id === c.id)
            .map((p: any) => ({...p.user, avatarUrl: `https://placehold.co/100x100.png`}))
    }));
}


export async function getMessages(conversationId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users(id, full_name, email, role)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data.map((d: any) => ({
      ...d, 
      sender: {
          ...d.sender, 
          avatarUrl: `https://placehold.co/100x100.png`
      }
  }));
}

    