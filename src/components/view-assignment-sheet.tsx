
"use client";

import { useState, useRef, useEffect } from 'react';
import { format, formatDistanceToNow, isAfter, differenceInDays, setHours, setMinutes, parseISO, differenceInHours } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { submitAssignment, gradeSubmission, updateAssignment, deleteSubmission } from '@/app/assignments/actions';
import type { Assignment, AssignmentSubmission } from "@/app/assignments/actions";
import type { AppUser } from "@/app/messages/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { ChevronsUpDown, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { ClientOnly } from './client-only';


interface ViewAssignmentSheetProps {
  assignment: Assignment;
  user: AppUser;
  children: React.ReactNode;
}

export function ViewAssignmentSheet({ assignment, user, children }: ViewAssignmentSheetProps) {
    const [open, setOpen] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState(assignment);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setCurrentAssignment(assignment);
    }, [assignment]);

    const isTeacherOwner = user.role === 'teacher' && user.id === currentAssignment.teacher.id;

    return (
        <Sheet open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setIsEditing(false); // Reset edit state on close
        }}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col">
                {isEditing && isTeacherOwner ? (
                    <EditAssignmentForm 
                        assignment={currentAssignment} 
                        onCancel={() => setIsEditing(false)}
                        onSaved={() => {
                            setIsEditing(false);
                            // We don't need to manually refetch, revalidation will handle it
                        }}
                    />
                ) : (
                    <>
                        <SheetHeader className="pr-12">
                            <div className="flex justify-between items-start">
                                <div>
                                    <SheetTitle className="text-2xl">{currentAssignment.title}</SheetTitle>
                                    <SheetDescription className="mt-2">
                                        <ClientOnly>
                                            Due: {currentAssignment.dueDate ? format(new Date(currentAssignment.dueDate), 'PPP p zzz') : 'No due date'}
                                        </ClientOnly>
                                        <span className="mx-2">•</span>
                                        Posted by {currentAssignment.teacher.name}
                                    </SheetDescription>
                                </div>
                                {isTeacherOwner && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </SheetHeader>
                        <Separator className="my-4" />
                        <ScrollArea className="flex-1 pr-6 -mr-6">
                            <p className="text-muted-foreground whitespace-pre-wrap">{currentAssignment.description || 'No description provided.'}</p>
                            
                            <Separator className="my-6" />

                            {user.role === 'student' ? (
                                <StudentSubmissionView assignment={currentAssignment} user={user} onSubmitted={() => setOpen(false)} />
                            ) : (
                                <TeacherSubmissionsView assignment={currentAssignment} />
                            )}
                        </ScrollArea>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

function EditAssignmentForm({ assignment, onCancel, onSaved }: { assignment: Assignment, onCancel: () => void, onSaved: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dueDate, setDueDate] = useState<Date | undefined>(
        assignment.dueDate ? new Date(assignment.dueDate) : undefined
    );
    const [dueTime, setDueTime] = useState(
        assignment.dueDate ? format(new Date(assignment.dueDate), 'HH:mm') : '23:59'
    );

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        formData.append('assignmentId', assignment.id);
        if (dueDate) {
            const [hours, minutes] = dueTime.split(':').map(Number);
            const combinedDate = setMinutes(setHours(dueDate, hours), minutes);
            formData.append('dueDate', combinedDate.toISOString());
        }

        const result = await updateAssignment(formData);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Assignment updated successfully." });
            onSaved();
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader>
                <SheetTitle>Edit Assignment</SheetTitle>
                <SheetDescription>Update the assignment details below.</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-4">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={assignment.title} required />
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={assignment.description || ''} rows={8} />
                </div>
                <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                     <div className="grid grid-cols-2 gap-2">
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
            <SheetFooter>
                <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </SheetFooter>
        </form>
    );
}

function StudentSubmissionView({ assignment, user, onSubmitted }: { assignment: Assignment, user: AppUser, onSubmitted: () => void }) {
    const mySubmission = assignment.submissions.find(s => s.student_id === user.id);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        formData.append('assignmentId', assignment.id);
        
        const result = await submitAssignment(formData);

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Assignment submitted successfully!" });
            onSubmitted();
        }
        setIsSubmitting(false);
    };
    
    const handleUnsubmit = async () => {
        if (!mySubmission) return;

        const result = await deleteSubmission(mySubmission.id);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Your submission has been withdrawn." });
            onSubmitted(); // Close the sheet or trigger a refresh
        }
    };

    const getSubmissionStatus = () => {
        if (!mySubmission || !assignment.dueDate) {
            return null;
        }
        const dueDate = new Date(assignment.dueDate);
        const submittedAt = new Date(mySubmission.submitted_at);
        const wasLate = isAfter(submittedAt, dueDate);
        
        if (wasLate) {
            const hoursLate = differenceInHours(submittedAt, dueDate);
            if (hoursLate < 24) {
                 const lateLabel = hoursLate < 1 ? 'Late' : hoursLate === 1 ? '1 hour late' : `${hoursLate} hours late`;
                 return <Badge variant="destructive">{lateLabel}</Badge>;
            }
            const daysLate = differenceInDays(submittedAt, dueDate);
            const lateLabel = daysLate === 1 ? '1 day late' : `${daysLate} days late`;
            return <Badge variant="destructive">{lateLabel}</Badge>;
        } else {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">On Time</Badge>;
        }
    };


    if (mySubmission) {
        return (
            <div>
                <h3 className="text-lg font-semibold mb-4">Your Submission</h3>
                <div className="rounded-md border bg-card p-4 space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={mySubmission.grade ? "default" : "secondary"}>
                                {mySubmission.grade ? 'Graded' : 'Submitted'}
                            </Badge>
                             <ClientOnly>{getSubmissionStatus()}</ClientOnly>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            <ClientOnly>Submitted on {format(new Date(mySubmission.submitted_at), 'PPP p zzz')}</ClientOnly>
                        </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{mySubmission.submission_content}</p>
                    
                    {mySubmission.grade && (
                         <div className="pt-4 border-t">
                            <h4 className="font-semibold text-sm">Grade: {mySubmission.grade}</h4>
                            {mySubmission.feedback && (
                                <>
                                    <h4 className="font-semibold text-sm mt-2">Feedback:</h4>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{mySubmission.feedback}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
                 {!mySubmission.grade && (
                     <div className="mt-4 flex flex-col items-center">
                        <Collapsible open={isResubmitting} onOpenChange={setIsResubmitting}>
                            <CollapsibleTrigger asChild>
                                    <Button variant="link">
                                        <ChevronsUpDown className="h-4 w-4 mr-2" />
                                        {isResubmitting ? 'Cancel' : 'Resubmit Assignment'}
                                    </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <p className="text-xs text-center text-muted-foreground mb-4">You can edit your submission until it has been graded.</p>
                                <form ref={formRef} onSubmit={handleSubmit}>
                                    <Textarea
                                        name="submissionContent"
                                        rows={8}
                                        defaultValue={mySubmission.submission_content}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Resubmitting...' : 'Resubmit Assignment'}
                                        </Button>
                                    </div>
                                </form>
                            </CollapsibleContent>
                        </Collapsible>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="link" className="text-destructive text-xs h-auto p-0">
                                    Unsubmit Assignment
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to unsubmit?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Your current submission will be permanently deleted. You can submit again before the due date.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUnsubmit} className={buttonVariants({ variant: "destructive" })}>
                                    Yes, Unsubmit
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Submit Your Work</h3>
            <form ref={formRef} onSubmit={handleSubmit}>
                <Textarea
                    name="submissionContent"
                    rows={8}
                    placeholder="Type your submission here..."
                    required
                    disabled={isSubmitting}
                />
                <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function TeacherSubmissionsView({ assignment }: { assignment: Assignment }) {
    if (assignment.submissions.length === 0) {
        return <div className="text-center py-12 text-muted-foreground">No submissions yet.</div>;
    }
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Submissions ({assignment.submissions.length})</h3>
            <div className="space-y-6">
                {assignment.submissions.map(sub => <SubmissionCard key={sub.id} submission={sub} assignment={assignment} />)}
            </div>
        </div>
    );
}

function SubmissionCard({ submission, assignment }: { submission: AssignmentSubmission; assignment: Assignment }) {
    const { toast } = useToast();
    const [isGrading, setIsGrading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [currentGrade, setCurrentGrade] = useState(submission.grade);

    const handleGradeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsGrading(true);
        const formData = new FormData(event.currentTarget);
        formData.append('submissionId', submission.id);

        const result = await gradeSubmission(formData);
        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Grade saved." });
            setCurrentGrade(formData.get('grade') as string);
        }
        setIsGrading(false);
    }

    const getSubmissionStatus = () => {
        if (!assignment.dueDate) {
            return <Badge variant="secondary">On Time</Badge>;
        }
        const dueDate = new Date(assignment.dueDate);
        const submittedAt = new Date(submission.submitted_at);
        const wasLate = isAfter(submittedAt, dueDate);
        
        if (wasLate) {
            const hoursLate = differenceInHours(submittedAt, dueDate);
            if (hoursLate < 24) {
                 const lateLabel = hoursLate < 1 ? 'Late' : hoursLate === 1 ? '1 hour late' : `${hoursLate} hours late`;
                 return <Badge variant="destructive">{lateLabel}</Badge>;
            }
            const daysLate = differenceInDays(submittedAt, dueDate);
            const lateLabel = daysLate === 1 ? '1 day late' : `${daysLate} days late`;
            return <Badge variant="destructive">{lateLabel}</Badge>;
        } else {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">On Time</Badge>;
        }
    };

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9" data-ai-hint="person portrait">
                         <AvatarImage src={`https://placehold.co/100x100.png`} alt={submission.student_name} />
                         <AvatarFallback>{submission.student_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{submission.student_name}</p>
                        <p className="text-sm text-muted-foreground">{submission.student_email}</p>
                    </div>
                </div>
                 <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                        <ClientOnly>{format(new Date(submission.submitted_at), 'MMM d, yyyy @ h:mm a zzz')}</ClientOnly>
                    </p>
                    <div className="mt-1">
                        <ClientOnly>{getSubmissionStatus()}</ClientOnly>
                    </div>
                </div>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">{submission.submission_content}</p>

            <form ref={formRef} onSubmit={handleGradeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div className="md:col-span-1">
                        <Label htmlFor={`grade-${submission.id}`}>Grade</Label>
                        <Input 
                            id={`grade-${submission.id}`} 
                            name="grade" 
                            defaultValue={submission.grade || ''} 
                            placeholder="e.g., A+"
                            required 
                        />
                    </div>
                    <div className="md:col-span-3">
                         <Label htmlFor={`feedback-${submission.id}`}>Feedback</Label>
                        <Textarea 
                            id={`feedback-${submission.id}`} 
                            name="feedback" 
                            defaultValue={submission.feedback || ''}
                            placeholder="Provide constructive feedback..."
                            rows={3} 
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isGrading}>
                        {isGrading ? 'Saving...' : (currentGrade ? 'Update Grade' : 'Save Grade')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
