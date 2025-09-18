
'use client';

import { Suspense, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { getConversations, getMessages } from './data';
import type { AppUser } from './types';
import { MessagingContent } from '@/components/messaging-content';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateAvatarUrl } from '@/lib/utils';

function Messaging({ conversationId, currentUser }: { conversationId: string | null, currentUser: AppUser }) {
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [convs, msgs] = await Promise.all([
                getConversations(currentUser.id),
                conversationId ? getMessages(conversationId) : Promise.resolve([])
            ]);
            setConversations(convs);
            setMessages(msgs);
            setLoading(false);
        };
        fetchData();
    }, [currentUser.id, conversationId]);
    
    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading Messaging...</div>;
    }
    
    return (
        <MessagingContent 
            initialCurrentUser={currentUser}
            initialConversations={conversations}
            initialMessages={messages}
            initialActiveConversationId={conversationId}
        />
    );
}

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }
            
            const name = user.user_metadata?.full_name || user.email!;
            const appUser: AppUser = {
                id: user.id,
                name: name,
                email: user.email!,
                role: user.user_metadata?.role || 'student',
                avatarUrl: generateAvatarUrl(name),
                learning_preference: user.user_metadata?.learning_preference,
            };
            setCurrentUser(appUser);
            setLoading(false);
        }
        fetchUser();
    }, [router, supabase]);

    
    const conversationIdFromUrl = searchParams.get('conversation_id');
    
    if (loading || !currentUser) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <AppLayout user={currentUser}>
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Messaging...</div>}>
              <Messaging conversationId={conversationIdFromUrl} currentUser={currentUser} />
            </Suspense>
        </AppLayout>
    );
}
