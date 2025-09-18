
'use client';

import { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, type Profile } from '@/app/settings/actions';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
            </> : 'Save Changes'}
        </Button>
    )
}

export function ProfileForm({ profile }: { profile: Profile }) {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleFormSubmit = async (formData: FormData) => {
        const result = await updateProfile(formData);
        if (result?.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Your profile has been updated.",
            });
        }
    };
    
    return (
        <form ref={formRef} action={handleFormSubmit} className="space-y-6 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} disabled />
                 <p className="text-xs text-muted-foreground">You cannot change your email address.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
            </div>

            {profile.role === 'student' && (
                 <div className="space-y-2">
                    <Label htmlFor="learningPreference">Learning Preference</Label>
                    <Select name="learningPreference" defaultValue={profile.learning_preference}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select your preference" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    )
}
