'use client';

import { Bell, Camera, Layers, LogOut, Search, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PageHeaderProps {
  user: User;
}

const favorites = [
    { id: 'user-profile', type: 'user', name: '@lucio', avatar: 'https://i.postimg.cc/xTT3zpg1/MARADONA-Y-EL-PURO-e1630357319461.jpg', hasNewContent: false, abbrev: "LM" },
    { id: '1', type: 'tournament', name: 'Liga Anual 2024', avatar: 'https://i.postimg.cc/NfHBrS60/liga-anual.png', hasNewContent: true, abbrev: "LI"},
    { id: '2', type: 'tournament', name: 'Copa Verano', avatar: 'https://i.postimg.cc/W3d9b4Vf/copa-verano.png', hasNewContent: true, abbrev: "CO" },
    { id: '3', type: 'tournament', name: 'Torneo Relámpago', avatar: 'https://i.postimg.cc/8zJ17B67/torneo-relampago.png', hasNewContent: false, abbrev: "TO" },
    { id: '4', type: 'user', name: '@leomessi', avatar: 'https://i.postimg.cc/L6ZDmP25/messi.jpg', hasNewContent: false, abbrev: "LM" },
    { id: '5', type: 'user', name: '@dibumartinez', avatar: 'https://i.postimg.cc/44rD55vT/dibu.jpg', hasNewContent: false, abbrev: "DM" },
];

export function PageHeader({ user }: PageHeaderProps) {
  const hasNotifications = true;
  return (
    <header className="sticky top-0 z-20 w-full bg-[#291e37]/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex-1" />
            <form className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar perfiles..."
                    className="w-full rounded-full pl-10"
                />
            </form>
            <div className="flex flex-1 items-center justify-end gap-2">
                <Link href="/collectibles">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Layers className="h-6 w-6 text-destructive" />
                        <span className="font-bold text-sm">GRATIS</span>
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasNotifications && <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
                </Button>
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
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="p-3">
                    <h3 className="text-sm font-semibold mb-2">Favoritos:</h3>
                    <div className="flex gap-4">
                        {favorites.map((fav) => (
                        <Link href={fav.id === 'user-profile' ? `/profile/${user.id}` : '#'} key={fav.id} className="flex flex-col items-center gap-1">
                            <div className={cn(fav.hasNewContent ? "bg-gradient-to-br from-accent to-primary" : "bg-muted-foreground/50", "p-0.5 rounded-full")}>
                                <Avatar className="w-14 h-14 border-2 border-background">
                                    <AvatarImage src={fav.avatar} />
                                    <AvatarFallback>{fav.abbrev}</AvatarFallback>
                                </Avatar>
                            </div>
                            <span className="text-xs text-muted-foreground">{fav.name}</span>
                        </Link>
                        ))}
                    </div>
                </div>
            </ScrollArea>
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
