
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

        // Step 2: Fetch details for those conversations.
        const { data: conversations, error: convos_error } = await supabase
            .from('conversations')
            .select(`
                id,
                type,
                name
            `)
            .in('id', conversationIds);
        
        if (convos_error) {
            console.error('--- Server Error in main conversation fetch ---', convos_error);
            throw convos_error;
        }

        if (!conversations) {
            return [];
        }

        // Step 3: For each conversation, fetch participants and the last message.
        const detailedConversations = await Promise.all(
            conversations.map(async (convo) => {
                // Fetch participants for this convo
                const { data: participantsData, error: p_error } = await supabase
                    .from('conversation_participants')
                    .select('user:users(*)')
                    .eq('conversation_id', convo.id);

                // Fetch last message for this convo
                const { data: lastMessageData, error: m_error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', convo.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (p_error || m_error) {
                    console.error(`Error fetching details for convo ${convo.id}`, {p_error, m_error});
                    return { ...convo, participants: [], last_message: null };
                }

                return {
                    ...convo,
                    participants: (participantsData || []).map((p: any) => ({ ...p.user, avatarUrl: `https://placehold.co/100x100.png` })),
                    last_message: lastMessageData
                };
            })
        );
        
        console.log(`Server: Successfully fetched ${detailedConversations.length} conversations.`);
        return detailedConversations;

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
      .select('*, sender:users(*)')
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
