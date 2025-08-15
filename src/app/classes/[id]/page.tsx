
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import {
  announcements,
  assignments,
  attendance,
  classes,
  enrollments,
  submissions,
  users,
  type User,
} from '@/lib/mock-data';
import {
  ArrowLeft,
  Bell,
  BookMarked,
  Calendar as CalendarIcon,
  PlusCircle,
  Users as UsersIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


function ClassPageContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const userRole = searchParams.get('role') === 'student' ? 'student' : 'teacher';
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const role = user.user_metadata.role || 'student';
            const fetchedUser: User = {
                id: user.id,
                name: user.user_metadata.full_name,
                email: user.email!,
                role: role,
                avatarUrl: `https://placehold.co/100x100.png`
            };
            setCurrentUser(fetchedUser);
        }
    };
    fetchUser();
  }, []);

  
  const classInfo = classes.find((c) => c.id === params.id);
  const classAnnouncements = announcements.filter((a) => a.classId === params.id);
  const classAssignments = assignments.filter((a) => a.classId === params.id);
  const classEnrollments = enrollments.filter((e) => e.classId === params.id);
  const classStudents = users.filter((u) => classEnrollments.some((e) => e.userId === u.id));
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const studentAttendance = currentUser ? attendance.filter(a => a.studentId === currentUser.id && a.classId === params.id) : [];

  if (!classInfo || !currentUser) {
    return <div>Loading...</div>;
  }

  const teacher = users.find((u) => u.id === classInfo.teacherId);

  return (
    <AppLayout userRole={currentUser.role}>
      <div className="flex flex-col gap-6">
        <div>
          <Button variant="ghost" asChild className='mb-2'>
              <Link href={`/dashboard?role=${currentUser.role}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
          </Button>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{classInfo.name}</h1>
              <p className="text-muted-foreground">{classInfo.description}</p>
            </div>
            <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                    <AvatarImage src={teacher?.avatarUrl} />
                    <AvatarFallback>{teacher?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{teacher?.name}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="announcements">
          <div className="flex justify-between items-end">
            <TabsList>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              {currentUser.role === 'teacher' && (
                <>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </>
              )}
               {currentUser.role === 'student' && (
                  <TabsTrigger value="attendance">My Attendance</TabsTrigger>
              )}
            </TabsList>
            {currentUser.role === 'teacher' && (
              <div className="space-x-2">
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> New Assignment</Button>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Post Announcement</Button>
              </div>
            )}
          </div>
          <TabsContent value="announcements" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Class Announcements</CardTitle>
                <CardDescription>Updates and important information from your teacher.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {classAnnouncements.map((ann) => (
                  <div key={ann.id} className="flex items-start space-x-4 rounded-md border p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground mt-1">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{ann.title}</p>
                      <p className="text-sm text-muted-foreground">{ann.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(ann.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assignments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignments & Homework</CardTitle>
                <CardDescription>All your assigned tasks and their due dates.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Due Date</TableHead>
                      {currentUser.role === 'student' && <TableHead>Status</TableHead>}
                      {currentUser.role === 'student' && <TableHead>Grade</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classAssignments.map((assign) => {
                      const submission = submissions.find(s => s.assignmentId === assign.id && s.studentId === currentUser!.id);
                      return (
                        <TableRow key={assign.id}>
                          <TableCell><Badge variant={assign.type === 'homework' ? 'secondary' : 'default'} className="capitalize">{assign.type}</Badge></TableCell>
                          <TableCell className="font-medium">{assign.title}</TableCell>
                          <TableCell>{new Date(assign.dueDate).toLocaleDateString()}</TableCell>
                          {currentUser.role === 'student' && (
                            <TableCell><Badge variant={submission?.status === 'submitted' ? 'success' : 'outline'} className="capitalize">{submission?.status || 'Pending'}</Badge></TableCell>
                          )}
                          {currentUser.role === 'student' && (
                            <TableCell>{submission?.grade || 'N/A'}</TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          {currentUser.role === 'teacher' && (
            <>
              <TabsContent value="students" className="mt-4">
                <Card>
                  <CardHeader><CardTitle>Enrolled Students</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {classStudents.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Avatar className="h-6 w-6" data-ai-hint="person portrait"><AvatarImage src={student.avatarUrl} /><AvatarFallback>{student.name.charAt(0)}</AvatarFallback></Avatar>
                                        {student.name}
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="attendance" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Take Attendance</CardTitle>
                    <CardDescription>Mark student attendance for the selected date.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[280px] justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    <Table>
                        <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Present</TableHead><TableHead>Late</TableHead><TableHead>Absent</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {classStudents.map(student => {
                                const attendanceRecord = attendance.find(a => a.studentId === student.id && a.date === formattedDate);
                                return (
                                <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell><Checkbox checked={attendanceRecord?.status === 'present'} /></TableCell>
                                    <TableCell><Checkbox checked={attendanceRecord?.status === 'late'} /></TableCell>
                                    <TableCell><Checkbox checked={attendanceRecord?.status === 'absent'} /></TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
          {currentUser.role === 'student' && (
              <TabsContent value="attendance" className="mt-4">
                  <Card>
                      <CardHeader><CardTitle>My Attendance</CardTitle></CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {studentAttendance.map(att => (
                                      <TableRow key={att.date}>
                                          <TableCell>{format(new Date(att.date), "PPP")}</TableCell>
                                          <TableCell><Badge className="capitalize">{att.status}</Badge></TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </CardContent>
                  </Card>
              </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}


export default function ClassPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading class...</div>}>
      <ClassPageContent params={params} />
    </Suspense>
  )
}
