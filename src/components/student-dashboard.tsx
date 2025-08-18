
import Link from 'next/link';
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
import { Button } from './ui/button';

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
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">classes enrolled</p>
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
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>A list of your upcoming assignments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <p>No upcoming assignments.</p>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Stay up to date with class news.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <p>No new announcements.</p>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
