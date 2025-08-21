
"use client";

import {
  Users,
  FileText,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from './ui/scroll-area';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
}

interface Student {
    id: string;
    full_name: string;
    email: string;
    learning_preference: 'online' | 'in-person';
}

interface TeacherDashboardProps {
    user: User;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        const fetchStudents = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('users_with_roles')
                .select('id, full_name, email, learning_preference')
                .eq('role', 'student');

            if (error) {
                console.error("Error fetching students:", error);
            } else {
                setStudents(data as Student[]);
            }
        };
        fetchStudents();
    }, []);

  const onlineStudents = students.filter(s => s.learning_preference === 'online');
  const inPersonStudents = students.filter(s => s.learning_preference === 'in-person');
  const totalStudents = students.length;

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                 <p className="text-xs text-muted-foreground">in online & in-person classes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">assignments graded</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">announcements posted</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">0</div>
                 <p className="text-xs text-muted-foreground">messages from students</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>An overview of all your students, organized by class type.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="online">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="online">Online Students ({onlineStudents.length})</TabsTrigger>
                        <TabsTrigger value="in-person">In-Person Students ({inPersonStudents.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="online">
                        <StudentList students={onlineStudents} />
                    </TabsContent>
                    <TabsContent value="in-person">
                        <StudentList students={inPersonStudents} />
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
    </div>
  )
}

function StudentList({ students }: { students: Student[] }) {
    if (students.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>No students in this section.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-72">
            <div className="space-y-4 pr-4">
                {students.map(student => (
                    <div key={student.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                        <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                            <AvatarImage src={`https://placehold.co/100x100.png`} alt={student.full_name} />
                            <AvatarFallback>{student.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

