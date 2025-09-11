'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { allCards, Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function CollectionPage() {
  const [userCollection, setUserCollection] = useState<CardType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('rating');

  useEffect(() => {
    setIsClient(true);
    const savedCollection = localStorage.getItem('userCardCollection');
    if (savedCollection) {
      setUserCollection(JSON.parse(savedCollection));
    }
  }, []);

  const collectionPercentage = (userCollection.length / allCards.length) * 100;

  const rarities: CardType['rarity'][] = ['common', 'rare', 'epic', 'legendary', 'hero', 'CRACKS', 'LEYENDA MUNDIAL'];
  
  const filteredAndSortedCards = userCollection
    .filter(card => filter === 'all' || card.rarity === filter)
    .sort((a, b) => {
        if (sort === 'rating') return b.rating - a.rating;
        if (sort === 'id') return a.id - b.id;
        return 0;
    });

  if (!isClient) {
    return <div className="p-4 text-center">Cargando colección...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link href="/collectibles">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Menú del Juego
          </Button>
        </Link>
        <div className="bg-card/50 p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-2">Mi Colección de Cartas</h1>
          <p className="text-center text-muted-foreground mb-4">Has coleccionado {userCollection.length} de {allCards.length} cartas.</p>
          <Progress value={collectionPercentage} className="mb-6" />

          <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>Todas</Button>
              {rarities.map(rarity => (
                  <Button 
                    key={rarity} 
                    size="sm" 
                    variant={filter === rarity ? 'default' : 'outline'} 
                    onClick={() => setFilter(rarity)}
                    className="capitalize"
                  >
                    {rarity}
                  </Button>
              ))}
          </div>

          <div className="flex justify-center gap-2 mb-6">
              <span>Ordenar por:</span>
              <Button size="sm" variant={sort === 'rating' ? 'default' : 'outline'} onClick={() => setSort('rating')}>Rating</Button>
              <Button size="sm" variant={sort === 'id' ? 'default' : 'outline'} onClick={() => setSort('id')}>Número</Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAndSortedCards.map((card) => (
              <CollectibleCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
