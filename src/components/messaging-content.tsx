





'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader } from '@/components/ui/card';
import { Send, UserPlus, MessageSquarePlus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientTime } from '@/components/client-time';

import { getConversations, getMessages } from '@/app/messages/data';
import { sendMessage, deleteMessage } from '@/app/messages/actions';
import type { AppUser, Conversation, Message } from '@/app/messages/types';
import { NewConversationDialog } from '@/components/new-conversation-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MessagingContentProps {
    initialCurrentUser: AppUser;
    initialConversations: Conversation[];
    initialMessages: Message[];
    initialActiveConversationId: string | null;
}

function getInitials(name: string | null | undefined = ''): string {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function generateAvatarUrl(name: string | null | undefined): string {
    const initials = getInitials(name);
    return `https://placehold.co/100x100/EFEFEF/333333/png?text=${initials}`;
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

    const fetchAndSetConversations = useCallback(async (userId: string) => {
        const fetchedConversations = await getConversations(userId);
        setConversations(fetchedConversations);
        return fetchedConversations;
    }, []);
    
    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    
    const handleConversationSelect = useCallback(async (conversationId: string) => {
        if (!conversationId || conversationId === activeConversationId) {
            return;
        }

        setLoadingMessages(true);
        router.push(`/messages?conversation_id=${conversationId}`, { scroll: false });
        setActiveConversationId(conversationId);
        
        try {
            const fetchedMessages = await getMessages(conversationId);
            setMessages(fetchedMessages);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to load messages", error)
            setMessages([]);
            toast({ title: "Error", description: "Failed to load messages.", variant: "destructive"});
        } finally {
            setLoadingMessages(false);
        }
    }, [router, activeConversationId, toast]);
    
    const onConversationCreated = useCallback(async (conversationId: string) => {
        const updatedConversations = await fetchAndSetConversations(currentUser.id);
        const newConversation = updatedConversations.find(c => c.id === conversationId);
        if (newConversation) {
            handleConversationSelect(conversationId);
        }
    }, [currentUser.id, fetchAndSetConversations, handleConversationSelect]);

    useEffect(() => {
        const channel = supabase.channel(`conversations-channel`);
        
        const messageSubscription = channel
          .on('broadcast', { event: 'new_message' }, (payload) => {
              const newMessage: Message = payload.payload.payload;
              
              if (newMessage.sender.id === currentUser.id) return;

              if (newMessage.conversationId === activeConversationId) {
                  setMessages(prev => {
                      if (prev.some(m => m.id === newMessage.id)) return prev;
                      const newMessages = [...prev, newMessage];
                      scrollToBottom();
                      return newMessages;
                  });
              }

              fetchAndSetConversations(currentUser.id);
          })
          .on('broadcast', { event: 'message_updated' }, (payload) => {
                const { updatedMessage } = payload.payload.payload;
                if (updatedMessage && updatedMessage.conversationId === activeConversationId) {
                    setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
                }
                fetchAndSetConversations(currentUser.id);
          })
          .subscribe((status, err) => {
              if (status === 'SUBSCRIBED') {
                // console.log(`Successfully subscribed to broadcast channel!`);
              }
              if (status === 'CHANNEL_ERROR' || err) {
                console.error('Realtime broadcast channel error:', err);
              }
          });
    
        return () => {
          supabase.removeChannel(messageSubscription);
        };
    }, [supabase, activeConversationId, currentUser.id, fetchAndSetConversations]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    

    const handleSendMessage = async (formData: FormData) => {
        const content = formData.get('content') as string;
        if (!content?.trim() || !activeConversationId) return;
        
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            content: content,
            createdAt: new Date().toISOString(),
            conversationId: activeConversationId,
            sender: currentUser,
            is_deleted: false,
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();
        
        formRef.current?.reset();
        setIsSubmitting(true);
        
        formData.set('conversationId', activeConversationId);
        const result = await sendMessage(formData);
        
        if (result?.error) {
             console.error(result.error);
             setMessages(prev => prev.filter(m => m.id !== tempId));
             toast({
                title: "Error sending message",
                description: result.error,
                variant: "destructive",
             });
        } else if (result?.success && result.message) {
             setMessages(prev => prev.map(m => m.id === tempId ? result.message : m));
             
             const channel = supabase.channel(`conversations-channel`);
             channel.send({
                 type: 'broadcast',
                 event: 'new_message',
                 payload: { payload: result.message },
             });
            
             fetchAndSetConversations(currentUser.id);
        }
        
        setIsSubmitting(false);
    };

    const handleDeleteMessage = async (messageId: string) => {
        const originalMessages = [...messages];
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true, content: 'This message was deleted.' } : m));

        const result = await deleteMessage(messageId);
        
        if (result.error) {
            setMessages(originalMessages);
            toast({
                title: "Error deleting message",
                description: result.error,
                variant: "destructive",
            });
        } else if (result.success) {
            const channel = supabase.channel(`conversations-channel`);
            channel.send({
                type: 'broadcast',
                event: 'message_updated',
                payload: { payload: { updatedMessage: result.updatedMessage } },
            });
            fetchAndSetConversations(currentUser.id);
        }
    };

    const handleBack = () => {
        setActiveConversationId(null);
        router.push('/messages', { scroll: false });
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
            <div className="flex h-full">
                <div className={cn(
                    "w-full md:w-2/5 lg:w-1/3 flex-col h-full",
                    activeConversationId ? "hidden md:flex" : "flex"
                )}>
                    <Card className="rounded-none border-0 border-r h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <h2 className="text-xl font-bold">Chats</h2>
                            <NewConversationDialog
                                currentUser={currentUser}
                                onConversationCreated={onConversationCreated}
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
                                            <AvatarImage src={conv.type === 'direct' ? conv.participants.find(p=>p.id !== currentUser.id)?.avatarUrl : generateAvatarUrl(conv.name)} />
                                            <AvatarFallback>{getInitials(conv.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start min-w-0">
                                            <div className="font-semibold truncate w-full text-left">{conv.name}</div>
                                            {conv.last_message && (
                                                <p className="text-xs text-muted-foreground whitespace-nowrap w-full text-left">
                                                    {conv.last_message.content.length > 30
                                                        ? `${conv.last_message.content.substring(0, 30)}...`
                                                        : conv.last_message.content}
                                                </p>
                                            )}
                                        </div>
                                         {conv.last_message && (
                                            <div className="text-xs text-muted-foreground ml-auto whitespace-nowrap self-start">
                                                <ClientTime timestamp={conv.last_message.timestamp} formatType="distance" />
                                            </div>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>


                <div className={cn(
                    "w-full md:w-3/5 lg:w-2/3 flex-col bg-muted/30 h-full",
                    activeConversationId ? "flex" : "hidden md:flex"
                )}>
                    {activeConversation ? (
                        <>
                            <header className="flex items-center gap-4 border-b bg-background px-6 h-16">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={handleBack}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <Avatar data-ai-hint="person portrait">
                                     <AvatarImage src={activeConversation.type === 'direct' ? activeConversation.participants.find(p=>p.id !== currentUser.id)?.avatarUrl : generateAvatarUrl(activeConversation.name)} />
                                    <AvatarFallback>{getInitials(activeConversation.name)}</AvatarFallback>
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
                                <div className="space-y-6">
                                    {messages.length === 0 && !loadingMessages ? (
                                        <div className="text-center text-muted-foreground py-24">
                                            <p>This is the beginning of your conversation.</p>
                                            <p className="text-sm">Send a message to get started!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={cn('group flex items-end gap-2', msg.sender.id === currentUser.id ? 'justify-end' : 'justify-start')}>
                                                {msg.sender.id !== currentUser.id && (
                                                    <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                                                        <AvatarImage src={msg.sender.avatarUrl} />
                                                        <AvatarFallback>{getInitials(msg.sender.name)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                 {msg.sender.id === currentUser.id && !msg.is_deleted && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will mark the message as deleted. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)} className={buttonVariants({ variant: 'destructive' })}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                                <div className={cn('max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm', msg.sender.id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-card', msg.is_deleted && 'bg-transparent text-muted-foreground italic border border-dashed')}>
                                                    {!msg.is_deleted && <p className="font-bold mb-1">{msg.sender.name}</p>}
                                                    <p>{msg.is_deleted ? 'This message was deleted.' : msg.content}</p>
                                                    {!msg.is_deleted && (
                                                        <p className="text-xs opacity-70 mt-1.5 text-right">
                                                            <ClientTime timestamp={msg.createdAt} formatType="time" />
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
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
                                        onConversationCreated={onConversationCreated}
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
