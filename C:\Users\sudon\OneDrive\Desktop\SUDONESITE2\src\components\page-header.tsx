'use client';

import { Bell, Camera, Layers, LogOut, Search, User as UserIcon, Star } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface PageHeaderProps {
  user: User;
}

export function PageHeader({ user }: PageHeaderProps) {
  const hasNotifications = true;
  return (
    <header className="sticky top-0 z-20 w-full bg-[#291e37]/80 backdrop-blur-sm border-b">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <div className="flex-1">
                {/* Espacio a la izquierda, antes estaba favoritos */}
            </div>

            {/* BUSCADOR - CENTRO */}
            <form className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar..."
                    className="w-full rounded-full pl-9 h-9"
                />
            </form>

            {/* ICONOS Y PERFIL - DERECHA */}
            <div className="flex flex-1 items-center justify-end gap-2">
                <Link href="/collectibles">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-destructive" />
                        <span className="font-bold text-xs">GRATIS</span>
                    </Button>
                </Link>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasNotifications && <div className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                       <Avatar className="w-9 h-9">
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
