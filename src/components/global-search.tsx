'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This effect runs when allUsers data is available from context
    // Combine all data sources for searching
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
        path: `/leagues`, // Or tournament-specific page if available
    }));

    setAllData([...userResults, ...tournamentResults, ...staticPages]);
  }, [allUsers]);
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            inputRef.current?.focus();
            setOpen(o => !o);
        }
    }
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [])

  const filteredData = searchTerm
    ? allData.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleSelect = (value: string) => {
    const selectedItem = allData.find(item => `${item.type}-${item.id}` === value);
    if(selectedItem) {
        router.push(selectedItem.path);
        setOpen(false);
        setSearchTerm('');
    }
  };
  
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
        case 'USUARIO': return <User className="h-4 w-4 text-muted-foreground"/>;
        case 'TORNEO': return <Trophy className="h-4 w-4 text-muted-foreground"/>;
        case 'PÁGINA': return <Newspaper className="h-4 w-4 text-muted-foreground"/>;
        case 'JUEGO': return <Gamepad2 className="h-4 w-4 text-muted-foreground"/>;
        default: return <Search className="h-4 w-4 text-muted-foreground"/>
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 0 && !open) {
      setOpen(true);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                ref={inputRef}
                placeholder="Buscar perfiles, torneos..."
                className="w-full rounded-full pl-10"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => searchTerm.length > 0 && setOpen(true)}
            />
             <kbd className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] mt-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command shouldFilter={false} onValueChange={handleSelect}>
          <CommandList>
            {filteredData.length === 0 && searchTerm.length > 0 && (
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            )}
            {filteredData.map(item => (
              <CommandItem key={`${item.type}-${item.id}`} value={`${item.type}-${item.id}`}>
                <div className="flex items-center gap-3 flex-1">
                    {item.avatar ? (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={item.avatar}/>
                            <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    ) : getIcon(item.type)}
                    <span>{item.name}</span>
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">{item.type}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
