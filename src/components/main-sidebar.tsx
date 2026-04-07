'use client';

import {
  BarChart2, Bell, Cog, Download, Footprints, Home, Instagram, Landmark, LogOut, 
  Loader2, MessageSquare, ShieldCheck, Store, Swords, Ticket, Trophy, User as UserIcon, BookOpen,
  Youtube, FilePenLine
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from "react";
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/context/user-context';
import { usePwa } from '@/context/pwa-context'; // 1. Importar el hook usePwa

type MenuItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  requiresAuth?: boolean;
  allowedRoles?: string[];
};

const menuItems: MenuItem[] = [
    { href: '/', icon: Home, label: 'INICIO' },
    { href: '/tournament', icon: FilePenLine, label: 'INSCRIPCIONES' },
    { href: '/tournaments', icon: Trophy, label: 'LIGAS EN CURSO' },
    { href: '/store', icon: Store, label: 'TIENDA' },
    { href: '/guia', icon: BookOpen, label: 'GUIA DE USUARIO' },
    { href: '/collectibles', icon: Swords, label: 'TCG SUDONE', requiresAuth: true },
    { href: '/ranking', icon: BarChart2, label: 'RANKING' },
    { href: '/transfer-market', icon: Landmark, label: 'MERCADO DE PASES' },
    { href: '/admin', icon: ShieldCheck, label: 'PANEL DE ADMIN', allowedRoles: ['admin', 'vendedor'] },
];

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M16.6 14c-.2-.1-1.5-0.7-1.7-0.8-.2-.1-.4-.1-.6 0.1s-.6 0.8-.8 1c-.1 0.2-.3 0.2-.5 0.1-1-0.3-1.9-0.9-2.7-1.7-0.6-0.6-1.1-1.4-1.2-1.6-.1-.2 0-.4 0.1-.5 0.1-.1 0.2-.3 0.4-.4 0.1-.1 0.2-.2 0.2-.3 0.1-.1 0.1-.3 0-0.4C9.5 8.8 9.1 7.8 8.9 7.4c-.2-.4-.4-.3-.6-.3h-.5c-.2 0-.5 0.1-.7 0.3-0.2 0.2-.8 0.8-.8 1.9s0.8 2.2 1 2.4c0.1 0.2 1.5 2.3 3.7 3.2 0.5 0.2 0.9 0.4 1.2 0.5 0.7 0.2 1.3 0.2 1.8 0.1 0.5-.1 1.5-0.6 1.7-1.2 0.2-.5 0.2-1 0.1-1.1s-.2-.2-.4-.3z M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" /></svg>
);

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="currentColor" {...props}><path d="M20.8,3.2c-1.7-0.6-3.5-1-5.3-1.2C15.3,2,15.2,2,15,2.1c-0.2,0-0.3-0.1-0.5-0.1c-1.8,0.2-3.6,0.6-5.3,1.2	C4.9,4.7,3.5,8.2,3,11.8c-0.1,0.5-0.1,1,0,1.5c0.5,4.7,2.2,8.4,5.4,11.2c1.4,1.2,3.1,2.2,4.9,2.8c0.2,0.1,0.4,0.1,0.6,0.1c0.2,0,0.4,0,0.6-0.1c1.8-0.6,3.5-1.5,4.9-2.8c3.2-2.8,4.9-6.5,5.4-11.2c0.1-0.5,0.1-1,0-1.5C24.5,8.2,23.1,4.7,20.8,3.2z M12.2,19.2c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6S13.6,19.2,12.2,19.2z M18.4,19.2c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.2-2.6,2.6-2.6c1.4,0,2.6,1.2,2.6,2.6S19.8,19.2,18.4,19.2z"/></svg>
);

const socialItems = [
    { href: 'https://www.youtube.com/@ORGANIZACIONSUDONE', icon: Youtube, label: 'YOUTUBE' },
    { href: 'https://www.instagram.com/liga.sudone/', icon: Instagram, label: 'INSTAGRAM' },
    { href: 'https://wa.me/5491139027578', icon: WhatsAppIcon, label: 'WHATSAPP' },
    { href: 'https://discord.gg/H8tuKK5c', icon: DiscordIcon, label: 'DISCORD' }
];

const footerMenuItems: MenuItem[] = [
    { href: '/profile', icon: UserIcon, label: 'MI PERFIL', requiresAuth: true },
];

interface MainSidebarProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function MainSidebar({ isMobile = false, onLinkClick }: MainSidebarProps) {
  const pathname = usePathname();
  const { user, loading, logout, trackInteraction } = useUser();
  const { installPrompt, handleInstallPrompt } = usePwa(); // 2. Usar el hook usePwa
  const router = useRouter();
  
  const isVisitor = !user || user.id === 'visitor';

  // 3. Limpieza: Se elimina el useEffect y useState para `installPrompt` de aquí

  const handleInstallClick = () => {
      handleInstallPrompt(); // Se llama a la función del contexto
      onLinkClick?.();
  };

  const handleMenuClick = () => {
    if (!isVisitor) {
      trackInteraction?.();
    }
    onLinkClick?.();
  }

  const handleLogout = async () => {
    onLinkClick?.();
    if (isVisitor) {
        router.push('/login');
    } else {
        await logout();
    }
  }

  const renderMenuItems = (items: MenuItem[]) => {
    // ... (El resto de la función renderMenuItems permanece igual)
    return items.map((item) => {
      if (item.allowedRoles && (!user || !item.allowedRoles.includes(user.role))) {
        return null;
      }

      if (item.requiresAuth && isVisitor) {
        return null;
      }
      
      let finalHref = item.href;
      if(item.label === 'MI PERFIL' && !isVisitor) {
          finalHref = `/profile/${user.id}`;
      } else if (item.label === 'MI PERFIL' && isVisitor) {
          finalHref = '/login';
      }
      
      const isActive = finalHref === '/' 
        ? pathname === '/'
        : (pathname === finalHref || pathname.startsWith(`${finalHref}/`));

      return (
          <li key={item.label}>
              <Link href={finalHref} onClick={handleMenuClick}>
                <Button
                  variant='ghost'
                  className={cn('main-sidebar-button w-full justify-start gap-2 text-foreground')}
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
    "flex flex-col bg-background h-full",
    { "fixed left-0 hidden h-screen w-64 flex-col border-r md:flex": !isMobile },
  );

  return (
      <aside className={cn(sidebarClasses, "rounded-r-xl")}>
          {/* ... (Cabecera y perfil de usuario sin cambios) ... */}
          <div className="flex h-16 items-center justify-center border-b p-2">
              <Link href="/" onClick={onLinkClick}>
              <div className="relative" style={{ width: '140px', height: '40px' }}>
                  <Image
                  src="/sudone-titulo.png"
                  alt="SUDONE Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  sizes="140px"
                  />
              </div>
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
                      <Link href={isVisitor ? '/login' : `/profile/${user.id}`} onClick={onLinkClick}>
                          <AnimatedAvatar>
                              <Avatar className="w-12 h-12">
                                  <AvatarImage src={user.avatar} alt="User avatar" />
                                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                          </AnimatedAvatar>
                      </Link>
                      <div className="flex flex-col overflow-hidden">
                          {!isVisitor ? (
                            <>
                              <div className="transform origin-left scale-x-[.80] md:scale-x-100 font-bold truncate italic">
                                <span className="text-accent-red">#</span>{user.username?.toUpperCase()}
                              </div>
                              <span className="text-sm text-muted-foreground truncate">{user.name}</span>
                            </>
                          ) : (
                              <span className="font-semibold truncate">{user.name}</span>
                          )}
                      </div>
                  </>
              ) : null}
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto">
              <ul className="flex flex-col gap-1 p-2">
                  {renderMenuItems(menuItems)}
              </ul>
          </nav>
          
          <div className="mt-auto border-t">
            <ul className="flex flex-col gap-1 p-2">
                <div className="flex justify-start gap-2 py-2">
                    {socialItems.map(item => (
                        <li key={item.href}>
                              <Link href={item.href} target="_blank" rel="noopener noreferrer">
                                <Button variant='destructive' size="icon" className='bg-red-600 hover:bg-red-700 text-white'>
                                  <item.icon className="h-5 w-5" />
                                </Button>
                              </Link>
                        </li>
                    ))}
                    {/* 4. Mostrar el ícono de descarga si la app es instalable */}
                    {installPrompt && (
                      <li>
                        <Button variant='destructive' size="icon" className='bg-red-600 hover:bg-red-700 text-white' onClick={handleInstallClick}>
                          <Download className="h-5 w-5" />
                        </Button>
                      </li>
                    )}
                </div>
                {!isVisitor && renderMenuItems(footerMenuItems)}
                  {/* Limpieza: Se elimina el botón de texto "DESCARGAR APP" que estaba aquí abajo */}
                  <li>
                    <Button variant="ghost" className="main-sidebar-button w-full justify-start gap-2 text-foreground" onClick={handleLogout} disabled={loading}>
                        <LogOut className="h-5 w-5" />
                        <span className="lg:text-base">{isVisitor ? 'INICIAR SESIÓN' : 'CERRAR SESIÓN'}</span>
                    </Button>
                </li>
            </ul>
            <div className="border-t p-3 text-center text-xs text-muted-foreground">
              Desarrollado por{' '}
              <Link 
                href="https://fersoliz.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-semibold text-foreground hover:underline"
              >
                Fer Soliz
              </Link>
            </div>
          </div>
      </aside>
  );
}
