
'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export type User = {
    id: string;
    full_name: string;
    avatar_url: string;
    role: 'teacher' | 'student';
    learning_preference?: 'online' | 'in-person';
};

export type Message = {
    id: number;
    content: string;
    created_at: string;
    sender: User;
};

export type Conversation = {
    id: string;
    type: 'direct' | 'group';
    name: string | null;
    last_message: {
        content: string;
        created_at: string;
    } | null;
    participants: {
        user: User;
    }[];
};

export async function getConversations(userId: string): Promise<Conversation[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: userId });

    if (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
    
    // The RPC returns participants as JSON, so we need to ensure avatar_url is added
    return data.map((conv: any) => ({
        ...conv,
        participants: conv.participants.map((p: any) => ({
            ...p,
            user: {
                ...p.user,
                avatar_url: `https://placehold.co/100x100.png`
            }
        }))
    }));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            sender:sender_id (
                id,
                full_name,
                role
            )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data.map((msg: any) => ({
        ...msg,
        sender: {
            ...msg.sender,
            avatar_url: `https://placehold.co/100x100.png`
        }
    }));
}


export async function getPotentialRecipients(currentUser: User): Promise<User[]> {
    noStore();
    const supabase = createClient();

    if (currentUser.role === 'teacher') {
        const { data, error } = await supabase.from('users').select('*').neq('id', currentUser.id);
        if (error) {
            console.error('Error fetching users for teacher:', error);
            return [];
        }
        return data.map(u => ({...u, avatar_url: 'https://placehold.co/100x100.png' }));
    } else {
        // Student: can message teacher and students in the same learning preference
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`role.eq.teacher,learning_preference.eq.${currentUser.learning_preference}`)
            .neq('id', currentUser.id)

        if (error) {
            console.error('Error fetching users for student:', error);
            return [];
        }
        return data.map(u => ({...u, avatar_url: 'https://placehold.co/100x100.png' }));
    }
}
