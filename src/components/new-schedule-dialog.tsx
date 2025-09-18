
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
import { createClassSchedule, updateClassSchedule } from '@/app/schedule/actions';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { type ClassSchedule } from '@/app/schedule/actions';

interface NewScheduleDialogProps {
    schedule?: ClassSchedule;
    children?: React.ReactNode;
}

const weekDays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
];

export function NewScheduleDialog({ schedule, children }: NewScheduleDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const isEditMode = !!schedule;

    const handleFormSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        
        const action = isEditMode ? updateClassSchedule : createClassSchedule;
        if (isEditMode) {
            formData.append('id', schedule.id);
        }

        const result = await action(formData);

        if (result?.error) {
            toast({
                title: `Error ${isEditMode ? 'updating' : 'creating'} schedule`,
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: `Schedule ${isEditMode ? 'updated' : 'created'}.`,
            });
            setOpen(false);
        }
        setIsSubmitting(false);
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Class Schedule
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Create New'} Class Schedule</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this class session.' : 'Set up a new recurring class session.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                        Title
                    </Label>
                    <Input
                        id="title"
                        name="title"
                        defaultValue={schedule?.title}
                        className="col-span-3"
                        required
                    />
                </div>

                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class_type" className="text-right">
                        Class Type
                    </Label>
                    <Select name="class_type" required defaultValue={schedule?.class_type}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select class type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="in-person">In-Person</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="day_of_week" className="text-right">
                        Day
                    </Label>
                    <Select name="day_of_week" required defaultValue={schedule?.day_of_week?.toString()}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                            {weekDays.map(day => (
                                <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Time</Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                        <Input
                            id="start_time"
                            name="start_time"
                            type="time"
                            defaultValue={schedule?.start_time}
                            required
                        />
                         <Input
                            id="end_time"
                            name="end_time"
                            type="time"
                            defaultValue={schedule?.end_time}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        defaultValue={schedule?.description || ''}
                        className="col-span-3"
                        rows={3}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Schedule')}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
