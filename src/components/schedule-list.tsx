
'use client';

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
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteClassSchedule, type ClassSchedule } from "@/app/schedule/actions";
import { AppUser } from "@/app/messages/types";
import { Edit, Trash2 } from "lucide-react";
import { NewScheduleDialog } from "./new-schedule-dialog";

const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

function formatTime(timeString: string) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes} ${ampm}`;
}

interface ScheduleListProps {
    schedules: ClassSchedule[];
    user: AppUser;
    classType: 'online' | 'in-person';
}

export function ScheduleList({ schedules, user, classType }: ScheduleListProps) {

    if (schedules.length === 0) {
        return (
             <div className="text-center text-muted-foreground py-12">
                <p>No classes scheduled for the {classType} track.</p>
                 {user.role === 'teacher' && <p className="text-sm mt-1">Click "New Class Schedule" to add one.</p>}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {schedules.map(schedule => (
                <div key={schedule.id} className="p-4 rounded-lg border bg-card/50 flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{schedule.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {weekDays.find(d => d.value === schedule.day_of_week)?.label} from {formatTime(schedule.start_time)} to {formatTime(schedule.end_time)}
                        </p>
                        {schedule.description && <p className="text-xs text-muted-foreground mt-1">{schedule.description}</p>}
                    </div>

                    {user.role === 'teacher' && (
                        <div className="flex items-center">
                            <NewScheduleDialog schedule={schedule}>
                                 <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </NewScheduleDialog>
                           
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this class schedule.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <form action={deleteClassSchedule.bind(null, schedule.id)}>
                                            <AlertDialogAction asChild>
                                            <Button type="submit" variant="destructive">Delete</Button>
                                            </AlertDialogAction>
                                        </form>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
