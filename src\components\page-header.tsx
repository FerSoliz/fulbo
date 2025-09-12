
'use client';

import { Bell, Camera, Layers, LogOut, Search, User as UserIcon, Star, FileText, Heart, Package, Trophy } from 'lucide-react';
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
import { Skeleton } from './ui/skeleton';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { initialNotifications, Notification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
};

export function PageHeader() {
  const { user, loading, logout } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);
  
  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  }

  const handleOpenNotifications = () => {
    // Mark all as read when opening
    setTimeout(() => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }, 1000);
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-[#291e37]/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex-1" />
            <div className="flex flex-1 justify-center items-center gap-2">
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

    