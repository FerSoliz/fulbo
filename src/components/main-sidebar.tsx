'use client';

import {
  Bell,
  BookCopy,
  Cog,
  Home,
  LogOut,
  ShieldCheck,
  Store,
  Swords,
  Ticket,
  Trophy,
  User,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from "react";

interface MainSidebarProps {
  user: {
    id: string;
    role: 'admin' | 'user';
    avatarUrl: string;
  };
}

const menuItems = [
    { href: '/', icon: Home, label: 'INICIO' },
    { href: '/admin', icon: ShieldCheck, label: 'PANEL DE ADMIN', adminOnly: true },
    { href: '/leagues', icon: Trophy, label: 'LIGAS EN CURSO' },
    { href: '/subscribe', icon: Ticket, label: 'INSCRIBIRME' },
    { href: '/store', icon: Store, label: 'TIENDA' },
    { href: '/onetrivia', icon: BookCopy, label: 'ONETRIVIA' },
    { href: '/collectibles', icon: Swords, label: 'COLECCIONABLES' },
    { href: '/rankeds', icon: Bell, label: 'RANKEDS' },
];

const footerMenuItems = [
    { href: '/settings', icon: Cog, label: 'CONFIGURACIÓN' },
    { href: '/profile', icon: User, label: 'MI PERFIL' },
    { href: '/logout', icon: LogOut, label: 'CERRAR SESIÓN' },
];


export function MainSidebar({ user }: MainSidebarProps) {
  const pathname = usePathname();

  const renderMenuItems = (items: typeof menuItems | typeof footerMenuItems) => {
    return items.map((item) => {
      if ('adminOnly' in item && item.adminOnly && user.role !== 'admin') {
        return null;
      }
      const isActive = pathname === item.href;
      return (
        <li key={item.href}>
          <Link href={item.href} passHref>
            <Button
              variant="ghost"
              className={cn(
                'main-sidebar-button w-full justify-start gap-2 text-foreground',
              )}
              data-active={isActive}
            >
              <item.icon className="size-4" />
              {item.label}
            </Button>
          </Link>
        </li>
      );
    });
  };

  return (
    <aside className="fixed left-0 hidden h-screen w-64 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 p-2">
            <Link href="/profile">
                <AnimatedAvatar>
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatarUrl} alt="User avatar" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </AnimatedAvatar>
            </Link>
            <Image src="https://i.postimg.cc/L8g23g1S/logo-sudone.png" alt="SUDONE Logo" width={114} height={32} />
        </div>

        <nav className="flex flex-1 flex-col">
            <ul className="flex flex-col gap-1 p-2">
                {renderMenuItems(menuItems)}
            </ul>
            <ul className="mt-auto flex flex-col gap-1 border-t p-2">
                {renderMenuItems(footerMenuItems)}
            </ul>
        </nav>
    </aside>
  );
}
