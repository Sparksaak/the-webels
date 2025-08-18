
"use client";

import { Suspense, useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/mock-data';
import { Paperclip, Send } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

function MessagesContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const role = user.user_metadata.role || 'student';
            const fetchedUser: User = {
                id: user.id,
                name: user.user_metadata.full_name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`
            };
            setCurrentUser(fetchedUser);
        }
    };
    fetchUser();
  }, []);

  
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);


    if (!currentUser) {
        return <div>Loading...</div>;
    }

  return (
    <AppLayout userRole={currentUser.role}>
      <div className="h-[calc(100vh-5rem)]">
        <div className="grid h-full grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex flex-col border-r">
            <div className="p-4">
              <h2 className="text-xl font-bold">Conversations</h2>
              <Input placeholder="Search messages..." className="mt-2" />
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 p-2">
                {/* Mock data removed */}
              </div>
            </ScrollArea>
          </div>
          <div className="flex flex-col md:col-span-2 lg:col-span-3">
            {selectedConversation ? (
              <>
                <div className="flex items-center gap-4 border-b p-4">
                  <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                    <AvatarImage src={selectedConversation.avatarUrl} alt={selectedConversation.name} />
                    <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{selectedConversation.role}</p>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="flex flex-col gap-4">
                    {/* Mock data removed */}
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <form className="relative">
                    <Textarea
                      placeholder="Type your message..."
                      className="min-h-[48px] w-full rounded-2xl p-4 pr-16"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" size="icon" variant="ghost">
                                        <Paperclip className="h-5 w-5" />
                                        <span className="sr-only">Attach file</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Attach file</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="submit" size="icon" variant="ghost">
                                        <Send className="h-5 w-5" />
                                        <span className="sr-only">Send</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <h3 className="text-2xl font-bold tracking-tight">No conversation selected</h3>
                <p className="text-muted-foreground">Select a conversation to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div>Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    )
}
