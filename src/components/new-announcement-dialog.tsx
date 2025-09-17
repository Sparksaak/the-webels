"use client";

import { useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement } from '@/app/announcements/actions';
import { PlusCircle } from 'lucide-react';

export function NewAnnouncementDialog() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        
        const result = await createAnnouncement(formData);

        if (result?.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Announcement created.",
            });
            setOpen(false);
            formRef.current?.reset();
        }
        setIsSubmitting(false);
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>
            Compose a new announcement for your students. It will be visible to everyone.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                        Title
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        className="col-span-3"
                        required
                    />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="content" className="text-right pt-2">
                        Content
                    </Label>
                    <Textarea
                        id="content"
                        name="content"
                        className="col-span-3"
                        rows={6}
                        required
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Announcement'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
