
'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePassword } from '@/app/settings/actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
            </> : 'Update Password'}
        </Button>
    )
}

export function UpdatePasswordForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleFormSubmit = async (formData: FormData) => {
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        const result = await updatePassword(formData);
        if (result?.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Your password has been updated.",
            });
            formRef.current?.reset();
        }
    };
    
    return (
        <form ref={formRef} action={handleFormSubmit} className="space-y-6 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    )
}
