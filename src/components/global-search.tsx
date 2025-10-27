'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, User, Trophy, Gamepad2, Newspaper, History, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/context/user-context';
import { cn } from '@/lib/utils';

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
  const { user } = useUser(); // Solo necesitamos el usuario actual para la lógica
  const [open, setOpen] = useState(false);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [filteredData, setFilteredData] = useState<SearchResult[]>([]);


  useEffect(() => {
    // Función para cargar todos los datos de búsqueda
    const loadAllData = async () => {
      // Ya no obtenemos allUsers del contexto para evitar errores de renderizado.
      // En una implementación más robusta, esto vendría de una API o una carga controlada.
      const usersFromLocalStorage = JSON.parse(localStorage.getItem('allUsers') || '[]');
      const userResults: SearchResult[] = (usersFromLocalStorage || []).map((u: any) => ({
        type: 'USUARIO',
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        path: `/profile/${u.id}`,
      }));

      const storedTournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
      const tournamentResults: SearchResult[] = (storedTournaments || []).map((t: any) => ({
          type: 'TORNEO',
          id: t.id,
          name: t.name,
          path: `/leagues`,
      }));

      setAllData([...userResults, ...tournamentResults, ...staticPages]);
    }

    loadAllData();
    
    // Cargar historial de búsqueda de localStorage
    const savedHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setHistory(savedHistory);

  }, []); // El array de dependencias vacío asegura que esto se ejecute solo una vez

   useEffect(() => {
    if (searchValue.length >= 3) {
      const lowercasedValue = searchValue.toLowerCase();
      const results = allData.filter(item =>
        item.name.toLowerCase().includes(lowercasedValue)
      );
      setFilteredData(results);
    } else {
      setFilteredData([]);
    }
  }, [searchValue, allData]);

  
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
  
  const addToHistory = (item: SearchResult) => {
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  const removeFromHistory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Evitar la selección del item
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSelect = (path: string, item: SearchResult) => {
    addToHistory(item);
    setSearchValue('');
    setOpen(false);
    router.push(path);
  }
  
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
        case 'USUARIO': return <User className="h-4 w-4 mr-3 text-muted-foreground"/>;
        case 'TORNEO': return <Trophy className="h-4 w-4 mr-3 text-muted-foreground"/>;
        case 'PÁGINA': return <Newspaper className="h-4 w-4 mr-3 text-muted-foreground"/>;
        case 'JUEGO': return <Gamepad2 className="h-4 w-4 mr-3 text-muted-foreground"/>;
        default: return <Search className="h-4 w-4 mr-3 text-muted-foreground"/>
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-full justify-start rounded-full text-sm text-muted-foreground sm:pr-12 bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline-flex">Buscar...</span>
            <span className="inline-flex lg:hidden">Buscar...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-transparent px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-secondary/80 backdrop-blur-md border-white/10"
          align="start"
        >
             <Command shouldFilter={false} className="bg-transparent">
                <CommandInput 
                    className="bg-transparent focus:bg-transparent"
                    placeholder="Busca un perfil, torneo, página..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                />
                <CommandList>
                    {searchValue.length < 3 && history.length > 0 && (
                        <CommandGroup heading="Búsquedas Recientes">
                            {history.map(item => (
                                <CommandItem key={`hist-${item.id}`} onSelect={() => handleSelect(item.path, item)} className="flex justify-between items-center group hover:bg-white/10">
                                    <div className="flex items-center">
                                        <History className="h-4 w-4 mr-3 text-muted-foreground"/>
                                        {item.name}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => removeFromHistory(e, item.id)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                    {searchValue.length >= 3 && (
                       <>
                         <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                         {filteredData.filter(i => i.type === 'USUARIO').length > 0 && <CommandGroup heading="Usuarios">
                             {filteredData.filter(i => i.type === 'USUARIO').map(item => (
                                 <CommandItem key={item.id} onSelect={() => handleSelect(item.path, item)} className="hover:bg-white/10">
                                     <Avatar className="h-6 w-6 mr-3">
                                         <AvatarImage src={item.avatar}/>
                                         <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                     </Avatar>
                                     {item.name}
                                 </CommandItem>
                             ))}
                         </CommandGroup>}
                         {filteredData.filter(i => i.type === 'TORNEO').length > 0 && <CommandGroup heading="Torneos">
                             {filteredData.filter(i => i.type === 'TORNEO').map(item => (
                                 <CommandItem key={item.id} onSelect={() => handleSelect(item.path, item)} className="hover:bg-white/10">
                                     {getIcon(item.type)}
                                     {item.name}
                                 </CommandItem>
                             ))}
                         </CommandGroup>}
                         {filteredData.filter(i => i.type === 'PÁGINA' || i.type === 'JUEGO').length > 0 && <CommandGroup heading="Otras Páginas">
                             {filteredData.filter(i => i.type === 'PÁGINA' || i.type === 'JUEGO').map(item => (
                                 <CommandItem key={item.id} onSelect={() => handleSelect(item.path, item)} className="hover:bg-white/10">
                                     {getIcon(item.type)}
                                     {item.name}
                                 </CommandItem>
                             ))}
                         </CommandGroup>}
                       </>
                    )}
                </CommandList>
            </Command>
        </PopoverContent>
    </Popover>
  );
}
