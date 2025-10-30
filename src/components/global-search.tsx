'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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

// Componente para un grupo de resultados, para mantener el código limpio
const ResultsGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">{title}</h3>
        <div className="flex flex-col">
            {children}
        </div>
    </div>
);

// Componente para un item individual de resultado
const ResultItem = ({ item, onSelect, children }: { item: SearchResult, onSelect: () => void, children: React.ReactNode }) => (
    <div
        onClick={onSelect}
        className="flex items-center p-2 mx-2 rounded-md cursor-pointer hover:bg-accent-red"
        role="button"
    >
        {children}
    </div>
);

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
  
  const renderContent = () => {
    const userResults = filteredData.filter(i => i.type === 'USUARIO');
    const tournamentResults = filteredData.filter(i => i.type === 'TORNEO');
    const pageResults = filteredData.filter(i => i.type === 'PÁGINA' || i.type === 'JUEGO');

    if (searchValue.length < 2) {
        if (history.length > 0) {
            return (
                <ResultsGroup title="Búsquedas Recientes">
                    {history.map(item => (
                        <div
                            key={`hist-${item.id}`}
                            onClick={() => handleSelect(item.path, item)}
                            className="flex justify-between items-center p-2 mx-2 group rounded-md cursor-pointer hover:bg-accent-red"
                            role="button"
                        >
                            <div className="flex items-center text-sm">
                                <History className="h-4 w-4 mr-3 text-muted-foreground"/>
                                {item.name}
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => removeFromHistory(e, item.id)} title="Eliminar del historial">
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </ResultsGroup>
            );
        }
        return null;
    }

    if (filteredData.length > 0) {
        return (
            <>
                {userResults.length > 0 && (
                    <ResultsGroup title="Usuarios">
                        {userResults.map(item => (
                            <ResultItem key={item.id} item={item} onSelect={() => handleSelect(item.path, item)}>
                                <Avatar className="h-6 w-6 mr-3">
                                    <AvatarImage src={item.avatar}/>
                                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{item.name}</span>
                            </ResultItem>
                        ))}
                    </ResultsGroup>
                )}
                {tournamentResults.length > 0 && (
                    <ResultsGroup title="Torneos">
                        {tournamentResults.map(item => (
                            <ResultItem key={item.id} item={item} onSelect={() => handleSelect(item.path, item)}>
                                {getIcon(item.type)}
                                <span className="text-sm">{item.name}</span>
                            </ResultItem>
                        ))}
                    </ResultsGroup>
                )}
                {pageResults.length > 0 && (
                    <ResultsGroup title="Otras Páginas">
                        {pageResults.map(item => (
                            <ResultItem key={item.id} item={item} onSelect={() => handleSelect(item.path, item)}>
                                {getIcon(item.type)}
                                <span className="text-sm">{item.name}</span>
                            </ResultItem>
                        ))}
                    </ResultsGroup>
                )}
            </>
        );
    }

    return <p className="p-4 text-sm text-center text-muted-foreground">No se encontraron resultados para "{searchValue}".</p>;
  }

  return (
    <div className="relative w-full" ref={searchContainerRef}>
        <div 
            className="relative flex h-9 w-full items-center justify-start rounded-full text-sm text-muted-foreground bg-secondary/30 backdrop-blur-sm border border-border-soft transition-colors hover:bg-secondary/50"
        >
            <input 
                className="h-full w-full border-none bg-transparent text-white placeholder:text-muted-foreground focus:ring-0 px-4"
                placeholder="Buscar..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setShowResults(true)}
            />
        </div>

        {showResults && (
            <div className="absolute top-full mt-2 w-full z-50">
                 <div className="w-full py-1 bg-secondary/80 backdrop-blur-md border border-white/10 rounded-lg">
                    {renderContent()}
                </div>
            </div>
        )}
    </div>
  );
}
