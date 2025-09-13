'use client';

import {
  Bell,
  MessageSquare,
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
  Youtube,
  Instagram,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from "react";
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';


const menuItems = [
    { href: '/', icon: Home, label: 'INICIO' },
    { href: '/admin', icon: ShieldCheck, label: 'PANEL DE ADMIN', adminOnly: true },
    { href: '/leagues', icon: Trophy, label: 'LIGAS EN CURSO' },
    { href: '/messages', icon: MessageSquare, label: 'MENSAJES' },
    { href: '/tournament', icon: Ticket, label: 'INSCRIBIRME' },
    { href: '/store', icon: Store, label: 'TIENDA' },
    { href: '/collectibles', icon: Swords, label: 'COLECCIONABLES' },
    { href: '/ranking', icon: BarChart2, label: 'RANKING' },
];

const socialItems = [
    { href: 'https://youtube.com', icon: Youtube, label: 'YOUTUBE' },
    { href: 'https://instagram.com', icon: Instagram, label: 'INSTAGRAM' },
];

const footerMenuItems = [
    { href: '/settings', icon: Cog, label: 'CONFIGURACIÓN' },
    { href: '/profile', icon: UserIcon, label: 'MI PERFIL' },
];


export function MainSidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { user, loading, logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    if (user?.name === 'VISITANTE') {
        router.push('/login');
    } else {
        await logout();
    }
  }

  const renderMenuItems = (items: (typeof menuItems | typeof footerMenuItems)) => {
    return items.map((item) => {
      if ('adminOnly' in item && item.adminOnly && user?.role !== 'admin' && user?.role !== 'editor') {
        return null;
      }
      
      let finalHref = item.href;
      if('label' in item && item.label === 'MI PERFIL' && user && user.name !== 'VISITANTE') {
          finalHref = `/profile/${user.id}`;
      } else if ('label' in item && item.label === 'MI PERFIL' && (!user || user.name === 'VISITANTE')) {
          finalHref = '/login'; // Redirect visitor to login
      }

      const isActive = pathname === finalHref || (finalHref !== '/' && pathname.startsWith(finalHref) && finalHref.length > 1);

      return (
        <li key={item.href}>
          <Link href={finalHref} passHref>
            <Button
              variant='ghost'
              className={cn(
                'main-sidebar-button w-full justify-start gap-2 text-foreground'
              )}
              data-active={isActive}
              disabled={loading}
            >
              <item.icon className="h-5 w-5" />
              <span className="lg:text-base">{item.label}</span>
            </Button>
          </Link>
        </li>
      );
    });
  };

  const sidebarClasses = cn(
    "flex flex-col bg-card h-full",
    { "fixed left-0 hidden h-screen w-64 border-r md:flex": !isMobile },
  );

  return (
    <aside className={sidebarClasses}>
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
            {loading ? (
                 <>
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                    </div>
                </>
            ) : user ? (
                <>
                    <Link href={user.name === 'VISITANTE' ? '/login' : `/profile/${user.id}`}>
                        <AnimatedAvatar>
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={user.avatar} alt="User avatar" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </AnimatedAvatar>
                    </Link>
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold truncate">{user.name}</span>
                        {user.name !== 'VISITANTE' && <span className="text-sm text-muted-foreground truncate">@{user.name === 'Lucio Mingrone' ? 'luccio' : user.name.split(' ')[0].toLowerCase()}</span>}
                    </div>
                </>
            ) : null}
        </div>

        <nav className="flex flex-1 flex-col">
            <ul className="flex flex-col gap-1 p-2">
                {renderMenuItems(menuItems)}
            </ul>
            <ul className="mt-auto flex flex-col gap-1 border-t p-2">
                <div className="flex justify-center gap-2 py-2">
                    {socialItems.map(item => (
                        <li key={item.href}>
                             <Link href={item.href} passHref target="_blank">
                                <Button
                                variant='destructive'
                                size="icon"
                                className='bg-red-600 hover:bg-red-700 text-white'
                                >
                                <item.icon className="h-5 w-5" />
                                </Button>
                            </Link>
                        </li>
                    ))}
                </div>
                {user?.name !== 'VISITANTE' && renderMenuItems(footerMenuItems)}
                 <li>
                    <Button
                        variant="ghost"
                        className="main-sidebar-button w-full justify-start gap-2 text-foreground"
                        onClick={handleLogout}
                        disabled={loading}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="lg:text-base">{user?.name === 'VISITANTE' ? 'INICIAR SESIÓN' : 'CERRAR SESIÓN'}</span>
                    </Button>
                </li>
            </ul>
        </nav>
    </aside>
  );
}
