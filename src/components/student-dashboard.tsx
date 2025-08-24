
"use client";

import {
  FileText,
  Megaphone,
  MessageSquare,
  Users,
  Clock
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AppUser } from '@/app/messages/types';

interface StudentDashboardProps {
    user: AppUser;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'teacher')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching teacher:', error);
      } else {
        setTeacher(data);
      }
      setLoading(false);
    };

    fetchTeacher();
  }, []);
  
  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">class enrolled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
               <p className="text-xs text-muted-foreground">assignments upcoming</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Announcements</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
               <p className="text-xs text-muted-foreground">new announcements</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
               <p className="text-xs text-muted-foreground">messages from teachers</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Teacher</CardTitle>
              <CardDescription>Your primary instructor for your class.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>Loading teacher information...</p>
                  </div>
                ) : teacher ? (
                  <div className="flex items-center gap-4 pt-4">
                    <Avatar className="h-12 w-12" data-ai-hint="person portrait">
                        <AvatarImage src={`https://placehold.co/100x100.png`} alt={teacher.full_name} />
                        <AvatarFallback>{teacher.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-lg">{teacher.full_name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>Your teacher has not been assigned yet.</p>
                    </div>
                )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>Your upcoming class time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-muted-foreground pt-4">
                <Clock className="h-8 w-8" />
                <div className="text-center ">
                    <p className="font-semibold text-foreground">Monday, 10:00 AM</p>
                    <p className="text-sm">Next class starts soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
