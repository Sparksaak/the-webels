
'use client';

import { useState, useTransition, useRef } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
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
import { deleteAccount } from '@/app/settings/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';

export function DeleteAccountButton() {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (formRef.current) {
            const formData = new FormData(formRef.current);
            startTransition(async () => {
                const result = await deleteAccount(formData);
                if (result?.error) {
                    toast({
                        title: "Error Deleting Account",
                        description: result.error,
                        variant: "destructive",
                    });
                } else {
                    setOpen(false);
                }
            });
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <form ref={formRef}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove your data from our servers. To confirm, please enter your password.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="password-confirm">Password</Label>
                        <Input
                            id="password-confirm"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            disabled={isPending}
                            className={buttonVariants({ variant: "destructive" })}
                            asChild
                        >
                           <Button type="submit" form="delete-account-form">
                             {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? 'Deleting...' : 'Yes, delete my account'}
                           </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
