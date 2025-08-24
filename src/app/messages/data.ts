
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message } from './types';

export async function getConversations(userId: string): Promise<Conversation[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch conversations the user is a part of
    const { data: userConvos, error: userConvosError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (userConvosError) {
        console.error('Error fetching user conversations:', userConvosError);
        return [];
    }

    if (!userConvos || userConvos.length === 0) {
        return [];
    }

    const conversationIds = userConvos.map(c => c.conversation_id);

    // Fetch conversation details including participants
    const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
            id,
            name,
            type,
            created_at,
            participants:conversation_participants(
                user:users(id, full_name, email, role)
            )
        `)
        .in('id', conversationIds);

    if (conversationsError) {
        console.error('Error fetching conversation details:', conversationsError);
        return [];
    }

    // Fetch last message for each conversation in a single query
    const { data: lastMessages, error: lastMessagesError } = await supabase.rpc('get_last_message_for_conversations', {
        c_ids: conversationIds
    });

    if (lastMessagesError) {
        console.error('Error fetching last messages:', lastMessagesError);
        // We can continue without last messages if this fails
    }
    
    const lastMessageMap = new Map<string, { content: string, timestamp: string }>();
    if (lastMessages) {
        for (const msg of lastMessages) {
            lastMessageMap.set(msg.conversation_id, {
                content: msg.content,
                timestamp: msg.created_at,
            });
        }
    }

    // Map and format conversation data
    const conversationsWithDetails = conversations.map((conv) => {
        const participants = conv.participants.map((p: any) => ({
            id: p.user.id,
            name: p.user.full_name || p.user.email,
            email: p.user.email,
            role: p.user.role,
            avatarUrl: `https://placehold.co/100x100.png`
        }));

        let conversationName = conv.name;
        // For direct messages, derive the name from the other participant
        if (conv.type === 'direct' && !conv.name) {
            const otherParticipant = participants.find(p => p.id !== userId);
            conversationName = otherParticipant?.name || 'Direct Message';
        }

        return {
            ...conv,
            name: conversationName,
            participants: participants,
            last_message: lastMessageMap.get(conv.id) || null,
        };
    });

    // Sort conversations: those with messages are sorted by last message time,
    // and those without are sorted by creation time.
    conversationsWithDetails.sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.timestamp).getTime() : new Date(a.created_at).getTime();
        const bTime = b.last_message ? new Date(b.last_message.timestamp).getTime() : new Date(b.created_at).getTime();
        return bTime - aTime;
    });

    return conversationsWithDetails as Conversation[];
}


export async function getMessages(conversationId: string): Promise<Message[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            sender:users(id, full_name, email, role)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
    
    return data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        conversationId: conversationId,
        sender: {
            id: msg.sender.id,
            name: msg.sender.full_name || msg.sender.email,
            email: msg.sender.email,
            role: msg.sender.role,
            avatarUrl: `https://placehold.co/100x100.png`
        }
    }));
}
