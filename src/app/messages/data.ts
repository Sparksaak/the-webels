
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message } from './types';

export async function getConversations(userId: string): Promise<Conversation[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

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
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

    if (conversationsError) {
        console.error('Error fetching conversation details:', conversationsError);
        return [];
    }
    
    // Separately fetch last messages to avoid complex query issues.
    const { data: lastMessagesData, error: lastMessageError } = await supabase
        .from('last_messages_view')
        .select('*')
        .in('conversation_id', conversationIds);

    if (lastMessageError) {
        console.error("Error fetching last messages", lastMessageError);
    }

    const lastMessageMap = new Map<string, { content: string, timestamp: string }>();
    if (lastMessagesData) {
        for (const msg of lastMessagesData) {
            lastMessageMap.set(msg.conversation_id, { content: msg.content, timestamp: msg.created_at });
        }
    }
    
    const detailedConversations = conversations.map((conv) => {
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

        return {
            ...conv,
            name: conversationName,
            participants,
            last_message: lastMessageMap.get(conv.id) || null,
        };
    });

    // Sort conversations: those with messages first, sorted by time, then those without, by creation time.
    detailedConversations.sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.timestamp).getTime() : 0;
        const bTime = b.last_message ? new Date(b.last_message.timestamp).getTime() : 0;

        if (aTime > 0 && bTime > 0) return bTime - aTime;
        if (aTime > 0) return -1;
        if (bTime > 0) return 1;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return detailedConversations as Conversation[];
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
