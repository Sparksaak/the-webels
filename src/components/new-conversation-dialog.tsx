
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
 
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createConversation, getUsers } from '@/app/messages/actions';
import { AppUser } from '@/app/messages/types';
import { useToast } from '@/hooks/use-toast';

interface NewConversationDialogProps {
  currentUser: AppUser;
  onConversationCreated: (conversationId: string) => void;
  children?: React.ReactNode;
}

export function NewConversationDialog({ currentUser, onConversationCreated, children }: NewConversationDialogProps) {
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [users, setUsers] = useState<{ id: string; full_name: string | null; role: 'teacher' | 'student' }[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            getUsers().then(setUsers);
        }
    }, [open]);

    const handleCreateConversation = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        selectedUsers.forEach(id => formData.append('participants', id));
        if (selectedUsers.length > 1 && groupName) {
            formData.append('name', groupName);
        }

        const result = await createConversation(formData);

        if (result?.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        } else if (result?.success && result.conversationId) {
            toast({
                title: "Success",
                description: "Conversation created.",
            });
            onConversationCreated(result.conversationId);
            setOpen(false);
            setSelectedUsers([]);
            setGroupName('');
        }
    }

    const getDisplayName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return "Unknown User";
        const role = user.role === 'teacher' ? ' (Teacher)' : '';
        return `${user.full_name}${role}`;
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
            <Button size="icon" variant="ghost">
                <UserPlus className="h-5 w-5" />
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select one or more people to start a conversation. Add a group name for group chats.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateConversation}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="participants" className="text-right">
                        To:
                    </Label>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={popoverOpen}
                                className="col-span-3 justify-between h-auto"
                            >
                                <div className="flex flex-wrap gap-1">
                                    {selectedUsers.length > 0
                                        ? selectedUsers.map(id => (
                                            <span key={id} className="bg-muted text-foreground rounded-md px-2 py-1 text-xs">
                                                {getDisplayName(id)}
                                            </span>
                                        ))
                                        : "Select users..."}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search users..." />
                                <CommandList>
                                <CommandEmpty>No users found.</CommandEmpty>
                                <CommandGroup>
                                    {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.full_name || user.id}
                                        onSelect={() => {
                                            setSelectedUsers(current => 
                                                current.includes(user.id)
                                                    ? current.filter(id => id !== user.id)
                                                    : [...current, user.id]
                                            );
                                            setPopoverOpen(true);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedUsers.includes(user.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {getDisplayName(user.id)}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                {selectedUsers.length > 1 && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Group Name
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="col-span-3"
                            placeholder="Optional"
                        />
                    </div>
                )}
            </div>
            <DialogFooter>
            <Button type="submit">Start Conversation</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
