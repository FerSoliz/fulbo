
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
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  
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
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu/>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                       <MainSidebar isMobile={true} onLinkClick={() => setIsSheetOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>
             <div className="hidden md:flex flex-1 items-center gap-2">
                <div className="flex-1">
                    <GlobalSearch />
                </div>
            </div>
            <div className="flex flex-shrink-0 items-center justify-end gap-2">
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
                        <Link href={`/profile/${user.id}`}>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar>
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </Link>
                    </>
                ) : (
                    <Link href="/login">
                        <Button>Iniciar Sesión</Button>
                    </Link>
                )}
            </div>
        </div>
        <div className="border-t border-border/50 px-4 pt-2 pb-3 md:hidden">
           <GlobalSearch />
        </div>
         <div className="px-4 pb-2">
            <Link href="https://www.monsterenergy.com" target="_blank" rel="noopener noreferrer">
                <Image
                    src="/banner-monster.png" // Ruta local
                    alt="Monster Energy Banner"
                    width={1200} // Dimensiones intrínsecas de la imagen
                    height={150} // Dimensiones intrínsecas de la imagen
                    priority
                    className="rounded-lg" // Clases directamente en el Image
                />
            </Link>
        </div>
    </header>
  );
}
