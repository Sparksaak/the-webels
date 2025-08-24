
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message } from './types';

export async function getConversations(userId: string): Promise<Conversation[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch conversation IDs where the user is a participant
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

    // Fetch the details of those conversations
    const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*, participants:conversation_participants(user:users(id, full_name, email, role))')
        .in('id', conversationIds);

    if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return [];
    }

    // Enhance conversations with last message and correct name
    const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
            const { data: lastMessage, error: lastMessageError } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (lastMessageError && lastMessageError.code !== 'PGRST116') { // 'PGRST116' is "No rows found"
                console.error('Error fetching last message:', lastMessageError);
            }

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
                participants: participants,
                last_message: lastMessage ? { content: lastMessage.content, timestamp: lastMessage.created_at } : null,
            };
        })
    );
    
    // Sort conversations by the timestamp of the last message
    conversationsWithDetails.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime();
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
