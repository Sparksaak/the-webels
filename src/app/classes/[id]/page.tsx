
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';

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
import type { User } from '@/lib/mock-data';


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

  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formattedDate = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  if (!currentUser) {
    return <div>Loading...</div>;
  }
  
  const classInfo = { id: params.id, name: "Intro to React", description: "A sample class description", teacherId: "teacher-id" };
  const teacher = { name: "Dr. Evelyn Reed", avatarUrl: "https://placehold.co/100x100.png" };


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
                {/* Mock data removed */}
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
                    {/* Mock data removed */}
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
                           {/* Mock data removed */}
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
                           {/* Mock data removed */}
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
                                  {/* Mock data removed */}
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
