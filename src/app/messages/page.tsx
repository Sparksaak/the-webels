


import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { getConversations, getMessages } from './data';
import type { AppUser } from './types';
import { MessagingContent } from '@/components/messaging-content';
import { redirect } from 'next/navigation';
import { generateAvatarUrl } from '@/lib/utils';
import { cookies } from 'next/headers';

async function Messaging({ conversationId, currentUser }: { conversationId: string | null, currentUser: AppUser }) {
    const [conversations, messages] = await Promise.all([
        getConversations(currentUser.id),
        conversationId ? getMessages(conversationId) : Promise.resolve([])
    ]);
    
    return (
        <MessagingContent 
            initialCurrentUser={currentUser}
            initialConversations={conversations}
            initialMessages={messages}
            initialActiveConversationId={conversationId}
        />
    );
}

export default async function MessagesPage({ searchParams }: { searchParams: { conversation_id?: string } }) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }
    
    const name = user.user_metadata?.full_name || user.email!;
    const currentUser: AppUser = {
        id: user.id,
        name: name,
        email: user.email!,
        role: user.user_metadata?.role || 'student',
        avatarUrl: generateAvatarUrl(name),
        learning_preference: user.user_metadata?.learning_preference,
    };
    
    const conversationIdFromUrl = searchParams.conversation_id || null;
    
    return (
        <AppLayout user={currentUser}>
            <div className="h-[calc(100vh_-_5rem)] md:h-[calc(100vh_-_3.5rem)]">
                <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="text-muted-foreground">Loading Messaging...</div></div>}>
                  <Messaging conversationId={conversationIdFromUrl} currentUser={currentUser} />
                </Suspense>
            </div>
        </AppLayout>
    );
}
