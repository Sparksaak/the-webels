
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, MessageSquare, BookOpen, FileText, CalendarClock } from 'lucide-react';
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
import { LoadingLink } from './loading-link';

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

function NavItems({ role }: { role: 'teacher' | 'student' }) {
    const pathname = usePathname();
    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/announcements', label: 'Announcements', icon: Megaphone },
        { href: '/assignments', label: 'Assignments', icon: FileText },
        { href: '/materials', label: 'Materials', icon: BookOpen },
        ...(role === 'teacher' ? [{ href: '/schedule', label: 'Schedule', icon: CalendarClock }] : []),
        { href: '/messages', label: 'Messages', icon: MessageSquare },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <LoadingLink href={`${item.href}`} className='w-full'>
                  <SidebarMenuButton 
                    isActive={isActive(item.href)}
                    tooltip={{children: item.label, side: "right"}}
                    size="lg"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </LoadingLink>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}

export function AppLayout({ children, user }: AppLayoutProps) {
  if (!user) {
      return (
          <div className="flex min-h-screen bg-background items-center justify-center">
              <div>Loading...</div>
          </div>
      )
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon" className="border-r border-border/20">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
              <Logo className="size-8" />
              <span className="font-bold text-lg hidden sm:inline">The Webels</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
            <NavItems role={user.role} />
        </SidebarContent>
        <SidebarFooter className="p-2">
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
          <header className="sticky top-0 z-10 flex h-14 items-center justify-start gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
              <div className="md:hidden">
                  <SidebarTrigger />
              </div>
          </header>
          <div className="flex-1 w-full overflow-y-auto">
            <main className="p-4 sm:px-6 lg:px-8 h-full">
              {children}
            </main>
          </div>
      </SidebarInset>
    </div>
  );
}
