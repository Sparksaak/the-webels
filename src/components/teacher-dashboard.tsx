
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
import Link from 'next/link';
import { Button } from './ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
}

interface TeacherDashboardProps {
    user: User;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  // In the future, we would fetch these counts from the database.
  const totalClasses = 0;
  const totalStudents = 0;

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{totalClasses}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">0</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">0</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>An overview of all your classes.</CardDescription>
              </div>
              <Button asChild>
                <Link href="/classes/create">Create Class</Link>
              </Button>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-12">
                    <p>You haven't created any classes yet.</p>
                    <Button asChild variant="link">
                        <Link href="/classes/create">Create your first class</Link>
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
