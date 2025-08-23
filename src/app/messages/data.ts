
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
            .from('conversation_participants')
            .select(`
                conversation:conversations (
                    id,
                    type,
                    name,
                    last_message:messages (
                        content,
                        created_at
                    )
                ),
                user:users (
                    id,
                    full_name,
                    email,
                    role
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { foreignTable: 'conversations.messages', ascending: false })
            .limit(1, { foreignTable: 'conversations.messages' });

        if (error) {
            console.error('--- Server Error: getConversations query failed ---', error);
            throw error;
        }

        if (!data) {
          console.log('Server: No conversation data returned, returning empty array.');
          return [];
        }
        
        // The query above returns one row for each participant in a conversation for the current user.
        // We need to group these by conversation ID.
        const conversationsMap = new Map();
        
        for (const participant of data) {
            if (participant.conversation) {
                const convoId = participant.conversation.id;
                if (!conversationsMap.has(convoId)) {
                    conversationsMap.set(convoId, {
                        ...participant.conversation,
                        participants: [],
                        last_message: participant.conversation.last_message[0] || null,
                    });
                }
            }
        }
        
        // Fetch all participants for the conversations we found
        const convoIds = Array.from(conversationsMap.keys());
        if (convoIds.length > 0) {
            const { data: allParticipants, error: participantsError } = await supabase
                .from('conversation_participants')
                .select(`
                    conversation_id,
                    user:users (id, full_name, email, role)
                `)
                .in('conversation_id', convoIds);

            if (participantsError) {
                console.error('--- Server Error: Failed to fetch all participants ---', participantsError);
                throw participantsError;
            }

            if (allParticipants) {
                for (const p of allParticipants) {
                    if (conversationsMap.has(p.conversation_id)) {
                        const user = {...p.user, avatarUrl: `https://placehold.co/100x100.png`}
                        conversationsMap.get(p.conversation_id).participants.push(user);
                    }
                }
            }
        }
        
        const finalConversations = Array.from(conversationsMap.values());
        console.log(`Server: Successfully processed ${finalConversations.length} conversations.`);
        return finalConversations;

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
