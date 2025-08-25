
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message, AppUser } from './types';

// This function now directly calls the SQL function in the database.
export async function getConversations(userId: string): Promise<Conversation[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.rpc('get_user_conversations_with_details', { p_user_id: userId });

    if (error) {
        console.error('Error fetching conversations via RPC:', error);
        return [];
    }

    if (!data) {
        return [];
    }
    
    // The data from the SQL function is already in the desired shape.
    // We just need to handle the conversation name for direct messages.
    const conversations = data.map((conv: any) => {
        let conversationName = conv.name;
        if (conv.type === 'direct' && !conv.name) {
            const otherParticipant = conv.participants.find((p: AppUser) => p.id !== userId);
            conversationName = otherParticipant?.name || 'Direct Message';
        }
        return {
            ...conv,
            name: conversationName,
        };
    });

    return conversations as Conversation[];
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
