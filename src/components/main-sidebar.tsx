
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Shield,
  Trophy,
  PenSquare,
  Store,
  Ticket,
  Puzzle,
  BarChart,
  Settings,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';

// Mock user type, replace with your actual user type
type User = {
  id: string;
  role: 'admin' | 'editor' | 'user';
  avatarUrl?: string;
  name?: string;
};

interface MainSidebarProps {
  user?: User;
}

const menuItems = [
  { href: '/', icon: Home, label: 'INICIO', roles: ['user', 'editor', 'admin'] },
  { href: '/admin', icon: Shield, label: 'PANEL DE ADMIN', roles: ['editor', 'admin'] },
  { href: '/leagues', icon: Trophy, label: 'LIGAS EN CURSO', roles: ['user', 'editor', 'admin'] },
  { href: '/tournament', icon: PenSquare, label: 'INSCRIBIRME', roles: ['user', 'editor', 'admin'] },
  { href: '/tienda', icon: Store, label: 'TIENDA', roles: ['user', 'editor', 'admin'] },
  { href: '/onetrivia', icon: Puzzle, label: 'ONETRIVIA', roles: ['user', 'editor', 'admin'] },
  { href: '/collectible-cards', icon: Ticket, label: 'COLECCIONABLES', roles: ['user', 'editor', 'admin'] },
  { href: '/ranking', icon: BarChart, label: 'RANKEDS', roles: ['user', 'editor', 'admin'] },
];

export function MainSidebar({ user }: MainSidebarProps) {
  const userRole = user?.role || 'user';
  const isLoggedIn = !!user;

  return (
    <>
      <SidebarHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {isLoggedIn && user ? (
            <Link href={`/profile/${user.id}`} passHref>
              <Avatar className="h-24 w-24 border-2 border-primary cursor-pointer">
                <AvatarImage src={user.avatarUrl} alt="User Avatar" />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="h-24 w-24"></div> // Placeholder
          )}
           <Link href="/" passHref>
             <div className="cursor-pointer">
                <Image
                    src="https://i.postimg.cc/vTdS7yvR/logo-sadasfsaf.png"
                    width={150}
                    height={40}
                    alt="SUDONE Logo"
                    priority
                />
             </div>
           </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) =>
            item.roles.includes(userRole) ? (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton className='main-sidebar-button' asChild>
                    <>
                      <item.icon />
                      <span>{item.label}</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ) : null
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          {isLoggedIn && user && (
            <>
              <SidebarMenuItem>
                <Link href="/settings" passHref>
                  <SidebarMenuButton className='main-sidebar-button' asChild>
                    <>
                      <Settings />
                      <span>CONFIGURACIÓN</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href={`/profile/${user.id}`} passHref>
                  <SidebarMenuButton className='main-sidebar-button' asChild>
                    <>
                      <User />
                      <span>MI PERFIL</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/login" passHref>
                  <SidebarMenuButton className='main-sidebar-button' asChild>
                    <>
                      <LogOut />
                      <span>CERRAR SESIÓN</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </>
          )}
          {!isLoggedIn && (
            <SidebarMenuItem>
              <Link href="/login" passHref>
                <SidebarMenuButton className='main-sidebar-button' asChild>
                  <>
                    <LogIn />
                    <span>INICIAR SESIÓN</span>
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
