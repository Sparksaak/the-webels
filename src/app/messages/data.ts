
'use server';

import { createClient } from '@/lib/supabase/server';
import { AppUser } from './types';
import { cookies } from 'next/headers';

export async function getUsers(currentUserId: string): Promise<AppUser[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase.from('users').select('*').not('id', 'eq', currentUserId);
  
  if (error) {
    console.error('--- Server Error: getUsers failed ---', error);
    throw error;
  }
  return (data || []).map(u => ({...u, avatarUrl: `https://placehold.co/100x100.png`})) as AppUser[];
}

export async function getConversations(userId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Step 1: Get the conversation IDs the user is part of.
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
    
    // Step 2: Get the full conversation objects for those IDs.
    const { data: conversations, error: convosError } = await supabase
        .from('conversations')
        .select(`id, type, name, created_at`)
        .in('id', conversationIds)
        .order('created_at', { ascending: false });
        
    if (convosError) {
        console.error('--- Server Error in main conversation fetch ---', convosError);
        throw convosError;
    }

    return conversations || [];
}

export async function getConversationParticipants(conversationId: string): Promise<AppUser[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
        .from('conversation_participants')
        .select('user:users(*)')
        .eq('conversation_id', conversationId);

    if (error) {
        console.error('--- Server Error fetching participants ---', error);
        throw error;
    }

    if (!data) return [];
    
    return data.map((p: any) => ({
        ...p.user,
        avatarUrl: `https://placehold.co/100x100.png`
    }));
}


export async function getMessages(conversationId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
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
}
