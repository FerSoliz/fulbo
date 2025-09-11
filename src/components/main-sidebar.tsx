
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
import { usePathname } from 'next/navigation';
import { AnimatedAvatar } from './ui/animated-avatar';

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
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <Link href={`/profile/${user.id}`} passHref>
              <AnimatedAvatar>
                <Avatar className="h-12 w-12 cursor-pointer">
                  <AvatarImage src={user.avatarUrl} alt="User Avatar" />
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </AnimatedAvatar>
            </Link>
          ) : (
            <div className="h-12 w-12"></div> 
          )}
           <Link href="/" passHref>
             <div className="cursor-pointer">
                <Image
                    src="https://i.postimg.cc/vTdS7yvR/logo-sadasfsaf.png"
                    width={114}
                    height={32}
                    alt="SUDONE Logo"
                    priority
                />
             </div>
           </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) =>
            item.roles.includes(userRole) ? (
              <li key={item.label}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton 
                    variant="ghost" 
                    className="w-full justify-start gap-2 main-sidebar-button" 
                    data-active={pathname === item.href}
                    asChild
                  >
                    <>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </li>
            ) : null
          )}
        </ul>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2 border-t">
        <ul className="flex flex-col gap-1">
          {isLoggedIn && user && (
            <>
              <li>
                <Link href="/settings" passHref>
                  <SidebarMenuButton variant="ghost" className="w-full justify-start gap-2 main-sidebar-button" data-active={pathname === '/settings'} asChild>
                    <>
                      <Settings className="size-4" />
                      <span>CONFIGURACIÓN</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </li>
              <li>
                <Link href={`/profile/${user.id}`} passHref>
                   <SidebarMenuButton variant="ghost" className="w-full justify-start gap-2 main-sidebar-button" data-active={pathname === `/profile/${user.id}`} asChild>
                    <>
                      <User className="size-4" />
                      <span>MI PERFIL</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </li>
              <li>
                <Link href="/login" passHref>
                  <SidebarMenuButton variant="ghost" className="w-full justify-start gap-2 main-sidebar-button" data-active={pathname === '/login'} asChild>
                    <>
                      <LogOut className="size-4" />
                      <span>CERRAR SESIÓN</span>
                    </>
                  </SidebarMenuButton>
                </Link>
              </li>
            </>
          )}
          {!isLoggedIn && (
            <li>
              <Link href="/login" passHref>
                <SidebarMenuButton variant="ghost" className="w-full justify-start gap-2 main-sidebar-button" data-active={pathname === '/login'} asChild>
                  <>
                    <LogIn className="size-4" />
                    <span>INICIAR SESIÓN</span>
                  </>
                </SidebarMenuButton>
              </Link>
            </li>
          )}
        </ul>
      </SidebarFooter>
    </>
  );
}
