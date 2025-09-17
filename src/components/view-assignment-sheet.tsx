
"use client";

import { useState, useRef, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
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
import { submitAssignment, gradeSubmission } from '@/app/assignments/actions';
import type { Assignment, AssignmentSubmission } from "@/app/assignments/actions";
import type { AppUser } from "@/app/messages/types";

interface ViewAssignmentSheetProps {
  assignment: Assignment;
  user: AppUser;
  children: React.ReactNode;
}

export function ViewAssignmentSheet({ assignment, user, children }: ViewAssignmentSheetProps) {
    const [open, setOpen] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState(assignment);

    // This allows the sheet to reflect changes (like a new submission or grade)
    // without having to close and reopen it.
    useEffect(() => {
        setCurrentAssignment(assignment);
    }, [assignment]);

    const handleSubmissionOrGradeChange = (updatedAssignment: Assignment) => {
        setCurrentAssignment(updatedAssignment);
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col">
                <SheetHeader className="pr-12">
                    <SheetTitle className="text-2xl">{currentAssignment.title}</SheetTitle>
                    <SheetDescription>
                        Due: {currentAssignment.dueDate ? format(new Date(currentAssignment.dueDate), 'PPP') : 'No due date'}
                        <span className="mx-2">•</span>
                        Posted by {currentAssignment.teacher.name}
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4" />
                <ScrollArea className="flex-1 pr-6 -mr-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap">{currentAssignment.description}</p>
                    </div>

                    <Separator className="my-6" />

                    {user.role === 'student' ? (
                        <StudentSubmissionView assignment={currentAssignment} user={user} onSubmitted={() => setOpen(false)} />
                    ) : (
                        <TeacherSubmissionsView assignment={currentAssignment} />
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}


function StudentSubmissionView({ assignment, user, onSubmitted }: { assignment: Assignment, user: AppUser, onSubmitted: () => void }) {
    const mySubmission = assignment.submissions.find(s => s.student_id === user.id);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (mySubmission) {
        return (
            <div>
                <h3 className="text-lg font-semibold mb-4">Your Submission</h3>
                <div className="rounded-md border bg-muted p-4 space-y-4">
                    <div className="flex justify-between items-center">
                         <Badge variant={mySubmission.grade ? "default" : "secondary"}>
                            {mySubmission.grade ? 'Graded' : 'Submitted'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            Submitted on {format(new Date(mySubmission.submitted_at), 'PPP p')}
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
                    <p className="text-xs text-center text-muted-foreground mt-4">You can resubmit your work until it is graded.</p>
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
                {assignment.submissions.map(sub => <SubmissionCard key={sub.id} submission={sub} />)}
            </div>
        </div>
    );
}

function SubmissionCard({ submission }: { submission: AssignmentSubmission }) {
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
                 <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                </p>
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

// Helper to add cn to globals.css
import { cn } from '@/lib/utils';
