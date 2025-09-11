
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Search, Layers, Bell, Upload } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import Link from 'next/link';

// Mock data, replace with actual data fetching
const favorites = {
  tournaments: [
    { id: 1, name: 'Liga Anual 2024' },
    { id: 2, name: 'Copa Verano' },
    { id: 3, name: 'Torneo Relámpago' },
  ],
  users: [
    { id: 1, name: 'Leo Messi' },
    { id: 2, name: 'Dibu Martinez' },
  ],
};

const user = { role: 'admin' }; // Mock user

export function PageHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-auto w-full flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between gap-4 py-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar perfiles..." className="pl-9" />
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/onetrivia">
              <Image src="https://i.postimg.cc/wTS3SwPx/LOGO-ONE-TRIVIA.png" width={24} height={24} alt="Onetrivia"/>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Layers />
            <span className="absolute -top-1 -right-2 text-xs font-bold text-red-500 bg-white px-1 rounded-sm">GRATIS</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Bell />
          </Button>
        </div>
      </div>

      {/* Sponsor Banner */}
      <div className="relative w-full h-24 sm:h-32 md:h-40 group">
        <Image
          src="https://i.postimg.cc/DwGLHwqS/banner-final.png"
          alt="Sponsor Banner"
          fill
          style={{ objectFit: 'cover' }}
        />
        {user.role === 'admin' && (
          <Button
            variant="outline"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Upload className="mr-2 h-4 w-4" />
            Cambiar Banner
          </Button>
        )}
      </div>
      
      {/* Favorites Bar */}
      <div className="w-full border-t bg-background">
        <ScrollArea className="whitespace-nowrap">
            <div className="flex w-max space-x-4 p-3 text-sm">
                 <h3 className="font-semibold text-primary">Favoritos:</h3>
                {favorites.tournaments.map((t) => (
                    <Link href={`/tournament/${t.id}`} key={`t-${t.id}`} className="hover:underline hover:text-primary transition-colors">{t.name}</Link>
                ))}
                 {favorites.users.map((u) => (
                    <Link href={`/profile/${u.id}`} key={`u-${u.id}`} className="hover:underline hover:text-primary transition-colors">@{u.name.replace(/\s+/g, '').toLowerCase()}</Link>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </header>
  );
}
