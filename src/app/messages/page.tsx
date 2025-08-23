
'use client';

import { AppUser } from './types';
import { Suspense, useEffect, useState, useTransition, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { createConversation, sendMessage } from './actions';
import { getUsers, getConversations, getMessages } from './data';
import { MessageCircle, Plus, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function MessagingContent() {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeConversationId = searchParams.get('conversation_id');
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isSending, setIsSending] = useState(false);


    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }, 100);
    }, []);

    const fetchAndSetData = useCallback(async (user: AppUser, convoId: string | null) => {
        try {
            const convos = await getConversations(user.id);
            setConversations(convos);

            let currentConvo = null;
            if (convoId) {
                currentConvo = convos.find(c => c.id === convoId) || null;
            } else if (convos.length > 0) {
                 // If no convoId is in the URL, redirect to the most recent one.
                router.replace(`/messages?conversation_id=${convos[0].id}`);
                return; // Stop execution to let the redirect and re-render handle the rest.
            }
            
            setActiveConversation(currentConvo);

            if (currentConvo) {
                const fetchedMessages = await getMessages(currentConvo.id);
                setMessages(fetchedMessages);
                scrollToBottom();
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('--- Client Error: Failed to fetch conversations ---', error);
            toast({ title: 'Error fetching conversations', description: 'Could not load your conversation list.', variant: 'destructive' });
        }
    }, [router, scrollToBottom, toast]);


    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: appUser } = await supabase.from('users').select('*').eq('id', user.id).single();
                if (appUser) {
                    const enrichedAppUser = {...appUser, avatarUrl: `https://placehold.co/100x100.png`};
                    setCurrentUser(enrichedAppUser as AppUser);
                    await fetchAndSetData(enrichedAppUser as AppUser, activeConversationId);
                } else {
                     router.push('/login');
                }
            } else {
                router.push('/login');
            }
            setLoading(false);
        };

        initialize();
    }, [activeConversationId, fetchAndSetData, router]);


    useEffect(() => {
        if (!activeConversationId) return;

        const channel = createClient()
            .channel(`db-messages-${activeConversationId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `conversation_id=eq.${activeConversationId}` 
            }, async (payload) => {
                const { data: senderData, error } = await createClient().from('users').select('*').eq('id', payload.new.sender_id).single();

                if (error) {
                    console.error("Error fetching sender for realtime message:", error);
                    return;
                }

                const fullMessage = {
                    ...payload.new,
                    sender: {...senderData, avatarUrl: `https://placehold.co/40x40.png`}
                }
                setMessages(currentMessages => [...currentMessages, fullMessage]);
                scrollToBottom();
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime: Subscribed to messages channel.');
                }
                if (err) {
                    console.error('--- Client Error: Realtime subscription failed ---', err);
                }
            });

        return () => {
            channel.unsubscribe();
        };

    }, [activeConversationId, scrollToBottom]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId || !currentUser) return;
        
        setIsSending(true);
        const tempMessage = newMessage;
        setNewMessage('');

        const result = await sendMessage(activeConversationId, tempMessage);
        
        if (result.error) {
            toast({
                title: 'Error sending message',
                description: result.error,
                variant: 'destructive',
            });
            setNewMessage(tempMessage); // Restore message on error
        }
        setIsSending(false);
        scrollToBottom();
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><p>Loading messages...</p></div>;
    }

    if (!currentUser) return null;

    const getConversationTitle = (convo: any) => {
        if (!convo || !convo.participants) return 'Conversation';
        if (convo.type === 'group') return convo.name || 'Group Chat';
        const otherParticipant = convo.participants.find((p: any) => p.id !== currentUser.id);
        return otherParticipant?.full_name || 'Direct Message';
    };

    const getConversationAvatar = (convo: any) => {
        if (!convo || !convo.participants) return '';
        if (convo.type === 'group') return `https://placehold.co/40x40.png`;
        const otherParticipant = convo.participants.find((p: any) => p.id !== currentUser.id);
        return otherParticipant?.avatarUrl || `https://placehold.co/40x40.png`;
    };

    return (
        <AppLayout userRole={currentUser.role}>
            <div className="grid grid-cols-[300px_1fr] h-[calc(100vh-4rem)]">
                <div className="flex flex-col border-r">
                    <div className="p-4 flex justify-between items-center border-b">
                        <h2 className="text-xl font-bold">Conversations</h2>
                        <NewConversationDialog currentUser={currentUser} onConversationCreated={(newId) => router.push(`/messages?conversation_id=${newId}`)} />
                    </div>
                    <ScrollArea>
                        {conversations.map((convo) => (
                            <button
                                key={convo.id}
                                className={`w-full text-left p-4 border-b hover:bg-muted ${activeConversation?.id === convo.id ? 'bg-muted' : ''}`}
                                onClick={() => router.push(`/messages?conversation_id=${convo.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={getConversationAvatar(convo)} />
                                        <AvatarFallback>{getConversationTitle(convo).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{getConversationTitle(convo)}</p>
                                        <p className="text-sm text-muted-foreground truncate">{convo.last_message?.content || 'No messages yet'}</p>
                                    </div>
                                    {convo.last_message && (
                                        <time className="text-xs text-muted-foreground self-start">
                                            {formatDistanceToNow(new Date(convo.last_message.created_at), { addSuffix: true })}
                                        </time>
                                    )}
                                </div>
                            </button>
                        ))}
                    </ScrollArea>
                </div>

                <div className="flex flex-col h-full bg-card">
                    {activeConversation ? (
                        <>
                            <CardHeader className="border-b">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={getConversationAvatar(activeConversation)} />
                                        <AvatarFallback>{getConversationTitle(activeConversation).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-lg">{getConversationTitle(activeConversation)}</p>
                                        <p className="text-sm text-muted-foreground">{activeConversation.participants.map((p:any) => p.full_name).join(', ')}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0">
                                <ScrollArea className="h-[calc(100vh-14rem)] p-4" ref={scrollAreaRef}>
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex items-start gap-3 my-4 ${msg.sender_id === currentUser!.id ? 'justify-end' : ''}`}>
                                           {msg.sender_id !== currentUser!.id && (
                                             <Avatar className="h-8 w-8">
                                                <AvatarImage src={msg.sender?.avatarUrl || `https://placehold.co/40x40.png`} />
                                                <AvatarFallback>{msg.sender?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                             </Avatar>
                                           )}
                                            <div className={`rounded-lg p-3 max-w-md ${msg.sender_id === currentUser!.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                <p className="font-bold text-sm">{msg.sender?.full_name}</p>
                                                <p>{msg.content}</p>
                                                <time className="text-xs opacity-70 mt-1 block">
                                                     {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                </time>
                                            </div>
                                             {msg.sender_id === currentUser!.id && (
                                             <Avatar className="h-8 w-8">
                                                <AvatarImage src={currentUser?.avatarUrl} />
                                                <AvatarFallback>{currentUser!.full_name?.charAt(0)}</AvatarFallback>
                                             </Avatar>
                                           )}
                                        </div>
                                    ))}
                                </ScrollArea>
                            </CardContent>
                            <div className="p-4 border-t bg-background">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        autoComplete="off"
                                        disabled={isSending}
                                    />
                                    <Button type="submit" size="icon" disabled={isSending}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <MessageCircle className="h-24 w-24" />
                            <h2 className="text-2xl font-semibold mt-4">Select a conversation</h2>
                            <p>Start a new chat or select one from the list.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function NewConversationDialog({ currentUser, onConversationCreated }: { currentUser: AppUser, onConversationCreated: (newId: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');
    const [isPending, startTransition] = useTransition();
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if(isOpen) {
            getUsers(currentUser.id).then(setAllUsers);
        }
    }, [isOpen, currentUser.id]);

    const handleCreateConversation = async () => {
        if (selectedUsers.length === 0) return;
        if (conversationType === 'group' && !groupName.trim()) {
            toast({ title: 'Group name required', description: 'Please enter a name for your group chat.', variant: 'destructive' });
            return;
        }

        startTransition(async () => {
            const result = await createConversation(selectedUsers, conversationType, groupName);

            if (result.error) {
                 toast({
                    title: "Error creating conversation",
                    description: result.error.details || result.error.message || 'An unknown error occurred.',
                    variant: "destructive",
                });
            } else if (result.data) {
                setIsOpen(false);
                setSelectedUsers([]);
                setGroupName('');
                onConversationCreated(result.data.id);
            }
        });
    };
    
    const handleUserSelection = (checked: boolean | string, userId: string) => {
        const isChecked = checked === true || checked === 'true';
        if (conversationType === 'direct') {
            setSelectedUsers(isChecked ? [userId] : []);
        } else {
            setSelectedUsers(prev =>
                isChecked ? [...prev, userId] : prev.filter(id => id !== userId)
            );
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost"><Plus /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 border-b pb-4">
                    <Button variant={conversationType === 'direct' ? 'default' : 'outline'} onClick={() => { setConversationType('direct'); setSelectedUsers([]); }} className="flex-1">Direct Message</Button>
                    <Button variant={conversationType === 'group' ? 'default' : 'outline'} onClick={() => { setConversationType('group'); setSelectedUsers([]); }} className="flex-1">Group Chat</Button>
                </div>
                {conversationType === 'group' && (
                    <Input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="mt-4" />
                )}
                <p className="font-semibold mt-4">Select Participants:</p>
                <ScrollArea className="h-64 mt-2">
                    <div className="space-y-2">
                        {allUsers.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={`user-${user.id}`}
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={(checked) => handleUserSelection(checked, user.id)}
                                    disabled={conversationType === 'direct' && selectedUsers.length > 0 && !selectedUsers.includes(user.id)}
                                />
                                <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback>{user.full_name?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p>{user.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <Button onClick={handleCreateConversation} disabled={isPending || (selectedUsers.length === 0)} className="mt-4 w-full">
                    {isPending ? 'Creating...' : 'Start Conversation'}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><p>Loading...</p></div>}>
            <MessagingContent />
        </Suspense>
    );
}
