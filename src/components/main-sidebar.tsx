
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
  Footprints,
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
    { href: '/botines', icon: Footprints, label: 'BOTINES'},
    { href: '/collectibles', icon: Swords, label: 'COLECCIONABLES' },
    { href: '/ranking', icon: BarChart2, label: 'RANKING' },
];

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M16.6 14c-.2-.1-1.5-0.7-1.7-0.8-.2-.1-.4-.1-.6 0.1s-.6 0.8-.8 1c-.1 0.2-.3 0.2-.5 0.1-1-0.3-1.9-0.9-2.7-1.7-0.6-0.6-1.1-1.4-1.2-1.6-.1-.2 0-.4 0.1-.5 0.1-.1 0.2-.3 0.4-.4 0.1-.1 0.2-.2 0.2-.3 0.1-.1 0.1-.3 0-0.4C9.5 8.8 9.1 7.8 8.9 7.4c-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5 0.1-.7 0.3-0.2 0.2-.8 0.8-.8 1.9s0.8 2.2 1 2.4c0.1 0.2 1.5 2.3 3.7 3.2 0.5 0.2 0.9 0.4 1.2 0.5 0.7 0.2 1.3 0.2 1.8 0.1 0.5-.1 1.5-0.6 1.7-1.2 0.2-.5 0.2-1 0.1-1.1s-.2-.2-.4-.3z M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
  </svg>
);

const socialItems = [
    { href: 'https://www.youtube.com/@ORGANIZACIONSUDONE', icon: Youtube, label: 'YOUTUBE' },
    { href: 'https://www.instagram.com/liga.sudone/', icon: Instagram, label: 'INSTAGRAM' },
    { href: 'https://wa.me/5491139027578', icon: WhatsAppIcon, label: 'WHATSAPP' },
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

  const renderMenuItems = (items: (typeof menuItems | typeof footerMenuItems)[]) => {
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
                        {user.name !== 'VISITANTE' && <span className="text-sm text-muted-foreground truncate">@{user.username}</span>}
                    </div>
                </>
            ) : null}
        </div>

        <nav className="flex flex-1 flex-col">
            <ul className="flex flex-col gap-1 p-2">
                {renderMenuItems(menuItems)}
            </ul>
            <ul className="mt-auto flex flex-col gap-1 border-t p-2">
                <div className="flex justify-start gap-2 py-2">
                    {socialItems.map(item => (
                        <li key={item.href}>
                             <Link href={item.href} passHref target="_blank" rel="noopener noreferrer">
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
                {user && user.name !== 'VISITANTE' && renderMenuItems(footerMenuItems)}
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
