
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
  User as UserIcon,
  BarChart2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from "react";
import type { User } from '@/lib/data';
import { Skeleton } from './ui/skeleton';


interface MainSidebarProps {
  user: User | null;
}

const menuItems = [
    { href: '/', icon: Home, label: 'INICIO' },
    { href: '/admin', icon: ShieldCheck, label: 'PANEL DE ADMIN', adminOnly: true },
    { href: '/leagues', icon: Trophy, label: 'LIGAS EN CURSO' },
    { href: '/tournament', icon: Ticket, label: 'INSCRIBIRME' },
    { href: '/store', icon: Store, label: 'TIENDA' },
    { href: '/collectibles', icon: Swords, label: 'COLECCIONABLES' },
    { href: '/ranking', icon: BarChart2, label: 'RANKING' },
];

const footerMenuItems = [
    { href: '/settings', icon: Cog, label: 'CONFIGURACIÓN' },
    { href: '/profile', icon: UserIcon, label: 'MI PERFIL' },
    { href: '/logout', icon: LogOut, label: 'CERRAR SESIÓN' },
];


export function MainSidebar({ user }: MainSidebarProps) {
  const pathname = usePathname();

  const renderMenuItems = (items: typeof menuItems | typeof footerMenuItems) => {
    return items.map((item) => {
      if ('adminOnly' in item && item.adminOnly && user?.role !== 'admin' && user?.role !== 'editor') {
        return null;
      }
      
      let finalHref = item.href;
      if(item.label === 'MI PERFIL' && user) {
          finalHref = `/profile/${user.id}`;
      }

      const isActive = pathname === finalHref || (finalHref !== '/' && pathname.startsWith(finalHref) && finalHref.length > 1);


      return (
        <li key={item.href}>
          <Link href={finalHref} passHref>
            <Button
              variant="ghost"
              className={cn(
                'main-sidebar-button w-full justify-start gap-2 text-foreground',
              )}
              data-active={isActive}
              disabled={!user}
            >
              <item.icon className="h-5 w-5" />
              <span className="lg:text-base">{item.label}</span>
            </Button>
          </Link>
        </li>
      );
    });
  };

  return (
    <aside className="fixed left-0 hidden h-screen w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center justify-center border-b p-2">
          <Link href="/">
            <Image
              src="https://i.postimg.cc/sgTxwJtP/sudone-titulo.png"
              alt="SUDONE Logo"
              width={140}
              height={40}
              priority
            />
          </Link>
        </div>
        <div className="flex items-center gap-2 p-2">
            {user ? (
                <>
                    <Link href={`/profile/${user.id}`}>
                        <AnimatedAvatar>
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={user.avatar} alt="User avatar" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </AnimatedAvatar>
                    </Link>
                    <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-sm text-muted-foreground">@{user.name.split(' ')[0].toLowerCase()}</span>
                    </div>
                </>
            ) : (
                <>
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                    </div>
                </>
            )}
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
