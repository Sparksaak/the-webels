
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

    console.log(`Server: getConversations called for user: ${userId}`);

    try {
        const { data, error } = await supabase.rpc('get_user_conversations_with_details', {
            p_user_id: userId
        });

        if (error) {
            console.error('--- Server Error: getConversations RPC failed ---', error);
            throw error;
        }

        console.log('Server: Successfully fetched conversations via RPC:', data);
        
        if (!data) {
          return [];
        }

        return data.map((convo: any) => ({
          id: convo.conversation_id,
          type: convo.conversation_type,
          name: convo.conversation_name,
          participants: convo.participants.map((p: any) => ({ ...p, avatarUrl: `https://placehold.co/100x100.png`})),
          last_message: convo.last_message_content ? {
            content: convo.last_message_content,
            created_at: convo.last_message_created_at
          } : null
        }));

    } catch (e) {
        console.error('--- Server CRITICAL: Exception in getConversations ---', e);
        // Re-throw the error so the client's catch block can handle it
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
    
    console.log(`Server: Successfully fetched messages for convo ${conversationId}`);
    return data.map((d: any) => ({
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
