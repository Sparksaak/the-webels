
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/app-layout';
import { getConversations, getMessages } from './data';
import type { AppUser } from './types';
import { MessagingContent } from '@/components/messaging-content';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ClientOnly } from '@/components/client-only';
import { generateAvatarUrl } from '@/lib/utils';

async function Messaging({ conversationId, currentUser }: { conversationId: string | null, currentUser: AppUser }) {
    const [conversations, messages] = await Promise.all([
      getConversations(currentUser.id),
      conversationId ? getMessages(conversationId) : Promise.resolve([])
    ]);
    
    return (
        <ClientOnly>
            <MessagingContent 
                initialCurrentUser={currentUser}
                initialConversations={conversations}
                initialMessages={messages}
                initialActiveConversationId={conversationId}
            />
        </ClientOnly>
    );
}

export default async function MessagesPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
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
    
    const conversationIdFromUrl = typeof searchParams.conversation_id === 'string' ? searchParams.conversation_id : null;
    
    return (
        <AppLayout user={currentUser}>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Messaging...</div>}>
              <Messaging conversationId={conversationIdFromUrl} currentUser={currentUser} />
            </Suspense>
        </AppLayout>
    );
}
