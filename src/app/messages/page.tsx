
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { getConversations, getMessages } from './data';
import type { AppUser } from './types';
import { MessagingContent } from '@/components/messaging-content';
import { cookies } from 'next/headers';

async function MessagesPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // This should be handled by middleware, but as a fallback
        return (
            <div className="flex items-center justify-center h-screen">
                <p>You must be logged in to view messages.</p>
            </div>
        );
    }
    
    const currentUser: AppUser = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        email: user.email!,
        role: user.user_metadata?.role || 'student',
        avatarUrl: `https://placehold.co/100x100.png`
    };

    const conversations = await getConversations(currentUser.id);
    const conversationIdFromUrl = typeof searchParams.conversation_id === 'string' ? searchParams.conversation_id : null;
    
    const messages = conversationIdFromUrl 
        ? await getMessages(conversationIdFromUrl) 
        : [];
    
    const activeConversation = conversations.find(c => c.id === conversationIdFromUrl) || null;
    
    return (
        <AppLayout userRole={currentUser.role}>
            <MessagingContent 
                initialCurrentUser={currentUser}
                initialConversations={conversations}
                initialMessages={messages}
                initialActiveConversationId={conversationIdFromUrl}
            />
        </AppLayout>
    );
}

export default function MessagesPageWrapper({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Messaging...</div>}>
      <MessagesPage searchParams={searchParams} />
    </Suspense>
  )
}
