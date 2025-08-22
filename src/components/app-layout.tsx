
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Megaphone, MessageSquare } from 'lucide-react';
import {
  SidebarProvider,
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
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  userRole: 'teacher' | 'student';
}

export function AppLayout({ children, userRole }: AppLayoutProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ];
  
  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };
  
  if (!currentUser) {
      return (
          <div className="flex min-h-screen bg-background items-center justify-center">
              <div>Loading...</div>
          </div>
      )
  }

  return (
    <SidebarProvider>
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
                 <UserNav user={currentUser} />
                 <div className="flex flex-col text-sm">
                     <span className="font-semibold">{currentUser.name}</span>
                     <span className="text-muted-foreground capitalize">{currentUser.role}</span>
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
                <UserNav user={currentUser} />
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
