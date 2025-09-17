
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader } from '@/components/ui/card';
import { Send, UserPlus, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

import { getConversations, getMessages } from '@/app/messages/data';
import { sendMessage } from '@/app/messages/actions';
import type { AppUser, Conversation, Message } from '@/app/messages/types';
import { NewConversationDialog } from '@/components/new-conversation-dialog';
import { useToast } from '@/hooks/use-toast';
import { ClientOnly } from './client-only';

interface MessagingContentProps {
    initialCurrentUser: AppUser;
    initialConversations: Conversation[];
    initialMessages: Message[];
    initialActiveConversationId: string | null;
}

export function MessagingContent({ 
    initialCurrentUser, 
    initialConversations, 
    initialMessages, 
    initialActiveConversationId 
}: MessagingContentProps) {
    const router = useRouter();
    const supabase = createClient();
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const [currentUser] = useState<AppUser>(initialCurrentUser);
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(initialActiveConversationId);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setConversations(initialConversations);
    }, [initialConversations]);
    
    useEffect(() => {
      setMessages(initialMessages);
    }, [initialMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    const fetchAndSetConversations = useCallback(async (userId: string) => {
        const fetchedConversations = await getConversations(userId);
        setConversations(fetchedConversations);
        return fetchedConversations;
    }, []);

    const handleConversationSelect = useCallback(async (conversationId: string) => {
        if (!conversationId || conversationId === activeConversationId) return;

        router.push(`/messages?conversation_id=${conversationId}`, { scroll: false });
        setActiveConversationId(conversationId);
        setLoadingMessages(true);
        try {
            const fetchedMessages = await getMessages(conversationId);
            setMessages(fetchedMessages);
        } catch (error) {
            console.error("Failed to load messages", error)
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, [router, activeConversationId]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        if (!activeConversationId) {
          return;
        }
    
        const channel = supabase
          .channel(`messages:${activeConversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${activeConversationId}`,
            },
            async (payload) => {
                const newMessage = payload.new as Message;
                
                // We need to fetch the sender's details for the new message
                const { data: userData } = await supabase
                    .from('users')
                    .select('id, user_metadata')
                    .eq('id', newMessage.sender_id)
                    .single();

                const sender: AppUser = {
                    id: userData.id,
                    name: userData.user_metadata.full_name || 'Unknown',
                    email: userData.user_metadata.email,
                    role: userData.user_metadata.role || 'student',
                    avatarUrl: 'https://placehold.co/100x100.png'
                }

                const fullMessage: Message = { ...newMessage, sender };
                
                setMessages((currentMessages) => {
                    // Avoid adding duplicates from optimistic update
                    if (currentMessages.some(m => m.id === fullMessage.id)) {
                        return currentMessages;
                    }
                    return [...currentMessages, fullMessage];
                });

                // Also refresh the conversation list to show new "last message"
                fetchAndSetConversations(currentUser.id);
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Successfully subscribed to channel: messages:${activeConversationId}`);
            }
            if (status === 'CHANNEL_ERROR') {
              console.error(`Failed to subscribe to channel: messages:${activeConversationId}`, err);
            }
            if (err) {
              console.error('Subscription error:', err);
            }
          });
    
        return () => {
          supabase.removeChannel(channel);
        };
      }, [activeConversationId, supabase, currentUser.id, fetchAndSetConversations]);
    

    const handleSendMessage = async (formData: FormData) => {
        const content = formData.get('content') as string;
        if (!content?.trim() || !activeConversationId) return;
        
        setIsSubmitting(true);
        formRef.current?.reset();

        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            content: content,
            createdAt: new Date().toISOString(),
            conversationId: activeConversationId,
            sender: currentUser,
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();
        
        const result = await sendMessage(formData);
        
        if (result?.error) {
             console.error(result.error);
             setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
             toast({
                title: "Error sending message",
                description: result.error,
                variant: "destructive",
             });
        } else {
             // The realtime subscription will handle receiving the final message.
             // We can remove the optimistic one once the real one arrives.
             setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        }
        
        setIsSubmitting(false);
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
            <div className="flex h-[calc(100vh_-_3.5rem)]">
                <Card className="w-1/3 rounded-r-none border-r h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <h2 className="text-xl font-bold">Chats</h2>
                        <NewConversationDialog
                            currentUser={currentUser}
                            onConversationCreated={async (conversationId) => {
                                if (currentUser) {
                                    await fetchAndSetConversations(currentUser.id);
                                    handleConversationSelect(conversationId);
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
                                            <ClientOnly>
                                                {formatDistanceToNow(parseISO(conv.last_message.timestamp), { addSuffix: true })}
                                            </ClientOnly>
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
                                            : `Direct message`
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
                                                        <p className="text-xs opacity-70 mt-1.5 text-right">
                                                            <ClientOnly>
                                                                {format(parseISO(msg.createdAt), 'p')}
                                                            </ClientOnly>
                                                        </p>
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
                                    action={handleSendMessage} 
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
                                        onConversationCreated={async (conversationId) => {
                                            if (currentUser) {
                                                await fetchAndSetConversations(currentUser.id);
                                                handleConversationSelect(conversationId);
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
