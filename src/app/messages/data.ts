
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
      console.error('--- Server Error: Error fetching users ---', error);
      return [];
    }
    return data.map(u => ({...u, avatarUrl: `https://placehold.co/100x100.png`})) as AppUser[];
  } catch (e) {
    console.error('--- Server CRITICAL: Exception fetching users ---', e);
    return [];
  }
}


export async function getConversations(userId: string) {
    console.log(`Server: getConversations called for user: ${userId}`);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    try {
        const { data, error } = await supabase
            .rpc('get_user_conversations_with_details', { p_user_id: userId });

        if (error) {
            console.error('--- Server Error: get_user_conversations_with_details RPC failed ---', error);
            throw error;
        }
        
        console.log(`Server: Successfully fetched ${data.length} conversations via RPC.`);
        if (!data) return [];

        return data.map((convo: any) => ({
            ...convo,
            participants: (convo.participants || []).map((p:any) => ({...p, avatarUrl: `https://placehold.co/100x100.png`})),
        }));

    } catch (e) {
        console.error('--- Server CRITICAL: Exception in getConversations ---', e);
        throw e;
    }
}


export async function getMessages(conversationId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  try {
    console.log(`Server: getMessages called for convo: ${conversationId}`);
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:users(id, full_name, email, role)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`--- Server Error: getMessages failed for convo ${conversationId} ---`, error);
      throw error;
    }
    
    if (!data) {
      console.log(`Server: No messages found for convo ${conversationId}, returning empty array.`);
      return [];
    }

    console.log(`Server: Successfully fetched ${data.length} messages for convo ${conversationId}`);
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
