
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

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
}

interface StudentDashboardProps {
    user: AppUser;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  
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
                
                    <div className="text-center text-muted-foreground py-12">
                        <p>Your teacher has not been assigned yet.</p>
                    </div>
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
