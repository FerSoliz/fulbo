
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Search, Layers, Bell, Upload, ClipboardList, Download, UploadCloud } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';


// Mock data, replace with actual data fetching
const favorites = {
  tournaments: [
    { id: 1, name: 'Liga Anual 2024', hasNewContent: true },
    { id: 2, name: 'Copa Verano', hasNewContent: false },
    { id: 3, name: 'Torneo Relámpago', hasNewContent: true },
  ],
  users: [
    { id: 1, name: 'Leo Messi', avatar: 'https://i.postimg.cc/xTT3zpg1/MARADONA-Y-EL-PURO-e1630357319461.jpg', hasNewContent: true },
    { id: 2, name: 'Dibu Martinez', avatar: 'https://i.postimg.cc/y6gMfdjq/CARTA-DIBU.png', hasNewContent: false },
  ],
};

const user = { role: 'admin' }; // Mock user
const hasNotifications = true;

export function PageHeader() {
  return (
    <header className="sticky top-0 z-20 flex w-full flex-col border-b bg-[#291e37]/80 backdrop-blur-sm">
      {/* First Row */}
      <div className="container flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar perfiles..." className="pl-10 h-9" />
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/onetrivia">
              <Image src="https://i.postimg.cc/wTS3SwPx/LOGO-ONE-TRIVIA.png" width={60} height={60} alt="Onetrivia"/>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/collectible-cards/pack" className='relative'>
              <Layers className="h-6 w-6 text-destructive" />
               <span className="absolute -top-1 -right-2 text-xs font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-sm text-center">GRATIS</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {hasNotifications && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></div>}
          </Button>
        </div>
      </div>

      {/* Sponsor Banner */}
      <div className="relative w-full h-20 group">
        <Image
          src="https://i.postimg.cc/DwGLHwqS/banner-final.png"
          alt="Sponsor Banner"
          fill
          style={{ objectFit: 'cover' }}
        />
        {user.role === 'admin' && (
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-2 right-2 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Upload className="mr-2 h-4 w-4" />
            Cambiar Banner
          </Button>
        )}
      </div>
      
      {/* Favorites Bar */}
      <div className="w-full border-t bg-background/80">
        <ScrollArea className="whitespace-nowrap">
            <div className="flex w-max space-x-4 p-3 text-sm items-center">
                 <h3 className="font-semibold text-primary">Favoritos:</h3>
                {favorites.tournaments.map((t) => (
                    <Link href={`/tournament/${t.id}`} key={`t-${t.id}`} className="flex flex-col items-center gap-1.5 group">
                      <div className={`w-14 h-14 rounded-full p-0.5 ${t.hasNewContent ? 'bg-gradient-to-br from-accent to-primary' : 'bg-muted-foreground/50'}`}>
                        <div className='w-full h-full rounded-full bg-background flex items-center justify-center font-bold text-lg group-hover:bg-accent/20 transition-colors'>
                          {t.name.substring(0,2).toUpperCase()}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{t.name}</span>
                    </Link>
                ))}
                 {favorites.users.map((u) => (
                    <Link href={`/profile/${u.id}`} key={`u-${u.id}`} className="flex flex-col items-center gap-1.5 group">
                      <Avatar className={`w-14 h-14 p-0.5 ${u.hasNewContent ? 'bg-gradient-to-br from-accent to-primary' : 'bg-muted-foreground/50'}`}>
                         <AvatarImage src={u.avatar} alt={u.name} className="rounded-full"/>
                         <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">@{u.name.replace(/\s+/g, '').toLowerCase()}</span>
                    </Link>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </header>
  );
}
