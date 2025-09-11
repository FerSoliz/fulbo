'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Card as CardType } from '@/lib/collectible-cards-data';
import { CollectibleCard } from './collectible-card';
import { motion, AnimatePresence } from 'framer-motion';

const packImageUrl = 'https://i.postimg.cc/qM6GyVNg/sobre-base-campeones-de-qatar.png';

interface CardPackProps {
  newCards: CardType[];
}

export function CardPack({ newCards }: CardPackProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  
  const handleOpenPack = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsRevealed(true);
    }, 1000); // Wait for pack opening animation
  };

  const handleReset = () => {
      setIsOpening(false);
      setIsRevealed(false);
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={isOpening ? { scale: [1, 1.1, 0], rotate: [0, 10, -720] } : {}}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <Image src={packImageUrl} alt="Sobre de cartas" width={300} height={420} priority />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRevealed && (
            <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4">¡Has obtenido estas cartas!</h2>
                <div className="flex justify-center items-center gap-4 -mt-16">
                    {newCards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 100, scale: 0.5, rotate: (index - 1) * -15 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: (index - 1) * 15 }}
                        transition={{ duration: 0.5, delay: index * 0.2, ease: 'easeOut' }}
                        className="z-10"
                        style={{ zIndex: 10 + index }}
                    >
                        <CollectibleCard card={card} />
                    </motion.div>
                    ))}
                </div>
                 <Button onClick={handleReset} className="mt-8">Abrir otro sobre</Button>
            </div>
        )}
      </AnimatePresence>

      {!isOpening && !isRevealed && (
        <Button onClick={handleOpenPack} className="mt-8">
          ABRIR SOBRE
        </Button>
      )}
    </div>
  );
}
