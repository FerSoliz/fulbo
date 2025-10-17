'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { allCards, Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@/context/user-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CollectionPage() {
  const [userCollection, setUserCollection] = useState<CardType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const { user } = useUser();

  useEffect(() => {
    setIsClient(true);
    const fetchCollection = async () => {
        if (user && user.id !== 'visitor') {
            const collectionRef = doc(db, 'users', user.id, 'data', 'collectibles');
            const docSnap = await getDoc(collectionRef);
            if (docSnap.exists()) {
                const collectionIds = docSnap.data().cardIds as number[];
                const collectionData = allCards.filter(card => collectionIds.includes(card.id));
                setUserCollection(collectionData);
            }
        }
    };
    fetchCollection();
  }, [user]);

  const collectionPercentage = allCards.length > 0 ? (userCollection.length / allCards.length) * 100 : 0;

  const collectionCards = allCards
    .map(card => ({
        ...card,
        owned: userCollection.some(ownedCard => ownedCard.id === card.id)
    }))
    .sort((a, b) => a.id - b.id);

  if (!isClient) {
    return <div className="p-4 text-center">Cargando colección...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link href="/collectibles" legacyBehavior>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Menú del Juego
          </Button>
        </Link>
        <div className="bg-card/50 p-6 rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-2">Mi Colección</h1>
          <p className="text-center text-muted-foreground mb-4">Has coleccionado {userCollection.length} de {allCards.length} cartas.</p>
          <Progress value={collectionPercentage} className="mb-6" />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {collectionCards.map((card) => (
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
                    className="w-full max-w-[280px] sm:max-w-[320px]"
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
