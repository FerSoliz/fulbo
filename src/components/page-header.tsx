
'use client';

import { Bell, Menu, Layers, LogOut, Search, User as UserIcon, Star, FileText, Heart, Package, Trophy, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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
import { User, Notification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MainSidebar } from './main-sidebar';
import { GlobalSearch } from './global-search';


const favorites = [
    { id: '1', type: 'tournament', name: 'Liga Anual 2024', avatar: 'https://i.postimg.cc/NfHBrS60/liga-anual.png', hasNewContent: true, abbrev: "LI"},
    { id: '2', type: 'tournament', name: 'Copa Verano', avatar: 'https://i.postimg.cc/W3d9b4Vf/copa-verano.png', hasNewContent: true, abbrev: "CO" },
    { id: '3', type: 'tournament', name: 'Torneo Relámpago', avatar: 'https://i.postimg.cc/8zJ17B67/torneo-relampago.png', hasNewContent: false, abbrev: "TO" },
    { id: '4', type: 'user', name: '@leomessi', avatar: 'https://i.postimg.cc/L6ZDmP25/messi.jpg', hasNewContent: false, abbrev: "LM" },
    { id: '5', type: 'user', name: '@dibumartinez', avatar: 'https://i.postimg.cc/44rD55vT/dibu.jpg', hasNewContent: false, abbrev: "DM" },
];

const notificationIcons: { [key: string]: React.ElementType } = {
  post: FileText,
  sudpoints: Trophy,
  like: Heart,
  pack: Package,
  team: Trophy,
  friend_request: UserCheck,
};

export function PageHeader() {
  const { user, loading, logout, notifications, setNotifications, availablePacks, countdown } = useUser();
  const router = useRouter();
  
  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  const handleLogout = async () => {
    if (user?.id === 'visitor') {
        router.push('/login');
    } else {
        await logout();
    }
  }
  
  const handleNotificationAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Action clicked:", action);
    // Here you would implement the logic for accepting/rejecting friends
    // For now, we just log it
    // toast({title: "Acción no implementada", description: "La lógica para esta acción aún no está definida."})
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
             <div className="hidden md:flex flex-1 items-center gap-2">
                <div className="flex-1">
                    <GlobalSearch />
                </div>
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
            <div className="flex flex-shrink-0 items-center justify-end gap-2">
                <Link href="/collectibles">
                    <Button variant="ghost" className="flex items-center gap-2 text-destructive">
                        <Layers className="h-6 w-6" />
                         <span className="font-bold text-sm">
                            {availablePacks > 0 
                                ? `SOBRE GRATIS (${availablePacks})` 
                                : countdown 
                                ? `PRÓXIMO EN: ${countdown}`
                                : 'SOBRES'
                            }
                        </span>
                    </Button>
                </Link>
                {loading ? (
                   <Skeleton className="h-10 w-10 rounded-full" />
                ) : user && user.id !== 'visitor' ? (
                    <>
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
                                        <DropdownMenuItem key={notif.id} asChild className="p-0">
                                            <Link href={notif.link} className="flex items-start gap-3 p-2 w-full">
                                                <div className="relative">
                                                    <Icon className="h-4 w-4 mt-1" />
                                                    {!notif.isRead && <div className="absolute -right-1 top-0 h-1.5 w-1.5 rounded-full bg-accent" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm whitespace-normal">{notif.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                                    </p>
                                                    {notif.actions && (
                                                        <div className="flex gap-2 mt-2">
                                                            {notif.actions.map(action => (
                                                                <Button key={action.label} size="sm" variant={action.label === 'Aceptar' ? 'default' : 'outline'} onClick={(e) => handleNotificationAction(e, action.action)}>
                                                                    {action.label === 'Aceptar' ? <UserCheck className="mr-2 h-4 w-4"/> : <UserX className="mr-2 h-4 w-4"/>}
                                                                    {action.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                    )
                                }) : (
                                    <p className="p-4 text-sm text-center text-muted-foreground">No tienes notificaciones.</p>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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
                    </>
                ) : (
                    <Link href="/login">
                        <Button>Iniciar Sesión</Button>
                    </Link>
                )}
            </div>
        </div>
        <div className="md:hidden px-4 pb-2">
           <GlobalSearch />
        </div>
         <div className="px-4 pb-2">
            <Link href="https://www.monsterenergy.com" target="_blank" rel="noopener noreferrer">
                <Image
                    src="https://i.postimg.cc/PNGVGZ92/banner-monster.png"
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
