
'use client';

import { Suspense, useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader } from '@/components/ui/card';
import { Send, UserPlus, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

import { getConversations, getMessages } from './data';
import { sendMessage } from './actions';
import type { AppUser, Conversation, Message } from './types';
import { NewConversationDialog } from '@/components/new-conversation-dialog';

function MessagingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const formRef = useRef<HTMLFormElement>(null);

    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    const fetchAndSetData = useCallback(async (user: AppUser, conversationIdToSelect?: string) => {
        setLoading(true);
        try {
            const fetchedConversations = await getConversations(user.id);
            setConversations(fetchedConversations);

            let idToSelect = conversationIdToSelect || searchParams.get('conversation_id');
            if (!idToSelect && fetchedConversations.length > 0) {
                idToSelect = fetchedConversations[0].id;
            }

            if (idToSelect) {
                await handleConversationSelect(idToSelect, false); // false to avoid pushing router history again
            } else {
                 setActiveConversationId(null);
                 setMessages([]);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [router, searchParams]); // handleConversationSelect is memoized, so it's safe to exclude.

    const handleConversationSelect = useCallback(async (conversationId: string, pushHistory = true) => {
        setLoadingMessages(true);
        setActiveConversationId(conversationId);
        if (pushHistory) {
            router.push(`/messages?conversation_id=${conversationId}`, { scroll: false });
        }
        try {
            const fetchedMessages = await getMessages(conversationId);
            setMessages(fetchedMessages);
        } catch (error) {
            console.error("Failed to load messages", error)
        } finally {
            setLoadingMessages(false);
        }
    }, [router]);

    useEffect(() => {
        const getUserAndData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const appUser: AppUser = {
                    id: user.id,
                    name: user.user_metadata?.full_name || user.email,
                    email: user.email!,
                    role: user.user_metadata?.role || 'student',
                    avatarUrl: `https://placehold.co/100x100.png`
                };
                setCurrentUser(appUser);
                await fetchAndSetData(appUser);
            } else {
                router.push('/login');
                setLoading(false);
            }
        };
        getUserAndData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleNewMessage = useCallback(async (payload: any) => {
        const newMessagePayload = payload.new;

        const { data: senderData, error } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .eq('id', newMessagePayload.sender_id)
            .single();

        if (error) {
            console.error('Error fetching sender for new message:', error);
            return;
        }

        const sender: AppUser = {
            id: senderData.id,
            name: senderData.full_name || senderData.email,
            email: senderData.email!,
            role: senderData.role || 'student',
            avatarUrl: `https://placehold.co/100x100.png`
        };

        const newMessage: Message = {
            id: newMessagePayload.id,
            content: newMessagePayload.content,
            createdAt: newMessagePayload.created_at,
            conversationId: newMessagePayload.conversation_id,
            sender: sender,
        };
        
        if (newMessage.conversationId === activeConversationId) {
             setMessages(currentMessages => [...currentMessages, newMessage]);
        }

        // Update the conversation in the list with the new last message
        setConversations(prevConvos => {
            const updatedConvos = prevConvos.map(convo => {
                if (convo.id === newMessage.conversationId) {
                    return {
                        ...convo,
                        last_message: {
                            content: newMessage.content,
                            timestamp: newMessage.createdAt
                        }
                    };
                }
                return convo;
            });
            // Re-sort the conversations to bring the updated one to the top
            return updatedConvos.sort((a, b) => {
                const aTime = a.last_message ? new Date(a.last_message.timestamp).getTime() : new Date(a.created_at).getTime();
                const bTime = b.last_message ? new Date(b.last_message.timestamp).getTime() : new Date(b.created_at).getTime();
                return bTime - aTime;
            });
        });
        
    }, [activeConversationId, supabase]);

    useEffect(() => {
        const channel = supabase
            .channel('realtime-messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages' }, 
                handleNewMessage
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, handleNewMessage]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading conversations...</div>;
    }

    if (!currentUser) {
        return null; // Should be redirected by the effect hook
    }

    return (
        <div className="flex h-[calc(100vh_-_3.5rem)]">
            <Card className="w-1/3 rounded-r-none border-r h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <h2 className="text-xl font-bold">Chats</h2>
                    <NewConversationDialog
                        currentUser={currentUser}
                        onConversationCreated={(conversationId) => {
                            if (currentUser) {
                                fetchAndSetData(currentUser, conversationId);
                            }
                        }}
                    />
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {conversations.map((conv) => (
                            <Button
                                key={conv.id}
                                variant={conv.id === activeConversationId ? 'secondary' : 'ghost'}
                                className="w-full justify-start h-auto py-3 px-3"
                                onClick={() => handleConversationSelect(conv.id)}
                            >
                                <Avatar className="h-10 w-10 mr-3" data-ai-hint="person portrait">
                                    <AvatarImage src={conv.type === 'direct' ? conv.participants.find(p=>p.id !== currentUser.id)?.avatarUrl : 'https://placehold.co/100x100.png'} />
                                    <AvatarFallback>{conv.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start w-full truncate">
                                    <div className="font-semibold">{conv.name}</div>
                                    {conv.last_message && (
                                        <p className="text-xs text-muted-foreground truncate w-full">
                                            {conv.last_message.content}
                                        </p>
                                    )}
                                </div>
                                 {conv.last_message && (
                                    <div className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                                        {formatDistanceToNow(parseISO(conv.last_message.timestamp), { addSuffix: true })}
                                    </div>
                                )}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            <div className="w-2/3 flex flex-col bg-muted/30 h-full">
                {activeConversation ? (
                    <>
                        <header className="flex items-center gap-4 border-b bg-background px-6 h-16">
                            <Avatar data-ai-hint="person portrait">
                                 <AvatarImage src={activeConversation.type === 'direct' ? activeConversation.participants.find(p=>p.id !== currentUser.id)?.avatarUrl : 'https://placehold.co/100x100.png'} />
                                <AvatarFallback>{activeConversation.name?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-semibold">{activeConversation.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {activeConversation.type === 'group' 
                                        ? `${activeConversation.participants.length} members`
                                        : `Direct message with ${activeConversation.participants.find(p => p.id !== currentUser.id)?.name}`
                                    }
                                </p>
                            </div>
                        </header>
                        <ScrollArea className="flex-1 p-4 md:p-6">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <p>Loading messages...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-24">
                                            <p>This is the beginning of your conversation.</p>
                                            <p className="text-sm">Send a message to get started!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={cn('flex items-end gap-2', msg.sender.id === currentUser.id ? 'justify-end' : 'justify-start')}>
                                                {msg.sender.id !== currentUser.id && (
                                                    <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                                                        <AvatarImage src={msg.sender.avatarUrl} />
                                                        <AvatarFallback>{msg.sender.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn('max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm', msg.sender.id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-card')}>
                                                    <p className="font-bold mb-1">{msg.sender.name}</p>
                                                    <p>{msg.content}</p>
                                                    <p className="text-xs opacity-70 mt-1.5 text-right">{format(parseISO(msg.createdAt), 'p')}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-4 border-t bg-background">
                            <form 
                                ref={formRef}
                                action={async (formData) => {
                                    if (!formData.get('content')) return;
                                    setIsSubmitting(true);
                                    await sendMessage(formData);
                                    formRef.current?.reset();
                                    setIsSubmitting(false);
                                    scrollToBottom();
                                }} 
                                className="relative"
                            >
                                <Input
                                    name="content"
                                    placeholder="Type your message..."
                                    className="pr-12"
                                    autoComplete="off"
                                    disabled={isSubmitting}
                                />
                                <input type="hidden" name="conversationId" value={activeConversationId || ''} />
                                <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isSubmitting}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                         {conversations.length === 0 ? (
                            <>
                                <MessageSquarePlus className="h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-2xl font-semibold">Start a Conversation</h2>
                                <p className="mt-2 text-muted-foreground">You don't have any messages yet.</p>
                                <NewConversationDialog
                                    currentUser={currentUser}
                                    onConversationCreated={(conversationId) => {
                                        if (currentUser) {
                                            fetchAndSetData(currentUser, conversationId);
                                        }
                                    }}
                                >
                                    <Button className="mt-4">
                                        <UserPlus className="mr-2 h-4 w-4" /> New Conversation
                                    </Button>
                                </NewConversationDialog>
                            </>
                        ) : (
                             <>
                                <MessageSquarePlus className="h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-2xl font-semibold">No Conversation Selected</h2>
                                <p className="mt-2 text-muted-foreground">Select a conversation from the list to view messages.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Messaging...</div>}>
            <AppLayout userRole="student">
                <MessagingContent />
            </AppLayout>
        </Suspense>
    )
}
