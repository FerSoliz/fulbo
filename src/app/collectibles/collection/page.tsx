
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { allCards, Card as CollectibleCardType } from '@/lib/collectible-cards-data'; // Renombrado para evitar conflicto
import { CollectibleCard } from '@/components/collectible-card';
import { Progress } from '@/components/ui/progress'; // ¡Error corregido aquí!
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@/context/user-context';
import { getUserCollectibles } from '@/lib/firebase/db/collectibles';
import Image from 'next/image'; // Importar Image para la precarga

export default function CollectionPage() {
  const [userCollection, setUserCollection] = useState<CollectibleCardType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectibleCardType | null>(null);
  const { user } = useUser();

  useEffect(() => {
    setIsClient(true);
    const fetchCollection = async () => {
      if (user && user.id !== 'visitor') {
        const collectiblesData = await getUserCollectibles(user.id);
        const collection = allCards.filter(card => collectiblesData.cardIds.includes(card.id));
        setUserCollection(collection);
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
      {/* Bloque de precarga de imágenes (oculto) */}
      <div className="hidden">
        {userCollection.map((card) => (
          <Image
            key={`preload-${card.id}`}
            src={card.playerImageUrl}
            alt={`Preload ${card.name}`}
            width={406} // Las dimensiones grandes de la carta ampliada
            height={634}
            priority // Indica a Next.js que esta imagen es importante y debe precargarse
          />
        ))}
      </div>

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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {collectionCards.map((card) => (
              <div key={card.id} className="flex flex-col items-center">
                {card.owned ? (
                  <motion.div layoutId={`card-${card.id}`} onClick={() => setSelectedCard(card)} className="cursor-pointer">
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
              className="max-w-2xl md:max-w-3xl lg:max-w-4xl"
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
