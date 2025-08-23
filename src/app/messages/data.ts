
'use server';

import { createClient } from '@/lib/supabase/server';
import { AppUser } from './types';
import { cookies } from 'next/headers';

export async function getUsers(currentUserId: string): Promise<AppUser[]> {
  console.log(`Server: getUsers called, excluding user: ${currentUserId}`);
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
    console.log(`Server: getConversations called for user: ${userId}`);
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    try {
        // Step 1: Get all conversation IDs for the current user.
        const { data: participant_data, error: participant_error } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (participant_error) {
            console.error('--- Server Error fetching conversation participants ---', participant_error);
            throw participant_error;
        }

        if (!participant_data || participant_data.length === 0) {
            console.log('Server: User is not in any conversations.');
            return [];
        }

        const conversationIds = participant_data.map(p => p.conversation_id);

        // Step 2: Fetch details for those conversations, including participants and the last message.
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                type,
                name,
                participants:conversation_participants(user:users(id, full_name, email, role, avatarUrl:avatar_url)),
                last_message:messages(id, content, created_at, sender_id)
            `)
            .in('id', conversationIds)
            .order('created_at', { foreignTable: 'messages', ascending: false })
            .limit(1, { foreignTable: 'messages' });

        if (error) {
            console.error('--- Server Error in main conversation fetch ---', error);
            throw error;
        }
        
        console.log(`Server: Successfully fetched ${data.length} conversations.`);
        
        // Step 3: Process the data to be in the correct format.
        return data.map((convo) => ({
            ...convo,
            last_message: convo.last_message[0] || null,
            participants: (convo.participants || []).map((p: any) => ({...p.user, avatarUrl: `https://placehold.co/100x100.png`})),
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
