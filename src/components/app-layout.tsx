

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, MessageSquare, BookOpen, FileText } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/assignments', label: 'Assignments', icon: FileText },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];
  
  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };
  
  if (!user) {
      return (
          <div className="flex min-h-screen bg-background items-center justify-center">
              <div>Loading...</div>
          </div>
      )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsible="icon" className="border-r border-border/20">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
              <Logo className="size-8" />
              <span className="font-bold text-lg">Classroom</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={`${item.href}`}>
                  <SidebarMenuButton 
                    isActive={isActive(item.href)}
                    tooltip={{children: item.label, side: "right"}}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-2 w-full p-2">
                <UserNav user={user} />
                <div className="flex flex-col text-sm">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-muted-foreground capitalize">{user.role}</span>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col w-full">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
              <div className="md:hidden">
                  <SidebarTrigger />
              </div>
              <UserNav user={user} />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-full p-4 sm:p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
