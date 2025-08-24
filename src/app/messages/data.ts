
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message } from './types';

export async function getConversations(userId: string): Promise<Conversation[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch conversations where the user is a participant
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

    // Fetch the details of those conversations, including participants
    const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*, participants:conversation_participants(user:users(id, full_name, email, role))')
        .in('id', conversationIds);

    if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return [];
    }

    // Fetch the last message for all conversations in a single query
    const { data: lastMessages, error: lastMessagesError } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    if (lastMessagesError) {
        console.error('Error fetching last messages:', lastMessagesError);
        // We can continue without last messages if needed
    }

    const lastMessageMap = new Map<string, { content: string, timestamp: string }>();
    if (lastMessages) {
        // Since the query is ordered, the first one we see for each conversation is the latest
        for (const msg of lastMessages) {
            if (!lastMessageMap.has(msg.conversation_id)) {
                lastMessageMap.set(msg.conversation_id, {
                    content: msg.content,
                    timestamp: msg.created_at
                });
            }
        }
    }
    
    // Enhance conversations with last message and correct name
    const conversationsWithDetails = conversations.map((conv) => {
        const participants = conv.participants.map((p: any) => ({
            id: p.user.id,
            name: p.user.full_name || p.user.email,
            email: p.user.email,
            role: p.user.role,
            avatarUrl: `https://placehold.co/100x100.png`
        }));

        let conversationName = conv.name;
        if (conv.type === 'direct' && !conv.name) {
            const otherParticipant = participants.find(p => p.id !== userId);
            conversationName = otherParticipant?.name || 'Direct Message';
        }

        const last_message = lastMessageMap.get(conv.id) || null;

        return {
            ...conv,
            name: conversationName,
            participants: participants,
            last_message: last_message,
        };
    });
    
    // Sort conversations: those with messages by last message timestamp, those without by creation date (newest first)
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
