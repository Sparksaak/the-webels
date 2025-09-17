
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { getConversations, getMessages } from './data';
import type { AppUser } from './types';
import { MessagingContent } from '@/components/messaging-content';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ClientOnly } from '@/components/client-only';

async function MessagesPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }
    
    const currentUser: AppUser = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        email: user.email!,
        role: user.user_metadata?.role || 'student',
        avatarUrl: `https://placehold.co/100x100.png`
    };

    const conversationIdFromUrl = typeof searchParams.conversation_id === 'string' ? searchParams.conversation_id : null;
    
    const [conversations, messages] = await Promise.all([
      getConversations(currentUser.id),
      conversationIdFromUrl ? getMessages(conversationIdFromUrl) : Promise.resolve([])
    ]);
    
    return (
        <AppLayout user={currentUser}>
            <ClientOnly>
                <MessagingContent 
                    initialCurrentUser={currentUser}
                    initialConversations={conversations}
                    initialMessages={messages}
                    initialActiveConversationId={conversationIdFromUrl}
                />
            </ClientOnly>
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
