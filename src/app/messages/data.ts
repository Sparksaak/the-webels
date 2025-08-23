
'use server';

import { createClient } from '@/lib/supabase/server';
import { AppUser } from './types';
import { cookies } from 'next/headers';

export async function getUsers(currentUserId: string): Promise<AppUser[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const { data, error } = await supabase.from('users').select('*').not('id', 'eq', currentUserId);
    if (error) {
      console.error('--- Server Error: getUsers failed ---', error);
      throw error;
    }
    return (data || []).map(u => ({...u, avatarUrl: `https://placehold.co/100x100.png`})) as AppUser[];
  } catch (e) {
    console.error('--- Server CRITICAL: Exception in getUsers ---', e);
    throw e;
  }
}

export async function getConversations(userId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (participantError) {
        console.error('--- Server Error fetching conversation participants ---', participantError);
        throw participantError;
    }

    if (!participantData || participantData.length === 0) {
        return [];
    }

    const conversationIds = participantData.map(p => p.conversation_id);
    
    const { data: conversations, error: convosError } = await supabase
        .from('conversations')
        .select(`
            id,
            type,
            name,
            participants:conversation_participants(user:users(*))
        `)
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

    if (convosError) {
        console.error('--- Server Error in main conversation fetch ---', convosError);
        throw convosError;
    }

    if (!conversations) {
        return [];
    }

    const detailedConversations = conversations.map(convo => {
        return {
            ...convo,
            participants: (convo.participants || []).map((p: any) => ({ ...p.user, avatarUrl: `https://placehold.co/100x100.png` })),
            // last_message is intentionally omitted to prevent server crashes.
            last_message: null 
        };
    });

    return detailedConversations;
}


export async function getMessages(conversationId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:users(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`--- Server Error: getMessages failed for convo ${conversationId} ---`, error);
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map((d) => ({
        ...d, 
        sender: {
            ...d.sender, 
            avatarUrl: `https://placehold.co/40x40.png`
        }
    }));
  } catch(e) {
      console.error('--- Server CRITICAL: Exception in getMessages ---', e);
      throw e;
  }
}
