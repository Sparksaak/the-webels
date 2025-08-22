
"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Paperclip, Send, Users, MessageSquarePlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User, Conversation, Message } from './data';
import { getConversations, getMessages, getPotentialRecipients } from './data';
import { createConversation, sendMessage } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversationId = searchParams.get('id');

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile, error } = await supabase.from('users').select('*').eq('id', user.id).single();
                if (profile) {
                    const appUser = { ...profile, avatar_url: 'https://placehold.co/100x100.png' };
                    setCurrentUser(appUser);
                    const convos = await getConversations(appUser.id);
                    setConversations(convos);

                    if (activeConversationId) {
                        const foundConv = convos.find(c => c.id === activeConversationId);
                        if (foundConv) {
                            setActiveConversation(foundConv);
                        }
                    } else if (convos.length > 0) {
                        // Select the first conversation by default
                        router.replace(`/messages?id=${convos[0].id}`);
                    }

                } else {
                   router.push('/login');
                }
            } else {
                router.push('/login');
            }
            setLoading(false);
        };
        initialize();
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            if (activeConversation) {
                const msgs = await getMessages(activeConversation.id);
                setMessages(msgs);
            } else {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [activeConversation]);
    
    useEffect(() => {
        // Auto-select conversation based on URL
        if (activeConversationId && conversations.length > 0) {
            const foundConv = conversations.find(c => c.id === activeConversationId);
            if (foundConv && foundConv.id !== activeConversation?.id) {
                setActiveConversation(foundConv);
            }
        }
    }, [activeConversationId, conversations, activeConversation]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleConversationSelect = (conv: Conversation) => {
        setActiveConversation(conv);
        router.push(`/messages?id=${conv.id}`);
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const tempMessageId = Date.now();
        const sentMessageContent = newMessage;
        
        // Optimistic update
        if(currentUser) {
            const tempMessage: Message = {
                id: tempMessageId,
                content: sentMessageContent,
                created_at: new Date().toISOString(),
                sender: currentUser
            };
            setMessages(prev => [...prev, tempMessage]);
        }
        setNewMessage('');
        
        const result = await sendMessage(activeConversation.id, sentMessageContent);
        if(result.error) {
            console.error(result.error);
            // Revert optimistic update
            setMessages(prev => prev.filter(m => m.id !== tempMessageId));
            setNewMessage(sentMessageContent);
        }
    };

    if (loading || !currentUser) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div>Loading messages...</div>
            </div>
        );
    }

    const getConversationDisplay = (conv: Conversation) => {
        if (conv.type === 'group') {
            return { name: conv.name || 'Group Chat', avatarUrl: 'https://placehold.co/100x100.png' };
        }
        const otherParticipant = conv.participants.find(p => p.user.id !== currentUser.id)?.user;
        if (otherParticipant) {
             return { name: otherParticipant.full_name, avatarUrl: `https://placehold.co/100x100.png`};
        }
        return { name: 'Conversation', avatarUrl: `https://placehold.co/100x100.png`};
    }

    return (
        <AppLayout userRole={currentUser.role}>
            <div className="h-[calc(100vh-5rem)]">
                <div className="grid h-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col border-r">
                        <div className="p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Conversations</h2>
                            <NewConversationDialog currentUser={currentUser} onConversationCreated={(id) => router.push(`/messages?id=${id}`)} />
                        </div>
                        <Separator />
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-1 p-2">
                                {conversations.map(conv => {
                                    const display = getConversationDisplay(conv);
                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => handleConversationSelect(conv)}
                                            className={`flex items-center gap-3 p-2 rounded-md text-left w-full ${activeConversation?.id === conv.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={display.avatarUrl} alt={display.name} />
                                                <AvatarFallback>{display.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 truncate">
                                                <p className="font-semibold">{display.name}</p>
                                                {conv.last_message && <p className="text-sm text-muted-foreground truncate">{conv.last_message.content}</p>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="flex flex-col md:col-span-2 lg:col-span-3">
                        {activeConversation ? (
                            <>
                                <div className="flex items-center gap-4 border-b p-4">
                                     <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                                        <AvatarImage src={getConversationDisplay(activeConversation).avatarUrl} alt={getConversationDisplay(activeConversation).name} />
                                        <AvatarFallback>{getConversationDisplay(activeConversation).name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{getConversationDisplay(activeConversation).name}</p>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {activeConversation.type === 'group' ? `${activeConversation.participants.length} members` : 'Direct Message'}
                                        </p>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="flex flex-col gap-4">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender.id === currentUser.id ? 'justify-end' : ''}`}>
                                                {msg.sender.id !== currentUser.id && (
                                                     <Avatar className="h-8 w-8">
                                                        <AvatarImage src={msg.sender.avatar_url} alt={msg.sender.full_name} />
                                                        <AvatarFallback>{msg.sender.full_name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.sender.id === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    <p className="text-sm">{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${msg.sender.id === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                                <div className="border-t p-4">
                                    <form className="relative" onSubmit={handleSendMessage}>
                                        <Textarea
                                            placeholder="Type your message..."
                                            className="min-h-[48px] w-full rounded-2xl p-4 pr-16"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <Button type="button" size="icon" variant="ghost" disabled>
                                                <Paperclip className="h-5 w-5" />
                                                <span className="sr-only">Attach file</span>
                                            </Button>
                                            <Button type="submit" size="icon" variant="ghost">
                                                <Send className="h-5 w-5" />
                                                <span className="sr-only">Send</span>
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                                <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
                                <h3 className="text-2xl font-bold tracking-tight">No conversation selected</h3>
                                <p className="text-muted-foreground">Select a conversation or start a new one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function NewConversationDialog({ currentUser, onConversationCreated }: { currentUser: User, onConversationCreated: (id: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [recipients, setRecipients] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchUsers = async () => {
                const users = await getPotentialRecipients(currentUser);
                setRecipients(users);
            };
            fetchUsers();
        }
    }, [isOpen, currentUser]);

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        setIsLoading(true);
        const result = await createConversation(selectedUsers, selectedUsers.length > 1 ? groupName : undefined);
        if (result.error) {
            console.error(result.error);
        } else if (result.conversationId) {
            onConversationCreated(result.conversationId);
            setIsOpen(false);
            setSelectedUsers([]);
            setGroupName('');
        }
        setIsLoading(false);
    };

    const isGroup = selectedUsers.length > 1;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MessageSquarePlus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {isGroup && (
                        <Input 
                            placeholder="Group Name (optional)"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    )}
                    <p className="text-sm font-medium">Select Recipients:</p>
                    <ScrollArea className="h-64">
                       <div className="space-y-2">
                            {recipients.map(user => (
                                <div key={user.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox 
                                        id={`user-${user.id}`} 
                                        checked={selectedUsers.includes(user.id)}
                                        onCheckedChange={() => handleSelectUser(user.id)}
                                    />
                                    <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                                <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p>{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{user.role}</p>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                       </div>
                    </ScrollArea>
                    <Button onClick={handleCreate} disabled={selectedUsers.length === 0 || isLoading}>
                        {isLoading ? 'Creating...' : (isGroup ? 'Create Group' : 'Start Chat')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div>Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    )
}
