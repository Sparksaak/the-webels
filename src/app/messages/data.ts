
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Conversation, Message, AppUser } from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Step 3: Fetch user details for all senders in a single query
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
            role: user.user_metadata.role,
            avatarUrl: `https://placehold.co/100x100.png`
        };
        return acc;
    }, {} as Record<string, AppUser>);


    // Step 4: Map messages to include sender details
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
