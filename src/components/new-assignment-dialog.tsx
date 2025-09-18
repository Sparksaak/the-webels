
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
import { createAssignment } from '@/app/assignments/actions';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

export function NewAssignmentDialog() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [dueTime, setDueTime] = useState('23:59');
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleFormSubmit = async (formData: FormData) => {
        setIsSubmitting(true);

        if (dueDate) {
            const [hours, minutes] = dueTime.split(':').map(Number);
            const combinedDate = setMinutes(setHours(dueDate, hours), minutes);
            formData.append('dueDate', combinedDate.toISOString());
        }
        
        const result = await createAssignment(formData);

        if (result?.error) {
            toast({
                title: "Error creating assignment",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Assignment created successfully.",
            });
            setOpen(false);
            formRef.current?.reset();
            setDueDate(undefined);
            setDueTime('23:59');
        }
        setIsSubmitting(false);
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Fill out the details below to create a new assignment for your students.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                        Title
                    </Label>
                    <Input id="title" name="title" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                        Description
                    </Label>
                    <Textarea id="description" name="description" className="col-span-3" rows={6} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dueDate" className="text-right">
                        Due Date
                    </Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "justify-start text-left font-normal",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Input 
                            type="time" 
                            value={dueTime}
                            onChange={(e) => setDueTime(e.target.value)}
                            disabled={!dueDate}
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
