'use client';

import { Bell, Menu, Layers, LogOut, Search, User as UserIcon, Star, FileText, Heart, Package, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MainSidebar } from './main-sidebar';


const favorites = [
    { id: '1', type: 'tournament', name: 'Liga Anual 2024', avatar: '/images/liga-anual.png', hasNewContent: true, abbrev: "LI"},
    { id: '2', type: 'tournament', name: 'Copa Verano', avatar: '/images/copa-verano.png', hasNewContent: true, abbrev: "CO" },
    { id: '3', type: 'tournament', name: 'Torneo Relámpago', avatar: '/images/torneo-relampago.png', hasNewContent: false, abbrev: "TO" },
    { id: '4', type: 'user', name: '@leomessi', avatar: '/images/messi.jpg', hasNewContent: false, abbrev: "LM" },
    { id: '5', type: 'user', name: '@dibumartinez', avatar: '/images/dibu.jpg', hasNewContent: false, abbrev: "DM" },
];

const notificationIcons: { [key: string]: React.ElementType } = {
  post: FileText,
  sudpoints: Trophy,
  like: Heart,
  pack: Package,
  team: Trophy,
};

export function PageHeader() {
  const { user, loading, logout, notifications, setNotifications } = useUser();
  const router = useRouter();
  
  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  }

  const handleOpenNotifications = () => {
    // Mark all as read when opening
    setTimeout(() => {
        setNotifications(prevNotifications => 
            prevNotifications.map(n => ({ ...n, isRead: true }))
        );
    }, 1000);
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-[#291e37]/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="md:hidden flex-1">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu/>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                       <MainSidebar isMobile={true}/>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="hidden md:flex flex-1 justify-center items-center gap-2">
                <form className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar perfiles..."
                        className="w-full rounded-full pl-10"
                    />
                </form>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Star className="h-5 w-5"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Favoritos</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {favorites.map(fav => (
                         <DropdownMenuItem key={fav.id} asChild>
                            <Link href="#" className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                     <Avatar className="w-6 h-6">
                                        <AvatarImage src={fav.avatar} />
                                        <AvatarFallback>{fav.abbrev}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{fav.name}</span>
                                 </div>
                                {fav.hasNewContent && <div className="h-2 w-2 rounded-full bg-accent" />}
                            </Link>
                         </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
                <Link href="/collectibles">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Layers className="h-6 w-6 text-destructive" />
                        <span className="font-bold text-sm">GRATIS</span>
                    </Button>
                </Link>
                <DropdownMenu onOpenChange={(open) => open && handleOpenNotifications()}>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {hasUnreadNotifications && <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                         <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length > 0 ? notifications.map(notif => {
                            const Icon = notificationIcons[notif.type] || Bell;
                            return (
                                <DropdownMenuItem key={notif.id} asChild>
                                    <Link href={notif.link} className="flex items-start gap-3">
                                         <div className="relative">
                                             <Icon className="h-4 w-4 mt-1" />
                                             {!notif.isRead && <div className="absolute -right-1 top-0 h-1.5 w-1.5 rounded-full bg-accent" />}
                                         </div>
                                         <div className="flex-1">
                                             <p className="text-sm whitespace-normal">{notif.message}</p>
                                             <p className="text-xs text-muted-foreground mt-1">
                                                 {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                             </p>
                                         </div>
                                    </Link>
                                </DropdownMenuItem>
                            )
                        }) : (
                            <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones.</p>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                {loading ? (
                   <Skeleton className="h-10 w-10 rounded-full" />
                ) : user && user.name !== 'VISITANTE' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                           <Avatar>
                              <AvatarImage src={user?.avatar} alt={user?.name} />
                              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={`/profile/${user.id}`}>
                          <DropdownMenuItem>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Perfil</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link href="/login">
                        <Button>Iniciar Sesión</Button>
                    </Link>
                )}
            </div>
        </div>
        <div className="md:hidden px-4 pb-2">
           <form className="relative flex-1 max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar perfiles..."
                    className="w-full rounded-full pl-10"
                />
            </form>
        </div>
         <div className="px-4 pb-2">
            <Link href="https://www.monsterenergy.com" target="_blank" rel="noopener noreferrer">
                <Image
                    src="/images/banner-monster.png"
                    alt="Monster Energy Banner"
                    width={1200}
                    height={150}
                    className="w-full h-auto rounded-lg"
                />
            </Link>
        </div>
    </header>
  );
}
