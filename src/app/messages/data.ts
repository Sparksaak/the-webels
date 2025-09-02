
'use server';

import type { Conversation, Message, AppUser } from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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
    if (conversationIds.length === 0) return {};
    
    // Using supabaseAdmin to bypass RLS for this internal query.
    const { data, error } = await supabaseAdmin
        .from('messages')
        .select('id, conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching last messages:', error);
        return {};
    }

    const lastMessages: Record<string, { content: string; timestamp: string }> = {};
    for (const message of data) {
        if (!lastMessages[message.conversation_id]) {
            lastMessages[message.conversation_id] = {
                content: message.content,
                timestamp: message.created_at,
            };
        }
    }
    
    return lastMessages;
}

// This is the main function to fetch conversations.
export async function getConversations(userId: string): Promise<Conversation[]> {
    // 1. Get conversation IDs for the user using the admin client to bypass RLS.
    const { data: convParticipantData, error: convParticipantError } = await supabaseAdmin
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
    const { data: conversationsData, error: conversationsError } = await supabaseAdmin
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
    // Use admin client to fetch messages to ensure all messages in a conversation are visible
    // to its participants, bypassing potential RLS issues on the messages table itself.
    const { data: messagesData, error: messagesError } = await supabaseAdmin
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

    const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
    });
     
    if (usersError) {
        console.error('Error fetching users:', usersError);
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

    return messagesData.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        conversationId: msg.conversation_id,
        sender: usersById[msg.sender_id] || { 
            id: msg.sender_id,
            name: 'Unknown User',
            email: '',
            role: 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        }
    }));
}
