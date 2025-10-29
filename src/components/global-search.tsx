'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, User, Trophy, Gamepad2, Newspaper, History, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAllTournaments } from '@/lib/firebase/db/tournaments';
import { getRankedUsers } from '@/lib/firebase/db/users';

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
    { type: 'PÁGINA', id: 'tournaments', name: 'Torneos', path: '/tournaments' },
];

export function GlobalSearch() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [filteredData, setFilteredData] = useState<SearchResult[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAllData = async () => {
      const [users, tournaments] = await Promise.all([
        getRankedUsers(),
        getAllTournaments(),
      ]);

      const userResults: SearchResult[] = users.map(u => ({
        type: 'USUARIO',
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        path: `/profile/${u.id}`,
      }));

      const tournamentResults: SearchResult[] = tournaments.map(t => ({
          type: 'TORNEO',
          id: t.id,
          name: t.name,
          path: `/tournaments/${t.id}`,
      }));
      
      setAllData([...userResults, ...tournamentResults, ...staticPages]);
    }

    loadAllData();
    const savedHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setHistory(savedHistory);
  }, []);

  useEffect(() => {
    if (searchValue.length >= 2) {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const addToHistory = (item: SearchResult) => {
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  const removeFromHistory = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSelect = (path: string, item: SearchResult) => {
    addToHistory(item);
    setSearchValue('');
    setShowResults(false);
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
    <div className="relative w-full" ref={searchContainerRef}>
        <Command shouldFilter={false} className="bg-transparent">
            <div 
                className="relative flex h-9 w-full items-center justify-start rounded-full text-sm text-muted-foreground bg-secondary/30 backdrop-blur-sm border border-border-soft transition-colors hover:bg-secondary/50"
            >
                <CommandInput 
                    className="h-full w-full border-none bg-transparent text-white placeholder:text-muted-foreground focus:ring-0"
                    placeholder="Buscar..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                    onFocus={() => setShowResults(true)}
                />
            </div>

            {showResults && (
                <div className="absolute top-full mt-2 w-full z-50">
                     <CommandList 
                        className="w-full p-1 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-lg"
                     >
                        {searchValue.length < 2 && history.length > 0 && !filteredData.length && (
                            <CommandGroup heading="Búsquedas Recientes">
                                {history.map(item => (
                                    <CommandItem key={`hist-${item.id}`} onSelect={() => handleSelect(item.path, item)} className="flex justify-between items-center group hover:bg-white/10 rounded-md cursor-pointer">
                                        <div className="flex items-center">
                                            <History className="h-4 w-4 mr-3 text-muted-foreground"/>
                                            {item.name}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => removeFromHistory(e, item.id)} title="Eliminar del historial">
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        
                        {searchValue.length >= 2 && filteredData.length > 0 && (
                           <>
                             {filteredData.filter(i => i.type === 'USUARIO').length > 0 && <CommandGroup heading="Usuarios">
                                 {filteredData.filter(i => i.type === 'USUARIO').map(item => (
                                     <CommandItem key={item.id} onSelect={() => handleSelect(item.path, item)} className="hover:bg-white/10 rounded-md cursor-pointer">
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
                                     <CommandItem key={item.id} onSelect={() => handleSelect(item.path, item)} className="hover:bg-white/10 rounded-md cursor-pointer">
                                         {getIcon(item.type)}
                                         {item.name}
                                     </CommandItem>
                                 ))}
                             </CommandGroup>}
                             {filteredData.filter(i => i.type === 'PÁGINA' || i.type === 'JUEGO').length > 0 && <CommandGroup heading="Otras Páginas">
                                 {filteredData.filter(i => i.type === 'PÁGINA' || i.type === 'JUEGO').map(item => (
                                     <CommandItem key={item.id} onSelect={() => handleSelect(item.path, item)} className="hover:bg-white/10 rounded-md cursor-pointer">
                                         {getIcon(item.type)}
                                         {item.name}
                                     </CommandItem>
                                 ))}
                             </CommandGroup>}
                           </>
                        )}
                        
                        {searchValue.length >= 2 && filteredData.length === 0 && (
                            <CommandEmpty>No se encontraron resultados para "{searchValue}".</CommandEmpty>
                        )}
                    </CommandList>
                </div>
            )}
        </Command>
    </div>
  );
}
