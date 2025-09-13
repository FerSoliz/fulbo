'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, User, Trophy, Gamepad2, Newspaper } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/context/user-context';

type SearchResult = {
  type: 'USUARIO' | 'TORNEO' | 'PÁGINA' | 'JUEGO';
  id: string;
  name: string;
  avatar?: string;
  path: string;
};

const staticPages: SearchResult[] = [
    { type: 'PÁGINA', id: 'store', name: 'Tienda', path: '/store' },
    { type: 'JUEGO', id: 'collectibles', name: 'Cartas Coleccionables', path: '/collectibles' },
    { type: 'PÁGINA', id: 'ranking', name: 'Ranking de Jugadores', path: '/ranking' },
    { type: 'PÁGINA', id: 'leagues', name: 'Ligas en Curso', path: '/leagues' },
];

export function GlobalSearch() {
  const router = useRouter();
  const { allUsers } = useUser();
  const [open, setOpen] = useState(false);
  const [allData, setAllData] = useState<SearchResult[]>([]);

  useEffect(() => {
    const userResults: SearchResult[] = allUsers.map(user => ({
      type: 'USUARIO',
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      path: `/profile/${user.id}`,
    }));

    const storedTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const tournamentResults: SearchResult[] = storedTournaments.map((t: any) => ({
        type: 'TORNEO',
        id: t.id,
        name: t.name,
        path: `/leagues`,
    }));

    setAllData([...userResults, ...tournamentResults, ...staticPages]);
  }, [allUsers]);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen((open) => !open);
        }
    }
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])
  
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
        case 'USUARIO': return <User className="h-4 w-4 mr-2 text-muted-foreground"/>;
        case 'TORNEO': return <Trophy className="h-4 w-4 mr-2 text-muted-foreground"/>;
        case 'PÁGINA': return <Newspaper className="h-4 w-4 mr-2 text-muted-foreground"/>;
        case 'JUEGO': return <Gamepad2 className="h-4 w-4 mr-2 text-muted-foreground"/>;
        default: return <Search className="h-4 w-4 mr-2 text-muted-foreground"/>
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-full text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2 lg:hidden" />
        <span className="hidden lg:inline-flex">Buscar...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Busca un perfil, torneo, página..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
           <CommandGroup heading="Usuarios">
            {allData.filter(i => i.type === 'USUARIO').map(item => (
                 <CommandItem key={item.path} onSelect={() => runCommand(() => router.push(item.path))}>
                    <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={item.avatar}/>
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {item.name}
                </CommandItem>
            ))}
           </CommandGroup>
           <CommandGroup heading="Torneos">
             {allData.filter(i => i.type === 'TORNEO').map(item => (
                 <CommandItem key={item.path} onSelect={() => runCommand(() => router.push(item.path))}>
                    {getIcon(item.type)}
                    {item.name}
                </CommandItem>
            ))}
           </CommandGroup>
           <CommandGroup heading="Otras Páginas">
             {allData.filter(i => i.type === 'PÁGINA' || i.type === 'JUEGO').map(item => (
                 <CommandItem key={item.path} onSelect={() => runCommand(() => router.push(item.path))}>
                    {getIcon(item.type)}
                    {item.name}
                </CommandItem>
            ))}
           </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
