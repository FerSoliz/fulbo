
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from '@/components/collectible-card';
import { CardPack } from '@/components/card-pack';
import { Button } from '@/components/ui/button';

interface PackOpeningViewProps {
  cards: CardType[];
  onViewChange: (view: 'menu') => void;
}

export const PackOpeningView = ({ cards, onViewChange }: PackOpeningViewProps) => {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [packVisible, setPackVisible] = useState(true);
  const [revealedCardIndex, setRevealedCardIndex] = useState<number>(-1);

  useEffect(() => {
    if (cards.length === 0) {
      onViewChange('menu');
    }
  }, [cards, onViewChange]);

  const handleOpenPackAnimation = () => {
    if (cards.length > 0 && !isOpening) {
      setIsOpening(true);
      setTimeout(() => {
        setPackVisible(false);
        setRevealedCardIndex(0);
      }, 800);
    }
  };

  const handleNextCard = () => {
    if (revealedCardIndex < cards.length - 1) {
      setRevealedCardIndex(prev => prev + 1);
    } else {
      router.push('/collectibles/collection');
    }
  };

  if (cards.length === 0) {
    return null; // O un estado de carga/error
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <AnimatePresence>
        {packVisible && (
          <motion.div
            key="pack"
            initial={{ opacity: 1, scale: 1 }}
            animate={isOpening ? { scale: 1.1, transition: { duration: 0.3, ease: 'easeOut' } } : {}}
            exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
            className="flex flex-col items-center"
          >
            <CardPack />
            <Button onClick={handleOpenPackAnimation} className="mt-8">
              ABRIR SOBRE
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!packVisible && revealedCardIndex > -1 && revealedCardIndex < cards.length && (
          <motion.div
            key={revealedCardIndex}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={handleNextCard}
            className="cursor-pointer w-72 flex flex-col items-center"
          >
            <CollectibleCard card={cards[revealedCardIndex]} />
            <p className="mt-4 text-muted-foreground">Haz clic en la carta para revelar la siguiente</p>
          </motion.div>
        )}
      </AnimatePresence>

      {revealedCardIndex > -1 && (
        <div className="mt-8">
          <Button onClick={() => onViewChange('menu')} variant="secondary">Volver al Menú</Button>
        </div>
      )}
    </div>
  );
};
