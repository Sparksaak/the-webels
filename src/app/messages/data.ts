
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
      console.error('Error fetching users:', error);
      return [];
    }
    return data.map(u => ({...u, avatarUrl: `https://placehold.co/100x100.png`})) as AppUser[];
  } catch (e) {
    console.error('Exception fetching users:', e);
    return [];
  }
}


export async function getConversations(userId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    console.log(`Server: getConversations called for user: ${userId}`);

    try {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                type,
                name,
                participants:conversation_participants (
                    user:users ( id, full_name, email, role, avatarUrl:avatar_url )
                ),
                last_message:messages (
                    content,
                    created_at
                )
            `)
            .in('id', 
                supabase.from('conversation_participants')
                        .select('conversation_id')
                        .eq('user_id', userId)
            )
            .order('created_at', { foreignTable: 'messages', ascending: false })
            .limit(1, { foreignTable: 'messages' });


        if (error) {
            console.error('--- Server Error: getConversations query failed ---', error);
            throw error;
        }

        console.log('Server: Successfully fetched conversations via direct query:', data);
        
        if (!data) {
          return [];
        }

        // The query now returns a structure that is much closer to what we need.
        return data.map((convo: any) => ({
          id: convo.id,
          type: convo.type,
          name: convo.name,
          participants: convo.participants.map((p: any) => ({ ...p.user, avatarUrl: `https://placehold.co/100x100.png` })),
          last_message: convo.last_message[0] || null
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
      return [];
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
