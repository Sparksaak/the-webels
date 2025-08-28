
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message, AppUser } from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getParticipantsForConversations(conversationIds: string[]): Promise<Record<string, AppUser[]>> {
    const { data: participantsData, error: participantsError } = await supabaseAdmin
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds);

    if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return {};
    }

    const userIds = [...new Set(participantsData.map(p => p.user_id))];
    if (userIds.length === 0) return {};

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, 
    });

    if (usersError) {
        console.error('Error fetching users for participants:', usersError);
        return {};
    }

    const usersById = users
      .filter(u => userIds.includes(u.id))
      .reduce((acc, user) => {
        acc[user.id] = {
            id: user.id,
            name: user.user_metadata.full_name || user.email,
            email: user.email!,
            role: user.user_metadata.role || 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        };
        return acc;
    }, {} as Record<string, AppUser>);

    const participantsByConversation = participantsData.reduce((acc, participant) => {
        if (!acc[participant.conversation_id]) {
            acc[participant.conversation_id] = [];
        }
        const user = usersById[participant.user_id];
        if (user) {
            acc[participant.conversation_id].push(user);
        }
        return acc;
    }, {} as Record<string, AppUser[]>);

    return participantsByConversation;
}

async function getLastMessagesForConversations(conversationIds: string[]): Promise<Record<string, { content: string; timestamp: string }>> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.rpc('get_last_message_for_conversations', {
        c_ids: conversationIds
    });

    if (error) {
        // It's possible the function doesn't exist if migrations failed.
        // We can build a fallback mechanism here or just log the error.
        console.error('Error fetching last messages via RPC:', error);
        
        // Fallback: Query manually if RPC fails
        const lastMessages: Record<string, { content: string; timestamp: string }> = {};
        for (const id of conversationIds) {
            const { data: msg, error: msgError } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('conversation_id', id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (!msgError && msg) {
                lastMessages[id] = { content: msg.content, timestamp: msg.created_at };
            }
        }
        return lastMessages;
    }

    return (data || []).reduce((acc: any, msg: any) => {
        acc[msg.conversation_id] = {
            content: msg.content,
            timestamp: msg.created_at
        };
        return acc;
    }, {});
}

// This is the main function to fetch conversations.
export async function getConversations(userId: string): Promise<Conversation[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Get conversation IDs for the user
    const { data: convParticipantData, error: convParticipantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (convParticipantError) {
        console.error('Error fetching user conversation links:', convParticipantError);
        return [];
    }

    const conversationIds = convParticipantData.map(p => p.conversation_id);
    if (conversationIds.length === 0) {
        return [];
    }

    // 2. Get the actual conversation objects
    const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

    if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return [];
    }

    // 3. Batch fetch all participants and last messages
    const [participantsByConversationId, lastMessagesByConversationId] = await Promise.all([
        getParticipantsForConversations(conversationIds),
        getLastMessagesForConversations(conversationIds)
    ]);

    // 4. Combine all the data
    const conversations = conversationsData.map(conv => {
        const participants = participantsByConversationId[conv.id] || [];
        const last_message = lastMessagesByConversationId[conv.id] || null;

        let conversationName = conv.name;
        if (conv.type === 'direct' && !conv.name) {
            const otherParticipant = participants.find(p => p.id !== userId);
            conversationName = otherParticipant?.name || 'Direct Message';
        }

        return {
            ...conv,
            name: conversationName,
            participants,
            last_message
        };
    });
    
    // Sort conversations by last message timestamp
    conversations.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime();
    });

    return conversations as Conversation[];
}


export async function getMessages(conversationId: string): Promise<Message[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Step 1: Fetch all messages for the conversation
    const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return [];
    }

    if (!messagesData || messagesData.length === 0) {
        return [];
    }

    // Step 2: Get all unique sender IDs from the messages
    const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];

    // Step 3: Fetch user details for all senders in a single query using the admin client
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Adjust as needed
    });
     
    if (usersError) {
        console.error('Error fetching users:', usersError);
        // Fallback or return empty sender info
        return [];
    }

    const usersById = users
    .filter(user => senderIds.includes(user.id))
    .reduce((acc, user) => {
        acc[user.id] = {
            id: user.id,
            name: user.user_metadata.full_name || user.email,
            email: user.email!,
            role: user.user_metadata.role || 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        };
        return acc;
    }, {} as Record<string, AppUser>);

    // Step 4: Map messages to include full sender details
    return messagesData.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        conversationId: msg.conversation_id,
        sender: usersById[msg.sender_id] || { // Fallback for unknown sender
            id: msg.sender_id,
            name: 'Unknown User',
            email: '',
            role: 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        }
    }));
}
