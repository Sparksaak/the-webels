
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

    // Step 1: Get all conversation IDs for the current user.
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

    // Step 2: Fetch details for those conversations.
    const { data: conversations, error: convosError } = await supabase
        .from('conversations')
        .select(`id, type, name`)
        .in('id', conversationIds);
    
    if (convosError) {
        console.error('--- Server Error in main conversation fetch ---', convosError);
        throw convosError;
    }

    if (!conversations) {
        return [];
    }

    // Step 3: For each conversation, fetch participants and the last message.
    const detailedConversations = await Promise.all(
        conversations.map(async (convo) => {
            // Fetch participants for this convo
            const { data: participantsData, error: pError } = await supabase
                .from('conversation_participants')
                .select('user:users(*)')
                .eq('conversation_id', convo.id);

            // Fetch last message for this convo
            const { data: lastMessageData, error: mError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convo.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // Use maybeSingle to prevent error if no messages exist

            if (pError || mError) {
                console.error(`Error fetching details for convo ${convo.id}`, {pError, mError});
                return { ...convo, participants: [], last_message: null };
            }

            return {
                ...convo,
                participants: (participantsData || []).map((p: any) => ({ ...p.user, avatarUrl: `https://placehold.co/100x100.png` })),
                last_message: lastMessageData
            };
        })
    );
    
    // Sort conversations by the most recent message
    detailedConversations.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
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
