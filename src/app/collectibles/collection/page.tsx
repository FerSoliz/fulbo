'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { allCards, Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function CollectionPage() {
  const [userCollection, setUserCollection] = useState<CardType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('rating');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  useEffect(() => {
    setIsClient(true);
    const savedCollection = localStorage.getItem('userCardCollection');
    if (savedCollection) {
      setUserCollection(JSON.parse(savedCollection));
    }
  }, []);

  const collectionPercentage = (userCollection.length / allCards.length) * 100;

  const rarities: CardType['rarity'][] = ['common', 'rare', 'epic', 'legendary', 'hero', 'CRACKS', 'LEYENDA MUNDIAL'];
  
  const filteredAndSortedCards = allCards
    .map(card => ({
        ...card,
        owned: userCollection.some(ownedCard => ownedCard.id === card.id)
    }))
    .filter(card => {
        if (filter === 'all') return true;
        if (filter === 'owned') return card.owned;
        if (filter === 'unowned') return !card.owned;
        return card.rarity === filter;
    })
    .sort((a, b) => {
        if (sort === 'rating') return (b.owned ? b.rating : -1) - (a.owned ? a.rating : -1);
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
          <h1 className="text-3xl font-bold text-center mb-2">Mi Colección</h1>
          <p className="text-center text-muted-foreground mb-4">Has coleccionado {userCollection.length} de {allCards.length} cartas.</p>
          <Progress value={collectionPercentage} className="mb-6" />
          
          <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
            <div className="flex flex-wrap justify-center gap-2">
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
             <div className="flex items-center gap-2">
                <span className="text-sm">Ordenar por:</span>
                <Button size="sm" variant={sort === 'rating' ? 'default' : 'outline'} onClick={() => setSort('rating')}>Rating</Button>
                <Button size="sm" variant={sort === 'id' ? 'default' : 'outline'} onClick={() => setSort('id')}>Número</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredAndSortedCards.map((card) => (
              <div key={card.id} className="flex flex-col items-center">
                {card.owned ? (
                  <motion.div layoutId={`card-${card.id}`} onClick={() => setSelectedCard(card)}>
                    <CollectibleCard card={card} small />
                  </motion.div>
                ) : (
                  <div className="w-36 h-[225px] bg-muted/20 rounded-lg flex items-center justify-center">
                    <span className="text-5xl font-bold text-muted-foreground/50">{card.id}</span>
                  </div>
                )}
                <p className="mt-2 text-xs text-center truncate w-full">{card.id}. {card.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {selectedCard && (
            <motion.div 
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedCard(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    layoutId={`card-${selectedCard.id}`} 
                    className="w-72 md:w-80"
                    onClick={(e) => e.stopPropagation()}
                >
                    <CollectibleCard card={selectedCard} />
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
